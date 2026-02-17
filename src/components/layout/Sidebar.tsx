import type { Note } from "../../lib/tauri";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

type SidebarProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onNewNote: () => void;
  onNewPrompt: () => void;
  notes: Note[];
  activeNoteId: string | null;
  onSelectNote: (id: string) => void;
  onPinToggle: (id: string, pinned: boolean) => void;
  onTrash: (note: Note) => void;
  isLoading: boolean;
  theme: "light" | "dark";
  onToggleTheme: () => void;
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

function groupByDate(notes: Note[]): Record<DateGroupLabel, Note[]> {
  const grouped: Record<DateGroupLabel, Note[]> = {
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
  note: Note;
  isActive: boolean;
  onSelect: () => void;
  onPinToggle: () => void;
  onTrash: () => void;
}) {
  return (
    <div
      className={[
        "rounded-[var(--radius-card)] border px-2 py-2",
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
        <p className="mt-1 text-[11px] text-[var(--text-tertiary)]">{note.noteType}</p>
      </button>

      <div className="mt-2 flex items-center gap-1">
        <Button
          variant="ghost"
          className="h-7 px-2 text-[11px]"
          onClick={onPinToggle}
          aria-label={note.isPinned ? "Unpin note" : "Pin note"}
        >
          {note.isPinned ? "Unpin" : "Pin"}
        </Button>
        <Button
          variant="ghost"
          className="h-7 px-2 text-[11px]"
          onClick={onTrash}
          aria-label="Move note to trash"
        >
          Trash
        </Button>
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
}: SidebarProps) {
  const pinnedNotes = notes.filter((note) => note.isPinned);
  const groupedUnpinned = groupByDate(notes.filter((note) => !note.isPinned));

  return (
    <aside className="flex w-[var(--sidebar-width)] shrink-0 flex-col border-r border-[var(--border-default)] bg-[var(--bg-sidebar)] p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-content text-xl text-[var(--text-primary)]">PromptPad</h1>
        <Button variant="ghost" className="h-8 px-2" onClick={onToggleTheme}>
          {theme === "light" ? "Dark" : "Light"}
        </Button>
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
    </aside>
  );
}
