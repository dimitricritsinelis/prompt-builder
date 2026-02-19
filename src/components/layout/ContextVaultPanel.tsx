import { useMemo, useState } from "react";
import { countWords, estimateOpenAITokens } from "../../lib/tokenCount";
import { PanelToggleButton } from "../ui/PanelToggleButton";

type VaultBucket = {
  id: string;
  title: string;
  injectTarget: "CONTEXT" | "CONSTRAINTS" | "ROLE";
  placeholder: string;
};

type ContextInjectItem = {
  target: "CONTEXT" | "CONSTRAINTS" | "ROLE";
  text: string;
};

const PLACEHOLDER_BUCKETS: VaultBucket[] = [
  {
    id: "project-eagle-ford",
    title: "Project: Eagle Ford Optimization",
    injectTarget: "CONTEXT",
    placeholder: "Paste project background, goals, and constraints...",
  },
  {
    id: "dataset-schema",
    title: "Dataset Schema: Production + Pressure",
    injectTarget: "CONTEXT",
    placeholder: "Paste schema details, field definitions, and units...",
  },
  {
    id: "house-style",
    title: "House Style: concise, bullet-first",
    injectTarget: "CONSTRAINTS",
    placeholder: "Paste preferred writing style and tone guidance...",
  },
  {
    id: "safety-rules",
    title: "Safety / Compliance Rules",
    injectTarget: "CONSTRAINTS",
    placeholder: "Paste safety/compliance instructions and prohibited actions...",
  },
  {
    id: "role-persona",
    title: "Role Persona: Senior DS + PE",
    injectTarget: "ROLE",
    placeholder: "Paste role framing, expertise, and perspective...",
  },
];

type ContextVaultPanelProps = {
  onToggleCollapse: () => void;
};

export function ContextVaultPanel({ onToggleCollapse }: ContextVaultPanelProps) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [bucketContent, setBucketContent] = useState<Record<string, string>>({});
  const selectedCount = useMemo(
    () => Object.values(selected).filter(Boolean).length,
    [selected],
  );
  const selectedInjectableItems = useMemo(() => {
    return PLACEHOLDER_BUCKETS.flatMap((bucket) => {
      if (!selected[bucket.id]) return [];
      const text = (bucketContent[bucket.id] ?? "").trim();
      if (!text) return [];
      return [{ target: bucket.injectTarget, text }];
    });
  }, [bucketContent, selected]);

  const emitInjectEvent = (items: ContextInjectItem[]) => {
    if (items.length === 0) return;
    window.dispatchEvent(
      new CustomEvent("promptpad:inject-context", {
        detail: { items },
      }),
    );
  };

  return (
    <aside className="flex min-h-0 w-[var(--context-vault-width)] shrink-0 flex-col overflow-hidden border-l border-[var(--border-default)] bg-[var(--bg-primary)]">
      <div className="min-h-0 flex-1 p-4">
        <section className="flex h-full flex-col rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 shadow-[var(--shadow-md)]">
          <header className="border-b border-[var(--border-default)] pb-3">
            <div className="flex items-start gap-2">
              <PanelToggleButton
                panel="right"
                onClick={onToggleCollapse}
                aria-label="Collapse context vault"
                title="Collapse context vault"
                className="h-8 w-8 rounded-[12px]"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-content text-2xl leading-tight text-[var(--text-primary)]">
                    Context Vault
                  </h2>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      aria-label="Add context blob"
                      title="Add context blob"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] transition-colors duration-200 ease-in-out hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                        <path
                          d="M7 2.3v9.4M2.3 7h9.4"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      aria-label="Upload context document"
                      title="Upload context document"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] transition-colors duration-200 ease-in-out hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                        <path
                          d="M4 1.8h4.6L11.5 4.7V12.2H4V1.8Z"
                          stroke="currentColor"
                          strokeWidth="1.2"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M8.6 1.8V4.7H11.5"
                          stroke="currentColor"
                          strokeWidth="1.2"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M5.8 7.6H9.7M5.8 9.6H9.7"
                          stroke="currentColor"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
                  Select buckets to inject
                </p>
              </div>
            </div>
          </header>

          <div className="mt-4 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
            {PLACEHOLDER_BUCKETS.map((bucket) => {
              const isChecked = Boolean(selected[bucket.id]);
              const isExpanded = Boolean(expanded[bucket.id]);
              const content = bucketContent[bucket.id] ?? "";
              const wordCount = countWords(content);
              const estimatedTokens = estimateOpenAITokens(content);

              return (
                <article
                  key={bucket.id}
                  className="rounded-[var(--radius-button)] border border-[var(--border-default)] bg-[var(--bg-block)] px-3 py-2 transition-colors duration-200 ease-in-out hover:bg-[var(--bg-surface-hover)]"
                >
                  <div className="flex items-start gap-3">
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

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-[13px] leading-snug text-[var(--text-primary)]">
                            {bucket.title}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              const text = content.trim();
                              if (!text) return;
                              emitInjectEvent([{ target: bucket.injectTarget, text }]);
                            }}
                            disabled={content.trim().length === 0}
                            className="mt-1 text-[10px] font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)] transition-colors duration-200 ease-in-out hover:text-[var(--text-secondary)] disabled:cursor-not-allowed disabled:opacity-45"
                          >
                            Inject {"->"} {bucket.injectTarget}
                          </button>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <span className="text-[10px] text-[var(--text-tertiary)]">
                            {wordCount} words · ~{estimatedTokens} tokens
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setExpanded((previous) => ({
                                ...previous,
                                [bucket.id]: !previous[bucket.id],
                              }));
                            }}
                            className="inline-flex h-6 w-6 items-center justify-center rounded-[var(--radius-button)] border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-secondary)] transition-colors duration-200 ease-in-out hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"
                            aria-label={isExpanded ? "Collapse context block" : "Expand context block"}
                            title={isExpanded ? "Collapse" : "Expand"}
                          >
                            <svg
                              width="10"
                              height="10"
                              viewBox="0 0 10 10"
                              fill="none"
                              aria-hidden="true"
                              className={isExpanded ? "rotate-180" : ""}
                            >
                              <path
                                d="M2 3.5L5 6.5L8 3.5"
                                stroke="currentColor"
                                strokeWidth="1.2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {isExpanded ? (
                    <div className="mt-2 border-t border-[var(--border-default)] pt-2">
                      <textarea
                        value={content}
                        onChange={(event) => {
                          const nextText = event.currentTarget.value;
                          setBucketContent((previous) => ({
                            ...previous,
                            [bucket.id]: nextText,
                          }));
                        }}
                        placeholder={bucket.placeholder}
                        className="h-28 w-full resize-y rounded-[var(--radius-button)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-2.5 py-2 text-[12px] leading-relaxed text-[var(--text-primary)] outline-none transition-colors duration-200 ease-in-out placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-subtle)]"
                      />
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      </div>

      <footer className="flex h-[var(--status-height)] items-center justify-between gap-3 border-t border-[var(--border-default)] bg-[var(--bg-surface)] px-4 text-[11px] text-[var(--text-secondary)]">
        <span>{selectedCount} selected</span>
        <button
          type="button"
          onClick={() => emitInjectEvent(selectedInjectableItems)}
          disabled={selectedInjectableItems.length === 0}
          className="rounded-[var(--radius-button)] border border-[var(--border-default)] px-2 py-1 text-[11px] font-semibold text-[var(--text-secondary)] transition-colors duration-200 ease-in-out hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-45"
        >
          Inject selected
        </button>
      </footer>
    </aside>
  );
}
