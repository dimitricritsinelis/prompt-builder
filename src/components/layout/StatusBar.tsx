import type { TokenMode } from "../../lib/openaiTokenWorker";

type StatusBarProps = {
  saveState: string;
  wordCount: number;
  tokenMode: TokenMode;
  estimatedTokens: number;
  exactTokens: number | null;
  onToggleTokenMode: () => void;
};

export function StatusBar({
  saveState,
  wordCount,
  tokenMode,
  estimatedTokens,
  exactTokens,
  onToggleTokenMode,
}: StatusBarProps) {
  const tokenLabel =
    tokenMode === "exact" && exactTokens !== null
      ? `${exactTokens} tokens`
      : `~${estimatedTokens} tokens`;

  const toggleTitle =
    tokenMode === "estimate"
      ? "Switch to exact OpenAI token counting"
      : "Switch to instant estimate token counting";

  return (
    <footer className="flex h-[var(--status-height)] shrink-0 items-center justify-between border-t border-[var(--border-default)] bg-[var(--bg-surface)] px-4 text-[11px] text-[var(--text-secondary)]">
      <span>{saveState}</span>
      <div className="flex items-center gap-3">
        <span className="text-[13px] font-medium text-[var(--text-primary)]">{wordCount} words</span>
        <button
          type="button"
          onClick={onToggleTokenMode}
          title={toggleTitle}
          aria-label={toggleTitle}
          aria-pressed={tokenMode === "exact"}
          className="rounded-[var(--radius-button)] px-1.5 py-0.5 text-[13px] font-medium text-[var(--text-primary)] transition-colors duration-200 ease-in-out hover:bg-[var(--bg-surface-hover)]"
        >
          {tokenLabel}
        </button>
      </div>
    </footer>
  );
}
