import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { type Note } from '../db/db';
import { Plus, Trash2, FileText, Settings, Moon, Sun, Tag, X } from 'lucide-react';
import { getHighlight, getSnippet } from '../utils/searchUtils';
import { extractTags } from '../utils/tagUtils';
import SettingsModal from './SettingsModal';
import './Sidebar.css';

interface SidebarProps {
    notes: Note[];
    allNotesForTags: Note[];
    currentNoteId: number | null;
    onAddNote: () => void;
    onDeleteNote: (id: number) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    selectedTag: string | null;
    onSelectTag: (tag: string | null) => void;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    isOpen?: boolean;
    onClose?: () => void;
    onLogout?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    notes,
    allNotesForTags,
    currentNoteId,
    onAddNote,
    onDeleteNote,
    searchQuery,
    onSearchChange,
    selectedTag,
    onSelectTag,
    theme,
    toggleTheme,
    isOpen = true,
    onClose,
    onLogout
}) => {
    const navigate = useNavigate();
    const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
    const [isTagsExpanded, setIsTagsExpanded] = React.useState(true);

    const uniqueTags = useMemo(() => {
        const tags = new Set<string>();
        allNotesForTags.forEach(note => {
            const extracted = extractTags(note.content);
            extracted.forEach(tag => tags.add(tag));
        });
        return Array.from(tags).sort();
    }, [allNotesForTags]);

    const searchInputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }
            if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
                e.preventDefault();
                onAddNote();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onAddNote]);

    return (
        <>
            {isOpen && window.innerWidth <= 768 && (
                <div className="sidebar-overlay" onClick={onClose} />
            )}
            <div className={`sidebar-container ${!isOpen ? 'closed' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-title-row">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {onClose && (
                                <button className="sidebar-close-btn" onClick={onClose}>
                                    <X size={20} />
                                </button>
                            )}
                            <h2
                                onClick={() => navigate('/')}
                                className="sidebar-title"
                                title="Go to Home"
                            >
                                Synapse
                            </h2>
                        </div>
                        <div className="sidebar-actions">
                            <button
                                onClick={toggleTheme}
                                className="btn-icon"
                                title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                            >
                                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                            </button>
                            <button
                                onClick={() => setIsSettingsOpen(true)}
                                className="btn-icon"
                                title="Settings"
                            >
                                <Settings size={18} />
                            </button>
                            {onLogout && (
                                <button
                                    onClick={onLogout}
                                    className="btn-icon"
                                    title="Sign Out"
                                    style={{ color: '#ef4444' }}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="18"
                                        height="18"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                        <polyline points="16 17 21 12 16 7" />
                                        <line x1="21" y1="12" x2="9" y2="12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>

                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search... (Ctrl + K)"
                        value={searchQuery}
                        onChange={(e) => onSearchChange(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && notes.length > 0) {
                                navigate(`/note/${notes[0].id}`);
                                if (window.innerWidth <= 768 && onClose) onClose();
                            }
                        }}
                        className="sidebar-search"
                    />
                </div>

                <div className="sidebar-new-note">
                    <button
                        onClick={() => {
                            onAddNote();
                            if (window.innerWidth <= 768 && onClose) onClose();
                        }}
                        className="new-note-btn"
                    >
                        <Plus size={16} /> New Note
                    </button>
                </div>

                {/* Tags Section */}
                {uniqueTags.length > 0 && (
                    <div className="tags-section">
                        <div
                            onClick={() => setIsTagsExpanded(!isTagsExpanded)}
                            className="tags-header"
                        >
                            <Tag size={12} /> TAGS
                        </div>
                        {isTagsExpanded && (
                            <div className="tags-list">
                                {uniqueTags.map(tag => (
                                    <span
                                        key={tag}
                                        onClick={() => {
                                            onSelectTag(selectedTag === tag ? null : tag);
                                            // Optional: close sidebar on tag selection? Maybe not.
                                        }}
                                        className={`tag-item ${selectedTag === tag ? 'active' : ''}`}
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="notes-list">
                    {notes.map((note) => (
                        <div
                            key={note.id}
                            onClick={() => {
                                navigate(`/note/${note.id}`);
                                if (window.innerWidth <= 768 && onClose) onClose();
                            }}
                            className={`note-item note-item-container ${currentNoteId === note.id ? 'active' : ''}`}
                        >
                            <div className="note-info">
                                <div className="note-title-row">
                                    <FileText size={16} className="note-icon" />
                                    <span className="note-title" style={{ color: note.title ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                                        {getHighlight(note.title || 'Untitled Note', searchQuery)}
                                    </span>
                                </div>
                                {searchQuery && (
                                    <div className="note-snippet">
                                        {getSnippet(note.content, searchQuery)}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); onDeleteNote(note.id); }}
                                className="delete-btn btn-icon"
                                style={{ background: 'none', border: 'none' }}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                    {notes.length === 0 && (
                        <div className="no-notes">
                            {searchQuery ? 'No matches' : selectedTag ? 'No notes with this tag' : 'No notes'}
                        </div>
                    )}
                </div>
                <SettingsModal
                    isOpen={isSettingsOpen}
                    onClose={() => setIsSettingsOpen(false)}
                    theme={theme}
                    toggleTheme={toggleTheme}
                />
            </div>
        </>
    );
};

export default Sidebar;
