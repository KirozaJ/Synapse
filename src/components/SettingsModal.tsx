import React, { useRef, useState } from 'react';
import { db, type Note } from '../db/db';
import { Download, Upload, X, Trash2, AlertTriangle, Image } from 'lucide-react';
import './SettingsModal.css';

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
        <div className="settings-modal-overlay">
            <div className="settings-modal-content">
                <div className="settings-header">
                    <h2 className="settings-title">Settings</h2>
                    <button onClick={onClose} className="settings-close-btn">
                        <X size={24} />
                    </button>
                </div>

                <div className="settings-body">
                    {/* Export Section */}
                    <div className="settings-section">
                        <h3 className="settings-section-title">
                            <Download size={18} /> Export Data
                        </h3>
                        <p className="settings-section-description">
                            Download a JSON backup of all your notes.
                        </p>
                        <button
                            onClick={handleExport}
                            className="settings-action-btn"
                        >
                            Download Backup
                        </button>
                    </div>

                    {/* Import Section */}
                    <div className="settings-section">
                        <h3 className="settings-section-title">
                            <Upload size={18} /> Import Data
                        </h3>
                        <p className="settings-section-description">
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
                            className="settings-action-btn"
                        >
                            Select Backup File
                        </button>
                    </div>

                    {/* Maintenance Section */}
                    <div className="settings-section">
                        <h3 className="settings-section-title">
                            <Image size={18} /> Storage Maintenance
                        </h3>
                        <p className="settings-section-description">
                            Scan and delete images that are no longer used in any note.
                        </p>
                        <button
                            onClick={handleCleanupImages}
                            className="settings-action-btn"
                        >
                            Clean Up Unused Images
                        </button>
                    </div>

                    {/* Danger Zone */}
                    <div className="settings-danger-zone">
                        <h3 className="settings-danger-title">
                            <AlertTriangle size={18} /> Danger Zone
                        </h3>
                        {isConfirmingReset ? (
                            <div className="settings-danger-actions">
                                <button
                                    onClick={handleReset}
                                    className="settings-danger-btn-confirm"
                                >
                                    Confirm Wipe
                                </button>
                                <button
                                    onClick={() => setIsConfirmingReset(false)}
                                    className="settings-danger-btn-cancel"
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsConfirmingReset(true)}
                                className="settings-danger-btn-init"
                            >
                                <Trash2 size={16} /> Delete All Data
                            </button>
                        )}
                    </div>
                </div>

                {status && (
                    <div className="settings-status">
                        {status}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SettingsModal;
