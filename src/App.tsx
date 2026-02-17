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
    saveState,
    error,
    createFreeformNote,
    createPromptNote,
    setActiveNote,
    setSearchQuery,
    updateTitle,
    saveBody,
  } = useNotes();
  const [editorWordCount, setEditorWordCount] = useState(0);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const bodyText = activeNote?.bodyText.trim() ?? "";
    setEditorWordCount(bodyText ? bodyText.split(/\s+/).length : 0);
  }, [activeNote?.id, activeNote?.bodyText]);

  const saveLabel = error
    ? `Error: ${error}`
    : saveState === "saving"
      ? "Saving..."
      : saveState === "saved"
        ? "Saved"
        : isLoading
          ? "Loading..."
          : "Ready";

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
          onSaveBody={async (id, title, bodyJson, bodyText) => {
            await saveBody(id, title, bodyJson, bodyText);
          }}
          onStatsChange={(wordCount) => {
            setEditorWordCount(wordCount);
          }}
        />
        <StatusBar saveState={saveLabel} wordCount={editorWordCount} noteType={activeNote?.noteType ?? null} />
      </section>
    </div>
  );
}

export default App;
