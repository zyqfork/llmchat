// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";
import { TransformStream } from "node:stream/web";
import { TextDecoder, TextEncoder } from "node:util";

// jsdom 下部分依赖（如 typebox）会假定存在 Web 标准的 TextEncoder
globalThis.TextEncoder = TextEncoder as typeof globalThis.TextEncoder;
globalThis.TextDecoder = TextDecoder as typeof globalThis.TextDecoder;
globalThis.TransformStream =
  TransformStream as unknown as typeof globalThis.TransformStream;

// matchMedia 是 @lobehub/icons / antd-style 所需（jsdom 未实现）
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

global.fetch = (() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve([]),
    headers: new Headers(),
    redirected: false,
    statusText: "OK",
    type: "basic",
    url: "",
    body: null,
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve(new FormData()),
    text: () => Promise.resolve(""),
    clone: () => ({} as Response),
  } as Response)) as typeof fetch;
