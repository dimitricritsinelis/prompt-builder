import { useEffect, useRef, useState } from "react";
import { EditorPane } from "./components/layout/EditorPane";
import { Sidebar } from "./components/layout/Sidebar";
import { StatusBar } from "./components/layout/StatusBar";
import type { Note } from "./lib/tauri";
import { useNotes } from "./hooks/useNotes";

type Theme = "light" | "dark";

type UndoToast = {
  noteId: string;
  title: string;
};

const THEME_STORAGE_KEY = "promptpad-theme";

function getInitialTheme(): Theme {
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [undoToast, setUndoToast] = useState<UndoToast | null>(null);
  const [hintToast, setHintToast] = useState<string | null>(null);
  const undoTimeoutRef = useRef<number | null>(null);
  const hintTimeoutRef = useRef<number | null>(null);
  const {
    notes,
    activeNote,
    activeNoteId,
    searchQuery,
    isLoading,
    saveState,
    error,
    createFreeformNote,
    createPromptNote,
    setActiveNote,
    setSearchQuery,
    updateTitle,
    saveBody,
    pinNote,
    trashNote,
    restoreNote,
  } = useNotes();
  const [editorWordCount, setEditorWordCount] = useState(0);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const bodyText = activeNote?.bodyText.trim() ?? "";
    setEditorWordCount(bodyText ? bodyText.split(/\s+/).length : 0);
  }, [activeNote?.id, activeNote?.bodyText]);

  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return;

      const key = event.key.toLowerCase();
      if (key === "n") {
        event.preventDefault();
        if (event.shiftKey) {
          void createPromptNote();
        } else {
          void createFreeformNote();
        }
        return;
      }

      if (key === "f") {
        event.preventDefault();
        const searchInput = document.getElementById(
          "sidebar-search-input",
        ) as HTMLInputElement | null;
        searchInput?.focus();
        searchInput?.select();
        return;
      }

      if (key === "s") {
        event.preventDefault();
        window.dispatchEvent(new Event("promptpad:force-save"));
        return;
      }

      if (key === "e" && event.shiftKey) {
        event.preventDefault();
        setHintToast("Export dialog shortcut wired (Cmd/Ctrl+Shift+E).");
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [createFreeformNote, createPromptNote]);

  useEffect(() => {
    if (!hintToast) return;
    if (hintTimeoutRef.current) {
      window.clearTimeout(hintTimeoutRef.current);
    }
    hintTimeoutRef.current = window.setTimeout(() => {
      setHintToast(null);
      hintTimeoutRef.current = null;
    }, 2200);

    return () => {
      if (hintTimeoutRef.current) {
        window.clearTimeout(hintTimeoutRef.current);
      }
    };
  }, [hintToast]);

  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) {
        window.clearTimeout(undoTimeoutRef.current);
      }
      if (hintTimeoutRef.current) {
        window.clearTimeout(hintTimeoutRef.current);
      }
    };
  }, []);

  const saveLabel = error
    ? `Error: ${error}`
    : saveState === "saving"
      ? "Saving..."
      : saveState === "saved"
        ? "Saved"
        : isLoading
          ? "Loading..."
          : "Ready";

  const handleTrash = async (note: Note) => {
    await trashNote(note.id);
    if (undoTimeoutRef.current) {
      window.clearTimeout(undoTimeoutRef.current);
    }

    setUndoToast({
      noteId: note.id,
      title: note.title || "Untitled",
    });

    undoTimeoutRef.current = window.setTimeout(() => {
      setUndoToast(null);
      undoTimeoutRef.current = null;
    }, 5000);
  };

  const handleUndoTrash = async () => {
    if (!undoToast) return;

    await restoreNote(undoToast.noteId);
    if (!searchQuery.trim()) {
      await setActiveNote(undoToast.noteId);
    }
    setUndoToast(null);

    if (undoTimeoutRef.current) {
      window.clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }
  };

  return (
    <div className="relative flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <Sidebar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onNewNote={() => {
          void createFreeformNote();
        }}
        onNewPrompt={() => {
          void createPromptNote();
        }}
        notes={notes}
        activeNoteId={activeNoteId}
        onSelectNote={(id) => {
          void setActiveNote(id);
        }}
        onPinToggle={(id, pinned) => {
          void pinNote(id, pinned);
        }}
        onTrash={(note) => {
          void handleTrash(note);
        }}
        isLoading={isLoading}
        theme={theme}
        onToggleTheme={() =>
          setTheme((previous) => (previous === "light" ? "dark" : "light"))
        }
      />
      <section className="flex min-w-0 flex-1 flex-col">
        <EditorPane
          activeNote={activeNote}
          onUpdateTitle={async (title) => {
            await updateTitle(title);
          }}
          onSaveBody={async (id, title, bodyJson, bodyText) => {
            await saveBody(id, title, bodyJson, bodyText);
          }}
          onStatsChange={(wordCount) => {
            setEditorWordCount(wordCount);
          }}
        />
        <StatusBar
          saveState={saveLabel}
          wordCount={editorWordCount}
          noteType={activeNote?.noteType ?? null}
        />
      </section>

      {undoToast ? (
        <div className="absolute bottom-10 right-4 z-50 flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 shadow-[var(--shadow-md)]">
          <p className="text-[12px] text-[var(--text-secondary)]">
            Moved "{undoToast.title}" to trash.
          </p>
          <button
            type="button"
            onClick={() => {
              void handleUndoTrash();
            }}
            className="rounded-[var(--radius-button)] border border-[var(--border-default)] px-2 py-1 text-[11px] font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
          >
            Undo
          </button>
        </div>
      ) : null}

      {hintToast ? (
        <div className="absolute bottom-10 left-1/2 z-40 -translate-x-1/2 rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-[11px] text-[var(--text-secondary)] shadow-[var(--shadow-sm)]">
          {hintToast}
        </div>
      ) : null}
    </div>
  );
}

export default App;
