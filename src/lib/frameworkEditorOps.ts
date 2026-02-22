import type { JSONContent } from "@tiptap/core";
import {
  INJECT_TARGET_SECTION_KEY,
  PROMPT_FRAMEWORKS,
  resolveSectionDefinition,
  type PromptFrameworkDefinition,
  type PromptSectionKey,
} from "./promptFrameworks";

export type ApplyMode = "replace" | "insertTop";
export type ContextInjectTarget = keyof typeof INJECT_TARGET_SECTION_KEY;
export type ContextInjectItem = {
  target: ContextInjectTarget;
  text: string;
};

export type PromptLineDefinition = {
  sectionKey: PromptSectionKey;
  label: string;
  helper: string;
  normalizedLabel: string;
};

export type MatchedPromptLine = {
  definition: PromptLineDefinition;
  labelStart: number;
  labelEnd: number;
  remainder: string;
};

type SectionSegment = {
  sectionKey: PromptSectionKey;
  startIndex: number;
  endIndex: number;
  bodyNodes: JSONContent[];
};

const PROMPT_LINE_DEFINITIONS: PromptLineDefinition[] = (() => {
  const byLabel = new Map<string, PromptLineDefinition>();

  for (const framework of PROMPT_FRAMEWORKS) {
    for (const section of framework.sections) {
      const normalizedLabel = normalizedText(section.label);
      if (byLabel.has(normalizedLabel)) continue;

      byLabel.set(normalizedLabel, {
        sectionKey: section.sectionKey,
        label: section.label,
        helper: section.helper,
        normalizedLabel,
      });
    }
  }

  return [...byLabel.values()];
})();

const PROMPT_LINE_DEFINITIONS_BY_LENGTH = [...PROMPT_LINE_DEFINITIONS].sort(
  (left, right) => right.label.length - left.label.length,
);

export const DEFAULT_HELPER_BY_LABEL = (() => {
  const map = new Map<string, string>();
  for (const definition of PROMPT_LINE_DEFINITIONS) {
    map.set(definition.label, definition.helper);
  }
  return map;
})();

function textFromNode(node: JSONContent | undefined): string {
  if (!node) return "";

  const ownText = typeof node.text === "string" ? node.text : "";
  if (!Array.isArray(node.content)) {
    return ownText;
  }

  return `${ownText}${node.content.map((child) => textFromNode(child)).join("")}`;
}

function isParagraphNode(node: JSONContent): boolean {
  return node.type === "paragraph";
}

function createSectionLineNode(
  section: PromptFrameworkDefinition["sections"][number],
  bodyText = "",
): JSONContent {
  const value = bodyText.trim();
  return {
    type: "paragraph",
    content: [
      {
        type: "text",
        text: value.length > 0 ? `${section.label}: ${value}` : `${section.label}: `,
      },
    ],
  };
}

function rewriteLabelOnLine(node: JSONContent, label: string): JSONContent {
  const lineText = isParagraphNode(node) ? textFromNode(node) : "";
  const parsed = parsePromptLine(lineText);
  const remainder = parsed ? parsed.remainder : lineText.trim();
  const nextText = remainder.length > 0 ? `${label}: ${remainder}` : `${label}: `;

  return {
    type: "paragraph",
    content: [{ type: "text", text: nextText }],
  };
}

function extractFrameworkSegments(
  content: JSONContent[],
  framework: PromptFrameworkDefinition,
): SectionSegment[] {
  const frameworkSectionsByLabel = new Map(
    framework.sections.map((section) => [normalizedText(section.label), section] as const),
  );

  const segments: SectionSegment[] = [];

  for (let index = 0; index < content.length; index += 1) {
    const node = content[index];
    if (!isParagraphNode(node)) continue;

    const parsed = parsePromptLine(textFromNode(node));
    if (!parsed) continue;

    const section = frameworkSectionsByLabel.get(parsed.definition.normalizedLabel);
    if (!section) continue;

    let endIndex = index + 1;
    while (endIndex < content.length) {
      const candidate = content[endIndex];
      if (!isParagraphNode(candidate)) {
        endIndex += 1;
        continue;
      }

      const candidateParsed = parsePromptLine(textFromNode(candidate));
      if (
        candidateParsed &&
        frameworkSectionsByLabel.has(candidateParsed.definition.normalizedLabel)
      ) {
        break;
      }

      endIndex += 1;
    }

    segments.push({
      sectionKey: section.sectionKey,
      startIndex: index,
      endIndex,
      bodyNodes: content.slice(index, endIndex),
    });

    index = endIndex - 1;
  }

  return segments;
}

function buildFrameworkSectionNodes(
  framework: PromptFrameworkDefinition,
  sectionKeys: PromptSectionKey[],
  existingBodies: Map<PromptSectionKey, JSONContent[]>,
): JSONContent[] {
  const selected = new Set(sectionKeys);
  const nextNodes: JSONContent[] = [];

  for (const section of framework.sections) {
    if (!selected.has(section.sectionKey)) continue;

    const preservedBody = existingBodies.get(section.sectionKey);
    if (!preservedBody || preservedBody.length === 0) {
      nextNodes.push(createSectionLineNode(section));
      continue;
    }

    const [first, ...rest] = preservedBody;
    nextNodes.push(rewriteLabelOnLine(first, section.label), ...rest);
  }

  return nextNodes;
}

export function normalizedText(value: string): string {
  return value.replace(/\u00A0/g, " ").trim().toLowerCase();
}

