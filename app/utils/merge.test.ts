import { merge } from "./merge";

describe("merge", () => {
  test("deep merges nested objects", () => {
    const target = { a: { x: 1, y: 2 }, b: 1 };
    merge(target, { a: { y: 3, z: 4 } });
    expect(target).toEqual({ a: { x: 1, y: 3, z: 4 }, b: 1 });
  });

  test("source wins on conflicting scalar values", () => {
    const target = { a: 1, b: 2 };
    merge(target, { a: 100, c: 3 });
    expect(target).toEqual({ a: 100, b: 2, c: 3 });
  });

  test("keeps target-only keys and adds source-only keys", () => {
    const target = { onlyInTarget: 1 };
    merge(target, { onlyInSource: 2 });
    expect(target).toEqual({ onlyInTarget: 1, onlyInSource: 2 });
  });

  test("merges arrays by index", () => {
    const target = { list: [1, 2, 3] };
    merge(target, { list: [9, 8] });
    expect(target).toEqual({ list: [9, 8, 3] });
  });

  test("does not pollute the prototype via __proto__", () => {
    const source = JSON.parse('{"__proto__": {"polluted": true}}');
    const target: Record<string, unknown> = {};
    merge(target, source);
    expect(({} as any).polluted).toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(target, "__proto__")).toBe(
      true,
    );
    expect((target as any).__proto__.polluted).toBe(true);
    // 自定义键数据完好
    expect(({} as any).polluted).toBeUndefined();
  });

  test("does not touch Object constructor via constructor key", () => {
    const source = JSON.parse('{"constructor": {"hacked": 1}}');
    const target: Record<string, unknown> = {};
    merge(target, source);
    expect((Object as any).hacked).toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(target, "constructor")).toBe(
      true,
    );
    expect((target as any).constructor.hacked).toBe(1);
  });

  test("null/undefined source values are copied as-is", () => {
    const target: Record<string, unknown> = { a: 1 };
    merge(target, { a: null, b: undefined });
    expect(target.a).toBeNull();
    expect("b" in target).toBe(true);
    expect(target.b).toBeUndefined();
  });
});