import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import type { EditorStats } from "../../lib/editorStats";
import type { Note } from "../../lib/tauri";
import { Input } from "../ui/Input";

type EditorPaneProps = {
  activeNote: Note | null;
  editorBodyText?: string;
  onUpdateTitle: (title: string) => Promise<void>;
  onSaveBody: (
    id: string,
    title: string,
    bodyJson: string,
    bodyText: string,
  ) => Promise<void>;
  onStatsChange: (stats: EditorStats) => void;
};

const DEFAULT_NOTE_TITLES = ["", "untitled", "note", "prompt"];

function isDefaultNoteTitle(title: string): boolean {
  return DEFAULT_NOTE_TITLES.includes(title.trim().toLowerCase());
}

const LazyEditor = lazy(() =>
  import("../editor/Editor").then((module) => ({ default: module.Editor })),
);

function EditorLoadingFallback() {
  return (
    <section className="h-full rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--bg-primary)]/70 p-5">
      <p className="text-[var(--font-size-label)] font-semibold uppercase tracking-[0.05em] text-[var(--text-tertiary)]">
        Loading editor...
      </p>
      <div className="mt-4 space-y-2">
        <div className="h-3 w-5/6 rounded-full bg-[var(--bg-surface-hover)]" />
        <div className="h-3 w-full rounded-full bg-[var(--bg-surface-hover)]" />
        <div className="h-3 w-4/5 rounded-full bg-[var(--bg-surface-hover)]" />
      </div>
    </section>
  );
}

export function EditorPane({
  activeNote,
  editorBodyText = "",
  onUpdateTitle,
  onSaveBody,
  onStatsChange,
}: EditorPaneProps) {
  const fallbackTitle = "Prompt";
  const [titleValue, setTitleValue] = useState(activeNote?.title ?? "");
  const titleTimeoutRef = useRef<number | null>(null);
  const isBlankDefaultTitle = activeNote ? isDefaultNoteTitle(activeNote.title) : false;
  const hasBodyText = editorBodyText.trim().length > 0;
  const showEmptyEditorState = !activeNote || (isBlankDefaultTitle && !hasBodyText);

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
              {showEmptyEditorState ? (
                <section className="editor-placeholder-block">
                  <p className="text-[13px] font-semibold tracking-[0.03em] text-[var(--text-primary)]">
                    Build better prompts
                  </p>
                  <p className="mt-2 text-[var(--font-size-ui)] text-[var(--text-secondary)]">
                    Start writing, then select Context Vault blocks to inject.
                  </p>
                </section>
              ) : null}

              <Suspense fallback={<EditorLoadingFallback />}>
                <LazyEditor
                  key={activeNote.id}
                  note={activeNote}
                  onSaveBody={onSaveBody}
                  onStatsChange={onStatsChange}
                />
              </Suspense>
            </div>
          ) : (
            <section className="editor-placeholder-block mt-4">
              <p className="text-[13px] font-semibold tracking-[0.03em] text-[var(--text-primary)]">
                Build better prompts
              </p>
              <p className="mt-2 text-[var(--font-size-ui)] text-[var(--text-secondary)]">
                Start writing, then select Context Vault blocks to inject.
              </p>
            </section>
          )}
        </article>
      </div>
    </main>
  );
}
