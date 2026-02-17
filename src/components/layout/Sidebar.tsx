import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

type SidebarProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onNewNote: () => void;
  onNewPrompt: () => void;
  onListNotes: () => void;
  smokeStatus: string;
  theme: "light" | "dark";
  onToggleTheme: () => void;
};

export function Sidebar({
  searchValue,
  onSearchChange,
  onNewNote,
  onNewPrompt,
  onListNotes,
  smokeStatus,
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

      <div className="mt-6 space-y-3">
        <p className="text-[var(--font-size-label)] font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)]">
          Recent
        </p>
        <div className="rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-3 shadow-[var(--shadow-sm)]">
          <p className="text-[var(--font-size-ui)] text-[var(--text-primary)]">
            Welcome note
          </p>
          <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">
            Shell mock content
          </p>
        </div>
      </div>

      <div className="mt-auto space-y-2 pt-4">
        <p className="text-[var(--font-size-label)] font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)]">
          Dev Smoke
        </p>
        <Button variant="ghost" className="w-full justify-start" onClick={onListNotes}>
          List Notes
        </Button>
        <p className="text-[11px] text-[var(--text-tertiary)]">{smokeStatus}</p>
      </div>
    </aside>
  );
}
