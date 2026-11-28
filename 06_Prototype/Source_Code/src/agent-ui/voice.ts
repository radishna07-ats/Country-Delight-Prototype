// Voice for the PROTOTYPE (not Graine's production voice stack).
//
// Microphone permission is requested once and then reused:
//   1. The Permissions API is checked first, so the browser is only asked when the state is "prompt".
//   2. getUserMedia() is called once per page session; the MediaStream is kept and its track is
//      disabled between turns, so later mic taps don't trigger new permission requests.
//   3. Speech recognition is fed that same track (SpeechRecognition.start(track), Chrome 135+);
//      older browsers ignore the argument and use the already-granted microphone.
//   4. If the permission is revoked, the stream is released and the next tap explains how to re-enable it.
// When the page is hosted on claude.ai, the platform's dictation capability is used instead: the platform
// holds the microphone and asks the viewer once per artifact.
import { useSyncExternalStore } from "react";
import { logCall } from "../backend/store";

export type MicState = "unknown" | "prompt" | "granted" | "denied" | "blocked" | "unavailable";
export interface VoiceState { listening: boolean; starting: boolean; interim: string; error: string | null; source: "dictation" | "browser" | "none"; mic: MicState }

let state: VoiceState = { listening: false, starting: false, interim: "", error: null, source: "none", mic: "unknown" };
const subs = new Set<() => void>();
const set = (p: Partial<VoiceState>) => { state = { ...state, ...p }; subs.forEach((f) => f()); };
export const useVoice = () => useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => state);
export const voiceState = () => state;
export const subscribeVoice = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };

