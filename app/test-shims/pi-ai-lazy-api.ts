function unsupportedApi() {
  return {
    stream(): never {
      throw new Error("pi-ai streaming is not available in Jest shim");
    },
    streamSimple(): never {
      throw new Error("pi-ai streaming is not available in Jest shim");
    },
  };
}

export const openAICompletionsApi = unsupportedApi;
export const openAIResponsesApi = unsupportedApi;
export const azureOpenAIResponsesApi = unsupportedApi;
export const anthropicMessagesApi = unsupportedApi;
export const googleGenerativeAIApi = unsupportedApi;
