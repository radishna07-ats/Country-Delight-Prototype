import { describe, expect, it } from "vitest";
import { sentencesOf, speakCaption, toSpeech } from "../../src/agent-ui/conversation";
import { parse } from "../../src/agent/nlu";

describe("captions == speech", () => {
  it("splits a caption into the sentences that are spoken and highlighted, without losing words", () => {
    const t = "Done. I added 1 × Whey Protein Powder — Unflavoured (1 kg, ₹1,614, ★4.6 from 2,140 ratings) to your cart. Checkout stays with you.";
    const s = sentencesOf(t);
    expect(s).toHaveLength(3);
    expect(s.join(" ")).toBe(t);
  });
  it("keeps decimals and amounts inside one sentence", () => {
    expect(sentencesOf("It's rated ★4.6. The price is ₹1,614.50 today.")).toEqual(["It's rated ★4.6.", "The price is ₹1,614.50 today."]);
  });
  it("normalises pronunciation only: same words, read naturally", () => {
    expect(toSpeech("₹1,614")).toBe("1,614 rupees");
    expect(toSpeech("that's +₹36 per delivery")).toBe("that's plus 36 rupees per delivery");
    expect(toSpeech("★4.6 from 2,140 ratings")).toBe("4.6 stars from 2,140 ratings");
    expect(toSpeech("Added 2 × Cow Milk")).toBe("Added 2 Cow Milk");
    expect(toSpeech("Menu › My Subscriptions")).toBe("Menu, then My Subscriptions");
    expect(toSpeech("Typing “protein powder” into search…")).toBe("Typing protein powder into search.");
  });
  it("resolves at once when speech is unavailable, so nothing waits on it", async () => {
    const t0 = Date.now(); await speakCaption("x", "Hello there."); expect(Date.now() - t0).toBeLessThan(50);
  });
  it("“that's all” / “bye” end the conversation; “stopped” is not a stop command", () => {
    expect(parse("that's all", "2026-11-21T20:15").intent).toBe("goodbye");
    expect(parse("bye", "2026-11-21T20:15").intent).toBe("goodbye");
    expect(parse("Okay, I'm done", "2026-11-21T20:15").intent).toBe("goodbye");
    expect(parse("thank you", "2026-11-21T20:15").intent).toBe("thanks");
  });
});

import { shouldSpeak, speechKind } from "../../src/agent/speechPolicy";
describe("speech policy", () => {
  it("speaks conversational and final in-app messages only", () => {
    expect(shouldSpeak({ role: "agent", text: "Which milk?", speech: undefined }, "inapp")).toBe(true);
    expect(shouldSpeak({ role: "agent", text: "Done!", speech: "final" }, "inapp")).toBe(true);
    expect(shouldSpeak({ role: "agent", text: "Searching…", speech: "operational" }, "inapp")).toBe(false);
    expect(shouldSpeak({ role: "agent", text: "x", speech: "silent" }, "inapp")).toBe(false);
    expect(shouldSpeak({ role: "user", text: "hello" }, "inapp")).toBe(false);
    expect(shouldSpeak({ role: "agent", text: "Hi" }, "whatsapp")).toBe(false); // text channel
    expect(speechKind({ role: "agent" })).toBe("conversational");
  });
});
