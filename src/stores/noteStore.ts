import { create } from "zustand";
import {
  type Note,
  type NoteMeta,
  type NoteType,
  noteCreate,
  noteDelete,
  noteGet,
  noteListMeta,
  notePin,
  noteRestore,
  noteSearchMeta,
  noteUpdate,
} from "../lib/tauri";
import { promptTemplateDoc, promptTemplateText } from "../lib/promptBlocks";

type NoteStoreState = {
  notes: NoteMeta[];
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

function defaultTitleForType(noteType: NoteType): string {
  return noteType === "prompt" ? "Prompt" : "Note";
}

function sortNotes(notes: NoteMeta[]): NoteMeta[] {
  return [...notes].sort((a, b) => {
    if (a.isPinned !== b.isPinned) {
      return a.isPinned ? -1 : 1;
    }
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

function toNoteMeta(note: Note): NoteMeta {
  return {
    id: note.id,
    title: note.title,
    noteType: note.noteType,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
    isPinned: note.isPinned,
    isTrashed: note.isTrashed,
  };
}

function upsertNoteMeta(notes: NoteMeta[], updated: NoteMeta): NoteMeta[] {
  const hasExisting = notes.some((note) => note.id === updated.id);
  if (!hasExisting) {
    return sortNotes([updated, ...notes]);
  }

  return sortNotes(notes.map((note) => (note.id === updated.id ? updated : note)));
}

function resolveActiveNoteId(notes: NoteMeta[], preferredId: string | null): string | null {
  if (preferredId && notes.some((note) => note.id === preferredId)) {
    return preferredId;
  }

  return notes[0]?.id ?? null;
}

async function loadVisibleNotes(query: string): Promise<NoteMeta[]> {
  const cleaned = query.trim();
  if (!cleaned) {
    return sortNotes(await noteListMeta(false));
  }

  return sortNotes(await noteSearchMeta(cleaned));
}

async function resolveActiveNote(
  notes: NoteMeta[],
  preferredId: string | null,
  currentActive: Note | null,
): Promise<{ activeNoteId: string | null; activeNote: Note | null }> {
  const activeNoteId = resolveActiveNoteId(notes, preferredId);
  if (!activeNoteId) {
    return { activeNoteId: null, activeNote: null };
  }

  if (currentActive?.id === activeNoteId) {
    return {
      activeNoteId,
      activeNote: currentActive,
    };
  }

  return {
    activeNoteId,
    activeNote: await noteGet(activeNoteId),
  };
}

export const useNoteStore = create<NoteStoreState>((set, get) => {
  const refreshVisibleNotes = async (preferredId?: string | null) => {
    const notes = await loadVisibleNotes(get().searchQuery);
    const { activeNoteId, activeNote } = await resolveActiveNote(
      notes,
      preferredId ?? get().activeNoteId,
      get().activeNote,
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
        const notes = sortNotes(await noteListMeta(false));
        const { activeNoteId, activeNote } = await resolveActiveNote(
          notes,
          get().activeNoteId,
          get().activeNote,
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
        const { activeNoteId, activeNote } = await resolveActiveNote(
          notes,
          get().activeNoteId,
          get().activeNote,
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
        const baseTitle = defaultTitleForType(noteType);
        created = await noteUpdate({
          id: created.id,
          title: baseTitle,
          bodyJson:
            noteType === "prompt" ? JSON.stringify(promptTemplateDoc()) : created.bodyJson,
          bodyText: noteType === "prompt" ? promptTemplateText() : created.bodyText,
        });

        const notes = sortNotes(await noteListMeta(false));
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

      const nextTitle = title.trim() || defaultTitleForType(active.noteType);
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
          notes: upsertNoteMeta(state.notes, toNoteMeta(updated)),
        }));
      } catch (error) {
        set({ error: String(error), saveState: "error" });
      }
    },

    async saveBody(id, title, bodyJson, bodyText) {
      const active = get().activeNote;
      if (!active || active.id !== id) return;

      if (
        active.title === title &&
        active.bodyJson === bodyJson &&
        active.bodyText === bodyText
      ) {
        return;
      }

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
          notes: upsertNoteMeta(state.notes, toNoteMeta(updated)),
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
