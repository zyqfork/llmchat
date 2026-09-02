import { activateCopyToClipboard } from "../utils";

jest.mock("../components/ui-lib", () => ({
  showToast: jest.fn(),
}));

describe("activateCopyToClipboard", () => {
  test("prevents default and stops propagation before copying", () => {
    const preventDefault = jest.fn();
    const stopPropagation = jest.fn();
    const writeText = jest.fn().mockResolvedValue(undefined);

    Object.assign(navigator, {
      clipboard: { writeText },
    });

    activateCopyToClipboard({ preventDefault, stopPropagation }, "hello");

    expect(preventDefault).toHaveBeenCalled();
    expect(stopPropagation).toHaveBeenCalled();
    expect(writeText).toHaveBeenCalledWith("hello");
  });
});
