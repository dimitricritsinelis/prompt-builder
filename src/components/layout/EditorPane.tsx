import { useCallback, useEffect, useRef, useState } from "react";
import { Editor } from "../editor/Editor";
import type { EditorStats } from "../../lib/editorStats";
import type { Note } from "../../lib/tauri";
import { Input } from "../ui/Input";

type EditorPaneProps = {
  activeNote: Note | null;
  onUpdateTitle: (title: string) => Promise<void>;
  onSaveBody: (
    id: string,
    title: string,
    bodyJson: string,
    bodyText: string,
  ) => Promise<void>;
  onStatsChange: (stats: EditorStats) => void;
};

export function EditorPane({
  activeNote,
  onUpdateTitle,
  onSaveBody,
  onStatsChange,
}: EditorPaneProps) {
  const fallbackTitle = activeNote?.noteType === "prompt" ? "Prompt" : "Note";
  const [titleValue, setTitleValue] = useState(activeNote?.title ?? "");
  const titleTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setTitleValue(activeNote?.title ?? "");
  }, [activeNote?.id, activeNote?.title]);

  const flushTitleSave = useCallback(async () => {
    if (!activeNote) return;
    const nextTitle = titleValue.trim() || fallbackTitle;
    if (nextTitle === activeNote.title) return;
    await onUpdateTitle(nextTitle);
  }, [activeNote, fallbackTitle, onUpdateTitle, titleValue]);

  useEffect(() => {
    if (!activeNote) return;
    if (titleValue.trim() === (activeNote.title || "").trim()) return;

    if (titleTimeoutRef.current) {
      window.clearTimeout(titleTimeoutRef.current);
    }

    titleTimeoutRef.current = window.setTimeout(() => {
      void flushTitleSave();
    }, 1000);

    return () => {
      if (titleTimeoutRef.current) {
        window.clearTimeout(titleTimeoutRef.current);
      }
    };
  }, [activeNote, flushTitleSave, titleValue]);

  return (
    <main className="min-h-0 min-w-0 flex-1 overflow-hidden bg-[var(--bg-primary)]">
      <div className="h-full px-6 pb-4 pt-4">
        <article className="editor-pane-content flex h-full min-h-0 flex-col rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-6 shadow-[var(--shadow-md)]">
          <header>
            <div>
              <Input
                value={titleValue}
                onChange={(event) => setTitleValue(event.currentTarget.value)}
                onBlur={() => {
                  void flushTitleSave();
                }}
                placeholder={fallbackTitle}
                className="h-auto border-none bg-transparent px-0 py-0 text-4xl font-semibold leading-tight shadow-none focus:ring-0"
              />
            </div>
          </header>

          {activeNote ? (
            <div className="mt-4 min-h-0 flex-1">
              <Editor
                key={activeNote.id}
                note={activeNote}
                onSaveBody={onSaveBody}
                onStatsChange={onStatsChange}
              />
            </div>
          ) : (
            <section className="editor-placeholder-block mt-4">
              <p className="text-[var(--font-size-label)] font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)]">
                No Active Note
              </p>
              <p className="mt-2">
                Select a note from the sidebar or create one to start writing.
              </p>
            </section>
          )}
        </article>
      </div>
    </main>
  );
}
