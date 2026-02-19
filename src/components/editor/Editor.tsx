import CodeBlock from "@tiptap/extension-code-block";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import TextAlign from "@tiptap/extension-text-align";
import Typography from "@tiptap/extension-typography";
import Underline from "@tiptap/extension-underline";
import { Extension, type Editor as TiptapEditor, type JSONContent } from "@tiptap/core";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { Plugin, PluginKey, type EditorState } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type CSSProperties,
  type ChangeEvent,
} from "react";
import { PromptBlock } from "../../extensions/prompt-block";
import { useEditorAutosave } from "../../hooks/useEditorAutosave";
import type { EditorStats } from "../../lib/editorStats";
import {
  getDefaultSectionKeys,
  getFrameworkById,
  INJECT_TARGET_SECTION_KEY,
  PROMPT_FRAMEWORKS,
  resolveSectionDefinition,
  type PromptFrameworkDefinition,
  type PromptFrameworkId,
  type PromptSectionKey,
} from "../../lib/promptFrameworks";
import type { Note } from "../../lib/tauri";
import { countWords } from "../../lib/tokenCount";

type EditorProps = {
  note: Note;
  onSaveBody: (
    id: string,
    title: string,
    bodyJson: string,
    bodyText: string,
  ) => Promise<void>;
  onStatsChange: (stats: EditorStats) => void;
};

type HeadingValue = "paragraph" | "h1" | "h2" | "h3";
type ListValue = "none" | "bullet" | "ordered" | "task";
type TextAlignValue = "left" | "center" | "right" | "justify";
type FrameworkSelectValue = "none" | PromptFrameworkId;
type ApplyMode = "replace" | "insertTop";
type ContextInjectTarget = keyof typeof INJECT_TARGET_SECTION_KEY;
type ContextInjectItem = {
  target: ContextInjectTarget;
  text: string;
};
type ContextInjectEventDetail = {
  items: ContextInjectItem[];
};

type SectionSegment = {
  sectionKey: PromptSectionKey;
  startIndex: number;
  endIndex: number;
  bodyNodes: JSONContent[];
};

const ZOOM_STEPS = [80, 90, 100, 110, 120, 130] as const;

const ALIGNMENT_OPTIONS: { title: string; value: TextAlignValue }[] = [
  { title: "Align left", value: "left" },
  { title: "Align center", value: "center" },
  { title: "Align right", value: "right" },
  { title: "Justify", value: "justify" },
];

function fallbackDoc(): JSONContent {
  return {
    type: "doc",
    content: [{ type: "paragraph" }],
  };
}

function parseStoredDoc(rawJson: string): JSONContent {
  try {
    const parsed = JSON.parse(rawJson) as JSONContent;
    if (
      parsed &&
      parsed.type === "doc" &&
      Array.isArray(parsed.content) &&
      parsed.content.length > 0
    ) {
      return parsed;
    }
  } catch {
    // Fall back to an empty document when previous content is invalid.
  }

  return fallbackDoc();
}

function deriveBodyText(editorText: string): string {
  return editorText.replace(/\u00A0/g, " ").trim();
}

function extractBodyText(editor: TiptapEditor): string {
  return deriveBodyText(editor.state.doc.textBetween(0, editor.state.doc.content.size, "\n\n"));
}

function deriveSavePayload(editor: TiptapEditor): { bodyJson: string; bodyText: string } {
  return {
    bodyJson: JSON.stringify(editor.getJSON()),
    bodyText: extractBodyText(editor),
  };
}

function getNextZoom(current: number, direction: -1 | 1): number {
  const currentIndex = ZOOM_STEPS.indexOf(current as (typeof ZOOM_STEPS)[number]);
  const fallbackIndex = ZOOM_STEPS.indexOf(100);
  const startIndex = currentIndex === -1 ? fallbackIndex : currentIndex;
  const nextIndex = Math.max(0, Math.min(ZOOM_STEPS.length - 1, startIndex + direction));
  return ZOOM_STEPS[nextIndex];
}

function getHeadingValue(editor: TiptapEditor): HeadingValue {
  if (editor.isActive("heading", { level: 1 })) return "h1";
  if (editor.isActive("heading", { level: 2 })) return "h2";
  if (editor.isActive("heading", { level: 3 })) return "h3";
  return "paragraph";
}

