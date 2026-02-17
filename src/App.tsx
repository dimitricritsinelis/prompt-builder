import { useEffect, useState } from "react";
import { EditorPane } from "./components/layout/EditorPane";
import { useNotes } from "./hooks/useNotes";
import { Sidebar } from "./components/layout/Sidebar";
import { StatusBar } from "./components/layout/StatusBar";

type Theme = "light" | "dark";

function App() {
  const [theme, setTheme] = useState<Theme>("light");
  const {
    notes,
    activeNote,
    activeNoteId,
    searchQuery,
    isLoading,
    error,
    createFreeformNote,
    createPromptNote,
    setActiveNote,
    setSearchQuery,
    updateTitle,
  } = useNotes();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const wordCount = activeNote?.bodyText.trim()
    ? activeNote.bodyText.trim().split(/\s+/).length
    : 0;
  const charCount = activeNote?.bodyText.length ?? 0;
  const saveState = error ? `Error: ${error}` : isLoading ? "Loading..." : "Ready";

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
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
        />
        <StatusBar
          saveState={saveState}
          noteCount={notes.length}
          wordCount={wordCount}
          charCount={charCount}
        />
      </section>
    </div>
  );
}

export default App;
