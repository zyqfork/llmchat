import type { ChatSession } from "../store/chat";
import { StreamUpdateOptimizer } from "./stream-optimizer";

const session = { id: "session-1" } as ChatSession;

function contents(updates: Map<string, { content: string }>) {
  return Array.from(updates.values()).map((update) => update.content);
}

describe("StreamUpdateOptimizer", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(1_000);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("renders the first chunk immediately", () => {
    const onBatchUpdate = jest.fn();
    const optimizer = new StreamUpdateOptimizer(onBatchUpdate);

    optimizer.updateStreamingMessage("session-1", "message-1", "A", session);

    expect(onBatchUpdate).toHaveBeenCalledTimes(1);
    expect(contents(onBatchUpdate.mock.calls[0][0])).toEqual(["A"]);
  });

  test("uses a fixed throttle window without postponing continuous updates", () => {
    const onBatchUpdate = jest.fn();
    const optimizer = new StreamUpdateOptimizer(onBatchUpdate);

    optimizer.updateStreamingMessage("session-1", "message-1", "A", session);
    jest.advanceTimersByTime(10);
    optimizer.updateStreamingMessage("session-1", "message-1", "AB", session);
    jest.advanceTimersByTime(10);
    optimizer.updateStreamingMessage("session-1", "message-1", "ABC", session);

    expect(onBatchUpdate).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(12);

    expect(onBatchUpdate).toHaveBeenCalledTimes(2);
    expect(contents(onBatchUpdate.mock.calls[1][0])).toEqual(["ABC"]);
  });

  test("flushes the latest pending content immediately at stream end", () => {
    const onBatchUpdate = jest.fn();
    const optimizer = new StreamUpdateOptimizer(onBatchUpdate);

    optimizer.updateStreamingMessage("session-1", "message-1", "A", session);
    jest.advanceTimersByTime(5);
    optimizer.updateStreamingMessage("session-1", "message-1", "final", session);
    optimizer.flushUpdates();

    expect(onBatchUpdate).toHaveBeenCalledTimes(2);
    expect(contents(onBatchUpdate.mock.calls[1][0])).toEqual(["final"]);

    jest.runOnlyPendingTimers();
    expect(onBatchUpdate).toHaveBeenCalledTimes(2);
  });

  test("flushes multiple active messages fairly in the same batch", () => {
    const onBatchUpdate = jest.fn();
    const optimizer = new StreamUpdateOptimizer(onBatchUpdate);

    optimizer.updateStreamingMessage("session-1", "seed", "seed", session);
    jest.advanceTimersByTime(5);
    optimizer.updateStreamingMessage("session-1", "message-1", "one", session);
    optimizer.updateStreamingMessage("session-1", "message-2", "two", session);
    jest.advanceTimersByTime(27);

    expect(onBatchUpdate).toHaveBeenCalledTimes(2);
    expect(contents(onBatchUpdate.mock.calls[1][0]).sort()).toEqual([
      "one",
      "two",
    ]);
  });

  test("does not lose updates queued by the batch callback", () => {
    let optimizer: StreamUpdateOptimizer;
    const onBatchUpdate = jest.fn(
      (updates: Map<string, { content: string }>) => {
        if (contents(updates).includes("AB")) {
          optimizer.updateStreamingMessage(
            "session-1",
            "message-1",
            "ABC",
            session,
          );
        }
      },
    );
    optimizer = new StreamUpdateOptimizer(onBatchUpdate);

    optimizer.updateStreamingMessage("session-1", "message-1", "A", session);
    jest.advanceTimersByTime(5);
    optimizer.updateStreamingMessage("session-1", "message-1", "AB", session);
    jest.advanceTimersByTime(27);
    jest.advanceTimersByTime(32);

    expect(onBatchUpdate).toHaveBeenCalledTimes(3);
    expect(contents(onBatchUpdate.mock.calls[2][0])).toEqual(["ABC"]);
  });
});