function getListValue(editor: TiptapEditor): ListValue {
  if (editor.isActive("taskList")) return "task";
  if (editor.isActive("bulletList")) return "bullet";
  if (editor.isActive("orderedList")) return "ordered";
  return "none";
}

function getDocContent(editor: TiptapEditor): JSONContent[] {
  const doc = editor.getJSON();
  return Array.isArray(doc.content) ? doc.content : [];
}

function textFromNode(node: JSONContent | undefined): string {
  if (!node) return "";

  const ownText = typeof node.text === "string" ? node.text : "";
  if (!Array.isArray(node.content)) {
    return ownText;
  }

  return `${ownText}${node.content.map((child) => textFromNode(child)).join("")}`;
}

function normalizedText(value: string): string {
  return value.replace(/\u00A0/g, " ").trim().toLowerCase();
}

function isParagraphNode(node: JSONContent): boolean {
  return node.type === "paragraph";
}

type PromptLineDefinition = {
  sectionKey: PromptSectionKey;
  label: string;
  helper: string;
  normalizedLabel: string;
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

const DEFAULT_HELPER_BY_LABEL = (() => {
  const map = new Map<string, string>();
  for (const definition of PROMPT_LINE_DEFINITIONS) {
    map.set(definition.label, definition.helper);
  }
  return map;
})();

type MatchedPromptLine = {
  definition: PromptLineDefinition;
  leadingWhitespace: number;
  labelStart: number;
  labelEnd: number;
  prefixEnd: number;
  remainder: string;
};

function parsePromptLine(text: string): MatchedPromptLine | null {
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
      leadingWhitespace,
      labelStart: leadingWhitespace,
      labelEnd: leadingWhitespace + definition.label.length + 1,
      prefixEnd: leadingWhitespace + definition.label.length + 1 + suffixLeadingWhitespace,
      remainder,
    };
  }

  return null;
}

function createPromptLineGhostExtension(
  getHelperMap: () => Map<string, string>,
): Extension {
  return Extension.create({
    name: "promptLineGhost",
    addProseMirrorPlugins() {
      return [
        new Plugin({
          key: new PluginKey("promptLineGhost"),
          props: {
            decorations(state: EditorState) {
              const decorations: Decoration[] = [];
              const helperMap = getHelperMap();

              state.doc.descendants((node: ProseMirrorNode, position: number) => {
                if (node.type.name !== "paragraph") return;
                const paragraphText = node.textContent ?? "";
                const match = parsePromptLine(paragraphText);
                if (!match) return;

                const helper = helperMap.get(match.definition.label) ?? match.definition.helper;

                decorations.push(
                  Decoration.inline(
                    position + 1 + match.labelStart,
                    position + 1 + match.labelEnd,
                    {
                      class: "prompt-line-label",
                      title: helper,
                    },
                  ),
                );

                if (helper && match.remainder.trim().length === 0) {
                  decorations.push(
                    Decoration.node(
                      position,
                      position + node.nodeSize,
                      {
                        class: "prompt-line-has-ghost",
                        "data-prompt-helper": helper,
                        title: helper,
                      },
                    ),
                  );
                }
              });

              return DecorationSet.create(state.doc, decorations);
            },
          },
        }),
      ];
    },
  });
}

function formatChecklistLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/(^|[\s/])([a-z])/g, (_match, prefix: string, letter: string) => {
      return `${prefix}${letter.toUpperCase()}`;
    });
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

function rewriteLabelOnLine(
  node: JSONContent,
  label: string,
): JSONContent {
  const lineText = isParagraphNode(node) ? textFromNode(node) : "";
  const parsed = parsePromptLine(lineText);
  const remainder = parsed ? parsed.remainder : lineText.trim();
  const nextText = remainder.length > 0 ? `${label}: ${remainder}` : `${label}: `;

  return {
    type: "paragraph",
    content: [{ type: "text", text: nextText }],
  };
}

