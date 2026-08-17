import { getEmojiUrl, EMOJI_STYLE } from "./emoji";

describe("getEmojiUrl", () => {
  test("builds CDN URL with apple style and 64px", () => {
    expect(getEmojiUrl("1f600")).toBe(
      "https://fastly.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f600.png",
    );
  });

  test("EMOJI_STYLE is apple", () => {
    expect(EMOJI_STYLE).toBe("apple");
  });

  test("handles multi-part unicode ids", () => {
    expect(getEmojiUrl("1f469-200d-1f4bb")).toContain("1f469-200d-1f4bb");
    expect(getEmojiUrl("1f469-200d-1f4bb")).toContain("/64/");
  });

  test("produces stable output (pure function)", () => {
    expect(getEmojiUrl("1f600")).toBe(getEmojiUrl("1f600"));
  });
});