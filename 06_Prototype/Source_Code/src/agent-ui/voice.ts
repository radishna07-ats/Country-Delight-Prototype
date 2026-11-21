// Browser voice for the PROTOTYPE: Web Speech API recognition (Chrome/Edge) and speech synthesis.
// This is NOT Graine's production voice stack; when unavailable the UI falls back to tap-to-speak phrases.
type Rec = { lang: string; interimResults: boolean; continuous: boolean; start(): void; stop(): void; abort(): void;
  onresult: ((e: any) => void) | null; onerror: ((e: any) => void) | null; onend: (() => void) | null };

export function recognitionSupported() {
  return typeof window !== "undefined" && !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
}

export function listen(handlers: { onInterim: (t: string) => void; onFinal: (t: string) => void; onError: (msg: string) => void; onEnd: () => void }) {
  const C = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (!C) { handlers.onError("unsupported"); return null; }
  const r: Rec = new C();
  r.lang = "en-IN"; r.interimResults = true; r.continuous = false;
  let finalText = "";
  r.onresult = (e: any) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const t = e.results[i][0].transcript;
      if (e.results[i].isFinal) finalText += t; else interim += t;
    }
    handlers.onInterim(finalText + interim);
  };
  r.onerror = (e: any) => handlers.onError(e?.error ?? "error");
  r.onend = () => { if (finalText.trim()) handlers.onFinal(finalText.trim()); handlers.onEnd(); };
  try { r.start(); } catch { handlers.onError("start-failed"); return null; }
  return r;
}

let voiceCache: SpeechSynthesisVoice | null | undefined;
function pickVoice() {
  if (voiceCache !== undefined) return voiceCache;
  const vs = typeof speechSynthesis !== "undefined" ? speechSynthesis.getVoices() : [];
  voiceCache = vs.find((v) => /en-IN/i.test(v.lang)) ?? vs.find((v) => /en-GB|en-US/i.test(v.lang)) ?? null;
  return voiceCache;
}

export function speak(text: string, onEnd?: () => void) {
  if (typeof speechSynthesis === "undefined") { onEnd?.(); return; }
  const clean = text.replace(/[\u{1F300}-\u{1FAFF}]/gu, "").replace(/₹/g, "rupees ").replace(/×/g, " times ").replace(/—/g, ", ");
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(clean);
    const v = pickVoice(); if (v) u.voice = v;
    u.rate = 1.04; u.onend = () => onEnd?.(); u.onerror = () => onEnd?.();
    speechSynthesis.speak(u);
  } catch { onEnd?.(); }
}
export const stopSpeaking = () => { try { speechSynthesis.cancel(); } catch { /* ignore */ } };
