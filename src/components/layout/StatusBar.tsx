type StatusBarProps = {
  saveState: string;
  wordCount: number;
  noteType: "freeform" | "prompt" | null;
};

export function StatusBar({ saveState, wordCount, noteType }: StatusBarProps) {
  return (
    <footer className="flex h-[var(--status-height)] items-center justify-between border-t border-[var(--border-default)] bg-[var(--bg-surface)] px-4 text-[11px] text-[var(--text-secondary)]">
      <span>{saveState}</span>
      <div className="flex items-center gap-2">
        <span>{wordCount} words</span>
        <span className="rounded-[var(--radius-button)] border border-[var(--border-default)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)]">
          {noteType ?? "none"}
        </span>
      </div>
    </footer>
  );
}
