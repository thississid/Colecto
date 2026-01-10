const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  getNotes: (folderPath) => ipcRenderer.invoke('get-notes', folderPath),
  saveNote: (folderPath, noteId, content) => ipcRenderer.invoke('save-note', folderPath, noteId, content),
  createNote: (folderPath) => ipcRenderer.invoke('create-note', folderPath),
  deleteNote: (folderPath, noteId) => ipcRenderer.invoke('delete-note', folderPath, noteId)
});
