import { useEffect, useState } from "react";
import { EditorPane } from "./components/layout/EditorPane";
import { Sidebar } from "./components/layout/Sidebar";
import { StatusBar } from "./components/layout/StatusBar";

type Theme = "light" | "dark";

function App() {
  const [theme, setTheme] = useState<Theme>("light");
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <Sidebar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onNewNote={() => undefined}
        onNewPrompt={() => undefined}
        theme={theme}
        onToggleTheme={() =>
          setTheme((previous) => (previous === "light" ? "dark" : "light"))
        }
      />
      <section className="flex min-w-0 flex-1 flex-col">
        <EditorPane />
        <StatusBar
          saveState="Saved a moment ago"
          noteCount={12}
          wordCount={248}
          charCount={1462}
        />
      </section>
    </div>
  );
}

export default App;
