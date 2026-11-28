// Speech policy: the single place that decides whether something the assistant produces is SPOKEN.
//
// The assistant speaks to communicate with the customer, not to narrate its work:
//   conversational — acknowledgements, questions, clarifications, explanations, confirmation requests, issues → spoken
//   final          — the outcome of a task (“Done! I've added …”, “Your deliveries are paused …”)            → spoken
//   operational    — what it does in the background (searching, opening screens, tapping, verifying)        → shown only
//   silent         — anything else that must never make a sound                                              → shown only
//
// Operational progress is not even a message: it lives in the step line (ui.operator) and the activity inspector,
// which have no path into the speech queue. Only messages that pass `shouldSpeak` are queued, so a new operational
// update can never interrupt or duplicate a spoken reply. A message's spoken words are its caption text, exactly;
// supporting detail (prices, specs, the route taken) goes in `detail`, which is displayed but never spoken.
import { logCall, type Msg } from "../backend/store";
import type { Channel } from "../data/types";

export type SpeechKind = NonNullable<Msg["speech"]>;
const SPOKEN: ReadonlySet<SpeechKind> = new Set(["conversational", "final"]);

/** The kind of a message: explicit metadata wins; an agent reply with no label is conversational. */
export function speechKind(m: Pick<Msg, "role" | "speech">): SpeechKind {
  if (m.speech) return m.speech;
  return m.role === "agent" ? "conversational" : "silent";
}

/** True only for in-app assistant messages classified for speech. */
export function shouldSpeak(m: Pick<Msg, "role" | "speech" | "text">, ch: Channel): boolean {
  return ch === "inapp" && m.role === "agent" && SPOKEN.has(speechKind(m)) && !!m.text.trim();
}

/** Record the decision in the activity inspector, so the policy can be checked during a demo. */
export function logSpeechDecision(m: Pick<Msg, "role" | "speech" | "text">, ch: Channel) {
  if (ch !== "inapp" || m.role !== "agent") return;
  const kind = speechKind(m); const spoken = shouldSpeak(m, ch);
  logCall({ name: `speech: ${spoken ? "spoken" : "shown only"} (${kind}) “${m.text.slice(0, 60)}${m.text.length > 60 ? "…" : ""}”`, kind: "nlu", status: "info", channel: ch });
}
