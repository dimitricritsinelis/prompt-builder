import { describe, expect, it } from "vitest";
import { countWords, estimateOpenAITokens } from "./tokenCount";

describe("estimateOpenAITokens", () => {
  it("returns 0 for empty and whitespace-only input", () => {
    expect(estimateOpenAITokens("")).toBe(0);
    expect(estimateOpenAITokens("   ")).toBe(0);
    expect(estimateOpenAITokens("\n\t")).toBe(0);
  });

  it("normalizes NBSP before estimating", () => {
    expect(estimateOpenAITokens("\u00A0hello\u00A0world\u00A0")).toBe(3);
  });

  it("uses deterministic length/4 rounding up", () => {
    expect(estimateOpenAITokens("abcd")).toBe(1);
    expect(estimateOpenAITokens("abcde")).toBe(2);
    expect(estimateOpenAITokens("abcdefgh")).toBe(2);
    expect(estimateOpenAITokens("abcdefghi")).toBe(3);
  });
});

describe("countWords", () => {
  it("counts words from normalized whitespace", () => {
    expect(countWords("one two three")).toBe(3);
    expect(countWords(" one\t two \nthree ")).toBe(3);
    expect(countWords("one\u00A0two")).toBe(2);
    expect(countWords("")).toBe(0);
  });
});

