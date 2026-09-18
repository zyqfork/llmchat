import {
  collectCompactionSlice,
  getActiveContextStartIndex,
  getCompactionBoundaryStartIndex,
} from "./summary-utils";

function msg(role: "user" | "assistant", text: string, extra?: object) {
  return { role, content: text, ...extra };
}

describe("collectCompactionSlice keep-recent semantics", () => {
  const getContent = (m: any) => (typeof m.content === "string" ? m.content : "");

  it("summarizes all history when recent window is smaller than keepRecentTokens", () => {
    // ~40 tokens total, keepRecent=10000 → summarize everything
    const messages = [
      msg("user", "hello ".repeat(20)),
      msg("assistant", "world ".repeat(20)),
    ];
    const slice = collectCompactionSlice(messages, 0, 10000, getContent);
    expect(slice.summarizeFromIndex).toBe(0);
    expect(slice.firstKeptIndex).toBe(messages.length);
  });

  it("keeps recent messages raw and summarizes older history", () => {
    // Each line ~ 100 chars ≈ 50 tokens (estimateMessageTokens uses length/4)
    const oldUser = msg("user", "x".repeat(400)); // ~100 tokens
    const oldAsst = msg("assistant", "y".repeat(400));
    const midUser = msg("user", "z".repeat(400));
    const recentUser = msg("user", "r".repeat(400));
    const recentAsst = msg("assistant", "s".repeat(400));
    const messages = [oldUser, oldAsst, midUser, recentUser, recentAsst];

    // keep recent ≈ 2 messages worth (~200 tokens) → firstKept near recentUser
    const slice = collectCompactionSlice(messages, 0, 200, getContent);
    expect(slice.summarizeFromIndex).toBe(0);
    expect(slice.firstKeptIndex).toBeGreaterThanOrEqual(3);
    expect(slice.firstKeptIndex).toBeLessThan(messages.length);
  });

  it("getActiveContextStartIndex uses lastSummarizeIndex after compaction", () => {
    const state = {
      messages: [
        msg("user", "old"),
        msg("assistant", "summarized", { isCompressedContextPrompt: true }),
        msg("user", "kept recent"),
      ],
      lastSummarizeIndex: 2,
      compressedContextIndex: 1,
      clearContextIndex: 0,
    };
    // keep-recent starts at index 2 → active context includes "kept recent"
    expect(getActiveContextStartIndex(state)).toBe(2);
  });

  it("getCompactionBoundaryStartIndex prefers lastSummarizeIndex", () => {
    const state = {
      messages: [
        msg("user", "old"),
        msg("assistant", "summary", { isCompressedContextPrompt: true }),
        msg("user", "kept"),
      ],
      lastSummarizeIndex: 2,
      compressedContextIndex: 1,
      clearContextIndex: 0,
    };
    expect(getCompactionBoundaryStartIndex(state)).toBe(2);
  });
});
