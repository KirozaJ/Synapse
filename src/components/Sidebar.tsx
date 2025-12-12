import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { type Note } from '../db/db';
import { Plus, Trash2, FileText, Settings, Moon, Sun, Tag } from 'lucide-react';
import { getHighlight, getSnippet } from '../utils/searchUtils';
import { extractTags } from '../utils/tagUtils';
import SettingsModal from './SettingsModal';

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
    toggleTheme
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
        <div style={{
            width: '250px',
            minWidth: '250px',
            flexShrink: 0,
            borderRight: '1px solid var(--border)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--bg-secondary)'
        }}>
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h2
                        onClick={() => navigate('/')}
                        style={{ fontSize: '1.2rem', fontWeight: 'bold', cursor: 'pointer' }}
                        title="Go to Home"
                    >
                        Synapse
                    </h2>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button
                            onClick={toggleTheme}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--text-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
                        >
                            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                        </button>
                        <button
                            onClick={() => setIsSettingsOpen(true)}
                            style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--text-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            title="Settings"
                        >
                            <Settings size={18} />
                        </button>
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
                        }
                    }}
                    style={{
                        width: '100%',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        border: '1px solid var(--border)',
                        fontSize: '0.9rem',
                        backgroundColor: 'var(--bg-primary)',
                        color: 'var(--text-primary)'
                    }}
                />
            </div>

            <div style={{ padding: '0.5rem 1rem' }}>
                <button
                    onClick={onAddNote}
                    style={{
                        width: '100%',
                        padding: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        backgroundColor: 'var(--accent)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontWeight: 500
                    }}
                >
                    <Plus size={16} /> New Note
                </button>
            </div>

            {/* Tags Section */}
            {uniqueTags.length > 0 && (
                <div style={{ padding: '0 1rem 0.5rem', borderBottom: '1px solid var(--border)' }}>
                    <div
                        onClick={() => setIsTagsExpanded(!isTagsExpanded)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.8rem',
                            fontWeight: 'bold',
                            color: 'var(--text-secondary)',
                            marginBottom: '6px',
                            cursor: 'pointer',
                            userSelect: 'none'
                        }}
                    >
                        <Tag size={12} /> TAGS
                    </div>
                    {isTagsExpanded && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {uniqueTags.map(tag => (
                                <span
                                    key={tag}
                                    onClick={() => onSelectTag(selectedTag === tag ? null : tag)}
                                    style={{
                                        fontSize: '0.75rem',
                                        padding: '2px 6px',
                                        borderRadius: '12px',
                                        backgroundColor: selectedTag === tag ? 'var(--accent)' : 'var(--bg-primary)',
                                        color: selectedTag === tag ? 'white' : 'var(--text-secondary)',
                                        cursor: 'pointer',
                                        border: '1px solid var(--border)'
                                    }}
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div style={{ flex: 1, overflowY: 'auto' }}>
                {notes.map((note) => (
                    <div
                        key={note.id}
                        onClick={() => navigate(`/note/${note.id}`)}
                        className={`note-item ${currentNoteId === note.id ? 'active' : ''}`}
                        style={{
                            padding: '10px 1rem',
                            cursor: 'pointer',
                            borderBottom: '1px solid var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: currentNoteId === note.id ? 'var(--bg-primary)' : 'transparent'
                        }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <FileText size={16} style={{ marginRight: '8px', minWidth: '16px', color: 'var(--text-secondary)' }} />
                                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: note.title ? 'var(--text-primary)' : 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>
                                    {getHighlight(note.title || 'Untitled Note', searchQuery)}
                                </span>
                            </div>
                            {searchQuery && (
                                <div style={{ paddingLeft: '24px' }}>
                                    {getSnippet(note.content, searchQuery)}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDeleteNote(note.id); }}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, color: 'var(--text-secondary)' }}
                            className="delete-btn btn-icon"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
                {notes.length === 0 && (
                    <div style={{ padding: '1rem', color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.9rem' }}>
                        {searchQuery ? 'No matches' : selectedTag ? 'No notes with this tag' : 'No notes'}
                    </div>
                )}
            </div>
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
        </div>
    );
};

export default Sidebar;
