import { prettyObject, chunks } from "./format";

describe("prettyObject", () => {
  test("wraps object in ```json code block", () => {
    const result = prettyObject({ a: 1, b: "x" });
    expect(result).toBe('```json\n{\n  "a": 1,\n  "b": "x"\n}\n```');
  });

  test("calls toString() for empty object", () => {
    class Foo {
      toString() {
        return "foo-repr";
      }
    }
    expect(prettyObject(new Foo())).toBe("foo-repr");
  });

  test("returns string as-is when already a ```json block", () => {
    const block = "```json\n{}\n```";
    expect(prettyObject(block)).toBe(block);
  });

  test("wraps plain string in code block", () => {
    const result = prettyObject("hello");
    expect(result).toBe("```json\nhello\n```");
  });

  test("handles null", () => {
    expect(prettyObject(null)).toContain("null");
  });

  test("handles undefined gracefully (returns 'undefined' string)", () => {
    expect(prettyObject(undefined)).toBe("undefined");
  });

  test("handles nested objects", () => {
    const result = prettyObject({ nested: { x: [1, 2] } });
    expect(result).toContain('"nested"');
    expect(result).toContain('"x"');
  });
});

describe("chunks", () => {
  // chunks() splits on the LAST space within the [0, maxBytes+1] window.
  // With a large maxBytes, it finds the last space in the whole string.
  // Each space is consumed as a delimiter (not included in output chunks).

  test("yields single chunk when string has no spaces", () => {
    const parts = [...chunks("helloworld", 1000)];
    expect(parts).toEqual(["helloworld"]);
  });

  test("yields empty array for empty string", () => {
    const parts = [...chunks("")];
    expect(parts).toEqual([]);
  });

  test("splits 'ab cd' (one space) into ['ab', 'cd']", () => {
    const parts = [...chunks("ab cd", 1000)];
    expect(parts).toEqual(["ab", "cd"]);
  });

  test("with large maxBytes, splits at last space in each iteration", () => {
    // "one two three" — last space is before "three"
    // first chunk = "one two", second chunk = "three"
    const parts = [...chunks("one two three", 1000)];
    expect(parts).toEqual(["one two", "three"]);
  });

  test("with tight maxBytes, splits closer to the boundary", () => {
    // "one two three" in bytes; with maxBytes=4:
    // lastIndexOf(32, 5) in "one two three" encoded = space at index 3
    // first chunk = "one", remainder = "two three" → splits again at "two three" last space → "two", "three"
    const parts = [...chunks("one two three", 4)];
    // the exact split depends on lastIndexOf(32, maxBytes+1) logic
    // we just assert the reconstituted text is correct and all parts are non-empty
    expect(parts.join(" ")).toBe("one two three");
    expect(parts.every((p) => p.length > 0)).toBe(true);
  });

  test("does not corrupt multi-byte UTF-8 sequences", () => {
    const text = "你好 world";
    const parts = [...chunks(text, 5)];
    for (const part of parts) {
      expect(typeof part).toBe("string");
    }
    expect(parts.join(" ")).toContain("你好");
  });
});
