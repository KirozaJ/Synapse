import { useState, useMemo, useEffect, lazy, Suspense } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Routes, Route, useNavigate, useMatch } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Sidebar from './components/Sidebar'
// Lazy load large components for code splitting
const Editor = lazy(() => import('./components/Editor'))
const GraphView = lazy(() => import('./components/GraphView'))
import { db } from './db/db'
import './App.css'

function App() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light'
  })
  const navigate = useNavigate()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  // Determine active note based on URL
  const match = useMatch('/note/:id')
  const activeNoteId = match && match.params.id ? parseInt(match.params.id, 10) : null

  const allNotes = useLiveQuery(() => db.notes.orderBy('updatedAt').reverse().toArray()) ?? []

  const filteredNotes = useMemo(() => {
    let filtered = allNotes;

    // Filter by Tag
    if (selectedTag) {
      // Simple word boundary check for tag
      // Matches whitespace/start + tag + whitespace/end/non-word
      const regex = new RegExp(`(?:^|\\s)${selectedTag}(?!\\w)`, 'i');
      filtered = filtered.filter(n => n.content && regex.test(n.content));
    }

    // Filter by Search Query
    if (searchQuery) {
      const lower = searchQuery.toLowerCase()
      filtered = filtered.filter(n =>
        (n.title && n.title.toLowerCase().includes(lower)) ||
        (n.content && n.content.toLowerCase().includes(lower))
      )
    }

    return filtered;
  }, [allNotes, searchQuery, selectedTag])

  const handleAddNote = async () => {
    try {
      const id = await db.notes.add({
        title: '',
        content: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      navigate(`/note/${id}`)
      setSearchQuery('')
      setSelectedTag(null)
      // On mobile, close sidebar after adding note
      if (window.innerWidth <= 768) {
        setSidebarOpen(false);
      }
    } catch (error) {
      console.error('Failed to add note:', error)
    }
  }

  const handleDeleteNote = async (id: number) => {
    if (confirm('Are you sure you want to delete this note?')) {
      await db.notes.delete(id)
      if (activeNoteId === id) {
        navigate('/')
      }
    }
  }

  const handleNodeClick = (noteId: number) => {
    navigate(`/note/${noteId}`)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Sidebar
        notes={filteredNotes}
        allNotesForTags={allNotes}
        currentNoteId={activeNoteId}
        onAddNote={handleAddNote}
        onDeleteNote={handleDeleteNote}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedTag={selectedTag}
        onSelectTag={setSelectedTag}
        theme={theme}
        toggleTheme={toggleTheme}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {!match && (
          <button
            className="mobile-menu-btn"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
        )}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
          <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', width: '100%', color: 'var(--text-secondary)' }}>Loading...</div>}>
            <Routes>
              <Route path="/" element={<GraphView onNodeClick={handleNodeClick} notes={filteredNotes} theme={theme} />} />
              <Route path="/note/:id" element={<Editor />} />
            </Routes>
          </Suspense>
        </div>
      </div>
    </div>
  )
}

export default App
