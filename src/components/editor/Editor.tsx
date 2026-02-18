import CodeBlock from "@tiptap/extension-code-block";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import Typography from "@tiptap/extension-typography";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { Editor as TiptapEditor, JSONContent } from "@tiptap/core";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { PromptBlock } from "../../extensions/prompt-block";
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

function extractBodyText(editor: TiptapEditor): string {
  return deriveBodyText(editor.state.doc.textBetween(0, editor.state.doc.content.size, "\n\n"));
}

function deriveSavePayload(editor: TiptapEditor): { bodyJson: string; bodyText: string } {
  return {
    bodyJson: JSON.stringify(editor.getJSON()),
    bodyText: extractBodyText(editor),
  };
}

export function Editor({ note, onSaveBody, onStatsChange }: EditorProps) {
  const initialDoc = useMemo(() => parseStoredDoc(note.bodyJson), [note.bodyJson]);
  const editorRef = useRef<TiptapEditor | null>(null);
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
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Placeholder.configure({
        placeholder: "Start writing...",
      }),
    ],
    content: initialDoc,
    editorProps: {
      attributes: {
        class:
          "tiptap h-full min-h-[380px] w-full rounded-[var(--radius-block)] border border-[var(--border-default)] bg-[var(--bg-block)] px-6 py-5 focus:outline-none",
      },
    },
    onCreate: ({ editor: instance }) => {
      editorRef.current = instance;
      const bodyText = extractBodyText(instance);
      onStatsChange(deriveWordCount(bodyText));
    },
    onUpdate: ({ editor: instance }) => {
      editorRef.current = instance;
      const bodyText = extractBodyText(instance);
      onStatsChange(deriveWordCount(bodyText));
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
    <div className="h-full min-h-0">
      <EditorContent editor={editor} />
    </div>
  );
}