function sortSectionKeys(
  framework: PromptFrameworkDefinition,
  keys: PromptSectionKey[],
): PromptSectionKey[] {
  const selected = new Set(keys);
  return framework.sections
    .map((section) => section.sectionKey)
    .filter((sectionKey) => selected.has(sectionKey));
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

function applyFrameworkToEditor(
  editor: TiptapEditor,
  framework: PromptFrameworkDefinition,
  sectionKeys: PromptSectionKey[],
  mode: ApplyMode,
): void {
  const sectionNodes = buildFrameworkSectionNodes(framework, sectionKeys, new Map());

  if (mode === "replace") {
    editor.commands.setContent({
      type: "doc",
      content: sectionNodes.length > 0 ? sectionNodes : [{ type: "paragraph" }],
    });
    return;
  }

  const currentContent = getDocContent(editor);
  editor.commands.setContent({
    type: "doc",
    content: [...sectionNodes, ...currentContent],
  });
}

function syncFrameworkSectionsInEditor(
  editor: TiptapEditor,
  framework: PromptFrameworkDefinition,
  sectionKeys: PromptSectionKey[],
): boolean {
  const content = getDocContent(editor);
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
    if (!bodyText) continue;

    const shouldDelete = window.confirm(
      `Remove ${segment.sectionKey.replace(/_/g, " ").toUpperCase()} section and delete its content?`,
    );

    if (!shouldDelete) {
      return false;
    }
  }

  const nextFrameworkNodes = buildFrameworkSectionNodes(framework, sectionKeys, existingBodies);
  const otherNodes = content.filter((_, index) => !usedIndexes.has(index));

  editor.commands.setContent({
    type: "doc",
    content:
      nextFrameworkNodes.length > 0 || otherNodes.length > 0
        ? [...nextFrameworkNodes, ...otherNodes]
        : [{ type: "paragraph" }],
  });

  return true;
}

function injectContextIntoSections(editor: TiptapEditor, items: ContextInjectItem[]): void {
  const entries = items
    .map((item) => ({
      target: item.target,
      text: item.text.trim(),
    }))
    .filter((item) => item.text.length > 0);

  if (entries.length === 0) return;

  const content = JSON.parse(JSON.stringify(getDocContent(editor))) as JSONContent[];

  for (const item of entries) {
    const sectionKey = INJECT_TARGET_SECTION_KEY[item.target];
    const sectionDefinition = resolveSectionDefinition(sectionKey);
    const label = sectionDefinition?.label ?? item.target;

    const lineIndex = content.findIndex((node) => {
      if (!isParagraphNode(node)) return false;
      const parsed = parsePromptLine(textFromNode(node));
      return parsed ? normalizedText(parsed.definition.label) === normalizedText(label) : false;
    });

    if (lineIndex < 0) {
      content.unshift({
        type: "paragraph",
        content: [{ type: "text", text: `${label}: ${item.text}` }],
      });
      continue;
    }

    const parsed = parsePromptLine(textFromNode(content[lineIndex]));
    if (parsed && parsed.remainder.trim().length === 0) {
      content[lineIndex] = {
        type: "paragraph",
        content: [{ type: "text", text: `${label}: ${item.text}` }],
      };
      continue;
    }

    let insertAt = lineIndex + 1;
    while (insertAt < content.length) {
      const candidate = content[insertAt];
      if (!isParagraphNode(candidate)) {
        insertAt += 1;
        continue;
      }
      const candidateParsed = parsePromptLine(textFromNode(candidate));
      if (candidateParsed) break;
      insertAt += 1;
    }

    content.splice(insertAt, 0, {
      type: "paragraph",
      content: [{ type: "text", text: item.text }],
    });
  }

  editor.commands.setContent({
    type: "doc",
    content: content.length > 0 ? content : [{ type: "paragraph" }],
  });
}

function AlignmentIcon({ value }: { value: TextAlignValue }) {
  const line = (x1: number, y1: number, x2: number, y2: number) => (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
  );

  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
      {value === "left" ? (
        <>
          {line(2, 3, 12, 3)}
          {line(2, 6, 9, 6)}
          {line(2, 9, 12, 9)}
          {line(2, 12, 8, 12)}
        </>
      ) : null}
      {value === "center" ? (
        <>
          {line(2, 3, 12, 3)}
          {line(4, 6, 10, 6)}
          {line(2.5, 9, 11.5, 9)}
          {line(4.5, 12, 9.5, 12)}
        </>
      ) : null}
      {value === "right" ? (
        <>
          {line(2, 3, 12, 3)}
          {line(5, 6, 12, 6)}
          {line(2, 9, 12, 9)}
          {line(6, 12, 12, 12)}
        </>
      ) : null}
      {value === "justify" ? (
        <>
          {line(2, 3, 12, 3)}
          {line(2, 6, 12, 6)}
          {line(2, 9, 12, 9)}
          {line(2, 12, 12, 12)}
        </>
      ) : null}
    </svg>
  );
}

