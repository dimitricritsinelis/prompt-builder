import type { ButtonHTMLAttributes } from "react";

type PanelToggleButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  panel: "left" | "right";
  tooltipLabel?: string;
  shortcutLabel?: string;
  className?: string;
  wrapperClassName?: string;
};

export function PanelToggleButton({
  panel,
  tooltipLabel,
  shortcutLabel,
  className = "",
  wrapperClassName = "",
  ...props
}: PanelToggleButtonProps) {
  const lineX = panel === "left" ? 5 : 11;

  return (
    <div className={["group relative", wrapperClassName].join(" ")}>
      <button
        type="button"
        className={[
          "inline-flex h-10 w-10 items-center justify-center rounded-[14px] border",
          "border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)]",
          "shadow-[var(--shadow-sm)] transition-colors duration-200 ease-in-out",
          "hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]",
          className,
        ].join(" ")}
        {...props}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <rect x="1.5" y="1.5" width="13" height="13" rx="3" stroke="currentColor" strokeWidth="1.2" />
          <line x1={lineX} y1="3" x2={lineX} y2="13" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      </button>

      {tooltipLabel ? (
        <div className="pointer-events-none absolute left-0 top-[calc(100%+10px)] z-40 min-w-max translate-y-1 rounded-[18px] border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-2 opacity-0 shadow-[var(--shadow-lg)] transition-all duration-200 ease-in-out group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
          <div className="flex items-center gap-3">
            <span className="text-[20px] leading-none text-[var(--text-primary)]">
              {tooltipLabel}
            </span>
            {shortcutLabel ? (
              <span className="rounded-[14px] border border-[var(--border-default)] bg-[var(--bg-block)] px-3 py-1 text-[14px] font-semibold text-[var(--text-secondary)]">
                {shortcutLabel}
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
