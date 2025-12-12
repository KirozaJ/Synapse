import React, { useRef, useState } from 'react';
import { db, type Note } from '../db/db';
import { Download, Upload, X, Trash2, AlertTriangle, Image } from 'lucide-react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [status, setStatus] = useState<string>('');
    const [isConfirmingReset, setIsConfirmingReset] = useState(false);

    if (!isOpen) return null;

    const handleExport = async () => {
        try {
            const allNotes = await db.notes.toArray();
            const jsonString = JSON.stringify(allNotes, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `synapse_backup_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);
            setStatus('Export successful!');
        } catch (error) {
            console.error('Export failed:', error);
            setStatus('Export failed.');
        }
    };

    const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = event.target?.result as string;
                const notes: Note[] = JSON.parse(json);

                if (!Array.isArray(notes)) {
                    throw new Error('Invalid backup file format');
                }

                // Simple validation
                if (notes.some(n => !n.title && !n.content)) {
                    // soft validation, maybe allow empty notes
                }

                await db.transaction('rw', db.notes, async () => {
                    await db.notes.clear();
                    await db.notes.bulkAdd(notes);
                });

                setStatus('Import successful! Database restored.');
                // Refresh logic usually handled by useLiveQuery automatically
            } catch (error) {
                console.error('Import failed:', error);
                setStatus('Import failed: Invalid file or data.');
            }
        };
        reader.readAsText(file);
    };

    const handleReset = async () => {
        try {
            await db.notes.clear();
            setStatus('Database cleared.');
            setIsConfirmingReset(false);
        } catch (error) {
            setStatus('Failed to clear database.');
        }
    };

    const handleCleanupImages = async () => {
        try {
            setStatus('Scanning...');
            const allNotes = await db.notes.toArray();
            const allFiles = await db.files.toArray(); // Get metadata first if possible, but toArray gets all
            // Ideally we'd map keys only, but Dexie toArray() fetches objects. 
            // For optimized: await db.files.toCollection().primaryKeys()

            const usedFileIds = new Set<number>();
            const regex = /synapse-img:\/\/(\d+)/g;

            allNotes.forEach(note => {
                let match;
                while ((match = regex.exec(note.content)) !== null) {
                    usedFileIds.add(parseInt(match[1], 10));
                }
            });

            const filesToDelete = allFiles.filter(f => !usedFileIds.has(f.id)).map(f => f.id);

            if (filesToDelete.length > 0) {
                await db.files.bulkDelete(filesToDelete);
                setStatus(`Cleanup complete! Deleted ${filesToDelete.length} unused images.`);
            } else {
                setStatus('No unused images found. Clean!');
            }

        } catch (error) {
            console.error('Cleanup failed:', error);
            setStatus('Cleanup failed.');
        }
    };

    return (
        <div className="modal-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div className="modal-content" style={{
                backgroundColor: 'var(--bg-primary)',
                padding: '2rem',
                borderRadius: '12px',
                width: '400px',
                maxWidth: '90%',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                border: '1px solid var(--border)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Settings</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                        <X size={24} />
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

                    {/* Export Section */}
                    <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
                        <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Download size={18} /> Export Data
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                            Download a JSON backup of all your notes.
                        </p>
                        <button
                            onClick={handleExport}
                            style={{
                                width: '100%',
                                padding: '8px',
                                backgroundColor: 'var(--bg-secondary)',
                                border: '1px solid var(--border)',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 500,
                                color: 'var(--text-primary)'
                            }}
                        >
                            Download Backup
                        </button>
                    </div>

                    {/* Import Section */}
                    <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px' }}>
                        <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Upload size={18} /> Import Data
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                            Restore notes from a JSON backup. <br />
                            <span style={{ color: '#ef4444' }}>Warning: This replaces all current notes.</span>
                        </p>
                        <input
                            type="file"
                            accept=".json"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleImport}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                width: '100%',
                                padding: '8px',
                                backgroundColor: 'var(--bg-secondary)',
                                border: '1px solid var(--border)',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 500,
                                color: 'var(--text-primary)'
                            }}
                        >
                            Select Backup File
                        </button>
                    </div>

                    {/* Danger Zone */}
                    <div style={{ padding: '1rem', border: '1px solid #ef4444', borderRadius: '8px', marginTop: '1rem' }}>
                        <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
                            <AlertTriangle size={18} /> Danger Zone
                        </h3>
                        {isConfirmingReset ? (
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={handleReset}
                                    style={{ flex: 1, padding: '8px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                                >
                                    Confirm Wipe
                                </button>
                                <button
                                    onClick={() => setIsConfirmingReset(false)}
                                    style={{ flex: 1, padding: '8px', backgroundColor: 'var(--bg-secondary)', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsConfirmingReset(true)}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid #ef4444',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    color: '#ef4444',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                <Trash2 size={16} /> Delete All Data
                            </button>
                        )}
                    </div>

                </div>

                {/* Maintenance Section */}
                <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px', marginTop: '1rem' }}>
                    <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Image size={18} /> Storage Maintenance
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                        Scan and delete images that are no longer used in any note.
                    </p>
                    <button
                        onClick={handleCleanupImages}
                        style={{
                            width: '100%',
                            padding: '8px',
                            backgroundColor: 'var(--bg-secondary)',
                            border: '1px solid var(--border)',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 500,
                            color: 'var(--text-primary)'
                        }}
                    >
                        Clean Up Unused Images
                    </button>
                </div>

                {status && (
                    <div style={{ marginTop: '1rem', padding: '0.5rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '4px', fontSize: '0.9rem', textAlign: 'center' }}>
                        {status}
                    </div>
                )}
            </div>
        </div>

    );
};

export default SettingsModal;
