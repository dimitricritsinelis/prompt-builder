import { useCallback, useEffect, useRef } from "react";

type EditorAutosavePayload = {
  bodyJson: string;
  bodyText: string;
};

type UseEditorAutosaveOptions = {
  noteId: string;
  initialBodyJson: string;
  initialBodyText: string;
  onSave: (bodyJson: string, bodyText: string) => Promise<void>;
};

export function useEditorAutosave({
  noteId,
  initialBodyJson,
  initialBodyText,
  onSave,
}: UseEditorAutosaveOptions) {
  const debounceRef = useRef<number | null>(null);
  const pendingRef = useRef<EditorAutosavePayload | null>(null);
  const lastSavedRef = useRef<EditorAutosavePayload>({
    bodyJson: initialBodyJson,
    bodyText: initialBodyText,
  });

  const flush = useCallback(async () => {
    const pending = pendingRef.current;
    if (!pending) return;

    const unchanged =
      pending.bodyJson === lastSavedRef.current.bodyJson &&
      pending.bodyText === lastSavedRef.current.bodyText;
    if (unchanged) {
      pendingRef.current = null;
      return;
    }

    await onSave(pending.bodyJson, pending.bodyText);
    lastSavedRef.current = pending;
    pendingRef.current = null;
  }, [onSave]);

  const queueSave = useCallback(
    (payload: EditorAutosavePayload) => {
      pendingRef.current = payload;
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }

      debounceRef.current = window.setTimeout(() => {
        void flush();
      }, 1000);
    },
    [flush],
  );

  useEffect(() => {
    lastSavedRef.current = { bodyJson: initialBodyJson, bodyText: initialBodyText };
    pendingRef.current = null;
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }, [initialBodyJson, initialBodyText, noteId]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
      void flush();
    };
  }, [flush, noteId]);

  return { queueSave, flush };
}
