import { useMemo, useState } from "react";

type VaultBucket = {
  id: string;
  title: string;
  injectTarget: "CONTEXT" | "CONSTRAINTS" | "ROLE";
};

const PLACEHOLDER_BUCKETS: VaultBucket[] = [
  {
    id: "project-eagle-ford",
    title: "Project: Eagle Ford Optimization",
    injectTarget: "CONTEXT",
  },
  {
    id: "dataset-schema",
    title: "Dataset Schema: Production + Pressure",
    injectTarget: "CONTEXT",
  },
  {
    id: "house-style",
    title: "House Style: concise, bullet-first",
    injectTarget: "CONSTRAINTS",
  },
  {
    id: "safety-rules",
    title: "Safety / Compliance Rules",
    injectTarget: "CONSTRAINTS",
  },
  {
    id: "role-persona",
    title: "Role Persona: Senior DS + PE",
    injectTarget: "ROLE",
  },
];

export function ContextVaultPanel() {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const selectedCount = useMemo(
    () => Object.values(selected).filter(Boolean).length,
    [selected],
  );

  return (
    <aside className="w-[var(--context-vault-width)] shrink-0 border-l border-[var(--border-default)] bg-[var(--bg-primary)] p-4">
      <section className="flex h-full flex-col rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-md)]">
        <header className="border-b border-[var(--border-default)] pb-3">
          <h2 className="font-content text-2xl leading-tight text-[var(--text-primary)]">
            Context Vault
          </h2>
          <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
            Select buckets to inject
          </p>
        </header>

        <div className="mt-4 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
          {PLACEHOLDER_BUCKETS.map((bucket) => {
            const isChecked = Boolean(selected[bucket.id]);
            return (
              <label
                key={bucket.id}
                className="flex cursor-pointer items-start gap-3 rounded-[var(--radius-button)] border border-[var(--border-default)] bg-[var(--bg-block)] px-3 py-2 transition-colors duration-200 ease-in-out hover:bg-[var(--bg-surface-hover)]"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(event) => {
                    const isNextChecked = event.currentTarget.checked;
                    setSelected((previous) => ({
                      ...previous,
                      [bucket.id]: isNextChecked,
                    }));
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-[var(--border-strong)] accent-[var(--accent)]"
                />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-[13px] leading-snug text-[var(--text-primary)]">
                    {bucket.title}
                  </span>
                  <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)]">
                    Inject {"->"} {bucket.injectTarget}
                  </span>
                </span>
              </label>
            );
          })}
        </div>

        <footer className="mt-4 border-t border-[var(--border-default)] pt-3 text-[11px] text-[var(--text-tertiary)]">
          {selectedCount} selected
        </footer>
      </section>
    </aside>
  );
}
