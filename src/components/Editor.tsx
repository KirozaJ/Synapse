import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Note } from '../types';
import { noteService } from '../services/NoteService';
import { ArrowLeft, Eye, Edit3, Columns } from 'lucide-react';
import getCaretCoordinates from 'textarea-caret';
import { visit } from 'unist-util-visit';
import './Editor.css';
import { useContextOutlet } from '../App';

// Plugin to add source position to elements
function rehypeAddLineNumber() {
    return (tree: any) => {
        visit(tree, 'element', (node: any) => {
            if (node.position && node.position.start) {
                if (!node.properties) node.properties = {};
                node.properties['data-line'] = node.position.start.line;
            }
        });
    };
}

const Editor: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const noteId = id ? parseInt(id, 10) : null;
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const titleInputRef = useRef<HTMLInputElement>(null);
    const lastFocusKeyRef = useRef<string>('');

    // Access global notes and refresh function from App layout
    const { notes: allNotes, refreshNotes } = useContextOutlet();

    // Derived state for current note
    const note = allNotes.find(n => n.id === noteId);

    const [title, setTitle] = useState('');
    const [originalTitle, setOriginalTitle] = useState('');
    const [content, setContent] = useState('');
    const [mode, setMode] = useState<'write' | 'preview' | 'split'>('write');

    // Refs for debouncing saves
    const contentSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const titleSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastNoteIdRef = useRef<number | null>(null);

    // Autocomplete State
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestionQuery, setSuggestionQuery] = useState('');
    const [suggestionIndex, setSuggestionIndex] = useState(0);
    const [caretCoords, setCaretCoords] = useState({ top: 0, left: 0 });

    // Update local state when note loads
    useEffect(() => {
        if (note) {
            // Only update local state if the note ID has changed
            // This prevents overwriting unsaved local changes when the parent list updates
            // or when switching modes.
            if (lastNoteIdRef.current !== note.id) {
                setTitle(note.title);
                setOriginalTitle(note.title);
                setContent(note.content);
                lastNoteIdRef.current = note.id;

                // Smart Auto-focus logic only when switching notes
                if (mode === 'write') {
                    const focusKey = `${note.id}-${mode}`;
                    if (lastFocusKeyRef.current !== focusKey) {
                        lastFocusKeyRef.current = focusKey;
                        setTimeout(() => {
                            if (!note.title.trim()) {
                                titleInputRef.current?.focus();
                            } else {
                                if (textareaRef.current) {
                                    const len = textareaRef.current.value.length;
                                    textareaRef.current.focus();
                                    textareaRef.current.setSelectionRange(len, len);
                                }
                            }
                        }, 0);
                    }
                }
            }
        }
    }, [note, noteId, mode]); // Mode is still needed for auto-focus logic, but guarded by ID check

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = e.target.value;
        setTitle(newTitle);

        if (noteId) {
            if (titleSaveTimeoutRef.current) clearTimeout(titleSaveTimeoutRef.current);

            titleSaveTimeoutRef.current = setTimeout(async () => {
                try {
                    await noteService.updateNote(noteId, { title: newTitle });
                    if (refreshNotes) refreshNotes();
                } catch (err) {
                    console.error('Failed to save title:', err);
                }
            }, 1000); // 1 second debounce
        }
    };

    const handleTitleBlur = async () => {
        // Force immediate save on blur if pending
        if (titleSaveTimeoutRef.current) clearTimeout(titleSaveTimeoutRef.current);

        if (noteId && title !== originalTitle && originalTitle.trim() !== '') {
            // Title changed! We need to refactor links.
            const oldLink = `[[${originalTitle}]]`;
            const newLink = `[[${title}]]`;

            const notesToUpdate = allNotes.filter(n => n.content.includes(oldLink));

            if (notesToUpdate.length > 0) {
                for (const n of notesToUpdate) {
                    await noteService.updateNote(n.id, {
                        content: n.content.replaceAll(oldLink, newLink)
                    });
                }
                console.log(`Refactored ${notesToUpdate.length} links from "${originalTitle}" to "${title}"`);
                if (refreshNotes) refreshNotes();
            }
            // Ensure title is saved
            await noteService.updateNote(noteId, { title: title });
            setOriginalTitle(title);
        } else if (noteId && title !== note?.title) {
            await noteService.updateNote(noteId, { title: title });
            if (refreshNotes) refreshNotes();
        }
    };

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newContent = e.target.value;
        setContent(newContent);

        // Autocomplete Logic
        const cursorPosition = e.target.selectionStart;
        const textBeforeCursor = newContent.slice(0, cursorPosition);
        const match = textBeforeCursor.match(/\[\[([^\]]*)$/);

        if (match) {
            const query = match[1];
            setSuggestionQuery(query);
            setShowSuggestions(true);
            setSuggestionIndex(0);

            if (textareaRef.current) {
                const coords = getCaretCoordinates(textareaRef.current, cursorPosition);
                setCaretCoords({ top: coords.top + 20, left: coords.left });
            }
        } else {
            setShowSuggestions(false);
        }

        if (noteId) {
            if (contentSaveTimeoutRef.current) clearTimeout(contentSaveTimeoutRef.current);

            contentSaveTimeoutRef.current = setTimeout(async () => {
                try {
                    await noteService.updateNote(noteId, { content: newContent });
                    // Only refresh if really needed, mostly we don't need to refresh list on content change
                    // unless we show preview in sidebar which we do.
                    // But we can be less aggressive.
                } catch (err) {
                    console.error('Failed to save content:', err);
                }
            }, 1000); // 1 second debounce
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (!showSuggestions) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSuggestionIndex(prev => (prev + 1) % filteredSuggestions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSuggestionIndex(prev => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length);
        } else if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            if (filteredSuggestions[suggestionIndex]) {
                insertLink(filteredSuggestions[suggestionIndex]);
            }
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    };

    const insertLink = (selectedNote: Note) => {
        const cursorPosition = textareaRef.current?.selectionStart || 0;
        const textBeforeCursor = content.slice(0, cursorPosition);
        const textAfterCursor = content.slice(cursorPosition);
        const match = textBeforeCursor.match(/\[\[([^\]]*)$/);

        if (match && match.index !== undefined) {
            const startPos = match.index;
            const newText =
                content.slice(0, startPos) +
                `[[${selectedNote.title}]]` +
                textAfterCursor;

            setContent(newText);
            setShowSuggestions(false);

            setTimeout(async () => {
                if (textareaRef.current) {
                    const newCursorPos = startPos + selectedNote.title.length + 4;
                    textareaRef.current.focus();
                    textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
                }
                if (noteId) {
                    await noteService.updateNote(noteId, { content: newText });
                    if (refreshNotes) refreshNotes();
                }
            }, 0);
        }
    };

    // Placeholder for Image Processing
    const processFiles = async (_files: FileList | File[]) => {
        alert("Image upload is currently disabled during the cloud migration. This feature will return in a future update.");
    };

    const handleDrop = async (e: React.DragEvent<HTMLTextAreaElement>) => {
        e.preventDefault();
        await processFiles(e.dataTransfer.files);
    };

    const handleDragOver = (e: React.DragEvent<HTMLTextAreaElement>) => {
        e.preventDefault();
    };

    const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        if (e.clipboardData.files.length > 0) {
            e.preventDefault();
            await processFiles(e.clipboardData.files);
        }
    };

    const backlinks = React.useMemo(() => {
        if (!note || !allNotes) return [];
        return allNotes.filter(n => {
            if (n.id === note.id) return false;
            const pattern = `[[${note.title}]]`;
            return n.content.includes(pattern);
        });
    }, [note, allNotes]);

    const filteredSuggestions = (allNotes || []).filter(n =>
        n.title.toLowerCase().includes(suggestionQuery.toLowerCase()) &&
        n.id !== noteId
    );

    const toggleCheckbox = async (lineIndex: number) => {
        const lines = content.split('\n');
        if (lines[lineIndex] !== undefined) {
            const line = lines[lineIndex];
            const newLine = line.includes('[ ]')
                ? line.replace('[ ]', '[x]')
                : line.replace('[x]', '[ ]');

            if (newLine !== line) {
                lines[lineIndex] = newLine;
                const newContent = lines.join('\n');
                setContent(newContent);
                if (noteId) {
                    await noteService.updateNote(noteId, { content: newContent });
                    // refreshNotes? checks state, maybe not needed immediately.
                }
            }
        }
    };

    const MarkdownComponents = {
        code(props: any) {
            const { children, className, node, ...rest } = props;
            const match = /language-(\w+)/.exec(className || '');
            return match ? (
                <SyntaxHighlighter
                    {...rest}
                    PreTag="div"
                    children={String(children).replace(/\n$/, '')}
                    language={match[1]}
                    style={vscDarkPlus}
                    customStyle={{ margin: 0, borderRadius: '6px', fontSize: '0.9rem' }}
                />
            ) : (
                <code {...rest} className={className}>
                    {children}
                </code>
            );
        },
        input(props: any) {
            if (props.type === 'checkbox' && props['data-line']) {
                const isChecked = props.checked || false;
                return (
                    <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleCheckbox(props['data-line'] - 1)}
                        style={{ cursor: 'pointer', marginRight: '0.5rem' }}
                    />
                );
            }
            return <input {...props} />;
        },
        img(props: any) {
            // Disable custom image rendering for now
            const { src, alt, ...rest } = props;
            return <img src={src} alt={alt} {...rest} style={{ maxWidth: '100%', borderRadius: '8px' }} />;
        }
    };

    if (!noteId) {
        return <div style={{ padding: '2rem' }}>Note not found</div>;
    }

    // If not found in loaded notes
    if (!note) {
        return <div style={{ flex: 1, padding: '2rem' }}>Loading or Note Not Found...</div>;
    }

    const isSplit = mode === 'split';

    return (
        <div className="editor-container">
            <div className="editor-header">
                <div className="back-btn-container">
                    <button
                        onClick={() => navigate('/')}
                        className="back-btn"
                        title="Back to Home"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    {note && (
                        <div className="editor-meta">
                            Last updated: {new Date(note.updatedAt).toLocaleString()}
                        </div>
                    )}
                </div>

                <div className="mode-toggles">
                    <button
                        onClick={() => setMode('write')}
                        className={`mode-btn ${mode === 'write' ? 'active' : ''}`}
                    >
                        <Edit3 size={16} /> <span className="mode-text">Write</span>
                    </button>
                    <button
                        onClick={() => setMode('split')}
                        className={`mode-btn ${mode === 'split' ? 'active' : ''}`}
                    >
                        <Columns size={16} /> <span className="mode-text">Split</span>
                    </button>
                    <button
                        onClick={() => setMode('preview')}
                        className={`mode-btn ${mode === 'preview' ? 'active' : ''}`}
                    >
                        <Eye size={16} /> <span className="mode-text">Preview</span>
                    </button>
                </div>
            </div>

            <input
                ref={titleInputRef}
                type="text"
                value={title}
                onChange={handleTitleChange}
                onBlur={handleTitleBlur}
                placeholder="Note Title"
                readOnly={mode === 'preview'}
                className="editor-title-input"
            />

            <div className={`editor-content-area ${isSplit ? 'locked-scroll' : ''}`}>
                <div className={`editor-workspace ${isSplit ? 'full-height' : ''}`}>
                    {(mode === 'write' || mode === 'split') && (
                        <div className={`editor-pane ${isSplit ? 'split-scroll-pane' : ''}`}>
                            <textarea
                                ref={textareaRef}
                                value={content}
                                onChange={handleContentChange}
                                onKeyDown={handleKeyDown}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onPaste={handlePaste}
                                placeholder="Start writing using Markdown..."
                                className="editor-textarea"
                            />
                            {showSuggestions && (
                                <div className="suggestion-box" style={{
                                    top: caretCoords.top,
                                    left: caretCoords.left,
                                }}>
                                    {filteredSuggestions.length > 0 ? (
                                        filteredSuggestions.map((s, i) => (
                                            <div
                                                key={s.id}
                                                onClick={() => insertLink(s)}
                                                className={`suggestion-item ${i === suggestionIndex ? 'active' : ''}`}
                                                onMouseEnter={() => setSuggestionIndex(i)}
                                            >
                                                {s.title || 'Untitled'}
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>No matches</div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {mode === 'split' && <div className="split-divider"></div>}

                    {(mode === 'preview' || mode === 'split') && (
                        <div className={`markdown-preview editor-pane ${isSplit ? 'split-scroll-pane' : ''}`}>
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                rehypePlugins={[rehypeAddLineNumber]}
                                components={MarkdownComponents}
                                urlTransform={(url) => url}
                            >
                                {content}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>

                {backlinks.length > 0 && (
                    <div className="linked-refs">
                        <h3 className="linked-refs-title">Linked References</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {backlinks.map(bn => (
                                <div
                                    key={bn.id}
                                    onClick={() => navigate(`/note/${bn.id}`)}
                                    className="ref-item"
                                >
                                    <div className="ref-item-title">{bn.title || 'Untitled Note'}</div>
                                    <div className="ref-item-snippet">
                                        {bn.content}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Editor;
