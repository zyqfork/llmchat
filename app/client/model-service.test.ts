import { fetchModels } from "./model-service";
import { jest } from "@jest/globals";
import { useAccessStore } from "../store/access";

describe("model-service fetchModels", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("uses builtin pi-ai catalog models when available", async () => {
    const result = await fetchModels("openai");

    expect(result.success).toBe(true);
    expect(result.models.length).toBeGreaterThan(0);
    expect(result.models[0].provider.id).toBe("openai");
  });

  it("fetches custom provider models from /models endpoint", async () => {
    const storeSpy = jest.spyOn(useAccessStore, "getState");
    const windowFetchSpy = jest.spyOn(window, "fetch");
    storeSpy.mockReturnValue({
      customProviders: [
        {
          id: "custom_demo",
          name: "Demo Provider",
          type: "google",
          apiKey: "abc123",
          endpoint: "https://example.com/v1/",
        },
      ],
    } as any);
    windowFetchSpy.mockResolvedValue({
      ok: true,
      json: async () => ({ data: [{ id: "demo-model" }] }),
      status: 200,
      statusText: "OK",
    } as any);

    const result = await fetchModels("custom_demo");

    expect(result.success).toBe(true);
    expect(result.models.map((m) => m.name)).toEqual(["demo-model"]);
    expect(windowFetchSpy).toHaveBeenCalledWith(
      "https://example.com/v1/models",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": "abc123",
        },
      },
    );
    storeSpy.mockRestore();
    windowFetchSpy.mockRestore();
  });
});
