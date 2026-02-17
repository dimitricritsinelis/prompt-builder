import { useCallback, useEffect, useRef } from "react";
import type { Note } from "../lib/tauri";
import { useNoteStore } from "../stores/noteStore";

type UseNotesResult = {
  notes: Note[];
  activeNote: Note | null;
  activeNoteId: string | null;
  searchQuery: string;
  isLoading: boolean;
  saveState: "idle" | "saving" | "saved" | "error";
  error: string | null;
  createFreeformNote: () => Promise<void>;
  createPromptNote: () => Promise<void>;
  setActiveNote: (id: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  updateTitle: (title: string) => Promise<void>;
  saveBody: (
    id: string,
    title: string,
    bodyJson: string,
    bodyText: string,
  ) => Promise<void>;
  pinNote: (id: string, pinned: boolean) => Promise<void>;
  trashNote: (id: string) => Promise<void>;
  restoreNote: (id: string) => Promise<void>;
};

export function useNotes(): UseNotesResult {
  const hasInitializedSearch = useRef(false);
  const {
    notes,
    activeNote,
    activeNoteId,
    searchQuery,
    hasLoaded,
    isLoading,
    saveState,
    error,
    loadNotes,
    searchNotes,
    createNote,
    setActiveNote,
    setSearchQuery,
    updateTitle,
    saveBody,
    pinNote,
    trashNote,
    restoreNote,
  } = useNoteStore();

  useEffect(() => {
    if (!hasLoaded) {
      void loadNotes();
    }
  }, [hasLoaded, loadNotes]);

  useEffect(() => {
    if (!hasLoaded) return;
    if (!hasInitializedSearch.current) {
      hasInitializedSearch.current = true;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (searchQuery.trim()) {
        void searchNotes(searchQuery);
      } else {
        void loadNotes();
      }
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [hasLoaded, loadNotes, searchNotes, searchQuery]);

  const createFreeformNote = useCallback(() => createNote("freeform"), [createNote]);
  const createPromptNote = useCallback(() => createNote("prompt"), [createNote]);

  return {
    notes,
    activeNote,
    activeNoteId,
    searchQuery,
    isLoading,
    saveState,
    error,
    createFreeformNote,
    createPromptNote,
    setActiveNote,
    setSearchQuery,
    updateTitle,
    saveBody,
    pinNote,
    trashNote,
    restoreNote,
  };
}
