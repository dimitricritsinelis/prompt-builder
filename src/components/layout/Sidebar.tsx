import type { NoteMeta } from "../../lib/tauri";
import { PanelToggleButton } from "../ui/PanelToggleButton";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

type SidebarProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onNewNote: () => void;
  onNewPrompt: () => void;
  notes: NoteMeta[];
  activeNoteId: string | null;
  onSelectNote: (id: string) => void;
  onPinToggle: (id: string, pinned: boolean) => void;
  onTrash: (note: NoteMeta) => void;
  isLoading: boolean;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onToggleCollapse: () => void;
};

type DateGroupLabel = "Today" | "Yesterday" | "This Week" | "This Month" | "Older";

const DATE_GROUP_ORDER: DateGroupLabel[] = [
  "Today",
  "Yesterday",
  "This Week",
  "This Month",
  "Older",
];

const MS_PER_DAY = 86_400_000;

function parseNoteTimestamp(value: string): Date {
  const normalized = value.includes("T") ? value : `${value.replace(" ", "T")}Z`;
  const parsed = new Date(normalized);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  return new Date();
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function groupByDate(notes: NoteMeta[]): Record<DateGroupLabel, NoteMeta[]> {
  const grouped: Record<DateGroupLabel, NoteMeta[]> = {
    Today: [],
    Yesterday: [],
    "This Week": [],
    "This Month": [],
    Older: [],
  };

  const now = new Date();
  const todayStart = startOfDay(now);

  for (const note of notes) {
    const updated = parseNoteTimestamp(note.updatedAt);
    const updatedStart = startOfDay(updated);
    const diffDays = Math.floor((todayStart.getTime() - updatedStart.getTime()) / MS_PER_DAY);

    if (diffDays <= 0) {
      grouped.Today.push(note);
      continue;
    }

    if (diffDays === 1) {
      grouped.Yesterday.push(note);
      continue;
    }

    if (diffDays <= 6) {
      grouped["This Week"].push(note);
      continue;
    }

    if (
      updated.getFullYear() === now.getFullYear() &&
      updated.getMonth() === now.getMonth()
    ) {
      grouped["This Month"].push(note);
      continue;
    }

    grouped.Older.push(note);
  }

  return grouped;
}

function NoteRow({
  note,
  isActive,
  onSelect,
  onPinToggle,
  onTrash,
}: {
  note: NoteMeta;
  isActive: boolean;
  onSelect: () => void;
  onPinToggle: () => void;
  onTrash: () => void;
}) {
  const noteTypeLabel = note.noteType === "prompt" ? "Prompt" : "Note";

  return (
    <div
      className={[
        "rounded-[var(--radius-card)] border px-2.5 py-2",
        "transition-colors duration-200 ease-in-out",
        isActive
          ? "border-[var(--accent)] bg-[var(--accent-subtle)]"
          : "border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)]",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={onSelect}
        className="w-full text-left"
      >
        <p className="truncate text-[var(--font-size-ui)] text-[var(--text-primary)]">
          {note.title || "Untitled"}
        </p>
      </button>

      <div className="mt-1.5 flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)]">
          {noteTypeLabel}
        </p>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className="inline-flex h-6 w-6 items-center justify-center rounded-[var(--radius-button)] border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] transition-colors duration-200 ease-in-out hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"
            onClick={onPinToggle}
            aria-label={note.isPinned ? "Unpin note" : "Pin note"}
            title={note.isPinned ? "Unpin" : "Pin"}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M5 2.5h6l-1 3v2.5l1.8 1.8v1.2H4.2V9.8L6 8V5.5l-1-3Z"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
              <path d="M8 10.8V14" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </button>
          <button
            type="button"
            className="inline-flex h-6 w-6 items-center justify-center rounded-[var(--radius-button)] border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] transition-colors duration-200 ease-in-out hover:bg-[var(--bg-surface-hover)] hover:text-[var(--accent)]"
            onClick={onTrash}
            aria-label="Move note to trash"
            title="Trash"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path
                d="M3.5 4.5h9M6.2 2.5h3.6M5 4.5v8h6v-8M6.8 6.5v4.3M9.2 6.5v4.3"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export function Sidebar({
  searchValue,
  onSearchChange,
  onNewNote,
  onNewPrompt,
  notes,
  activeNoteId,
  onSelectNote,
  onPinToggle,
  onTrash,
  isLoading,
  theme,
  onToggleTheme,
  onToggleCollapse,
}: SidebarProps) {
  const pinnedNotes = notes.filter((note) => note.isPinned);
  const groupedUnpinned = groupByDate(notes.filter((note) => !note.isPinned));

  return (
    <aside className="flex min-h-0 w-[var(--sidebar-width)] shrink-0 flex-col overflow-hidden border-r border-[var(--border-default)] bg-[var(--bg-sidebar)]">
      <div className="flex min-h-0 flex-1 flex-col p-4">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="font-content text-xl text-[var(--text-primary)]">PromptPad</h1>
          <div className="flex items-center gap-1">
            <Button variant="ghost" className="h-8 px-2" onClick={onToggleTheme}>
              {theme === "light" ? "Dark" : "Light"}
            </Button>
            <PanelToggleButton
              panel="left"
              onClick={onToggleCollapse}
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
              className="h-8 w-8 rounded-[12px]"
            />
          </div>
        </div>

        <Input
          id="sidebar-search-input"
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

        <div className="mt-6 flex min-h-0 flex-1 flex-col overflow-y-auto pr-1">
          {isLoading ? (
            <p className="mb-2 px-1 text-[11px] text-[var(--text-tertiary)]">Loading notes...</p>
          ) : null}

          {!isLoading && notes.length === 0 ? (
            <p className="px-1 text-[11px] text-[var(--text-tertiary)]">
              No notes yet. Create one to get started.
            </p>
          ) : null}

          {pinnedNotes.length > 0 ? (
            <section className="mb-4">
              <p className="mb-2 px-1 text-[var(--font-size-label)] font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)]">
                Pinned
              </p>
              <div className="space-y-2">
                {pinnedNotes.map((note) => (
                  <NoteRow
                    key={note.id}
                    note={note}
                    isActive={note.id === activeNoteId}
                    onSelect={() => onSelectNote(note.id)}
                    onPinToggle={() => onPinToggle(note.id, !note.isPinned)}
                    onTrash={() => onTrash(note)}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {DATE_GROUP_ORDER.map((group) => {
            const groupNotes = groupedUnpinned[group];
            if (groupNotes.length === 0) return null;

            return (
              <section key={group} className="mb-4">
                <p className="mb-2 px-1 text-[var(--font-size-label)] font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)]">
                  {group}
                </p>
                <div className="space-y-2">
                  {groupNotes.map((note) => (
                    <NoteRow
                      key={note.id}
                      note={note}
                      isActive={note.id === activeNoteId}
                      onSelect={() => onSelectNote(note.id)}
                      onPinToggle={() => onPinToggle(note.id, !note.isPinned)}
                      onTrash={() => onTrash(note)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>

      <footer className="flex h-[var(--status-height)] items-center border-t border-[var(--border-default)] bg-[var(--bg-surface)] px-4 text-[11px] text-[var(--text-secondary)]">
        {notes.length} notes
      </footer>
    </aside>
  );
}
