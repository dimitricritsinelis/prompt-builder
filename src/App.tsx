import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { EditorPane } from "./components/layout/EditorPane";
import { Sidebar } from "./components/layout/Sidebar";
import { StatusBar } from "./components/layout/StatusBar";

type Theme = "light" | "dark";

type Note = {
  id: string;
  noteType: "freeform" | "prompt";
};

function App() {
  const [theme, setTheme] = useState<Theme>("light");
  const [searchValue, setSearchValue] = useState("");
  const [smokeStatus, setSmokeStatus] = useState("No backend calls yet.");
  const [noteCount, setNoteCount] = useState(0);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  async function createNote(noteType: "freeform" | "prompt") {
    try {
      const note = await invoke<Note>("note_create", { noteType });
      setSmokeStatus(`Created ${note.noteType} note ${note.id.slice(0, 8)}...`);
      await listNotes();
    } catch (error) {
      setSmokeStatus(`Create failed: ${String(error)}`);
    }
  }

  async function listNotes() {
    try {
      const notes = await invoke<Note[]>("note_list", { includeTrashed: false });
      setNoteCount(notes.length);
      setSmokeStatus(`Loaded ${notes.length} active notes`);
    } catch (error) {
      setSmokeStatus(`List failed: ${String(error)}`);
    }
  }

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <Sidebar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onNewNote={() => {
          void createNote("freeform");
        }}
        onNewPrompt={() => {
          void createNote("prompt");
        }}
        onListNotes={() => {
          void listNotes();
        }}
        smokeStatus={smokeStatus}
        theme={theme}
        onToggleTheme={() =>
          setTheme((previous) => (previous === "light" ? "dark" : "light"))
        }
      />
      <section className="flex min-w-0 flex-1 flex-col">
        <EditorPane />
        <StatusBar
          saveState={smokeStatus}
          noteCount={noteCount}
          wordCount={248}
          charCount={1462}
        />
      </section>
    </div>
  );
}

export default App;
