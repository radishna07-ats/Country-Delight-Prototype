// Voice-first conversation for the in-app assistant.
//
// 1. Captions == speech. Every message the assistant shows in its captions (replies, questions, the live step
//    line while it works in the app, voice notices) goes through ONE speech queue and is spoken exactly as
//    displayed, in order, never cancelled by the next message. Text is split into sentences; the caption
//    highlights the sentence being spoken. Only pronunciation is normalised (“₹1,614” → “1,614 rupees”).
//    While speech is on, the in-app operator waits for each step to be spoken before acting, so the screen,
//    the caption and the voice stay in step.
// 2. Hands-free loop. One tap on the mic starts a conversation: listen → (end of speech detected) → process →
//    speak → listen again, until the customer ends it, says “that's all”, or stays silent for two turns.
//    The persistent microphone stream from voice.ts is reused (no new permission prompts); its level drives the
//    on-screen meter and lets the customer interrupt the assistant by speaking (barge-in). Speech heard while
//    the assistant is working is ignored, except “stop”, so a task never runs twice.
import { useSyncExternalStore } from "react";
import { logCall, ui } from "../backend/store";
import { notice, userSays } from "../agent/engine";
import { stopOperator } from "../operator/operator";
import * as V from "./voice";

export type Phase = "idle" | "listening" | "processing" | "speaking";
export interface ConvState {
  handsFree: boolean;     // the continuous conversation is running
  muted: boolean;         // microphone muted by the customer (conversation paused, not ended)
  phase: Phase;
  caption: { id: string; sentences: string[]; index: number } | null; // what is being spoken right now
  heard: string;          // live transcript of the customer
  level: number;          // microphone level 0–1 (browser path)
}
let st: ConvState = { handsFree: false, muted: false, phase: "idle", caption: null, heard: "", level: 0 };
const subs = new Set<() => void>();
const set = (p: Partial<ConvState>) => { st = { ...st, ...p }; subs.forEach((f) => f()); };
export const useConversation = () => useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => st);
export const conversation = () => st;

// ================================================================== speech output (captions == speech)
const synth = () => (typeof window !== "undefined" && "speechSynthesis" in window ? window.speechSynthesis : undefined);
export const speechOn = () => ui.get().speak && !!synth();

