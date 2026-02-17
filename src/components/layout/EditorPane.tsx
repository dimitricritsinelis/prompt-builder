import { useCallback, useEffect, useRef, useState } from "react";
import { Editor } from "../editor/Editor";
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
  onStatsChange: (wordCount: number) => void;
};

export function EditorPane({
  activeNote,
  onUpdateTitle,
  onSaveBody,
  onStatsChange,
}: EditorPaneProps) {
  const [titleValue, setTitleValue] = useState(activeNote?.title ?? "");
  const titleTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setTitleValue(activeNote?.title ?? "");
  }, [activeNote?.id, activeNote?.title]);

  const flushTitleSave = useCallback(async () => {
    if (!activeNote) return;
    const nextTitle = titleValue.trim() || "Untitled";
    if (nextTitle === activeNote.title) return;
    await onUpdateTitle(nextTitle);
  }, [activeNote, onUpdateTitle, titleValue]);

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
    <main className="min-w-0 flex-1 overflow-auto bg-[var(--bg-primary)]">
      <div className="mx-auto w-full max-w-[var(--editor-max-width)] px-[var(--editor-padding-x)] pb-20 pt-[var(--editor-padding-top)]">
        <article className="editor-pane-content space-y-6 rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-8 shadow-[var(--shadow-md)]">
          <header>
            <p className="text-[var(--font-size-label)] font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)]">
              {activeNote ? activeNote.noteType : "Draft"}
            </p>
            <div className="mt-2">
              <Input
                value={titleValue}
                onChange={(event) => setTitleValue(event.currentTarget.value)}
                onBlur={() => {
                  void flushTitleSave();
                }}
                placeholder="Untitled"
                className="h-auto border-none bg-transparent px-0 py-0 text-3xl font-semibold leading-tight shadow-none focus:ring-0"
              />
            </div>
          </header>

          {activeNote ? (
            <Editor
              key={activeNote.id}
              note={activeNote}
              onSaveBody={onSaveBody}
              onStatsChange={onStatsChange}
            />
          ) : (
            <section className="editor-placeholder-block">
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
