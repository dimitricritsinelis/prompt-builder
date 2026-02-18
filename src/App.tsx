import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EditorPane } from "./components/layout/EditorPane";
import { ContextVaultPanel } from "./components/layout/ContextVaultPanel";
import { Sidebar } from "./components/layout/Sidebar";
import { StatusBar } from "./components/layout/StatusBar";
import { PanelToggleButton } from "./components/ui/PanelToggleButton";
import type { EditorStats } from "./lib/editorStats";
import type {
  OpenAITokenizeRequest,
  OpenAITokenizeResponse,
  TokenMode,
} from "./lib/openaiTokenWorker";
import type { Note } from "./lib/tauri";
import { countWords, estimateOpenAITokens } from "./lib/tokenCount";
import { useNotes } from "./hooks/useNotes";

type Theme = "light" | "dark";

type UndoToast = {
  noteId: string;
  title: string;
};

const THEME_STORAGE_KEY = "promptpad-theme";
const LEFT_PANEL_STORAGE_KEY = "promptpad-left-panel-open";
const RIGHT_PANEL_STORAGE_KEY = "promptpad-right-panel-open";
const TOKEN_MODE_STORAGE_KEY = "promptpad:token-mode";

function getInitialTheme(): Theme {
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getInitialPanelState(storageKey: string): boolean {
  const stored = window.localStorage.getItem(storageKey);
  if (stored === "true") return true;
  if (stored === "false") return false;
  return true;
}

function getInitialTokenMode(): TokenMode {
  const stored = window.localStorage.getItem(TOKEN_MODE_STORAGE_KEY);
  return stored === "exact" ? "exact" : "estimate";
}

function App() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const [tokenMode, setTokenMode] = useState<TokenMode>(getInitialTokenMode);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState<boolean>(() =>
    getInitialPanelState(LEFT_PANEL_STORAGE_KEY),
  );
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(() =>
    getInitialPanelState(RIGHT_PANEL_STORAGE_KEY),
  );
  const [undoToast, setUndoToast] = useState<UndoToast | null>(null);
  const [hintToast, setHintToast] = useState<string | null>(null);
  const undoTimeoutRef = useRef<number | null>(null);
  const hintTimeoutRef = useRef<number | null>(null);
  const tokenizeWorkerRef = useRef<Worker | null>(null);
  const tokenDebounceRef = useRef<number | null>(null);
  const tokenModeRef = useRef<TokenMode>(tokenMode);
  const tokenizeRequestIdRef = useRef(0);
  const [exactTokenCount, setExactTokenCount] = useState<number | null>(null);
  const [isExactTokenizerAvailable, setIsExactTokenizerAvailable] = useState(true);
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
  const [editorBodyText, setEditorBodyText] = useState("");
  const estimatedTokenCount = useMemo(
    () => estimateOpenAITokens(editorBodyText),
    [editorBodyText],
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    tokenModeRef.current = tokenMode;
    window.localStorage.setItem(TOKEN_MODE_STORAGE_KEY, tokenMode);
  }, [tokenMode]);

  useEffect(() => {
    window.localStorage.setItem(LEFT_PANEL_STORAGE_KEY, String(isLeftPanelOpen));
  }, [isLeftPanelOpen]);

  useEffect(() => {
    window.localStorage.setItem(RIGHT_PANEL_STORAGE_KEY, String(isRightPanelOpen));
  }, [isRightPanelOpen]);

  useEffect(() => {
    const bodyText = activeNote?.bodyText ?? "";
    setEditorBodyText(bodyText);
    setEditorWordCount(countWords(bodyText));
    setExactTokenCount(null);
  }, [activeNote?.id, activeNote?.bodyText]);

  useEffect(() => {
    if (typeof Worker === "undefined") {
      setIsExactTokenizerAvailable(false);
      return;
    }

    const worker = new Worker(new URL("./workers/openaiTokenize.worker.ts", import.meta.url), {
      type: "module",
    });
    tokenizeWorkerRef.current = worker;

    worker.onmessage = (event: MessageEvent<OpenAITokenizeResponse>) => {
      const message = event.data;
      if (message.id !== tokenizeRequestIdRef.current) {
        return;
      }

      if ("error" in message) {
        setIsExactTokenizerAvailable(false);
        setExactTokenCount(null);
        return;
      }

      if (tokenModeRef.current === "exact") {
        setExactTokenCount(message.tokenCount);
      }
    };

    worker.onerror = () => {
      setIsExactTokenizerAvailable(false);
      setExactTokenCount(null);
    };

    return () => {
      if (tokenDebounceRef.current) {
        window.clearTimeout(tokenDebounceRef.current);
        tokenDebounceRef.current = null;
      }
      worker.terminate();
      tokenizeWorkerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (tokenDebounceRef.current) {
      window.clearTimeout(tokenDebounceRef.current);
      tokenDebounceRef.current = null;
    }

    if (tokenMode !== "exact") {
      return;
    }

    if (!isExactTokenizerAvailable || !tokenizeWorkerRef.current) {
      return;
    }

    const requestId = tokenizeRequestIdRef.current + 1;
    tokenizeRequestIdRef.current = requestId;
    setExactTokenCount(null);

    tokenDebounceRef.current = window.setTimeout(() => {
      const request: OpenAITokenizeRequest = {
        id: requestId,
        text: editorBodyText,
        encoding: "o200k_base",
      };
      tokenizeWorkerRef.current?.postMessage(request);
    }, 320);

    return () => {
      if (tokenDebounceRef.current) {
        window.clearTimeout(tokenDebounceRef.current);
        tokenDebounceRef.current = null;
      }
    };
  }, [activeNote?.id, editorBodyText, isExactTokenizerAvailable, tokenMode]);

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
      if (tokenDebounceRef.current) {
        window.clearTimeout(tokenDebounceRef.current);
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

  const handleUpdateTitle = useCallback(
    async (title: string) => {
      await updateTitle(title);
    },
    [updateTitle],
  );

  const handleSaveBody = useCallback(
    async (id: string, title: string, bodyJson: string, bodyText: string) => {
      await saveBody(id, title, bodyJson, bodyText);
    },
    [saveBody],
  );

  const handleStatsChange = useCallback((stats: EditorStats) => {
    setEditorWordCount(stats.wordCount);
    setEditorBodyText(stats.bodyText);
  }, []);

  const handleToggleTokenMode = useCallback(() => {
    setTokenMode((previous) => (previous === "estimate" ? "exact" : "estimate"));
  }, []);

  return (
    <div className="relative flex h-dvh min-h-0 overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
      {isLeftPanelOpen ? (
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
          onToggleCollapse={() => setIsLeftPanelOpen(false)}
        />
      ) : null}
      <div className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden">
        {!isLeftPanelOpen ? (
          <PanelToggleButton
            panel="left"
            onClick={() => setIsLeftPanelOpen(true)}
            aria-label="Expand sidebar"
            title="Expand sidebar"
            tooltipLabel="Toggle sidebar"
            wrapperClassName="absolute left-3 top-4 z-30"
          />
        ) : null}

        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <EditorPane
            activeNote={activeNote}
            onUpdateTitle={handleUpdateTitle}
            onSaveBody={handleSaveBody}
            onStatsChange={handleStatsChange}
          />
          <StatusBar
            saveState={saveLabel}
            wordCount={editorWordCount}
            tokenMode={tokenMode}
            estimatedTokens={estimatedTokenCount}
            exactTokens={isExactTokenizerAvailable ? exactTokenCount : null}
            onToggleTokenMode={handleToggleTokenMode}
          />
        </section>

        {isRightPanelOpen ? (
          <ContextVaultPanel onToggleCollapse={() => setIsRightPanelOpen(false)} />
        ) : (
          <PanelToggleButton
            panel="right"
            onClick={() => setIsRightPanelOpen(true)}
            wrapperClassName="absolute right-3 top-4 z-30"
            className="h-8 w-8 rounded-[12px]"
            aria-label="Expand context vault"
            title="Expand context vault"
            tooltipLabel="Toggle context vault"
          />
        )}
      </div>

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
