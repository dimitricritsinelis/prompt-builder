import { invoke } from "@tauri-apps/api/core";

export type NoteType = "freeform" | "prompt";

export type Note = {
  id: string;
  title: string;
  bodyJson: string;
  bodyText: string;
  noteType: NoteType;
  metaJson: string | null;
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
  isTrashed: boolean;
};

export type NoteUpdateInput = {
  id: string;
  title: string;
  bodyJson: string;
  bodyText: string;
};

export async function noteCreate(noteType: NoteType): Promise<Note> {
  return invoke<Note>("note_create", { noteType });
}

export async function noteGet(id: string): Promise<Note> {
  return invoke<Note>("note_get", { id });
}

export async function noteUpdate(input: NoteUpdateInput): Promise<Note> {
  return invoke<Note>("note_update", input);
}

export async function noteDelete(id: string): Promise<void> {
  return invoke<void>("note_delete", { id });
}

export async function noteRestore(id: string): Promise<void> {
  return invoke<void>("note_restore", { id });
}

export async function noteDeletePermanent(id: string): Promise<void> {
  return invoke<void>("note_delete_permanent", { id });
}

export async function noteList(includeTrashed = false): Promise<Note[]> {
  return invoke<Note[]>("note_list", { includeTrashed });
}

export async function noteSearch(query: string): Promise<Note[]> {
  return invoke<Note[]>("note_search", { query });
}

export async function notePin(id: string, pinned: boolean): Promise<void> {
  return invoke<void>("note_pin", { id, pinned });
}

export async function noteReindex(): Promise<void> {
  return invoke<void>("note_reindex");
}
