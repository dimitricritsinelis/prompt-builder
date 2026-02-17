import { useEffect, useState } from "react";
import type { Note } from "../../lib/tauri";
import { Input } from "../ui/Input";

type EditorPaneProps = {
  activeNote: Note | null;
  onUpdateTitle: (title: string) => Promise<void>;
};

export function EditorPane({ activeNote, onUpdateTitle }: EditorPaneProps) {
  const [titleValue, setTitleValue] = useState(activeNote?.title ?? "");

  useEffect(() => {
    setTitleValue(activeNote?.title ?? "");
  }, [activeNote?.id, activeNote?.title]);

  useEffect(() => {
    if (!activeNote) return;
    if (titleValue === activeNote.title) return;

    const timeoutId = window.setTimeout(() => {
      void onUpdateTitle(titleValue);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [activeNote, onUpdateTitle, titleValue]);

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
                placeholder="Untitled"
                className="h-auto border-none bg-transparent px-0 py-0 text-3xl font-semibold leading-tight shadow-none focus:ring-0"
              />
            </div>
          </header>

          <p>
            {activeNote
              ? "Active note loaded from SQLite-backed Tauri commands."
              : "Select or create a note to start writing."}
          </p>

          <section className="editor-placeholder-block">
            <p className="text-[var(--font-size-label)] font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)]">
              Body Placeholder
            </p>
            <p className="mt-2">
              {activeNote?.bodyText || "Note body wiring comes next."}
            </p>
          </section>

          <p>{activeNote ? `ID: ${activeNote.id}` : "No active note selected."}</p>
        </article>
      </div>
    </main>
  );
}
