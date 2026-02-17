import { useEffect, useRef } from "react";
import type { Note } from "../lib/tauri";
import { useNoteStore } from "../stores/noteStore";

type UseNotesResult = {
  notes: Note[];
  activeNote: Note | null;
  activeNoteId: string | null;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
  createFreeformNote: () => Promise<void>;
  createPromptNote: () => Promise<void>;
  setActiveNote: (id: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  updateTitle: (title: string) => Promise<void>;
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
    error,
    loadNotes,
    searchNotes,
    createNote,
    setActiveNote,
    setSearchQuery,
    updateTitle,
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

  return {
    notes,
    activeNote,
    activeNoteId,
    searchQuery,
    isLoading,
    error,
    createFreeformNote: () => createNote("freeform"),
    createPromptNote: () => createNote("prompt"),
    setActiveNote,
    setSearchQuery,
    updateTitle,
  };
}
