declare global {
  interface Window {
    electronAPI: {
      selectFolder: () => Promise<string | null>;
      getNotes: (folderPath: string) => Promise<Note[]>;
      saveNote: (folderPath: string, noteId: string, content: string) => Promise<boolean>;
      createNote: (folderPath: string) => Promise<string | null>;
      deleteNote: (folderPath: string, noteId: string) => Promise<boolean>;
      renameNote: (folderPath: string, oldNoteId: string, newTitle: string) => Promise<{ success: boolean; newNoteId?: string; error?: string }>;
    };
  }
}

export interface Note {
  id: string;
  title: string;
  content: string;
  modified: Date;
}

export {};
