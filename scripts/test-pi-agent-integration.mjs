import assert from "node:assert/strict";
import { Agent } from "@earendil-works/pi-agent-core";
import {
  createModels,
  fauxAssistantMessage,
  fauxProvider,
  fauxToolCall,
} from "@earendil-works/pi-ai";

const faux = fauxProvider();
const models = createModels();
models.setProvider(faux.provider);
faux.setResponses([
  fauxAssistantMessage(
    fauxToolCall("echo", { text: "ok" }, { id: "call-1" }),
    { stopReason: "toolUse" },
  ),
  fauxAssistantMessage("tool completed"),
]);

let calls = 0;
const events = [];
const agent = new Agent({
  initialState: {
    model: faux.getModel(),
    messages: [{ role: "user", content: "run echo", timestamp: Date.now() }],
    tools: [
      {
        name: "echo",
        label: "echo",
        description: "echo",
        // MCP sends ordinary JSON Schema; pi-agent validates it directly.
        parameters: {
          type: "object",
          properties: { text: { type: "string" } },
          required: ["text"],
        },
        execute: async (_id, args) => {
          calls += 1;
          return {
            content: [{ type: "text", text: args.text }],
            details: {},
          };
        },
      },
    ],
  },
  streamFn: models.streamSimple.bind(models),
});
agent.subscribe((event) => events.push(event.type));

await agent.continue();

const final = [...agent.state.messages]
  .reverse()
  .find((message) => message.role === "assistant");
assert.equal(calls, 1, "tool should execute exactly once");
assert.equal(final?.content?.[0]?.text, "tool completed");
assert.ok(events.includes("tool_execution_start"));
assert.ok(events.includes("tool_execution_end"));
assert.equal(events.at(0), "agent_start");
assert.equal(events.at(-1), "agent_end");

console.log("pi-agent MCP integration passed");
