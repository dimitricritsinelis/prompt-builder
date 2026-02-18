function normalizeText(text: string): string {
  return text.replace(/\u00A0/g, " ").trim();
}

export function countWords(text: string): number {
  const normalized = normalizeText(text);
  if (!normalized) return 0;
  return normalized.split(/\s+/).filter(Boolean).length;
}

export function estimateOpenAITokens(text: string): number {
  const normalized = normalizeText(text);
  if (!normalized) return 0;
  return Math.ceil(normalized.length / 4);
}