export function parsePromptLine(text: string): MatchedPromptLine | null {
  const leadingWhitespace = text.match(/^\s*/)?.[0].length ?? 0;
  const trimmedStart = text.slice(leadingWhitespace);
  const normalizedStart = trimmedStart.toLowerCase();

  for (const definition of PROMPT_LINE_DEFINITIONS_BY_LENGTH) {
    const prefix = `${definition.label.toLowerCase()}:`;
    if (!normalizedStart.startsWith(prefix)) continue;

    const suffix = trimmedStart.slice(prefix.length);
    const suffixLeadingWhitespace = suffix.match(/^\s*/)?.[0].length ?? 0;
    const remainder = suffix.slice(suffixLeadingWhitespace);

    return {
      definition,
      labelStart: leadingWhitespace,
      labelEnd: leadingWhitespace + definition.label.length + 1,
      remainder,
    };
  }

  return null;
}

export function formatChecklistLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/(^|[\s/])([a-z])/g, (_match, prefix: string, letter: string) => {
      return `${prefix}${letter.toUpperCase()}`;
    });
}

export function sortSectionKeys(
  framework: PromptFrameworkDefinition,
  keys: PromptSectionKey[],
): PromptSectionKey[] {
  const selected = new Set(keys);
  return framework.sections
    .map((section) => section.sectionKey)
    .filter((sectionKey) => selected.has(sectionKey));
}

export function applyFrameworkToContent(
  content: JSONContent[],
  framework: PromptFrameworkDefinition,
  sectionKeys: PromptSectionKey[],
  mode: ApplyMode,
): JSONContent[] {
  const sectionNodes = buildFrameworkSectionNodes(framework, sectionKeys, new Map());
  if (mode === "replace") {
    return sectionNodes.length > 0 ? sectionNodes : [{ type: "paragraph" }];
  }

  return [...sectionNodes, ...content];
}

export function syncFrameworkSectionsInContent(
  content: JSONContent[],
  framework: PromptFrameworkDefinition,
  sectionKeys: PromptSectionKey[],
  confirmRemove: (sectionKey: PromptSectionKey) => boolean,
): { applied: boolean; content: JSONContent[] } {
  const segments = extractFrameworkSegments(content, framework);

  const existingBodies = new Map<PromptSectionKey, JSONContent[]>();
  const usedIndexes = new Set<number>();

  for (const segment of segments) {
    if (!existingBodies.has(segment.sectionKey)) {
      existingBodies.set(segment.sectionKey, segment.bodyNodes);
    }

    for (let index = segment.startIndex; index < segment.endIndex; index += 1) {
      usedIndexes.add(index);
    }
  }

  const selected = new Set(sectionKeys);
  for (const segment of segments) {
    if (selected.has(segment.sectionKey)) continue;

    const bodyText = segment.bodyNodes
      .map((node, index) => {
        if (index !== 0) return textFromNode(node);
        const parsed = parsePromptLine(textFromNode(node));
        return parsed ? parsed.remainder : textFromNode(node);
      })
      .join("\n")
      .trim();

    if (bodyText && !confirmRemove(segment.sectionKey)) {
      return { applied: false, content };
    }
  }

  const nextFrameworkNodes = buildFrameworkSectionNodes(framework, sectionKeys, existingBodies);
  const otherNodes = content.filter((_, index) => !usedIndexes.has(index));

  return {
    applied: true,
    content:
      nextFrameworkNodes.length > 0 || otherNodes.length > 0
        ? [...nextFrameworkNodes, ...otherNodes]
        : [{ type: "paragraph" }],
  };
}

export function injectContextIntoContent(
  content: JSONContent[],
  items: ContextInjectItem[],
): JSONContent[] {
  const entries = items
    .map((item) => ({
      target: item.target,
      text: item.text.trim(),
    }))
    .filter((item) => item.text.length > 0);

  if (entries.length === 0) return content;

  const nextContent = JSON.parse(JSON.stringify(content)) as JSONContent[];

  for (const item of entries) {
    const sectionKey = INJECT_TARGET_SECTION_KEY[item.target];
    const sectionDefinition = resolveSectionDefinition(sectionKey);
    const label = sectionDefinition?.label ?? item.target;

    const lineIndex = nextContent.findIndex((node) => {
      if (!isParagraphNode(node)) return false;
      const parsed = parsePromptLine(textFromNode(node));
      return parsed ? normalizedText(parsed.definition.label) === normalizedText(label) : false;
    });

    if (lineIndex < 0) {
      nextContent.unshift({
        type: "paragraph",
        content: [{ type: "text", text: `${label}: ${item.text}` }],
      });
      continue;
    }

    const parsed = parsePromptLine(textFromNode(nextContent[lineIndex]));
    if (parsed && parsed.remainder.trim().length === 0) {
      nextContent[lineIndex] = {
        type: "paragraph",
        content: [{ type: "text", text: `${label}: ${item.text}` }],
      };
      continue;
    }

    let insertAt = lineIndex + 1;
    while (insertAt < nextContent.length) {
      const candidate = nextContent[insertAt];
      if (!isParagraphNode(candidate)) {
        insertAt += 1;
        continue;
      }

      const candidateParsed = parsePromptLine(textFromNode(candidate));
      if (candidateParsed) break;
      insertAt += 1;
    }

    nextContent.splice(insertAt, 0, {
      type: "paragraph",
      content: [{ type: "text", text: item.text }],
    });
  }

  return nextContent;
}