const SR = () => (typeof window === "undefined" ? undefined : (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
export const recognitionSupported = () => !!dictation || !!SR();

export const MSG = {
  denied: "Microphone access is blocked for this page. To allow it, click the icon at the left of the address bar, set Microphone to Allow, then tap the mic again. You can also type.",
  blocked: "This page isn't allowed to use the microphone here. Open the demo file in Chrome or Edge, or type your request.",
  dictationOff: "Voice is switched off for this page. Turn it on in the page's Permissions menu, or type your request.",
  unsupported: "Voice input isn't available in this browser. Use Chrome or Edge, or type. You can also tap an example phrase.",
  nodevice: "No microphone was found. Connect one, or type your request.",
  network: "The browser's speech service couldn't be reached (it needs an internet connection). Type your request instead.",
  nospeech: "I didn't hear anything. Tap the mic and try again.",
  insecure: "Voice needs a secure page (https or localhost). Type your request instead.",
};

// ------------------------------------------------------------------ hosted: claude.ai dictation capability
let dictation: any = null;
export interface DictationSink { onPartial: (t: string) => void; onFinal: (t: string) => void; onEnd: (reason?: string) => void }
let sink: DictationSink | null = null;
export const hasDictation = () => !!dictation;
export const dictationActive = () => !!dictation?.active?.();

/** Call once at start-up. Resolves the platform dictation capability when the page runs on claude.ai. */
export function initVoice() {
  const c = typeof window !== "undefined" ? (window as any).claude : undefined;
  if (c?.use) {
    Promise.resolve(c.use("dictation")).then((d: any) => {
      if (!d) return;
      dictation = d; set({ source: "dictation", mic: "unknown" });
      d.onPartial(({ text }: { text: string }) => sink?.onPartial(text));
      d.onFinal(({ text }: { text: string }) => sink?.onFinal(text));
      d.onState(({ state: st, reason }: { state: string; reason?: string }) => {
        set({ listening: st === "listening" || st === "finishing", starting: st === "starting" });
        if (st !== "idle") return;
        if (reason === "not_granted") set({ mic: "denied", error: MSG.dictationOff });
        else if (reason === "unavailable") { dictation = null; set({ source: SR() ? "browser" : "none", error: MSG.unsupported }); }
        else if (reason === "upstream_error" || reason === "rate_limited") set({ error: "Voice input had a problem. Try again in a moment, or type." });
        else if (reason !== "dismissed") set({ mic: "granted" });
        const h = sink; sink = null; h?.onEnd(reason);
      });
    }).catch(() => { /* not hosted: browser path */ });
  }
  if (SR()) set({ source: "browser" });
  void queryMic();
  if (typeof speechSynthesis !== "undefined") { try { speechSynthesis.addEventListener?.("voiceschanged", () => { voiceCache = undefined; }); } catch { /* ignore */ } }
}

/** Start a dictation session. MUST be called synchronously from a click or key press. It keeps listening
 *  until stopDictation(); the caller decides where one utterance ends. */
export function startDictation(h: DictationSink): void {
  sink = h; set({ starting: true, error: null });
  logCall({ name: "voice: listening (claude.ai dictation; permission asked once per artifact)", kind: "app_action", status: "info", channel: "inapp" });
  dictation.start().catch((err: any) => {
    const code = err?.code;
    set({ starting: false, listening: false });
    if (code === "not_granted") set({ mic: "denied", error: MSG.dictationOff });
    else if (code === "unavailable") { dictation = null; set({ source: SR() ? "browser" : "none" }); }
    else if (code === "dismissed") set({ error: "Voice needs your permission. Tap the mic again when you're ready." });
    if (code !== "stopped") { const x = sink; sink = null; x?.onEnd(code ?? "error"); }
  });
}
export function stopDictation() { if (dictation?.active?.()) void dictation.stop(); }

// ------------------------------------------------------------------ browser: one persistent microphone stream
let stream: MediaStream | null = null;
let permStatus: PermissionStatus | null = null;

async function queryMic(): Promise<MicState> {
  try {
    if (!permStatus) {
      permStatus = await navigator.permissions.query({ name: "microphone" as PermissionName });
      permStatus.onchange = () => {
        set({ mic: permStatus!.state as MicState });
        logCall({ name: `microphone permission changed: ${permStatus!.state}`, kind: "app_action", status: "info", channel: "inapp" });
        if (permStatus!.state !== "granted") releaseMic();
      };
    }
    set({ mic: permStatus.state as MicState });
    return permStatus.state as MicState;
  } catch { return state.mic; }
}

function policyBlocks(): boolean {
  try {
    const fp = (document as any).permissionsPolicy ?? (document as any).featurePolicy;
    return fp ? !fp.allowsFeature("microphone") : false;
  } catch { return false; }
}

const live = () => !!stream && stream.getAudioTracks().some((t) => t.readyState === "live");

/** Get the microphone once and keep it. Only the first call (or a call after revocation) can prompt. */
async function ensureMic(): Promise<"ok" | keyof typeof MSG> {
  if (live()) return "ok";
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return typeof isSecureContext !== "undefined" && !isSecureContext ? "insecure" : "unsupported";
  if (policyBlocks()) { set({ mic: "blocked" }); return "blocked"; }
  const st = await queryMic();
  if (st === "denied") return "denied";
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    stream.getAudioTracks().forEach((t) => { t.enabled = false; t.onended = () => { stream = null; }; });
    set({ mic: "granted" });
    logCall({ name: "microphone granted — stream kept for this session (no further prompts)", kind: "app_action", status: "ok", channel: "inapp", args: { previousState: st } });
    return "ok";
  } catch (e: any) {
    const n = e?.name;
    if (n === "NotAllowedError" || n === "SecurityError") { const b = policyBlocks(); set({ mic: b ? "blocked" : "denied" }); return b ? "blocked" : "denied"; }
    if (n === "NotFoundError" || n === "OverconstrainedError") return "nodevice";
    return "unsupported";
  }
}

/** Stop and forget the microphone (on revocation, or if the customer turns voice off). */
export function releaseMic() {
  stream?.getTracks().forEach((t) => t.stop());
  stream = null;
}

// ------------------------------------------------------------------ listening (shared by the dock and the call screen)
export interface Handlers { onInterim: (t: string) => void; onFinal: (t: string) => void; onError: (code: string) => void; onEnd: () => void }
let rec: any = null;

/** One utterance. MUST be called directly from a click/keypress (hosted dictation requires the gesture). */
export function listen(h: Handlers): void {
  set({ error: null, interim: "" });
  if (dictation) {
    let acc = ""; let timer: ReturnType<typeof setTimeout> | null = null; let done = false;
    startDictation({
      onPartial: (t) => { if (t && timer) { clearTimeout(timer); timer = null; } const x = (acc + (t ? ` ${t}` : "")).trim(); set({ interim: x }); h.onInterim(x); },
      onFinal: (t) => { acc = (acc + t).replace(/^\s+/, ""); set({ interim: acc }); h.onInterim(acc); if (timer) clearTimeout(timer); timer = setTimeout(() => stopDictation(), 1100); },
      onEnd: (reason) => { if (done) return; done = true; const text = acc.trim(); set({ interim: "" }); if (text) h.onFinal(text); else if (reason && !["stopped", "viewer_stopped", "hidden"].includes(reason)) h.onError(reason); h.onEnd(); },
    });
    return;
  }
  void listenBrowser(h);
}

export const micStream = () => (live() ? stream : null);
/** Keep the microphone track live (hands-free conversation: voice-activity detection between turns) or idle. */
export function setMicLive(on: boolean) { stream?.getAudioTracks().forEach((t) => { t.enabled = on; }); }
export async function prepareMic() { return ensureMic(); }

/** One browser speech-recognition turn on the persistent stream. `keepTrack` leaves the track live afterwards;
 *  `quiet` leaves silence handling to the caller (no "I didn't hear anything" message). */
export async function listenBrowser(h: Handlers, opts: { keepTrack?: boolean; quiet?: boolean } = {}) {
  const C = SR();
  if (!C) { set({ error: MSG.unsupported }); h.onError("unsupported"); h.onEnd(); return; }
  set({ starting: true });
  const m = await ensureMic();
  if (m !== "ok") { set({ starting: false, error: MSG[m] }); h.onError(m === "denied" ? "not-allowed" : m); h.onEnd(); return; }
  const track = stream!.getAudioTracks()[0];
  track.enabled = true;
  const r = new C();
  r.lang = "en-IN"; r.interimResults = true; r.continuous = false;
  let finalText = "";
  r.onresult = (e: any) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) { const t = e.results[i][0].transcript; if (e.results[i].isFinal) finalText += t; else interim += t; }
    const txt = (finalText + interim).trim(); set({ interim: txt }); h.onInterim(txt);
  };
  r.onerror = (e: any) => {
    const err = e?.error ?? "error";
    if (err === "aborted") return;
    const msg = err === "not-allowed" || err === "service-not-allowed" ? MSG.denied : err === "no-speech" ? MSG.nospeech : err === "network" ? MSG.network : err === "audio-capture" ? MSG.nodevice : "Voice input stopped unexpectedly. Try again, or type.";
    if (err === "not-allowed") { set({ mic: "denied" }); releaseMic(); }
    if (!(opts.quiet && err === "no-speech")) set({ error: msg });
    h.onError(err);
  };
  r.onend = () => {
    track.enabled = !!opts.keepTrack && live(); rec = null;
    set({ listening: false, starting: false, interim: "" });
    if (finalText.trim()) h.onFinal(finalText.trim());
    h.onEnd();
  };
  try { r.start(track); }
  catch { try { r.start(); } catch { track.enabled = false; set({ starting: false, error: "Voice input couldn't start. Try again, or type." }); h.onError("start-failed"); h.onEnd(); return; } }
  rec = r;
  set({ listening: true, starting: false });
  logCall({ name: "voice: listening (browser speech, reusing the granted microphone stream)", kind: "app_action", status: "info", channel: "inapp" });
}

