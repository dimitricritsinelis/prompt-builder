import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import type { Note } from "../../lib/tauri";

type SidebarProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onNewNote: () => void;
  onNewPrompt: () => void;
  notes: Note[];
  activeNoteId: string | null;
  onSelectNote: (id: string) => void;
  isLoading: boolean;
  theme: "light" | "dark";
  onToggleTheme: () => void;
};

export function Sidebar({
  searchValue,
  onSearchChange,
  onNewNote,
  onNewPrompt,
  notes,
  activeNoteId,
  onSelectNote,
  isLoading,
  theme,
  onToggleTheme,
}: SidebarProps) {
  return (
    <aside className="flex w-[var(--sidebar-width)] shrink-0 flex-col border-r border-[var(--border-default)] bg-[var(--bg-sidebar)] p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-content text-xl text-[var(--text-primary)]">PromptPad</h1>
        <Button variant="ghost" className="h-8 px-2" onClick={onToggleTheme}>
          {theme === "light" ? "Dark" : "Light"}
        </Button>
      </div>

      <Input
        value={searchValue}
        onChange={(event) => onSearchChange(event.currentTarget.value)}
        placeholder="Search notes..."
        aria-label="Search notes"
      />

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button variant="primary" onClick={onNewNote}>
          New Note
        </Button>
        <Button variant="secondary" onClick={onNewPrompt}>
          New Prompt
        </Button>
      </div>

      <div className="mt-6 flex min-h-0 flex-1 flex-col space-y-3">
        <p className="text-[var(--font-size-label)] font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)]">
          Notes
        </p>
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {isLoading ? (
            <p className="px-1 text-[11px] text-[var(--text-tertiary)]">Loading notes...</p>
          ) : null}

          {!isLoading && notes.length === 0 ? (
            <p className="px-1 text-[11px] text-[var(--text-tertiary)]">
              No notes yet. Create one to get started.
            </p>
          ) : null}

          {notes.map((note) => {
            const isActive = note.id === activeNoteId;
            return (
              <button
                key={note.id}
                type="button"
                onClick={() => onSelectNote(note.id)}
                className={[
                  "w-full rounded-[var(--radius-card)] border px-3 py-2 text-left",
                  "transition-colors duration-200 ease-in-out",
                  isActive
                    ? "border-[var(--accent)] bg-[var(--accent-subtle)]"
                    : "border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)]",
                ].join(" ")}
              >
                <p className="truncate text-[var(--font-size-ui)] text-[var(--text-primary)]">
                  {note.title || "Untitled"}
                </p>
                <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">
                  {note.noteType}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
