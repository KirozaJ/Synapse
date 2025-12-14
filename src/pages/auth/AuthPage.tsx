import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import './Auth.css';

const GoogleLogo = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
);

const AuthPage: React.FC = () => {
    const [isRightPanelActive, setIsRightPanelActive] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { showToast } = useToast();

    // Theme Logic
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        return (localStorage.getItem('theme') as 'light' | 'dark') || 'light';
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });
            if (error) throw error;
        } catch (err: any) {
            showToast(err.message || 'Failed to sign in with Google', 'error');
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
            showToast('Welcome back!', 'success');
            navigate('/');
        } catch (err: any) {
            showToast(err.message || 'Failed to sign in', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                    }
                }
            });
            if (error) throw error;
            showToast('Registration successful! Please check your email.', 'success');
            setIsRightPanelActive(false); // Slide back to login
        } catch (err: any) {
            showToast(err.message || 'Failed to sign up', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            showToast('Please enter your email address first.', 'info');
            return;
        }
        setLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin + '/reset-password',
            });
            if (error) throw error;
            showToast('Password reset email sent! Check your inbox.', 'success');
        } catch (err: any) {
            showToast(err.message || 'Failed to send reset email', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            {/* Theme Toggle */}
            <button
                className="theme-toggle-btn"
                onClick={toggleTheme}
                aria-label="Toggle Theme"
            >
                {theme === 'light' ? <Moon size={24} /> : <Sun size={24} />}
            </button>

            <div className={`auth-card ${isRightPanelActive ? 'right-panel-active' : ''}`}>

                {/* Sign Up Form Container */}
                <div className="form-container sign-up-container">
                    <form className="auth-form" onSubmit={handleSignup}>
                        <h1 className="auth-title">Create Account</h1>
                        <div className="social-container">
                            <button
                                type="button"
                                className="social google-btn"
                                onClick={handleGoogleLogin}
                                title="Sign up with Google"
                            >
                                <GoogleLogo />
                            </button>
                        </div>
                        <span className="auth-subtitle">or use your email for registration</span>

                        <input
                            type="text"
                            placeholder="Name"
                            className="form-input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <input
                            type="email"
                            placeholder="Email"
                            className="form-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            className="form-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button className="auth-btn" disabled={loading}>
                            {loading ? 'Signing Up...' : 'Sign Up'}
                        </button>

                        {/* Mobile Toggle */}
                        <div className="mobile-toggle" onClick={() => { setIsRightPanelActive(false); }}>
                            Already have an account? Sign In
                        </div>
                    </form>
                </div>

                {/* Sign In Form Container */}
                <div className="form-container sign-in-container">
                    <form className="auth-form" onSubmit={handleLogin}>
                        <h1 className="auth-title">Sign in</h1>
                        <div className="social-container">
                            <button
                                type="button"
                                className="social google-btn"
                                onClick={handleGoogleLogin}
                                title="Sign in with Google"
                            >
                                <GoogleLogo />
                            </button>
                        </div>
                        <span className="auth-subtitle">or use your account</span>

                        <input
                            type="email"
                            placeholder="Email"
                            className="form-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <input
                            type="password"
                            placeholder="Password"
                            className="form-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button type="button" className="forgot-password" onClick={handleForgotPassword}>
                            Forgot your password?
                        </button>
                        <button className="auth-btn" disabled={loading}>
                            {loading ? 'Signing In...' : 'Sign In'}
                        </button>

                        {/* Mobile Toggle */}
                        <div className="mobile-toggle" onClick={() => { setIsRightPanelActive(true); }}>
                            Don't have an account? Sign Up
                        </div>
                    </form>
                </div>

                {/* Overlay Container */}
                <div className="overlay-container">
                    <div className="overlay">
                        <div className="overlay-panel overlay-left">
                            <h1 className="auth-title">Welcome Back!</h1>
                            <p className="auth-subtitle">To keep connected with us please login with your personal info</p>
                            <button
                                className="auth-btn ghost"
                                id="signIn"
                                onClick={() => { setIsRightPanelActive(false); }}
                            >
                                Sign In
                            </button>
                        </div>
                        <div className="overlay-panel overlay-right">
                            <h1 className="auth-title">Hello, Friend!</h1>
                            <p className="auth-subtitle">Enter your personal details and start journey with us</p>
                            <button
                                className="auth-btn ghost"
                                id="signUp"
                                onClick={() => { setIsRightPanelActive(true); }}
                            >
                                Sign Up
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AuthPage;
