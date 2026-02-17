import { useCallback, useEffect, useRef } from "react";

type EditorAutosavePayload = {
  bodyJson: string;
  bodyText: string;
};

type UseEditorAutosaveOptions = {
  noteId: string;
  initialBodyJson: string;
  initialBodyText: string;
  getPayload: () => EditorAutosavePayload;
  onSave: (bodyJson: string, bodyText: string) => Promise<void>;
};

export function useEditorAutosave({
  noteId,
  initialBodyJson,
  initialBodyText,
  getPayload,
  onSave,
}: UseEditorAutosaveOptions) {
  const debounceRef = useRef<number | null>(null);
  const isDirtyRef = useRef(false);
  const lastSavedRef = useRef<EditorAutosavePayload>({
    bodyJson: initialBodyJson,
    bodyText: initialBodyText,
  });
  const onSaveRef = useRef(onSave);
  const getPayloadRef = useRef(getPayload);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    getPayloadRef.current = getPayload;
  }, [getPayload]);

  const flush = useCallback(async () => {
    if (!isDirtyRef.current) return;

    const pending = getPayloadRef.current();

    const unchanged =
      pending.bodyJson === lastSavedRef.current.bodyJson &&
      pending.bodyText === lastSavedRef.current.bodyText;
    if (unchanged) {
      isDirtyRef.current = false;
      return;
    }

    await onSaveRef.current(pending.bodyJson, pending.bodyText);
    lastSavedRef.current = pending;
    isDirtyRef.current = false;
  }, []);

  const queueSave = useCallback(
    () => {
      isDirtyRef.current = true;
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
    isDirtyRef.current = false;
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }, [initialBodyJson, initialBodyText, noteId]);

  const flushRef = useRef(flush);
  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
      void flushRef.current();
    };
  }, [noteId]);

  return { queueSave, flush };
}
