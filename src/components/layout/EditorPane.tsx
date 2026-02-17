export function EditorPane() {
  return (
    <main className="min-w-0 flex-1 overflow-auto bg-[var(--bg-primary)]">
      <div className="mx-auto w-full max-w-[var(--editor-max-width)] px-[var(--editor-padding-x)] pb-20 pt-[var(--editor-padding-top)]">
        <article className="editor-pane-content space-y-6 rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-8 shadow-[var(--shadow-md)]">
          <header>
            <p className="text-[var(--font-size-label)] font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)]">
              Draft
            </p>
            <h1 className="mt-2">Prompt Shell Placeholder</h1>
          </header>

          <p>
            This editor pane is intentionally focused and calm, with centered
            reading width and typography tuned for long-form prompt writing.
          </p>

          <section className="editor-placeholder-block">
            <p className="text-[var(--font-size-label)] font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)]">
              Structured Block Placeholder
            </p>
            <p className="mt-2">
              Role: Helpful assistant.
              <br />
              Task: Summarize this note with key constraints.
            </p>
          </section>

          <p>
            Add content here while the backend and persistence layer are wired
            in the next phase.
          </p>
        </article>
      </div>
    </main>
  );
}
