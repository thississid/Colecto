import { useState, useEffect, useCallback, useMemo } from 'react'
import { Note } from './types'
import './App.css'

type SortOption = 'modified' | 'title' | 'created'

function App() {
  const [folderPath, setFolderPath] = useState<string | null>(
    localStorage.getItem('colecto-folder')
  )
  const [notes, setNotes] = useState<Note[]>([])
  const [currentNote, setCurrentNote] = useState<Note | null>(null)
  const [content, setContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; note: Note } | null>(null)
  const [showHome, setShowHome] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('modified')
  const [showSortMenu, setShowSortMenu] = useState(false)
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set())
  const [lastClickedIndex, setLastClickedIndex] = useState<number | null>(null)

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

  // Clear selection when search query changes
  useEffect(() => {
    setSelectedNotes(new Set())
    setLastClickedIndex(null)
  }, [searchQuery])

  // Filter and sort notes
  const filteredAndSortedNotes = useMemo(() => {
    let filtered = notes

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = notes.filter(note => 
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query)
      )
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title)
        case 'modified':
          return new Date(b.modified).getTime() - new Date(a.modified).getTime()
        case 'created':
          // For now, we'll use modified as created since we don't track creation separately
          return new Date(a.modified).getTime() - new Date(b.modified).getTime()
        default:
          return 0
      }
    })

    return sorted
  }, [notes, searchQuery, sortBy])

  const selectFolder = async () => {
    const path = await window.electronAPI.selectFolder()
    if (path) {
      setFolderPath(path)
      localStorage.setItem('colecto-folder', path)
      const loadedNotes = await window.electronAPI.getNotes(path)
      setNotes(loadedNotes)
      setShowHome(false)
      if (loadedNotes.length > 0) {
        setCurrentNote(loadedNotes[0])
      }
    }
  }

  const createNote = useCallback(async () => {
    if (!folderPath) return
    const noteId = await window.electronAPI.createNote(folderPath)
    if (noteId) {
      await loadNotes()
      // Find the newly created note from the updated notes list
      const updatedNotes = await window.electronAPI.getNotes(folderPath)
      const newNote = updatedNotes.find(n => n.id === noteId)
      if (newNote) {
        setCurrentNote(newNote)
        setContent('')
        setSearchQuery('') // Clear search when creating new note
      }
    }
  }, [folderPath, loadNotes])

  const saveNote = useCallback(async () => {
    if (!folderPath || !currentNote) return
    setIsSaving(true)
    await window.electronAPI.saveNote(folderPath, currentNote.id, content)
    const updatedNotes = await window.electronAPI.getNotes(folderPath)
    setNotes(updatedNotes)
    // Update current note to reflect any changes (like renamed files)
    const updatedCurrentNote = updatedNotes.find(n => n.id === currentNote.id)
    if (updatedCurrentNote) {
      setCurrentNote(updatedCurrentNote)
    }
    setIsSaving(false)
  }, [folderPath, currentNote, content])

  const deleteNote = useCallback(async () => {
    if (!folderPath || !currentNote) return
    if (confirm('Delete this note?')) {
      await window.electronAPI.deleteNote(folderPath, currentNote.id)
      setCurrentNote(null)
      setContent('')
      await loadNotes()
    }
  }, [folderPath, currentNote, loadNotes])

  const renameNote = async (note: Note, newTitle: string) => {
    if (!folderPath || !newTitle.trim()) return
    const result = await window.electronAPI.renameNote(folderPath, note.id, newTitle.trim())
    if (result.success) {
      await loadNotes()
      // Update current note reference if it was the renamed note
      if (currentNote?.id === note.id) {
        const renamedNote = await window.electronAPI.getNotes(folderPath)
        const updatedNote = renamedNote.find(n => n.id === result.newNoteId)
        if (updatedNote) {
          setCurrentNote(updatedNote)
        }
      }
    } else {
      alert(result.error || 'Failed to rename note')
    }
  }

  const deleteNoteById = async (note: Note) => {
    if (!folderPath) return
    if (confirm(`Delete "${note.title}"?`)) {
      await window.electronAPI.deleteNote(folderPath, note.id)
      if (currentNote?.id === note.id) {
        setCurrentNote(null)
        setContent('')
      }
      await loadNotes()
    }
  }

  const handleContextMenu = (e: React.MouseEvent, note: Note) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({ x: e.clientX, y: e.clientY, note })
  }

  const handleRenameFromContext = () => {
    if (!contextMenu) return
    const newTitle = prompt('Enter new name:', contextMenu.note.title)
    if (newTitle && newTitle.trim()) {
      renameNote(contextMenu.note, newTitle.trim())
    }
    setContextMenu(null)
  }

  const handleDeleteFromContext = () => {
    if (!contextMenu) return
    deleteNoteById(contextMenu.note)
    setContextMenu(null)
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + N: New note
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault()
        if (folderPath) {
          createNote()
        }
      }
      // Cmd/Ctrl + S: Save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (currentNote && folderPath) {
          saveNote()
        }
      }
      // Cmd/Ctrl + F: Focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault()
        const searchInput = document.querySelector('.search-input') as HTMLInputElement
        searchInput?.focus()
        searchInput?.select()
      }
      // Cmd/Ctrl + K: Focus search (alternative)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        const searchInput = document.querySelector('.search-input') as HTMLInputElement
        searchInput?.focus()
        searchInput?.select()
      }
      // Escape: Clear search or close context menu
      if (e.key === 'Escape') {
        if (searchQuery) {
          setSearchQuery('')
        }
        setContextMenu(null)
        setShowSortMenu(false)
      }
      // Cmd/Ctrl + Delete: Delete current note
      if ((e.metaKey || e.ctrlKey) && (e.key === 'Delete' || e.key === 'Backspace')) {
        if (currentNote && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault()
          deleteNote()
        }
      }
      // Shift + Arrow keys: Multi-select notes
      if (e.shiftKey && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault()
          const currentIndex = filteredAndSortedNotes.findIndex(n => n.id === currentNote?.id)
          if (currentIndex === -1) return
          
          const newIndex = e.key === 'ArrowDown' 
            ? Math.min(currentIndex + 1, filteredAndSortedNotes.length - 1)
            : Math.max(currentIndex - 1, 0)
          
          if (newIndex !== currentIndex) {
            const startIndex = lastClickedIndex !== null ? lastClickedIndex : currentIndex
            const endIndex = newIndex
            const minIndex = Math.min(startIndex, endIndex)
            const maxIndex = Math.max(startIndex, endIndex)
            
            const newSelected = new Set(selectedNotes)
            for (let i = minIndex; i <= maxIndex; i++) {
              newSelected.add(filteredAndSortedNotes[i].id)
            }
            setSelectedNotes(newSelected)
            setCurrentNote(filteredAndSortedNotes[newIndex])
          }
        }
      }
      // Arrow keys without Shift: Navigate and clear selection
      if (!e.shiftKey && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
          e.preventDefault()
          const currentIndex = filteredAndSortedNotes.findIndex(n => n.id === currentNote?.id)
          if (currentIndex === -1 && filteredAndSortedNotes.length > 0) {
            setCurrentNote(filteredAndSortedNotes[0])
            setSelectedNotes(new Set([filteredAndSortedNotes[0].id]))
            setLastClickedIndex(0)
            return
          }
          
          const newIndex = e.key === 'ArrowDown' 
            ? Math.min(currentIndex + 1, filteredAndSortedNotes.length - 1)
            : Math.max(currentIndex - 1, 0)
          
          if (newIndex !== currentIndex) {
            setCurrentNote(filteredAndSortedNotes[newIndex])
            setSelectedNotes(new Set([filteredAndSortedNotes[newIndex].id]))
            setLastClickedIndex(newIndex)
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [folderPath, currentNote, searchQuery, createNote, saveNote, deleteNote, filteredAndSortedNotes, selectedNotes, lastClickedIndex])

  const highlightSearch = (text: string, query: string) => {
    if (!query.trim()) return text
    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="search-highlight">{part}</mark>
          ) : (
            part
          )
        )}
      </>
    )
  }

  useEffect(() => {
    const saveInterval = setInterval(() => {
      if (currentNote && content !== currentNote.content) {
        saveNote()
      }
    }, 2000)
    return () => clearInterval(saveInterval)
  }, [currentNote, content])

  if (!folderPath || showHome) {
    return (
      <div className="welcome">
        <div className="welcome-content">
          <h1>Colecto</h1>
          <p>A personal thought system</p>
          <button onClick={selectFolder} className="btn-primary">
            {folderPath ? 'Change Folder' : 'Select Folder'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="app" onClick={() => { setContextMenu(null); setShowSortMenu(false); }}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2 onClick={() => setShowHome(true)} className="clickable">Colecto</h2>
          <button onClick={createNote} className="btn-icon" title="New note (⌘N)">
            +
          </button>
        </div>
        
        <div className="sidebar-toolbar">
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="Search notes... (⌘F)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                className="search-clear"
                onClick={() => setSearchQuery('')}
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>
          <div className="sort-container" onClick={(e) => e.stopPropagation()}>
            <button 
              className="sort-button"
              onClick={(e) => {
                e.stopPropagation()
                setShowSortMenu(!showSortMenu)
              }}
              title="Sort notes"
            >
              {sortBy === 'modified' && '↓'}
              {sortBy === 'title' && 'A-Z'}
              {sortBy === 'created' && '↑'}
            </button>
            {showSortMenu && (
              <div className="sort-menu" onClick={(e) => e.stopPropagation()}>
                <button 
                  className={sortBy === 'modified' ? 'active' : ''}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSortBy('modified')
                    setShowSortMenu(false)
                  }}
                >
                  ↓ Recently Modified
                </button>
                <button 
                  className={sortBy === 'title' ? 'active' : ''}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSortBy('title')
                    setShowSortMenu(false)
                  }}
                >
                  A-Z Title
                </button>
                <button 
                  className={sortBy === 'created' ? 'active' : ''}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSortBy('created')
                    setShowSortMenu(false)
                  }}
                >
                  ↑ Oldest First
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="note-list">
          {filteredAndSortedNotes.length > 0 ? (
            <>
              {searchQuery && (
                <div className="search-results-info">
                  {filteredAndSortedNotes.length} {filteredAndSortedNotes.length === 1 ? 'note' : 'notes'} found
                </div>
              )}
              {selectedNotes.size > 1 && (
                <div className="selection-info">
                  {selectedNotes.size} notes selected
                </div>
              )}
              {filteredAndSortedNotes.map((note, index) => {
                const modifiedDate = new Date(note.modified)
                const isToday = modifiedDate.toDateString() === new Date().toDateString()
                const isThisWeek = (Date.now() - modifiedDate.getTime()) < 7 * 24 * 60 * 60 * 1000
                const isSelected = selectedNotes.has(note.id)
                const isActive = currentNote?.id === note.id
                
                const handleNoteClick = (e: React.MouseEvent) => {
                  if (e.shiftKey && lastClickedIndex !== null) {
                    // Range selection with Shift+Click
                    const startIndex = Math.min(lastClickedIndex, index)
                    const endIndex = Math.max(lastClickedIndex, index)
                    const newSelected = new Set(selectedNotes)
                    for (let i = startIndex; i <= endIndex; i++) {
                      newSelected.add(filteredAndSortedNotes[i].id)
                    }
                    setSelectedNotes(newSelected)
                    setCurrentNote(note)
                  } else if (e.metaKey || e.ctrlKey) {
                    // Toggle selection with Cmd/Ctrl+Click
                    const newSelected = new Set(selectedNotes)
                    if (newSelected.has(note.id)) {
                      newSelected.delete(note.id)
                    } else {
                      newSelected.add(note.id)
                    }
                    setSelectedNotes(newSelected)
                    setCurrentNote(note)
                    setLastClickedIndex(index)
                  } else {
                    // Single click - clear selection and select one
                    setCurrentNote(note)
                    setSelectedNotes(new Set([note.id]))
                    setLastClickedIndex(index)
                  }
                }
                
                return (
                  <div
                    key={note.id}
                    className={`note-item ${isActive ? 'active' : ''} ${isSelected ? 'selected' : ''}`}
                    onClick={handleNoteClick}
                    onContextMenu={(e) => handleContextMenu(e, note)}
                  >
                    <div className="note-item-header">
                      <div className="note-title">{note.title}</div>
                      <div className="note-date">
                        {isToday 
                          ? `Today ${modifiedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                          : isThisWeek
                          ? modifiedDate.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })
                          : modifiedDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: modifiedDate.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined })
                        }
                      </div>
                    </div>
                    <div className="note-preview">
                      {note.content.trim() 
                        ? (searchQuery 
                          ? highlightSearch(note.content.slice(0, 100), searchQuery)
                          : note.content.slice(0, 60) + (note.content.length > 60 ? '...' : ''))
                        : <span className="empty-note-preview">Empty note</span>
                      }
                    </div>
                  </div>
                )
              })}
            </>
          ) : (
            <div className="empty-state">
              {searchQuery ? `No notes found for "${searchQuery}"` : 'No notes yet'}
            </div>
          )}
        </div>
      </aside>

      <main className="editor">
        {currentNote ? (
          <>
            <div className="editor-header">
              <input
                type="text"
                value={currentNote.title}
                onChange={(e) => {
                  const newTitle = e.target.value
                  setCurrentNote({ ...currentNote, title: newTitle })
                }}
                onBlur={async (e) => {
                  const newTitle = e.target.value.trim()
                  const originalTitle = currentNote.id.replace('.md', '')
                  if (newTitle && newTitle !== originalTitle) {
                    await renameNote(currentNote, newTitle)
                  } else if (!newTitle) {
                    // Revert to original title if empty
                    setCurrentNote({ ...currentNote, title: originalTitle })
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.currentTarget.blur()
                  }
                }}
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
      
      {contextMenu && (
        <div
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={handleRenameFromContext}>Rename</button>
          <button onClick={handleDeleteFromContext} className="danger">Delete</button>
        </div>
      )}
    </div>
  )
}

export default App
