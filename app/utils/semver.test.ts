import { semverCompare, normalizeReleaseTagVersion } from "../utils";
import { removeThinkingContent } from "../utils";
import { trimTopic } from "../utils";

describe("normalizeReleaseTagVersion", () => {
  test("strips leading v", () => {
    expect(normalizeReleaseTagVersion("v2.19.0")).toBe("2.19.0");
  });

  test("pads short versions", () => {
    expect(normalizeReleaseTagVersion("2.19")).toBe("2.19.0");
    expect(normalizeReleaseTagVersion("2")).toBe("2.0.0");
  });

  test("caps to 3 parts", () => {
    expect(normalizeReleaseTagVersion("1.2.3.4")).toBe("");
  });

  test("rejects non-numeric parts", () => {
    expect(normalizeReleaseTagVersion("abc")).toBe("");
    expect(normalizeReleaseTagVersion("1.x")).toBe("");
  });

  test("keeps prerelease suffix", () => {
    expect(normalizeReleaseTagVersion("v2.20-beta")).toBe("2.20.0-beta");
  });

  test("strips build metadata", () => {
    expect(normalizeReleaseTagVersion("2.20.0+build5")).toBe("2.20.0");
  });

  test("handles empty/unknown", () => {
    expect(normalizeReleaseTagVersion("")).toBe("");
    expect(normalizeReleaseTagVersion("unknown")).toBe("");
    expect(normalizeReleaseTagVersion(undefined as unknown as string)).toBe("");
  });
});

describe("semverCompare", () => {
  test("equal versions", () => {
    expect(semverCompare("2.19.0", "2.19.0")).toBe(0);
    expect(semverCompare("v2.19.0", "2.19")).toBe(0);
  });

  test("major wins", () => {
    expect(semverCompare("3.0.0", "2.99.99")).toBeGreaterThan(0);
    expect(semverCompare("2.0.0", "3.0.0")).toBeLessThan(0);
  });

  test("minor wins", () => {
    expect(semverCompare("2.10.0", "2.9.0")).toBeGreaterThan(0);
    expect(semverCompare("2.9.0", "2.10.0")).toBeLessThan(0);
  });

  test("patch wins", () => {
    expect(semverCompare("2.19.1", "2.19.0")).toBeGreaterThan(0);
    expect(semverCompare("2.19.0", "2.19.1")).toBeLessThan(0);
  });

  test("prerelease sorts before release", () => {
    expect(semverCompare("2.20.0-beta", "2.20.0")).toBeLessThan(0);
    expect(semverCompare("2.20.0", "2.20.0-beta")).toBeGreaterThan(0);
  });

  test("numeric prerelease compares numerically", () => {
    expect(semverCompare("2.20.0-beta.2", "2.20.0-beta.10")).toBeLessThan(0);
    expect(semverCompare("2.20.0-beta.10", "2.20.0-beta.2")).toBeGreaterThan(0);
  });

  test("handles null/empty inputs", () => {
    expect(semverCompare("", "")).toBe(0);
    expect(semverCompare("", "1.0.0")).toBeLessThan(0);
    expect(semverCompare("1.0.0", "")).toBeGreaterThan(0);
  });
});

describe("removeThinkingContent", () => {
  // 函数正则匹配的标签是 <think>（t-h-i-n-k，无 ing）与 </redacted_reasoning>
  const open = "<think>";
  const closeThink = "</think>";
  const closeRedacted = "</redacted_reasoning>";

  test("removes think block", () => {
    const text = "before " + open + "hidden reasoning" + closeThink + " after";
    expect(removeThinkingContent(text)).toBe("before  after");
  });

  test("removes redacted_reasoning block", () => {
    const text = "head " + open + "secret" + closeRedacted + " tail";
    expect(removeThinkingContent(text)).toBe("head  tail");
  });

  test("removes incomplete trailing thinking", () => {
    expect(removeThinkingContent("answer " + open + "partial")).toBe("answer");
  });

  test("empty input returns empty", () => {
    expect(removeThinkingContent("")).toBe("");
    expect(removeThinkingContent(null as unknown as string)).toBe("");
  });

  test("plain text is untouched", () => {
    expect(removeThinkingContent("hello world")).toBe("hello world");
  });

  test("collapses 3+ newlines", () => {
    const text = "a\n\n\n\nb";
    expect(removeThinkingContent(text)).toBe("a\n\nb");
  });
});

describe("trimTopic", () => {
  test("removes leading/trailing quotes and asterisks", () => {
    expect(trimTopic("\"hello\"")).toBe("hello");
    expect(trimTopic("“你好”")).toBe("你好");
    expect(trimTopic("*hello*")).toBe("hello");
  });

  test("removes trailing punctuation", () => {
    expect(trimTopic("你好，")).toBe("你好");
    expect(trimTopic("hello, world!")).toBe("hello, world");
  });

  test("keeps inner whitespace (does not trim spaces)", () => {
    expect(trimTopic("  hello  ")).toBe("  hello  ");
  });

  test("empty input stays as-is", () => {
    expect(trimTopic("")).toBe("");
  });
});