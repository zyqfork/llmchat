import { estimateTokenLength } from "./token";

describe("estimateTokenLength", () => {
  test("empty string is 0", () => {
    expect(estimateTokenLength("")).toBe(0);
  });

  test("whitespace-only strings are 0", () => {
    expect(estimateTokenLength("   ")).toBe(0);
  });

  test("is monotonic: longer text never returns fewer tokens than its prefix", () => {
    const short = estimateTokenLength("a short message");
    const long = estimateTokenLength("a short message with much more content here");
    expect(long).toBeGreaterThanOrEqual(short);
  });

  test("CJK generates more tokens than ASCII of the same count", () => {
    const chinese = estimateTokenLength("你好世界");
    const letters = estimateTokenLength("abcd");
    expect(chinese).toBeGreaterThan(letters);
  });

  test("any non-empty input is greater than 0", () => {
    expect(estimateTokenLength("hello, world!")).toBeGreaterThan(0);
    expect(estimateTokenLength("a")).toBeGreaterThan(0);
    expect(estimateTokenLength("1")).toBeGreaterThan(0);
  });

  test("mixed content with CJK works", () => {
    expect(estimateTokenLength("hi 你好")).toBeGreaterThan(0);
  });
});