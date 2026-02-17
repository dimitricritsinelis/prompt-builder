import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      className={[
        "h-9 w-full rounded-[var(--radius-input)] border border-[var(--border-default)]",
        "bg-[var(--bg-surface)] px-3 text-[var(--font-size-ui)] text-[var(--text-primary)]",
        "placeholder:text-[var(--text-tertiary)] shadow-[var(--shadow-sm)]",
        "transition-colors duration-200 ease-in-out",
        "focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-subtle)]",
        className,
      ].join(" ")}
      {...props}
    />
  );
}
