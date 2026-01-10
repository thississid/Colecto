declare global {
  interface Window {
    electronAPI: {
      selectFolder: () => Promise<string | null>;
      getNotes: (folderPath: string) => Promise<Note[]>;
      saveNote: (folderPath: string, noteId: string, content: string) => Promise<boolean>;
      createNote: (folderPath: string) => Promise<string | null>;
      deleteNote: (folderPath: string, noteId: string) => Promise<boolean>;
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
