import { ui, logCall } from "../backend/store";
import { greet, handleEvent, userSays } from "../agent/engine";

/** Open the in-app assistant (dock → sheet), optionally with context from another surface (e.g. Ayuh),
 *  a first utterance, or a transaction to explain. */
export function openAssistant(opts: { context?: string; say?: string; explainTxn?: string; voice?: boolean }) {
  ui.set((s) => ({ ...s, agentOpen: true, agentExpanded: false, agentPinned: false, voiceOpen: !!opts.voice, channel: "inapp", nudge: null }));
  const fresh = ui.get().messages.length === 0;
  if (fresh) {
    logCall({ name: "session_start: in-app agent (identify user_id, screen context)", kind: "app_action", status: "ok", channel: "inapp", args: { route: ui.get().route.screen, context: opts.context } });
    if (!opts.say && !opts.explainTxn) greet("inapp", opts.context);
    else if (opts.context) greet("inapp", opts.context);
  }
  if (opts.say) setTimeout(() => void userSays(opts.say!, "inapp"), fresh ? 250 : 50);
  if (opts.explainTxn) setTimeout(() => void handleEvent({ kind: "explain_txn", txnId: opts.explainTxn! }, "inapp"), 50);
}
