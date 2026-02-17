type StatusBarProps = {
  saveState: string;
  noteCount: number;
  wordCount: number;
  charCount: number;
};

export function StatusBar({
  saveState,
  noteCount,
  wordCount,
  charCount,
}: StatusBarProps) {
  return (
    <footer className="flex h-[var(--status-height)] items-center justify-between border-t border-[var(--border-default)] bg-[var(--bg-surface)] px-4 text-[11px] text-[var(--text-secondary)]">
      <span>{saveState}</span>
      <span>
        {noteCount} notes | {wordCount} words | {charCount} chars
      </span>
    </footer>
  );
}
