import { getCompactionPolicy } from "./policy";

describe("compaction policy", () => {
  it("should compress when fixed threshold is reached", () => {
    const decision = getCompactionPolicy().evaluate({
      contextTokens: 9000,
      fixedThreshold: 8000,
      model: "gpt-4o-mini",
      ratio: 0.9,
      userMessageCount: 2,
      summaryMinUserMessages: 1,
      sendMemory: true,
    });

    expect(decision.reachedFixedThreshold).toBe(true);
    expect(decision.shouldCompress).toBe(true);
  });

  it("should not compress when sendMemory is disabled", () => {
    const decision = getCompactionPolicy().evaluate({
      contextTokens: 9000,
      fixedThreshold: 8000,
      model: "gpt-4o-mini",
      ratio: 0.9,
      userMessageCount: 2,
      summaryMinUserMessages: 1,
      sendMemory: false,
    });

    expect(decision.reachedFixedThreshold).toBe(true);
    expect(decision.shouldCompress).toBe(false);
  });

  it("should mark approaching threshold near 80 percent", () => {
    const decision = getCompactionPolicy().evaluate({
      contextTokens: 7600,
      fixedThreshold: 8000,
      model: "gpt-4o-mini",
      ratio: 0.9,
      userMessageCount: 2,
      summaryMinUserMessages: 1,
      sendMemory: true,
    });

    expect(decision.reachedFixedThreshold).toBe(false);
    expect(decision.approachingThreshold).toBe(true);
  });
});