export function Editor({ note, onSaveBody, onStatsChange }: EditorProps) {
  const initialDoc = useMemo(() => parseStoredDoc(note.bodyJson), [note.bodyJson]);
  const editorRef = useRef<TiptapEditor | null>(null);
  const helperByLabelRef = useRef<Map<string, string>>(DEFAULT_HELPER_BY_LABEL);
  const [, forceToolbarRender] = useReducer((value: number) => value + 1, 0);
  const [zoomPercent, setZoomPercent] = useState<number>(100);
  const [selectedFrameworkId, setSelectedFrameworkId] = useState<FrameworkSelectValue>("none");
  const [selectedSectionKeys, setSelectedSectionKeys] = useState<PromptSectionKey[]>([]);
  const [isFrameworkPanelOpen, setIsFrameworkPanelOpen] = useState(false);
  const [hasAppliedFramework, setHasAppliedFramework] = useState(false);
  const [pendingApply, setPendingApply] = useState<{
    framework: PromptFrameworkDefinition;
    sectionKeys: PromptSectionKey[];
  } | null>(null);

  const selectedFramework = useMemo(
    () =>
      selectedFrameworkId === "none"
        ? null
        : (getFrameworkById(selectedFrameworkId) ?? null),
    [selectedFrameworkId],
  );
  const promptLineGhostExtension = useMemo(
    () => createPromptLineGhostExtension(() => helperByLabelRef.current),
    [],
  );

  const saveBody = useCallback(
    async (bodyJson: string, bodyText: string) => {
      await onSaveBody(note.id, note.title, bodyJson, bodyText);
    },
    [note.id, note.title, onSaveBody],
  );

  const { queueSave, flush } = useEditorAutosave({
    noteId: note.id,
    initialBodyJson: note.bodyJson,
    initialBodyText: note.bodyText,
    getPayload: () => {
      const instance = editorRef.current;
      if (!instance) {
        return {
          bodyJson: note.bodyJson,
          bodyText: note.bodyText,
        };
      }
      return deriveSavePayload(instance);
    },
    onSave: saveBody,
  });

  useEffect(() => {
    if (!selectedFramework) {
      helperByLabelRef.current = DEFAULT_HELPER_BY_LABEL;
      return;
    }

    const next = new Map(DEFAULT_HELPER_BY_LABEL);
    for (const section of selectedFramework.sections) {
      next.set(section.label, section.helper);
    }
    helperByLabelRef.current = next;
  }, [selectedFramework]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      CodeBlock,
      Underline,
      Typography,
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
      }),
      promptLineGhostExtension,
      PromptBlock,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      TextAlign.configure({
        types: ["paragraph", "heading"],
      }),
      Placeholder.configure({
        placeholder: "Start writing...",
      }),
    ],
    content: initialDoc,
    editorProps: {
      attributes: {
        class:
          "tiptap h-full min-h-0 w-full rounded-[var(--radius-block)] border border-[var(--border-default)] bg-[var(--bg-block)] px-6 py-5 focus:outline-none",
      },
    },
    onCreate: ({ editor: instance }) => {
      editorRef.current = instance;
      const bodyText = extractBodyText(instance);
      onStatsChange({
        bodyText,
        wordCount: countWords(bodyText),
      });
    },
    onUpdate: ({ editor: instance }) => {
      editorRef.current = instance;
      const bodyText = extractBodyText(instance);
      onStatsChange({
        bodyText,
        wordCount: countWords(bodyText),
      });
      queueSave();
    },
    onDestroy: () => {
      editorRef.current = null;
    },
    onBlur: () => {
      void flush();
    },
  });

  useEffect(() => {
    return () => {
      void flush();
    };
  }, [flush]);

  useEffect(() => {
    setSelectedFrameworkId("none");
    setSelectedSectionKeys([]);
    setIsFrameworkPanelOpen(false);
    setHasAppliedFramework(false);
    setPendingApply(null);
  }, [note.id]);

  useEffect(() => {
    const handleForceSave = () => {
      void flush();
    };

    window.addEventListener("promptpad:force-save", handleForceSave);
    return () => {
      window.removeEventListener("promptpad:force-save", handleForceSave);
    };
  }, [flush]);

  useEffect(() => {
    if (!editor) return;

    const syncToolbarState = () => {
      forceToolbarRender();
    };

    editor.on("selectionUpdate", syncToolbarState);
    editor.on("transaction", syncToolbarState);

    return () => {
      editor.off("selectionUpdate", syncToolbarState);
      editor.off("transaction", syncToolbarState);
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) return;

    const handleContextInject = (event: Event) => {
      const customEvent = event as CustomEvent<ContextInjectEventDetail>;
      const detail = customEvent.detail;
      if (!detail || !Array.isArray(detail.items)) return;
      injectContextIntoSections(editor, detail.items);
    };

    window.addEventListener("promptpad:inject-context", handleContextInject as EventListener);
    return () => {
      window.removeEventListener("promptpad:inject-context", handleContextInject as EventListener);
    };
  }, [editor]);

  const handleHeadingChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      if (!editor) return;
      const nextValue = event.currentTarget.value as HeadingValue;
      if (nextValue === "paragraph") {
        editor.chain().focus().setParagraph().run();
        return;
      }

      const headingLevel = Number(nextValue.replace("h", ""));
      editor
        .chain()
        .focus()
        .setHeading({ level: headingLevel as 1 | 2 | 3 })
        .run();
    },
    [editor],
  );

  const handleListChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      if (!editor) return;
      const nextValue = event.currentTarget.value as ListValue;
      const chain = editor.chain().focus();

      if (editor.isActive("bulletList")) chain.toggleBulletList();
      if (editor.isActive("orderedList")) chain.toggleOrderedList();
      if (editor.isActive("taskList")) chain.toggleTaskList();

      if (nextValue === "bullet") chain.toggleBulletList();
      if (nextValue === "ordered") chain.toggleOrderedList();
      if (nextValue === "task") chain.toggleTaskList();
      if (nextValue === "none") chain.setParagraph();

      chain.run();
    },
    [editor],
  );

  const handleToggleLink = useCallback(() => {
    if (!editor) return;
    const previousHref = (editor.getAttributes("link").href as string | undefined) ?? "";
    const nextHref = window.prompt("Enter a URL", previousHref || "https://");
    if (nextHref === null) return;

    const normalized = nextHref.trim();
    if (!normalized) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: normalized }).run();
  }, [editor]);

  const handleFrameworkChange = useCallback((event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.currentTarget.value as FrameworkSelectValue;
    setSelectedFrameworkId(value);

    if (value === "none") {
      setSelectedSectionKeys([]);
      setIsFrameworkPanelOpen(false);
      setHasAppliedFramework(false);
      setPendingApply(null);
      return;
    }

    setSelectedSectionKeys(getDefaultSectionKeys(value));
    setIsFrameworkPanelOpen(true);
    setHasAppliedFramework(false);
    setPendingApply(null);
  }, []);

  const handleToggleSection = useCallback(
    (sectionKey: PromptSectionKey, enabled: boolean) => {
      if (!selectedFramework || !editor) return;

      const nextKeys = enabled
        ? [...new Set([...selectedSectionKeys, sectionKey])]
        : selectedSectionKeys.filter((key) => key !== sectionKey);
      const ordered = sortSectionKeys(selectedFramework, nextKeys);

      if (hasAppliedFramework) {
        const synced = syncFrameworkSectionsInEditor(editor, selectedFramework, ordered);
        if (!synced) return;
      }

      setSelectedSectionKeys(ordered);
    },
    [editor, hasAppliedFramework, selectedFramework, selectedSectionKeys],
  );

  const handleResetDefaults = useCallback(() => {
    if (!selectedFramework || !editor) return;

    const defaults = getDefaultSectionKeys(selectedFramework.id);
    if (hasAppliedFramework) {
      const synced = syncFrameworkSectionsInEditor(editor, selectedFramework, defaults);
      if (!synced) return;
    }

    setSelectedSectionKeys(defaults);
  }, [editor, hasAppliedFramework, selectedFramework]);

  const handleApply = useCallback(() => {
    if (!editor || !selectedFramework) return;

    const ordered = sortSectionKeys(selectedFramework, selectedSectionKeys);
    const hasContent = extractBodyText(editor).length > 0;

    if (!hasContent) {
      applyFrameworkToEditor(editor, selectedFramework, ordered, "replace");
      setHasAppliedFramework(true);
      setIsFrameworkPanelOpen(false);
      return;
    }

    setPendingApply({
      framework: selectedFramework,
      sectionKeys: ordered,
    });
  }, [editor, selectedFramework, selectedSectionKeys]);

  const handleCommitApply = useCallback(
    (mode: ApplyMode) => {
      if (!editor || !pendingApply) return;
      applyFrameworkToEditor(editor, pendingApply.framework, pendingApply.sectionKeys, mode);
      setHasAppliedFramework(true);
      setIsFrameworkPanelOpen(false);
      setPendingApply(null);
    },
    [editor, pendingApply],
  );

  const editorScaleStyle = useMemo(
    () =>
      ({
        "--editor-zoom": String(zoomPercent / 100),
      }) as CSSProperties,
    [zoomPercent],
  );

  if (!editor) {
    return null;
  }

  const activeHeading = getHeadingValue(editor);
  const activeList = getListValue(editor);

  return (
    <div className="relative flex h-full min-h-0 flex-col gap-3">
      <div className="editor-framework-row">
        <div className="editor-framework-controls">
          <label className="editor-framework-label" htmlFor="framework-select">
            Framework
          </label>

          <div className="editor-framework-select-wrap">
            <select
              id="framework-select"
              className="editor-framework-select"
              value={selectedFrameworkId}
              onChange={handleFrameworkChange}
              aria-label="Select prompt framework"
            >
              <option value="none">None</option>
              {PROMPT_FRAMEWORKS.map((framework) => (
                <option key={framework.id} value={framework.id}>
                  {framework.label}
                </option>
              ))}
            </select>
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
              <path d="M2 3.5L5 6.5L8 3.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </div>

          {selectedFramework ? (
            <button
              type="button"
              className="editor-framework-toggle"
              onClick={() => setIsFrameworkPanelOpen((previous) => !previous)}
            >
              Customize sections
            </button>
          ) : null}
        </div>
      </div>

      {selectedFramework && isFrameworkPanelOpen ? (
        <section className="editor-framework-panel">
          <div className="editor-framework-panel-header">
            <p className="editor-framework-panel-title">Customize sections</p>
            <p className="editor-framework-panel-subtitle">
              Select the sections to include for {selectedFramework.label}
            </p>
          </div>

          <div className="editor-framework-section-list">
            {selectedFramework.sections.map((section) => (
              <label key={section.sectionKey} className="editor-framework-section-row">
                <input
                  type="checkbox"
                  checked={selectedSectionKeys.includes(section.sectionKey)}
                  onChange={(event) => {
                    handleToggleSection(section.sectionKey, event.currentTarget.checked);
                  }}
                />
                <span className="editor-framework-section-line">
                  {formatChecklistLabel(section.label)}: {section.helper}
                </span>
              </label>
            ))}
          </div>

          <div className="editor-framework-actions">
            <button
              type="button"
              className="editor-framework-action"
              onClick={handleResetDefaults}
            >
              Reset to defaults
            </button>
            <button
              type="button"
              className="editor-framework-action editor-framework-action-primary"
              onClick={handleApply}
            >
              Apply
            </button>
          </div>

          {hasAppliedFramework ? (
            <p className="editor-framework-live-note">The checklist now controls sections in the note.</p>
          ) : null}
        </section>
      ) : null}

      <div className="editor-toolbar">
        <div className="editor-toolbar-group">
          <button
            type="button"
            className="editor-toolbar-button"
            onClick={() => setZoomPercent((previous) => getNextZoom(previous, -1))}
            disabled={zoomPercent <= ZOOM_STEPS[0]}
            aria-label="Decrease editor zoom"
          >
            -
          </button>
          <span className="editor-toolbar-zoom">{zoomPercent}%</span>
          <button
            type="button"
            className="editor-toolbar-button"
            onClick={() => setZoomPercent((previous) => getNextZoom(previous, 1))}
            disabled={zoomPercent >= ZOOM_STEPS[ZOOM_STEPS.length - 1]}
            aria-label="Increase editor zoom"
          >
            +
          </button>
        </div>

        <div className="editor-toolbar-separator" />

        <div className="editor-toolbar-group">
          <div className={`editor-toolbar-pill ${activeHeading !== "paragraph" ? "is-accent" : ""}`}>
            <select
              className="editor-toolbar-select"
              value={activeHeading}
              onChange={handleHeadingChange}
              aria-label="Text style"
            >
              <option value="paragraph">Body</option>
              <option value="h1">H1</option>
              <option value="h2">H2</option>
              <option value="h3">H3</option>
            </select>
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
              <path d="M2 3.5L5 6.5L8 3.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </div>

          <div className={`editor-toolbar-pill ${activeList !== "none" ? "is-accent" : ""}`}>
            <select
              className="editor-toolbar-select"
              value={activeList}
              onChange={handleListChange}
              aria-label="List style"
            >
              <option value="none">List</option>
              <option value="bullet">Bullet</option>
              <option value="ordered">Numbered</option>
              <option value="task">Task</option>
            </select>
            <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
              <path d="M2 3.5L5 6.5L8 3.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </div>
        </div>

        <div className="editor-toolbar-separator" />

        <div className="editor-toolbar-group">
          <button
            type="button"
            className={`editor-toolbar-button ${editor.isActive("bold") ? "is-active" : ""}`}
            onClick={() => editor.chain().focus().toggleBold().run()}
            aria-label="Toggle bold"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            className={`editor-toolbar-button ${editor.isActive("italic") ? "is-active" : ""}`}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            aria-label="Toggle italic"
          >
            <em>I</em>
          </button>
          <button
            type="button"
            className={`editor-toolbar-button ${editor.isActive("strike") ? "is-active" : ""}`}
            onClick={() => editor.chain().focus().toggleStrike().run()}
            aria-label="Toggle strikethrough"
          >
            <span className="line-through">S</span>
          </button>
          <button
            type="button"
            className={`editor-toolbar-button ${editor.isActive("underline") ? "is-active" : ""}`}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            aria-label="Toggle underline"
          >
            <span className="underline">U</span>
          </button>
          <button
            type="button"
            className={`editor-toolbar-button ${editor.isActive("link") ? "is-active" : ""}`}
            onClick={handleToggleLink}
            aria-label="Set or edit link"
            title="Link"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <path
                d="M5.2 8.8L8.8 5.2M4.1 10a2.4 2.4 0 0 1 0-3.4l1.5-1.5a2.4 2.4 0 1 1 3.4 3.4L8.4 9"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
              <path
                d="M9.9 4a2.4 2.4 0 0 1 0 3.4l-1.5 1.5A2.4 2.4 0 1 1 5 5.5l.6-.6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <button
            type="button"
            className="editor-toolbar-button"
            onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
            aria-label="Clear formatting"
            title="Clear formatting"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
              <path
                d="M3 3L11 11M9 3H11V5M3 9V11H5M4.5 6.8H8.2"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        <div className="editor-toolbar-separator" />

        <div className="editor-toolbar-group">
          {ALIGNMENT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`editor-toolbar-button ${editor.isActive({ textAlign: option.value }) ? "is-active" : ""}`}
              onClick={() => editor.chain().focus().setTextAlign(option.value).run()}
              aria-label={option.title}
              title={option.title}
            >
              <AlignmentIcon value={option.value} />
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1">
        <EditorContent
          editor={editor}
          className="editor-content-root h-full min-h-0"
          style={editorScaleStyle}
        />
      </div>

      {pendingApply ? (
        <div className="editor-template-modal-backdrop" role="dialog" aria-modal="true">
          <div className="editor-template-modal">
            <h3>Apply framework</h3>
            <p>
              This note already has content. Choose how to apply the selected framework sections.
            </p>
            <div className="editor-template-modal-actions">
              <button
                type="button"
                className="editor-framework-action"
                onClick={() => setPendingApply(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="editor-framework-action"
                onClick={() => handleCommitApply("replace")}
              >
                Replace existing content
              </button>
              <button
                type="button"
                className="editor-framework-action editor-framework-action-primary"
                onClick={() => handleCommitApply("insertTop")}
              >
                Insert at top
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
