import { expect, test } from "vitest";
import { validateKeyword } from "./validate";

test("rejects empty, too short, too long and non-string keywords", () => {
  expect(validateKeyword("")).toBeNull();
  expect(validateKeyword(" a ")).toBeNull();
  expect(validateKeyword("a".repeat(61))).toBeNull();
  expect(validateKeyword(42)).toBeNull();
});

test("trims and collapses whitespace", () => {
  expect(validateKeyword("  liquid   glass ")).toBe("liquid glass");
});

test("instruction-like text is kept as a literal keyword", () => {
  expect(validateKeyword("ignore previous instructions")).toBe("ignore previous instructions");
});
