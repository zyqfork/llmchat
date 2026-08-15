import { mergeWithUpdate } from "./sync";

// 只测纯函数 mergeWithUpdate（store 依赖通过下面的 mock 隔离）

test("remote wins conflicts when remote is newer", () => {
  const local = {
    lastUpdateTime: 100,
    theme: "light",
    fontSize: 14,
    localOnly: "keep-local",
  };
  const remote = {
    lastUpdateTime: 200,
    theme: "dark",
    fontSize: 16,
    remoteOnly: "keep-remote",
  };

  const result = mergeWithUpdate(local as any, remote as any);

  expect(result.theme).toBe("dark"); // 远端较新：远端值优先
  expect(result.fontSize).toBe(16);
  expect((result as any).localOnly).toBe("keep-local"); // 本地独有键保留
  expect((result as any).remoteOnly).toBe("keep-remote");
  expect(result.lastUpdateTime).toBe(200); // 较新的时间戳被传播
});

test("local wins conflicts when local is newer", () => {
  const local = {
    lastUpdateTime: 300,
    theme: "light",
    fontSize: 14,
    localOnly: "keep-local",
  };
  const remote = {
    lastUpdateTime: 200,
    theme: "dark",
    fontSize: 16,
    remoteOnly: "keep-remote",
  };

  const result = mergeWithUpdate(local as any, remote as any);

  expect(result.theme).toBe("light"); // 本地较新：本地值优先
  expect(result.fontSize).toBe(14);
  expect((result as any).localOnly).toBe("keep-local");
  expect((result as any).remoteOnly).toBe("keep-remote");
  expect(result.lastUpdateTime).toBe(300);
});

test("equal timestamps fall back to local winning", () => {
  const local = { lastUpdateTime: 500, a: "local" };
  const remote = { lastUpdateTime: 500, a: "remote" };
  const result = mergeWithUpdate(local as any, remote as any);
  expect((result as any).a).toBe("local");
});

test("missing local timestamp treats remote as newer", () => {
  const local = { a: "local" };
  const remote = { lastUpdateTime: 100, a: "remote" };
  const result = mergeWithUpdate(local as any, remote as any);
  expect((result as any).a).toBe("remote");
});

test("remotely-newer merge cannot pollute prototype via __proto__ keys", () => {
  const local: any = { lastUpdateTime: 1 };
  const remote: any = JSON.parse(
    '{"lastUpdateTime": 999, "__proto__": {"polluted": true}}',
  );
  const result = mergeWithUpdate(local, remote);
  expect(({} as any).polluted).toBeUndefined();
  expect((result as any).__proto__.polluted).toBe(true);
});