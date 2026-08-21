import {
  trimResponsesInputForStateful,
  applyStatefulResponsesPayload,
} from "./response-api";

const sys = (content: string) => ({ role: "system", content });
const dev = (content: string) => ({ role: "developer", content });
const user = (content: string) => ({ role: "user", content });
const assistant = (content: string) => ({ role: "assistant", content });

describe("trimResponsesInputForStateful", () => {
  test("returns input unchanged when hasPreviousResponseId is false", () => {
    const input = [user("hi"), assistant("hello")];
    expect(trimResponsesInputForStateful(input, false)).toBe(input);
  });

  test("returns input unchanged when input is empty", () => {
    expect(trimResponsesInputForStateful([], true)).toEqual([]);
  });

  test("keeps system prefix + last user message only", () => {
    const input = [
      sys("Be helpful"),
      user("first question"),
      assistant("first answer"),
      user("second question"),
    ];
    const result = trimResponsesInputForStateful(input, true);
    expect(result).toEqual([sys("Be helpful"), user("second question")]);
  });

  test("keeps developer prefix + last user message", () => {
    const input = [
      dev("You are helpful"),
      user("q1"),
      assistant("a1"),
      user("q2"),
      assistant("a2"),
      user("q3"),
    ];
    const result = trimResponsesInputForStateful(input, true);
    expect(result).toEqual([dev("You are helpful"), user("q3")]);
  });

  test("keeps multiple system/developer prefix items", () => {
    const input = [
      sys("rule 1"),
      dev("rule 2"),
      user("question"),
    ];
    const result = trimResponsesInputForStateful(input, true);
    expect(result).toEqual([sys("rule 1"), dev("rule 2"), user("question")]);
  });

  test("returns prefix only when no user message exists", () => {
    const input = [sys("Be helpful"), assistant("I am ready")];
    const result = trimResponsesInputForStateful(input, true);
    expect(result).toEqual([sys("Be helpful")]);
  });

  test("returns full input when no prefix and no user message", () => {
    const input = [assistant("only me")];
    const result = trimResponsesInputForStateful(input, true);
    expect(result).toEqual(input);
  });
});

describe("applyStatefulResponsesPayload", () => {
  test("returns payload unchanged when hasTools is true", () => {
    const payload = { model: "gpt-4o", input: [user("hi")] };
    const result = applyStatefulResponsesPayload(payload, { hasTools: true });
    expect(result).toBe(payload);
  });

  test("adds store:true and no previous_response_id when no previousResponseId", () => {
    const payload = { model: "gpt-4o", input: [user("hi")] };
    const result = applyStatefulResponsesPayload(payload, {});
    expect(result.store).toBe(true);
    expect(result).not.toHaveProperty("previous_response_id");
    expect(result.input).toEqual([user("hi")]);
  });

  test("adds store:true and previous_response_id when provided", () => {
    const input = [sys("sys"), user("q1"), assistant("a1"), user("q2")];
    const payload = { model: "gpt-4o", input };
    const result = applyStatefulResponsesPayload(payload, {
      previousResponseId: "resp-abc",
    });
    expect(result.store).toBe(true);
    expect(result.previous_response_id).toBe("resp-abc");
    // input trimmed to sys prefix + last user msg
    expect(result.input).toEqual([sys("sys"), user("q2")]);
  });

  test("does not mutate original payload", () => {
    const payload = { model: "gpt-4o", input: [user("hi")] };
    applyStatefulResponsesPayload(payload, { previousResponseId: "r-1" });
    expect(payload).not.toHaveProperty("store");
    expect(payload).not.toHaveProperty("previous_response_id");
  });

  test("handles missing input field gracefully", () => {
    const payload = { model: "gpt-4o" } as any;
    const result = applyStatefulResponsesPayload(payload, {
      previousResponseId: "r-2",
    });
    expect(result.store).toBe(true);
    expect(result.previous_response_id).toBe("r-2");
    expect(result.input).toEqual([]);
  });
});
