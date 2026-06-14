// Learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";
import { TransformStream } from "node:stream/web";
import { TextDecoder, TextEncoder } from "node:util";

// jsdom 下部分依赖（如 typebox）会假定存在 Web 标准的 TextEncoder
globalThis.TextEncoder = TextEncoder as typeof globalThis.TextEncoder;
globalThis.TextDecoder = TextDecoder as typeof globalThis.TextDecoder;
globalThis.TransformStream =
  TransformStream as unknown as typeof globalThis.TransformStream;

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
