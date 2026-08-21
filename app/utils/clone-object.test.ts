import { deepClone, ensure } from "./clone";
import { omit, pick } from "./object";

describe("deepClone", () => {
  test("returns a deep copy, not the same reference", () => {
    const original = { a: 1, b: { c: 2 } };
    const copy = deepClone(original);
    expect(copy).toEqual(original);
    expect(copy).not.toBe(original);
    expect(copy.b).not.toBe(original.b);
  });

  test("handles arrays", () => {
    const arr = [1, [2, 3], { x: 4 }];
    const copy = deepClone(arr);
    expect(copy).toEqual(arr);
    expect(copy).not.toBe(arr);
    expect(copy[1]).not.toBe(arr[1]);
  });

  test("handles primitives wrapped in objects", () => {
    expect(deepClone({ n: 42, s: "hi", b: true })).toEqual({
      n: 42,
      s: "hi",
      b: true,
    });
  });
});

describe("ensure", () => {
  test("returns true when all specified keys are present and non-empty", () => {
    expect(ensure({ a: 1, b: "x", c: true }, ["a", "b"])).toBe(true);
  });

  test("returns false when a key is undefined", () => {
    expect(ensure({ a: 1, b: undefined } as any, ["a", "b"])).toBe(false);
  });

  test("returns false when a key is null", () => {
    expect(ensure({ a: null, b: "x" } as any, ["a", "b"])).toBe(false);
  });

  test("returns false when a key is empty string", () => {
    expect(ensure({ a: "", b: "x" }, ["a", "b"])).toBe(false);
  });

  test("returns true for empty keys array", () => {
    expect(ensure({ a: 1 }, [])).toBe(true);
  });
});

describe("omit", () => {
  test("removes specified keys", () => {
    const result = omit({ a: 1, b: 2, c: 3 }, "a", "c");
    expect(result).toEqual({ b: 2 });
  });

  test("returns copy of object when no keys specified", () => {
    const obj = { x: 1 };
    const result = omit(obj);
    expect(result).toEqual(obj);
    expect(result).not.toBe(obj);
  });

  test("ignores keys not present on object", () => {
    const result = omit({ a: 1 } as any, "b" as any);
    expect(result).toEqual({ a: 1 });
  });
});

describe("pick", () => {
  test("returns only the specified keys", () => {
    const result = pick({ a: 1, b: 2, c: 3 }, "a", "c");
    expect(result).toEqual({ a: 1, c: 3 });
  });

  test("returns empty object when no keys specified", () => {
    expect(pick({ a: 1, b: 2 })).toEqual({});
  });

  test("picks keys even when their value is falsy", () => {
    const result = pick({ a: 0, b: false, c: "" }, "a", "b", "c");
    expect(result).toEqual({ a: 0, b: false, c: "" });
  });
});