export function stopListening() {
  if (dictation?.active?.()) { void dictation.stop(); return; }
  try { rec?.stop(); } catch { /* ignore */ }
}
/** Abandon the current browser turn without delivering what was heard. */
export function abortListening() { try { rec?.abort(); } catch { /* ignore */ } }
export const isListening = () => state.listening || state.starting;
export const clearVoiceError = () => set({ error: null });

/** Tap-to-speak demo phrases: show the words arriving, then hand them over. */
export function simulateSpeech(text: string, onFinal: (t: string) => void) {
  set({ listening: true, error: null, interim: "" });
  logCall({ name: "voice: simulated utterance (tap-to-speak)", kind: "app_action", status: "info", channel: "inapp" });
  const words = text.split(" "); let i = 0;
  const timer = setInterval(() => {
    i++; set({ interim: words.slice(0, i).join(" ") });
    if (i >= words.length) { clearInterval(timer); set({ listening: false, interim: "" }); onFinal(text); }
  }, 110);
}

// ------------------------------------------------------------------ speech synthesis (spoken replies)
let voiceCache: SpeechSynthesisVoice | null | undefined;
export function pickVoice() {
  if (voiceCache) return voiceCache;
  const vs = typeof speechSynthesis !== "undefined" ? speechSynthesis.getVoices() : [];
  if (!vs.length) return null; // voices load asynchronously: try again next time
  voiceCache = vs.find((v) => /en-IN/i.test(v.lang)) ?? vs.find((v) => /en-GB/i.test(v.lang) && v.localService) ?? vs.find((v) => /en-(GB|US)/i.test(v.lang)) ?? vs.find((v) => /^en/i.test(v.lang)) ?? null;
  return voiceCache;
}

export function speak(text: string, onEnd?: () => void) {
  if (typeof speechSynthesis === "undefined") { onEnd?.(); return; }
  const clean = text.replace(/[\u{1F300}-\u{1FAFF}]/gu, "").replace(/₹/g, "rupees ").replace(/×/g, " times ").replace(/—/g, ", ").replace(/★/g, "rated ");
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(clean);
    const v = pickVoice(); if (v) u.voice = v;
    u.rate = 1.04; u.onend = () => onEnd?.(); u.onerror = () => onEnd?.();
    speechSynthesis.speak(u);
  } catch { onEnd?.(); }
}
export const stopSpeaking = () => { try { speechSynthesis.cancel(); } catch { /* ignore */ } };
