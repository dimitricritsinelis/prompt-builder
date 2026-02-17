import { create } from "zustand";
import {
  type Note,
  type NoteType,
  noteCreate,
  noteGet,
  noteList,
  noteSearch,
  noteUpdate,
} from "../lib/tauri";

type NoteStoreState = {
  notes: Note[];
  activeNote: Note | null;
  activeNoteId: string | null;
  searchQuery: string;
  hasLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  loadNotes: () => Promise<void>;
  searchNotes: (query: string) => Promise<void>;
  createNote: (noteType: NoteType) => Promise<void>;
  setActiveNote: (id: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  updateTitle: (title: string) => Promise<void>;
};

function sortNotes(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => {
    if (a.isPinned !== b.isPinned) {
      return a.isPinned ? -1 : 1;
    }
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

export const useNoteStore = create<NoteStoreState>((set, get) => ({
  notes: [],
  activeNote: null,
  activeNoteId: null,
  searchQuery: "",
  hasLoaded: false,
  isLoading: false,
  error: null,

  async loadNotes() {
    set({ isLoading: true, error: null });
    try {
      const notes = sortNotes(await noteList(false));
      const currentActiveId = get().activeNoteId;
      const nextActiveId =
        currentActiveId && notes.some((note) => note.id === currentActiveId)
          ? currentActiveId
          : notes[0]?.id ?? null;

      set({
        notes,
        activeNoteId: nextActiveId,
        activeNote: nextActiveId
          ? notes.find((note) => note.id === nextActiveId) ?? null
          : null,
        hasLoaded: true,
      });
    } catch (error) {
      set({ error: String(error) });
    } finally {
      set({ isLoading: false });
    }
  },

  async searchNotes(query) {
    const cleaned = query.trim();
    if (!cleaned) {
      await get().loadNotes();
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const notes = sortNotes(await noteSearch(cleaned));
      const currentActiveId = get().activeNoteId;
      const nextActiveId =
        currentActiveId && notes.some((note) => note.id === currentActiveId)
          ? currentActiveId
          : notes[0]?.id ?? null;

      set({
        notes,
        activeNoteId: nextActiveId,
        activeNote: nextActiveId
          ? notes.find((note) => note.id === nextActiveId) ?? null
          : null,
      });
    } catch (error) {
      set({ error: String(error) });
    } finally {
      set({ isLoading: false });
    }
  },

  async createNote(noteType) {
    set({ isLoading: true, error: null });
    try {
      const created = await noteCreate(noteType);
      const notes = sortNotes([created, ...get().notes.filter((n) => n.id !== created.id)]);
      set({
        notes,
        activeNoteId: created.id,
        activeNote: created,
        searchQuery: "",
      });
    } catch (error) {
      set({ error: String(error) });
    } finally {
      set({ isLoading: false });
    }
  },

  async setActiveNote(id) {
    set({ isLoading: true, error: null });
    try {
      const note = await noteGet(id);
      set({ activeNoteId: note.id, activeNote: note });
    } catch (error) {
      set({ error: String(error) });
    } finally {
      set({ isLoading: false });
    }
  },

  setSearchQuery(query) {
    set({ searchQuery: query });
  },

  async updateTitle(title) {
    const active = get().activeNote;
    if (!active) return;

    const nextTitle = title.trim() || "Untitled";
    if (nextTitle === active.title) return;

    set({ error: null });
    try {
      const updated = await noteUpdate({
        id: active.id,
        title: nextTitle,
        bodyJson: active.bodyJson,
        bodyText: active.bodyText,
      });

      set((state) => ({
        activeNote: updated,
        notes: sortNotes(
          state.notes.map((note) => (note.id === updated.id ? updated : note)),
        ),
      }));
    } catch (error) {
      set({ error: String(error) });
    }
  },
}));
