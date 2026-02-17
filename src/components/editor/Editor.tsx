import CodeBlock from "@tiptap/extension-code-block";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import Typography from "@tiptap/extension-typography";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { JSONContent } from "@tiptap/core";
import { useCallback, useEffect, useMemo } from "react";
import { PromptBlock, PromptBlockSlashMenu } from "../../extensions/prompt-block";
import { PROMPT_BLOCKS, type PromptBlockType } from "../../lib/promptBlocks";
import type { Note } from "../../lib/tauri";
import { useEditorAutosave } from "../../hooks/useEditorAutosave";

type EditorProps = {
  note: Note;
  onSaveBody: (
    id: string,
    title: string,
    bodyJson: string,
    bodyText: string,
  ) => Promise<void>;
  onStatsChange: (wordCount: number) => void;
};

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

function deriveWordCount(bodyText: string): number {
  return bodyText ? bodyText.split(/\s+/).filter(Boolean).length : 0;
}

function ToolbarButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onMouseDown={(event) => {
        event.preventDefault();
        onClick();
      }}
      className={[
        "h-8 rounded-[var(--radius-button)] border px-2 text-[11px] font-medium",
        "transition-colors duration-200 ease-in-out",
        active
          ? "border-[var(--accent)] bg-[var(--accent-subtle)] text-[var(--text-primary)]"
          : "border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function InsertBlockSelect({
  onInsert,
}: {
  onInsert: (blockType: PromptBlockType) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-[11px] font-medium text-[var(--text-secondary)]">
      Insert Block
      <select
        defaultValue=""
        onChange={(event) => {
          const value = event.currentTarget.value as PromptBlockType | "";
          if (!value) return;
          onInsert(value);
          event.currentTarget.value = "";
        }}
        className="h-8 rounded-[var(--radius-button)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 text-[11px] text-[var(--text-primary)]"
      >
        <option value="">Select...</option>
        {PROMPT_BLOCKS.map((block) => (
          <option key={block.type} value={block.type}>
            {block.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Editor({ note, onSaveBody, onStatsChange }: EditorProps) {
  const initialDoc = useMemo(() => parseStoredDoc(note.bodyJson), [note.bodyJson]);
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
    onSave: saveBody,
  });

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
      PromptBlock,
      PromptBlockSlashMenu,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === "heading") return "Heading";
          if (node.type.name === "codeBlock") return "Write code...";
          if (node.type.name === "taskItem") return "Task";
          if (node.type.name === "promptBlock") return "Write block content...";
          return "Start writing your note...";
        },
      }),
    ],
    content: initialDoc,
    editorProps: {
      attributes: {
        class:
          "tiptap min-h-[360px] rounded-[var(--radius-block)] border border-[var(--border-default)] bg-[var(--bg-block)] p-4 focus:outline-none",
      },
    },
    onCreate: ({ editor: instance }) => {
      const bodyText = deriveBodyText(
        instance.state.doc.textBetween(0, instance.state.doc.content.size, "\n\n"),
      );
      onStatsChange(deriveWordCount(bodyText));
    },
    onUpdate: ({ editor: instance }) => {
      const bodyJson = JSON.stringify(instance.getJSON());
      const bodyText = deriveBodyText(
        instance.state.doc.textBetween(0, instance.state.doc.content.size, "\n\n"),
      );
      onStatsChange(deriveWordCount(bodyText));
      queueSave({ bodyJson, bodyText });
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
    const handleForceSave = () => {
      void flush();
    };

    window.addEventListener("promptpad:force-save", handleForceSave);
    return () => {
      window.removeEventListener("promptpad:force-save", handleForceSave);
    };
  }, [flush]);

  if (!editor) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <ToolbarButton
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <ToolbarButton
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <ToolbarButton
          label="Underline"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        />
        <ToolbarButton
          label="Bullet"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <ToolbarButton
          label="Ordered"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
        <ToolbarButton
          label="Task"
          active={editor.isActive("taskList")}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
        />
        <ToolbarButton
          label="Code"
          active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        />
        <ToolbarButton
          label="Link"
          active={editor.isActive("link")}
          onClick={() => {
            const existingUrl = editor.getAttributes("link").href as string | undefined;
            const href = window.prompt("Enter URL", existingUrl ?? "https://");
            if (!href) {
              editor.chain().focus().unsetLink().run();
              return;
            }

            editor.chain().focus().setLink({ href }).run();
          }}
        />
        <InsertBlockSelect
          onInsert={(blockType) => {
            editor.chain().focus().insertPromptBlock(blockType).run();
          }}
        />
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
