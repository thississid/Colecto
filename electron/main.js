const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: '#0a0a0a',
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  const isDev = process.env.NODE_ENV !== 'production';
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC Handlers
ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  
  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('get-notes', async (event, folderPath) => {
  try {
    const files = await fs.readdir(folderPath);
    const mdFiles = files.filter(file => file.endsWith('.md'));
    
    const notes = await Promise.all(
      mdFiles.map(async (file) => {
        const filePath = path.join(folderPath, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const stats = await fs.stat(filePath);
        
        return {
          id: file,
          title: file.replace('.md', ''),
          content,
          modified: stats.mtime
        };
      })
    );
    
    return notes.sort((a, b) => b.modified - a.modified);
  } catch (error) {
    console.error('Error reading notes:', error);
    return [];
  }
});

ipcMain.handle('save-note', async (event, folderPath, noteId, content) => {
  try {
    const filePath = path.join(folderPath, noteId.endsWith('.md') ? noteId : `${noteId}.md`);
    await fs.writeFile(filePath, content, 'utf-8');
    return true;
  } catch (error) {
    console.error('Error saving note:', error);
    return false;
  }
});

ipcMain.handle('create-note', async (event, folderPath) => {
  try {
    // Find next available "Untitled Note" number
    const files = await fs.readdir(folderPath);
    const untitledFiles = files.filter(f => f.startsWith('Untitled Note'));
    let counter = untitledFiles.length + 1;
    let noteId = `Untitled Note ${counter}.md`;
    let filePath = path.join(folderPath, noteId);
    
    // Ensure unique filename
    while (files.includes(noteId)) {
      counter++;
      noteId = `Untitled Note ${counter}.md`;
      filePath = path.join(folderPath, noteId);
    }
    
    await fs.writeFile(filePath, '', 'utf-8');
    return noteId;
  } catch (error) {
    console.error('Error creating note:', error);
    return null;
  }
});

ipcMain.handle('delete-note', async (event, folderPath, noteId) => {
  try {
    const filePath = path.join(folderPath, noteId);
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    console.error('Error deleting note:', error);
    return false;
  }
});

ipcMain.handle('rename-note', async (event, folderPath, oldNoteId, newTitle) => {
  try {
    const oldPath = path.join(folderPath, oldNoteId);
    const newNoteId = `${newTitle}.md`;
    const newPath = path.join(folderPath, newNoteId);
    
    // Check if new name already exists
    try {
      await fs.access(newPath);
      return { success: false, error: 'A note with this name already exists' };
    } catch {
      // File doesn't exist, proceed with rename
    }
    
    await fs.rename(oldPath, newPath);
    return { success: true, newNoteId };
  } catch (error) {
    console.error('Error renaming note:', error);
    return { success: false, error: error.message };
  }
});
