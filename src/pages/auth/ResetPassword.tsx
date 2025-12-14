import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { Lock, ArrowLeft } from 'lucide-react';
import './Auth.css';

const ResetPassword: React.FC = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();
    const navigate = useNavigate();

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            showToast('Passwords do not match', 'error');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            showToast('Password updated successfully! Please log in.', 'success');
            setTimeout(() => {
                navigate('/auth');
            }, 1000);
        } catch (err: any) {
            showToast(err.message || 'Failed to update password', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card reset-password-card">
                <form className="auth-form" onSubmit={handleResetPassword}>
                    <div className="icon-container">
                        <Lock size={32} strokeWidth={1.5} />
                    </div>

                    <h1 className="auth-title">Reset Password</h1>
                    <p className="auth-subtitle">Enter your new password below.</p>

                    <div className="form-group">
                        <input
                            type="password"
                            placeholder="New Password"
                            className="form-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>

                    <div className="form-group">
                        <input
                            type="password"
                            placeholder="Confirm Password"
                            className="form-input"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>

                    <button className="auth-btn" disabled={loading}>
                        {loading ? 'Updating...' : 'Update Password'}
                    </button>

                    <div className="auth-toggle">
                        <button
                            type="button"
                            className="toggle-link back-link"
                            onClick={() => navigate('/auth')}
                        >
                            <ArrowLeft size={16} />
                            <span>Back to Login</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
