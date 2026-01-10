import { useState, useEffect, useCallback } from 'react'
import { Note } from './types'
import './App.css'

function App() {
  const [folderPath, setFolderPath] = useState<string | null>(
    localStorage.getItem('colecto-folder')
  )
  const [notes, setNotes] = useState<Note[]>([])
  const [currentNote, setCurrentNote] = useState<Note | null>(null)
  const [content, setContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const loadNotes = useCallback(async () => {
    if (!folderPath) return
    const loadedNotes = await window.electronAPI.getNotes(folderPath)
    setNotes(loadedNotes)
  }, [folderPath])

  useEffect(() => {
    loadNotes()
  }, [loadNotes])

  useEffect(() => {
    if (currentNote) {
      setContent(currentNote.content)
    }
  }, [currentNote])

  const selectFolder = async () => {
    const path = await window.electronAPI.selectFolder()
    if (path) {
      setFolderPath(path)
      localStorage.setItem('colecto-folder', path)
      const loadedNotes = await window.electronAPI.getNotes(path)
      setNotes(loadedNotes)
      if (loadedNotes.length > 0) {
        setCurrentNote(loadedNotes[0])
      }
    }
  }

  const createNote = async () => {
    if (!folderPath) return
    const noteId = await window.electronAPI.createNote(folderPath)
    if (noteId) {
      await loadNotes()
      const newNote = notes.find(n => n.id === noteId)
      if (newNote) {
        setCurrentNote(newNote)
      }
    }
  }

  const saveNote = async () => {
    if (!folderPath || !currentNote) return
    setIsSaving(true)
    await window.electronAPI.saveNote(folderPath, currentNote.id, content)
    await loadNotes()
    setIsSaving(false)
  }

  const deleteNote = async () => {
    if (!folderPath || !currentNote) return
    if (confirm('Delete this note?')) {
      await window.electronAPI.deleteNote(folderPath, currentNote.id)
      setCurrentNote(null)
      setContent('')
      await loadNotes()
    }
  }

  useEffect(() => {
    const saveInterval = setInterval(() => {
      if (currentNote && content !== currentNote.content) {
        saveNote()
      }
    }, 2000)
    return () => clearInterval(saveInterval)
  }, [currentNote, content])

  if (!folderPath) {
    return (
      <div className="welcome">
        <div className="welcome-content">
          <h1>Colecto</h1>
          <p>A personal thought system</p>
          <button onClick={selectFolder} className="btn-primary">
            Select Folder
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Colecto</h2>
          <button onClick={createNote} className="btn-icon" title="New note">
            +
          </button>
        </div>
        
        <div className="note-list">
          {notes.map(note => (
            <div
              key={note.id}
              className={`note-item ${currentNote?.id === note.id ? 'active' : ''}`}
              onClick={() => setCurrentNote(note)}
            >
              <div className="note-title">{note.title}</div>
              <div className="note-preview">
                {note.content.slice(0, 60)}...
              </div>
            </div>
          ))}
          {notes.length === 0 && (
            <div className="empty-state">No notes yet</div>
          )}
        </div>

        <div className="sidebar-footer">
          <button onClick={selectFolder} className="btn-text">
            Change folder
          </button>
        </div>
      </aside>

      <main className="editor">
        {currentNote ? (
          <>
            <div className="editor-header">
              <input
                type="text"
                value={currentNote.title}
                readOnly
                className="note-title-input"
              />
              <div className="editor-actions">
                {isSaving && <span className="status">Saving...</span>}
                <button onClick={saveNote} className="btn-text">
                  Save
                </button>
                <button onClick={deleteNote} className="btn-text danger">
                  Delete
                </button>
              </div>
            </div>
            <textarea
              className="editor-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start writing..."
              autoFocus
            />
          </>
        ) : (
          <div className="empty-editor">
            <p>Select a note or create a new one</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
