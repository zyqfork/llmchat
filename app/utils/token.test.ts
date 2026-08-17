import { estimateTokenLength } from "./token";

describe("estimateTokenLength", () => {
  test("empty string is 0", () => {
    expect(estimateTokenLength("")).toBe(0);
  });

  test("ASCII letters estimate 0.25 each", () => {
    expect(estimateTokenLength("abcd")).toBeCloseTo(1);
  });

  test("digits and symbols estimate 0.5 each", () => {
    expect(estimateTokenLength("1234")).toBeCloseTo(2);
    expect(estimateTokenLength("!@#$")).toBeCloseTo(2);
  });

  test("single-space is 0.5", () => {
    expect(estimateTokenLength(" ")).toBeCloseTo(0.5);
  });

  test("CJK chars estimate 1.5 each (about 1 token/char heuristic)", () => {
    expect(estimateTokenLength("你好世界")).toBeCloseTo(6);
  });

  test("mixed content sums correctly", () => {
    // "hi " = 0.25+0.25+0.5 = 1, "你好" = 3
    expect(estimateTokenLength("hi 你好")).toBeCloseTo(4);
  });

  test("is monotonic: longer text never estimates fewer tokens", () => {
    const short = estimateTokenLength("a short message");
    const long = estimateTokenLength("a short message with much more content here");
    expect(long).toBeGreaterThan(short);
  });
});