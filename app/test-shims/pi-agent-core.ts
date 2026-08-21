export class Agent {
  state: any;
  options: any;
  subscribers: Array<(event: any) => void> = [];

  constructor(options: any = {}) {
    this.options = options;
    this.state = options.initialState || { messages: [] };
  }

  subscribe(fn: (event: any) => void) {
    this.subscribers.push(fn);
    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== fn);
    };
  }

  abort() {
    this.subscribers.forEach((fn) =>
      fn({
        type: "agent_end",
        messages: this.state.messages,
      }),
    );
  }

  async continue() {
    return this.state.messages;
  }
}

export function agentLoop(): never {
  throw new Error("agentLoop is not available in Jest shim");
}

export function runAgentLoop(): never {
  throw new Error("runAgentLoop is not available in Jest shim");
}
