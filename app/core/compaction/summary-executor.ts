import { DEFAULT_COMPACTION_SYSTEM_PROMPT } from "./summary-utils";

export interface SummaryExecutorApi {
  llm: {
    chat: (options: SummaryChatOptions) => void;
  };
}

export interface SummaryChatOptions {
  messages: Array<{
    role: "system" | "user";
    content: string;
    id: string;
    date: string;
  }>;
  config: Record<string, unknown> & {
    stream: true;
    model: string;
    providerName: string;
  };
  onUpdate: (message: string) => void;
  onFinish: (message: string, responseRes: Response) => void;
  onError: (error: Error) => void;
}

export interface SummaryExecutionParams {
  api: SummaryExecutorApi;
  systemPrompt?: string;
  summarizeInput: string;
  modelConfig: Record<string, unknown>;
  model: string;
  providerName: string;
  onUpdate: (filteredMessage: string) => void;
  onSuccess: (finalMessage: string, responseStatus?: number) => boolean;
  onFailure: (responseStatus?: number) => void;
  onError: (error: Error) => void;
  sanitizeMessage: (message: string) => string;
}

export async function executeSummaryStream(
  params: SummaryExecutionParams,
): Promise<boolean> {
  return await new Promise<boolean>((resolve) => {
    let resolved = false;
    const resolveOnce = (ok: boolean) => {
      if (!resolved) {
        resolved = true;
        resolve(ok);
      }
    };

    params.api.llm.chat({
      messages: [
        {
          role: "system",
          content:
            params.systemPrompt?.trim() || DEFAULT_COMPACTION_SYSTEM_PROMPT,
          id: "summary-system-prompt",
          date: new Date().toLocaleString(),
        },
        {
          role: "user",
          content: params.summarizeInput,
          id: "summary-user-input",
          date: new Date().toLocaleString(),
        },
      ],
      config: {
        ...params.modelConfig,
        stream: true,
        model: params.model,
        providerName: params.providerName,
      },
      onUpdate(message: string) {
        const filteredMessage = params.sanitizeMessage(message);
        params.onUpdate(filteredMessage);
      },
      onFinish(message: string, responseRes: Response) {
        const finalMessage = params.sanitizeMessage(message) || message;
        if (responseRes?.status === 200) {
          const ok = params.onSuccess(finalMessage, responseRes?.status);
          resolveOnce(ok);
          return;
        }
        params.onFailure(responseRes?.status);
        resolveOnce(false);
      },
      onError(err: Error) {
        params.onError(err);
        resolveOnce(false);
      },
    });
  });
}
