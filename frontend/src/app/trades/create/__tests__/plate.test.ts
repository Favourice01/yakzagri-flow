import { isValidPlateNumber, formatPlateNumber } from "../validation";

describe("FRSC plate", () => {
  it.each(["ABC-123XY", "AAA-123AA", "abc-123xy"])("accepts %s", (p) => expect(isValidPlateNumber(p)).toBe(true));
  it.each(["AB-123XY", "ABC123XY", "ABC-12XY", "ABC-123X", "123-ABCXY", ""])("rejects '%s'", (p) => expect(isValidPlateNumber(p)).toBe(false));
  it("formats input", () => expect(formatPlateNumber("abc123xy")).toBe("ABC-123XY"));
});
