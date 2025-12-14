import React, { useState } from 'react';
import { db } from '../db/db';
import { useAuth } from '../context/AuthContext';
import { X, Trash2, AlertTriangle, Moon, Sun, User, Github, Monitor } from 'lucide-react';
import './SettingsModal.css';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    theme: 'light' | 'dark';
    toggleTheme: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, theme, toggleTheme }) => {
    const { user } = useAuth();
    const [status, setStatus] = useState<string>('');
    const [isConfirmingReset, setIsConfirmingReset] = useState(false);

    if (!isOpen) return null;

    const handleClearLocalData = async () => {
        try {
            await db.notes.clear();
            await db.files.clear();
            setStatus('Local database cleared.');
            setIsConfirmingReset(false);
        } catch (error) {
            setStatus('Failed to clear local database.');
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
                    {/* Account Section */}
                    <div className="settings-section">
                        <h3 className="settings-section-title">
                            <User size={18} /> Account
                        </h3>
                        <div className="settings-section-content">
                            <p className="settings-section-description">
                                Signed in as: <br />
                                <strong>{user?.email}</strong>
                            </p>
                        </div>
                    </div>

                    {/* Appearance Section */}
                    <div className="settings-section">
                        <h3 className="settings-section-title">
                            <Monitor size={18} /> Appearance
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <button
                                onClick={() => theme !== 'light' && toggleTheme()}
                                className={`settings-theme-card ${theme === 'light' ? 'active' : ''}`}
                            >
                                <Sun size={24} />
                                <span>Light</span>
                            </button>
                            <button
                                onClick={() => theme !== 'dark' && toggleTheme()}
                                className={`settings-theme-card ${theme === 'dark' ? 'active' : ''}`}
                            >
                                <Moon size={24} />
                                <span>Dark</span>
                            </button>
                        </div>
                    </div>

                    {/* About Section */}
                    <div className="settings-section">
                        <h3 className="settings-section-title">
                            <Github size={18} /> About
                        </h3>
                        <p className="settings-section-description">
                            Synapse v1.0.0 - A Cloud-Connected Personal Knowledge Graph.
                        </p>
                        <a
                            href="https://github.com/KirozaJ/Synapse"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="settings-link-btn"
                        >
                            View on GitHub
                        </a>
                    </div>

                    {/* Danger Zone */}
                    <div className="settings-danger-zone">
                        <h3 className="settings-danger-title">
                            <AlertTriangle size={18} /> Danger Zone
                        </h3>
                        <p className="settings-section-description" style={{ marginBottom: '1rem' }}>
                            Clear all data stored locally in your browser. This does <b>not</b> delete your cloud notes.
                        </p>
                        {isConfirmingReset ? (
                            <div className="settings-danger-actions">
                                <button
                                    onClick={handleClearLocalData}
                                    className="settings-danger-btn-confirm"
                                >
                                    Confirm Clear
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
                                <Trash2 size={16} /> Clear Local Data
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
