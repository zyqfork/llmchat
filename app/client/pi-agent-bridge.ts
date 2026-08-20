import { Agent, type AgentTool } from "@earendil-works/pi-agent-core";
import {
  EventStream,
  type Api,
  type Context,
  type Message,
  type Model,
} from "@earendil-works/pi-ai";
import { executeMcpToolCall } from "./mcp-tool-executor";

type McpExecutor = typeof executeMcpToolCall;

export function toAgentTools(
  openAiTools: any[] = [],
  executeMcp: McpExecutor = executeMcpToolCall,
): AgentTool[] {
  return openAiTools.flatMap((tool: any) => {
    const fn = tool?.function;
    if (!fn?.name) return [];

    return [
      {
        name: fn.name,
        label: fn.name,
        description: fn.description || `Tool ${fn.name}`,
        parameters: fn.parameters || { type: "object", properties: {} },
        execute: async (toolCallId: string, args: any) => {
          const toolResult = await executeMcp(
            { id: toolCallId, name: fn.name, arguments: args },
            openAiTools,
          );
          if (toolResult.isError) throw new Error(toolResult.content);
          return {
            content: [{ type: "text" as const, text: toolResult.content }],
            details: {
              args,
              mcpPayload: toolResult.mcpPayload,
              mcpMeta: toolResult.mcpMeta,
            },
          };
        },
      } as AgentTool,
    ];
  });
}

export function lastAssistantMessage(messages: any[] = []) {
  return [...messages].reverse().find((message) => message?.role === "assistant");
}

export function agentEventToUnifiedPart(event: any) {
  if (event?.type === "message_update") {
    const update = event.assistantMessageEvent;
    if (update?.type === "text_delta") {
      return { type: "text-delta", text: update.delta };
    }
    if (update?.type === "thinking_delta") {
      return { type: "reasoning-delta", delta: update.delta };
    }
    if (update?.type === "toolcall_end") {
      return { type: "tool-call", toolCall: update.toolCall };
    }
    if (update?.type === "error") {
      return {
        type: "error",
        reason: update.reason,
        error: update.error,
      };
    }
    return undefined;
  }
  if (event?.type !== "tool_execution_end") return undefined;

  const details = event.result?.details;
  const toolCall = event.toolCall || {};
  return {
    type: "tool-result",
    toolCall: {
      id: event.toolCallId || toolCall.id,
      name: event.toolName || toolCall.name,
      arguments: toolCall.arguments ?? details?.args,
      mcpPayload: details?.mcpPayload,
      mcpMeta: details?.mcpMeta,
    },
    result:
      event.result?.content?.[0]?.text ?? JSON.stringify(event.result ?? {}),
    isError: !!event.isError,
  };
}

export interface PiAgentRunOptions {
  context: Context;
  model: Model<Api>;
  tools: AgentTool[];
  streamOptions: any;
  streamFn: (model: any, context: Context, options: any) => any;
  abortSignal?: AbortSignal;
  sessionId?: string;
}

/**
 * Adapt pi-agent's subscribed event API to the async stream consumed by the
 * existing React chat layer. Tool-loop state and ordering remain owned by Pi.
 */
export function createPiAgentRun(options: PiAgentRunOptions) {
  const agent = new Agent({
    initialState: {
      systemPrompt: options.context.systemPrompt || "",
      model: options.model,
      thinkingLevel: options.streamOptions.reasoning || "off",
      messages: options.context.messages,
      tools: options.tools,
    },
    convertToLlm: (messages) => messages as Message[],
    streamFn: (model, context, agentOptions) =>
      options.streamFn(model, context, {
        ...agentOptions,
        ...options.streamOptions,
      }),
    sessionId: options.sessionId,
    toolExecution: "parallel",
  });

  const events = new EventStream<any, any[]>(
    (event) => event?.type === "agent_end",
    (event) => event.messages || agent.state.messages,
  );
  const unsubscribe = agent.subscribe((event) => events.push(event));
  const abort = () => agent.abort();
  options.abortSignal?.addEventListener("abort", abort, { once: true });

  void agent
    .continue()
    .catch((error) => {
      events.push({
        type: "error",
        reason: "error",
        error: {
          errorMessage: error instanceof Error ? error.message : String(error),
        },
      });
      events.end(agent.state.messages);
    })
    .finally(() => {
      unsubscribe();
      options.abortSignal?.removeEventListener("abort", abort);
    });

  return events;
}
