import { useState, useMemo, useEffect, lazy, Suspense } from 'react'
import { Routes, Route, useNavigate, useMatch, Navigate, Outlet, useOutletContext } from 'react-router-dom'
import { Menu } from 'lucide-react'
import Sidebar from './components/Sidebar'
// Lazy load large components for code splitting
const Editor = lazy(() => import('./components/Editor'))
const GraphView = lazy(() => import('./components/GraphView'))
import './App.css'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import AuthPage from './pages/auth/AuthPage'
import ResetPassword from './pages/auth/ResetPassword.tsx'
import { useNotes } from './hooks/useNotes'
import { noteService } from './services/NoteService'
import { type Note } from './types'

// Protected Route Wrapper
const ProtectedRoute = () => {
  const { session, loading } = useAuth();

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>Loading Session...</div>;
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
};

function MainLayout() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark') || 'light'
  })
  const navigate = useNavigate()

  const { signOut } = useAuth();
  // Use cloud notes
  const { notes: allNotes, refresh } = useNotes();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
  }

  const match = useMatch('/note/:id')
  const activeNoteId = match && match.params.id ? parseInt(match.params.id, 10) : null

  const filteredNotes = useMemo(() => {
    let filtered = allNotes;

    // Filter by Tag
    if (selectedTag) {
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
      const id = await noteService.createNote({
        title: '',
        content: ''
      });
      await refresh(); // Reload list
      navigate(`/note/${id}`)
      setSearchQuery('')
      setSelectedTag(null)
      if (window.innerWidth <= 768) {
        setSidebarOpen(false);
      }
    } catch (error) {
      console.error('Failed to add note:', error)
      alert("Failed to create note. Ensure you are logged in.");
    }
  }

  const handleDeleteNote = async (id: number) => {
    if (confirm('Are you sure you want to delete this note?')) {
      await noteService.deleteNote(id)
      await refresh();
      if (activeNoteId === id) {
        navigate('/')
      }
    }
  }

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
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
        onLogout={handleLogout}
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
            {/* Pass refresh function to context so Editor can call it on save */}
            <Outlet context={{ onNodeClick: handleNodeClick, notes: filteredNotes, theme, refreshNotes: refresh }} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<GraphViewWrapper />} />
              <Route path="/note/:id" element={<Editor />} />
            </Route>
          </Route>
        </Routes>
      </ToastProvider>
    </AuthProvider>
  )
}

const GraphViewWrapper = () => {
  const context = useContextOutlet();
  return <GraphView onNodeClick={context.onNodeClick} notes={context.notes} theme={context.theme} />;
}

export function useContextOutlet() {
  return useOutletContext<{
    onNodeClick: (id: number) => void,
    notes: Note[],
    theme: 'light' | 'dark',
    refreshNotes?: () => void
  }>();
}

export default App