/** Split into sentences as displayed; the caption highlights one at a time. */
export function sentencesOf(text: string): string[] {
  const parts = text.replace(/\s+/g, " ").trim().split(/(?<=[.!?…])\s+(?=[^\s])/);
  return parts.filter(Boolean);
}
/** Pronunciation only — the words stay the same as the caption. */
export function toSpeech(t: string): string {
  return t
    .replace(/★\s?(\d(?:\.\d)?)/g, "$1 stars") // before the symbol filter below, which would drop ★
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{2604}\u{2606}-\u{27BF}]/gu, "")
    .replace(/([+−-])\s?₹\s?([\d,]+(?:\.\d+)?)/g, (_, s, n) => `${s === "+" ? "plus" : "minus"} ${n} rupees`)
    .replace(/₹\s?([\d,]+(?:\.\d+)?)\s*L\b/g, "$1 lakh rupees")
    .replace(/₹\s?([\d,]+(?:\.\d+)?)/g, "$1 rupees")
    .replace(/(\d)\s?×\s?/g, "$1 ").replace(/×/g, " times ")
    .replace(/\s?[—–]\s?/g, ", ").replace(/\s·\s/g, ", ").replace(/\s?→\s?/g, " to ").replace(/\s?›\s?/g, ", then ")
    .replace(/[“”"]/g, "").replace(/…/g, ".").replace(/\s{2,}/g, " ").trim();
}

// Exposed for the end-to-end tests, which compare what was spoken with what was captioned.
if (typeof window !== "undefined") (window as any).__cdSpeech = { sentencesOf, toSpeech };

type Item = { id: string; text: string; resolve: () => void };
const queue: Item[] = [];
let current: Item | null = null;
let generation = 0;           // bumped by interrupt(): stops the sentence loop
let synthHealthy = true;      // false after the engine fails to start (headless, no voices): don't wait on it

/** Speak a caption. Resolves when it has been spoken (or immediately when speech is off/unavailable). */
export function speakCaption(id: string, text: string): Promise<void> {
  if (!speechOn() || !text.trim()) return Promise.resolve();
  return new Promise((resolve) => { queue.push({ id, text, resolve }); pump(); });
}

function pump() {
  if (current) return;
  const next = queue.shift();
  if (!next) {
    if (st.phase === "speaking") set({ phase: st.handsFree ? "processing" : "idle", caption: null }); else set({ caption: null });
    // Finished speaking (e.g. the greeting): hand the turn back to the customer.
    if (st.handsFree && !st.muted && !processing) setTimeout(() => { if (!isSpeaking() && !processing) listenTurn(false); }, 200);
    return;
  }
  current = next;
  const gen = generation;
  const sentences = sentencesOf(next.text);
  set({ phase: "speaking", caption: { id: next.id, sentences, index: 0 } });
  (async () => {
    for (let i = 0; i < sentences.length; i++) {
      if (gen !== generation) break;
      set({ caption: { id: next.id, sentences, index: i } });
      await speakOne(toSpeech(sentences[i]), gen);
    }
  })().finally(() => {
    if (current === next) { current = null; next.resolve(); }
    if (gen === generation) { pump(); }
  });
}

function speakOne(text: string, gen: number): Promise<void> {
  const s = synth();
  if (!s || !text) return Promise.resolve();
  return new Promise((resolve) => {
    let started = false; let done = false;
    const finish = () => { if (done) return; done = true; clearTimeout(startTimer); clearTimeout(endTimer); resolve(); };
    const u = new SpeechSynthesisUtterance(text);
    const v = V.pickVoice(); if (v) { u.voice = v; u.lang = v.lang; } else u.lang = "en-IN";
    u.rate = 1.02; u.pitch = 1;
    u.onstart = () => { started = true; synthHealthy = true; utteranceStartedAt = Date.now(); echoFloor = Math.max(echoFloor, noiseFloor); };
    u.onend = finish;
    u.onerror = (e: any) => { if (e?.error !== "interrupted" && e?.error !== "canceled") synthHealthy = false; finish(); };
    // Watchdogs: an engine that never starts (no voices) or never reports the end must not stall the conversation.
    const startTimer = setTimeout(() => { if (!started) { synthHealthy = false; try { s.cancel(); } catch { /* */ } finish(); } }, synthHealthy ? 2500 : 600);
    const endTimer = setTimeout(finish, 2500 + text.split(/\s+/).length * 520);
    try { if (gen !== generation) return finish(); s.speak(u); } catch { finish(); }
  });
}

/** Stop speaking now (the customer tapped, or started talking). Queued captions stay on screen. */
export function interrupt(why = "customer") {
  if (!current && !queue.length) return;
  generation++;
  try { synth()?.cancel(); } catch { /* ignore */ }
  const pending = [current, ...queue.splice(0)].filter(Boolean) as Item[];
  current = null; pending.forEach((i) => i.resolve());
  set({ caption: null, phase: st.handsFree ? "processing" : "idle" });
  logCall({ name: `voice: assistant interrupted (${why})`, kind: "app_action", status: "info", channel: "inapp" });
}
export const isSpeaking = () => !!current || queue.length > 0;

// Spoken notices for voice errors shown in the captions (e.g. "Microphone access is blocked…").
let lastError: string | null = null;
let errSeq = 0;
V.subscribeVoice(() => {
  const e = V.voiceState().error;
  if (e && e !== lastError) { lastError = e; void speakCaption(`voice-error-${++errSeq}`, e); }
  if (!e) lastError = null;
});

// ================================================================== hands-free conversation loop
const STOP = /^\s*(stop|cancel|wait|hold on|never ?mind|stop it|stop that)\b/i;
const BYE = /^\s*(ok(ay)?,?\s+)?(bye|goodbye|good bye|that'?s all|that is all|i'?m done|i am done|nothing else|stop listening|end (the )?(conversation|chat|call)|no,? (that'?s|that is) all|that'?ll be all|no,? thanks?|no,? thank you)\b/i;
let silentTurns = 0;
let last = { text: "", at: 0 };
let processing = false;
let dictActive = false;
let acc = ""; let segTimer: ReturnType<typeof setTimeout> | null = null; let quietTimer: ReturnType<typeof setTimeout> | null = null;
let echoGuardUntil = 0;
let turnHeard = false; let turnError = "";

const busy = () => processing || ui.get().thinking || !!ui.get().operator || isSpeaking();

/** Start the hands-free conversation. Call synchronously from the mic tap (hosted dictation needs the gesture). */
export function startConversation() {
  ensureAudio();
  set({ handsFree: true, muted: false, heard: "" });
  silentTurns = 0;
  logCall({ name: "voice: hands-free conversation started (mic stays on between turns)", kind: "app_action", status: "ok", channel: "inapp" });
  listenTurn(true);
}

/** End the conversation: stop listening and speaking; keep what's on screen. */
export function endConversation(reason = "customer") {
  if (!st.handsFree && st.phase === "idle") return;
  set({ handsFree: false, muted: false, phase: isSpeaking() ? "speaking" : "idle", heard: "", level: 0 });
  stopTurn();
  V.setMicLive(false);
  logCall({ name: `voice: conversation ended (${reason})`, kind: "app_action", status: "info", channel: "inapp" });
}

/** Mute / unmute the microphone without ending the conversation. Unmute is a tap, so it can restart dictation. */
export function toggleMute() {
  if (!st.handsFree) return startConversation();
  if (st.muted) { set({ muted: false }); silentTurns = 0; listenTurn(true); logCall({ name: "voice: microphone unmuted", kind: "app_action", status: "info", channel: "inapp" }); return; }
  set({ muted: true, heard: "", phase: isSpeaking() ? "speaking" : busy() ? "processing" : "idle" });
  stopTurn(); V.setMicLive(false);
  logCall({ name: "voice: microphone muted", kind: "app_action", status: "info", channel: "inapp" });
}

/** Tap while the assistant speaks: stop it and listen straight away. */
export function interruptAndListen() {
  interrupt("tap");
  if (!st.handsFree) return startConversation();
  if (st.muted) set({ muted: false });
  if (!busy()) listenTurn(true);
}

/** Typed or tapped input. In a conversation it goes through the same loop as speech. */
export function submit(text: string) {
  if (!st.handsFree) { interrupt("new message"); void userSays(text, "inapp"); return; }
  if (!dictActive) V.abortListening();
  void onUtterance(text, "typed");
}

function stopTurn() {
  if (segTimer) clearTimeout(segTimer); if (quietTimer) clearTimeout(quietTimer); segTimer = quietTimer = null; acc = "";
  if (dictActive) { V.stopDictation(); dictActive = false; }
  V.abortListening();
}

function listenTurn(gesture: boolean) {
  if (!st.handsFree || st.muted) return;
  // Hosted dictation can only start inside a tap, so start the session now even if the assistant is still talking;
  // what it hears is ignored until it is the customer's turn.
  if (V.hasDictation() && gesture && !dictActive) listenDictation(true);
  if (busy()) { set({ phase: isSpeaking() ? "speaking" : "processing" }); return; }
  set({ phase: "listening", heard: "" });
  if (V.hasDictation()) return listenDictation(gesture);
  turnHeard = false; turnError = "";
  void V.listenBrowser({
    onInterim: (t) => { turnHeard = true; set({ heard: t }); },
    onFinal: (t) => { turnHeard = true; void onUtterance(t, "voice"); },
    onError: (code) => { turnError = code; },
    onEnd: () => afterBrowserTurn(),
  }, { keepTrack: true, quiet: true }).then(() => { V.setMicLive(true); startVad(); });
}

function afterBrowserTurn() {
  if (!st.handsFree || st.muted || processing) return;
  if (turnHeard) return; // the utterance is being processed; the loop resumes after the reply
  if (["not-allowed", "unsupported", "blocked", "insecure", "nodevice", "audio-capture", "service-not-allowed"].includes(turnError)) { endConversation(`microphone: ${turnError}`); return; }
  if (turnError === "network") {
    silentTurns++;
    if (silentTurns >= 2) { endConversation("speech service unreachable"); return; }
    setTimeout(() => listenTurn(false), 1200); return;
  }
  onSilence();
}

function onSilence() {
  silentTurns++;
  logCall({ name: `voice: no speech detected (${silentTurns}/2)`, kind: "app_action", status: "info", channel: "inapp" });
  if (silentTurns >= 2) {
    endConversation("silence");
    notice("I'll stop listening for now. Tap the mic whenever you need me.");
    return;
  }
  setTimeout(() => listenTurn(false), 150);
}

// ---------- hosted (claude.ai dictation): one continuous session, utterances segmented by a pause
function listenDictation(gesture: boolean) {
  if (st.phase === "listening") armQuiet();
  if (dictActive) return;
  if (!gesture) { set({ muted: true, phase: "idle" }); return; } // dictation can only start from a tap
  dictActive = true; acc = "";
  V.startDictation({
    onPartial: (t) => {
      if (Date.now() < echoGuardUntil || st.phase !== "listening") return; // the assistant's own voice / busy
      if (t) { if (segTimer) { clearTimeout(segTimer); segTimer = null; } armQuiet(); }
      set({ heard: (acc + (t ? ` ${t}` : "")).trim() });
    },
    onFinal: (t) => {
      if (Date.now() < echoGuardUntil) return;
      if (st.phase !== "listening") { if (STOP.test(t)) void onUtterance(t, "voice"); return; }
      acc = (acc + t).replace(/^\s+/, ""); set({ heard: acc }); armQuiet();
      if (segTimer) clearTimeout(segTimer);
      segTimer = setTimeout(() => { const text = acc.trim(); acc = ""; if (text) void onUtterance(text, "voice"); }, 1100);
    },
    onEnd: (reason) => {
      dictActive = false;
      if (!st.handsFree) return;
      if (reason === "not_granted" || reason === "unavailable") endConversation(`dictation: ${reason}`);
      else set({ muted: true, phase: isSpeaking() ? "speaking" : "idle" }); // stopped from the platform's control, or hidden
    },
  });
}
function armQuiet() {
  if (quietTimer) clearTimeout(quietTimer);
  quietTimer = setTimeout(() => { if (st.handsFree && !st.muted && st.phase === "listening" && !acc) onSilence(); }, 9000);
}

// ---------- one utterance → one turn
async function onUtterance(text: string, via: "voice" | "typed") {
  const t = text.trim(); if (!t) return;
  if (busy()) {
    if (STOP.test(t)) { stopOperator(); interrupt("stop"); logCall({ name: `voice: “${t}” — stopping the current task`, kind: "guardrail", status: "info", channel: "inapp" }); }
    else logCall({ name: `voice: ignored “${t}” while busy (prevents duplicate actions)`, kind: "guardrail", status: "info", channel: "inapp" });
    return;
  }
  if (t.toLowerCase() === last.text && Date.now() - last.at < 3000) return; // duplicate recognition
  last = { text: t.toLowerCase(), at: Date.now() }; silentTurns = 0;
  processing = true; set({ phase: "processing", heard: "" });
  if (quietTimer) clearTimeout(quietTimer);
  if (!dictActive) V.abortListening();
  try { await userSays(t, "inapp"); }
  finally {
    await whenIdle();
    processing = false;
    echoGuardUntil = Date.now() + 500;
  }
  if (!st.handsFree) { set({ phase: "idle" }); return; }
  if (BYE.test(t)) { endConversation("goodbye"); return; }
  if (via === "typed" && !st.muted) { listenTurn(false); return; }
  if (!st.muted) setTimeout(() => listenTurn(false), 250); else set({ phase: "idle" });
}

/** Resolves when the assistant has finished: no engine work, no operator task, nothing left to say. */
export function whenIdle(): Promise<void> {
  return new Promise((resolve) => {
    let stable = 0;
    const tick = () => {
      const idle = !ui.get().thinking && !ui.get().operator && !isSpeaking();
      stable = idle ? stable + 1 : 0;
      if (stable >= 3) return resolve(); // ~300 ms of quiet, so follow-up messages are caught too
      setTimeout(tick, 100);
    };
    tick();
  });
}

// ================================================================== voice activity (browser path): level meter + barge-in
let ac: AudioContext | null = null; let an: AnalyserNode | null = null; let vadTimer: ReturnType<typeof setInterval> | null = null;
let echoFloor = 0.01; let noiseFloor = 0.005; let loudFrames = 0;
let utteranceStartedAt = 0; // barge-in ignores the first moments of each sentence (speaker onset / echo)
function ensureAudio() {
  try { if (!ac && typeof AudioContext !== "undefined") ac = new AudioContext(); void ac?.resume(); } catch { ac = null; }
}
function startVad() {
  const s = V.micStream(); if (!s || !ac || an) return;
  try { const src = ac.createMediaStreamSource(s); an = ac.createAnalyser(); an.fftSize = 1024; src.connect(an); } catch { an = null; return; }
  const buf = new Float32Array(an.fftSize);
  vadTimer = setInterval(() => {
    if (!an) return;
    an.getFloatTimeDomainData(buf);
    let sum = 0; for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
    const rms = Math.sqrt(sum / buf.length);
    const level = Math.min(1, rms * 9);
    if (Math.abs(level - st.level) > 0.04) set({ level: st.handsFree ? level : 0 });
    // Barge-in: the customer starts talking over the assistant. The floor adapts to the assistant's own voice
    // leaking into the microphone, so only clearly louder, sustained speech interrupts.
    if (st.handsFree && !st.muted && st.phase === "speaking" && !processingTask()) {
      const threshold = Math.max(0.05, echoFloor * 2.6, noiseFloor * 3);
      const loud = rms > threshold && Date.now() - utteranceStartedAt > 700;
      if (!loud) echoFloor = echoFloor * 0.92 + rms * 0.08; // the assistant's own voice leaking into the mic
      loudFrames = loud ? loudFrames + 1 : 0;
      if (loudFrames >= 6) { loudFrames = 0; interrupt("customer started speaking"); setTimeout(() => listenTurn(false), 60); }
    } else {
      loudFrames = 0;
      // Background noise (fan, traffic, TV) measured while not speaking: steady noise never counts as an interruption.
      noiseFloor = noiseFloor * 0.95 + rms * 0.05;
      echoFloor = Math.max(noiseFloor, echoFloor * 0.98);
    }
  }, 60);
}
// Don't let barge-in fire while the assistant is narrating its own steps in the app (it would abandon the task).
const processingTask = () => !!ui.get().operator;
export function stopVad() { if (vadTimer) clearInterval(vadTimer); vadTimer = null; an = null; }
