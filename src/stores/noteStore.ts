import { create } from "zustand";
import {
  type Note,
  type NoteType,
  noteCreate,
  noteDelete,
  noteGet,
  noteList,
  notePin,
  noteRestore,
  noteSearch,
  noteUpdate,
} from "../lib/tauri";
import { promptTemplateDoc, promptTemplateText } from "../lib/promptBlocks";

type NoteStoreState = {
  notes: Note[];
  activeNote: Note | null;
  activeNoteId: string | null;
  searchQuery: string;
  hasLoaded: boolean;
  isLoading: boolean;
  saveState: "idle" | "saving" | "saved" | "error";
  error: string | null;
  loadNotes: () => Promise<void>;
  searchNotes: (query: string) => Promise<void>;
  createNote: (noteType: NoteType) => Promise<void>;
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

function sortNotes(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => {
    if (a.isPinned !== b.isPinned) {
      return a.isPinned ? -1 : 1;
    }
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

function resolveActiveNote(
  notes: Note[],
  preferredId: string | null,
): { activeNoteId: string | null; activeNote: Note | null } {
  const nextActiveId =
    preferredId && notes.some((note) => note.id === preferredId)
      ? preferredId
      : notes[0]?.id ?? null;

  return {
    activeNoteId: nextActiveId,
    activeNote: nextActiveId
      ? notes.find((note) => note.id === nextActiveId) ?? null
      : null,
  };
}

async function loadVisibleNotes(query: string): Promise<Note[]> {
  const cleaned = query.trim();
  if (!cleaned) {
    return sortNotes(await noteList(false));
  }
  return sortNotes(await noteSearch(cleaned));
}

export const useNoteStore = create<NoteStoreState>((set, get) => {
  const refreshVisibleNotes = async (preferredId?: string | null) => {
    const notes = await loadVisibleNotes(get().searchQuery);
    const { activeNoteId, activeNote } = resolveActiveNote(
      notes,
      preferredId ?? get().activeNoteId,
    );

    set({
      notes,
      activeNoteId,
      activeNote,
      hasLoaded: true,
      saveState: "saved",
    });
  };

  return {
    notes: [],
    activeNote: null,
    activeNoteId: null,
    searchQuery: "",
    hasLoaded: false,
    isLoading: false,
    saveState: "idle",
    error: null,

    async loadNotes() {
      set({ isLoading: true, error: null });
      try {
        const notes = sortNotes(await noteList(false));
        const { activeNoteId, activeNote } = resolveActiveNote(
          notes,
          get().activeNoteId,
        );

        set({
          notes,
          activeNoteId,
          activeNote,
          hasLoaded: true,
          saveState: "saved",
        });
      } catch (error) {
        set({ error: String(error) });
      } finally {
        set({ isLoading: false });
      }
    },

    async searchNotes(query) {
      set({ isLoading: true, error: null });
      try {
        const notes = await loadVisibleNotes(query);
        const { activeNoteId, activeNote } = resolveActiveNote(
          notes,
          get().activeNoteId,
        );

        set({
          notes,
          activeNoteId,
          activeNote,
          saveState: "saved",
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
        let created = await noteCreate(noteType);
        if (noteType === "prompt") {
          created = await noteUpdate({
            id: created.id,
            title: created.title,
            bodyJson: JSON.stringify(promptTemplateDoc()),
            bodyText: promptTemplateText(),
          });
        }

        const notes = sortNotes(await noteList(false));
        set({
          notes,
          activeNoteId: created.id,
          activeNote: created,
          searchQuery: "",
          saveState: "saved",
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
        set({ activeNoteId: note.id, activeNote: note, saveState: "saved" });
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

      set({ error: null, saveState: "saving" });
      try {
        const updated = await noteUpdate({
          id: active.id,
          title: nextTitle,
          bodyJson: active.bodyJson,
          bodyText: active.bodyText,
        });

        set((state) => ({
          activeNote: updated,
          saveState: "saved",
          notes: sortNotes(
            state.notes.map((note) => (note.id === updated.id ? updated : note)),
          ),
        }));
      } catch (error) {
        set({ error: String(error), saveState: "error" });
      }
    },

    async saveBody(id, title, bodyJson, bodyText) {
      const existing = get().notes.find((note) => note.id === id);
      if (existing && existing.bodyJson === bodyJson && existing.bodyText === bodyText) return;

      set({ error: null, saveState: "saving" });
      try {
        const updated = await noteUpdate({
          id,
          title,
          bodyJson,
          bodyText,
        });

        set((state) => ({
          activeNote:
            state.activeNote && state.activeNote.id === updated.id
              ? updated
              : state.activeNote,
          saveState: "saved",
          notes: sortNotes(
            state.notes.map((note) => (note.id === updated.id ? updated : note)),
          ),
        }));
      } catch (error) {
        set({ error: String(error), saveState: "error" });
      }
    },

    async pinNote(id, pinned) {
      set({ isLoading: true, error: null });
      try {
        await notePin(id, pinned);
        await refreshVisibleNotes(id);
      } catch (error) {
        set({ error: String(error) });
      } finally {
        set({ isLoading: false });
      }
    },

    async trashNote(id) {
      set({ isLoading: true, error: null });
      try {
        await noteDelete(id);
        await refreshVisibleNotes();
      } catch (error) {
        set({ error: String(error) });
      } finally {
        set({ isLoading: false });
      }
    },

    async restoreNote(id) {
      set({ isLoading: true, error: null });
      try {
        await noteRestore(id);
        await refreshVisibleNotes(id);
      } catch (error) {
        set({ error: String(error) });
      } finally {
        set({ isLoading: false });
      }
    },
  };
});
