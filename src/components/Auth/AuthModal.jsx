import { useState, useEffect } from 'react'
import { Modal } from 'antd'
import { useAuth } from '../../context/AuthContext'
import { useWallet } from '../../context/WalletContext'
import './AuthModal.css'

export default function AuthModal() {
    const {
        authModalOpen,
        authModalTab,
        closeAuthModal,
        openAuthModal,
        login,
        register,
        avatars
    } = useAuth()
    const { showToast } = useWallet()

    // Form state
    const [tab, setTab] = useState(authModalTab)
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [selectedAvatar, setSelectedAvatar] = useState('👑')
    const [agreeTerms, setAgreeTerms] = useState(true)
    const [showPassword, setShowPassword] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')
    const [loading, setLoading] = useState(false)

    // Sync tab when opened from external trigger
    useEffect(() => {
        if (authModalOpen) {
            setTab(authModalTab)
            setErrorMsg('')
        }
    }, [authModalOpen, authModalTab])

    const handleLoginSubmit = async (e) => {
        e.preventDefault()
        setErrorMsg('')
        setLoading(true)
        try {
            const user = await login(username, password)
            showToast('win', 'Welcome back!', `Logged in as ${user.username}`, 3000)
            resetForm()
        } catch (err) {
            setErrorMsg(err.message || 'Login failed. Please check your credentials.')
        } finally {
            setLoading(false)
        }
    }

    const handleRegisterSubmit = async (e) => {
        e.preventDefault()
        setErrorMsg('')

        if (password !== confirmPassword) {
            setErrorMsg('Passwords do not match.')
            return
        }
        if (!agreeTerms) {
            setErrorMsg('Please agree to the Terms of Service.')
            return
        }

        setLoading(true)
        try {
            const user = await register(username, email, password, selectedAvatar)
            showToast('win', 'Account Created!', `Welcome to Stake, ${user.username}!`, 3500)
            resetForm()
        } catch (err) {
            setErrorMsg(err.message || 'Registration failed.')
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setUsername('')
        setEmail('')
        setPassword('')
        setConfirmPassword('')
        setErrorMsg('')
    }

    return (
        <Modal
            open={authModalOpen}
            onCancel={closeAuthModal}
            footer={null}
            centered
            width={440}
            rootClassName="stake-auth-modal-root"
            closeIcon={
                <span className="auth-modal-close-btn" aria-label="Close">
                    ✕
                </span>
            }
        >
            <div className="auth-modal-content">
                {/* Header Logo */}
                <div className="auth-modal-header">
                    <div className="auth-logo-wrap">
                        <span className="auth-stake-logo">Stake</span>
                        <span className="auth-badge">ORIGINALS</span>
                    </div>
                    <p className="auth-subtitle">
                        {tab === 'login' ? 'Sign in to access your wallet and bets' : 'Create an account to start playing'}
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="auth-tabs">
                    <button
                        type="button"
                        className={`auth-tab-btn ${tab === 'login' ? 'active' : ''}`}
                        onClick={() => { setTab('login'); setErrorMsg(''); }}
                    >
                        Sign In
                    </button>
                    <button
                        type="button"
                        className={`auth-tab-btn ${tab === 'register' ? 'active' : ''}`}
                        onClick={() => { setTab('register'); setErrorMsg(''); }}
                    >
                        Register
                    </button>
                </div>

                {errorMsg && (
                    <div className="auth-error-banner" role="alert">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                        </svg>
                        <span>{errorMsg}</span>
                    </div>
                )}

                {tab === 'login' ? (
                    <form onSubmit={handleLoginSubmit} className="auth-form">
                        <div className="auth-form-group">
                            <label className="auth-label">Username or Email</label>
                            <div className="auth-input-wrapper">
                                <span className="auth-input-icon">
                                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                    </svg>
                                </span>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. CryptoWhale"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="auth-input"
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        <div className="auth-form-group">
                            <div className="auth-label-row">
                                <label className="auth-label">Password</label>
                                <button
                                    type="button"
                                    className="auth-ghost-link"
                                    onClick={() => setErrorMsg('Demo hint: Any password works for demo login')}
                                >
                                    Forgot password?
                                </button>
                            </div>
                            <div className="auth-input-wrapper">
                                <span className="auth-input-icon">
                                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                                    </svg>
                                </span>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="auth-input"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    className="auth-toggle-pwd"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? '👁' : '👁‍🗨'}
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="auth-submit-btn">
                            {loading ? 'Signing in…' : 'Sign In'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleRegisterSubmit} className="auth-form">
                        <div className="auth-form-group">
                            <label className="auth-label">Choose Avatar</label>
                            <div className="auth-avatar-picker">
                                {avatars.map(av => (
                                    <button
                                        key={av}
                                        type="button"
                                        className={`auth-avatar-choice ${selectedAvatar === av ? 'selected' : ''}`}
                                        onClick={() => setSelectedAvatar(av)}
                                    >
                                        {av}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="auth-form-group">
                            <label className="auth-label">Username</label>
                            <div className="auth-input-wrapper">
                                <span className="auth-input-icon">👤</span>
                                <input
                                    type="text"
                                    required
                                    placeholder="Choose username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="auth-input"
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        <div className="auth-form-group">
                            <label className="auth-label">Email</label>
                            <div className="auth-input-wrapper">
                                <span className="auth-input-icon">✉</span>
                                <input
                                    type="email"
                                    required
                                    placeholder="name@domain.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="auth-input"
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div className="auth-form-group">
                            <label className="auth-label">Password (min 6 characters)</label>
                            <div className="auth-input-wrapper">
                                <span className="auth-input-icon">🔒</span>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    placeholder="Create password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="auth-input"
                                    autoComplete="new-password"
                                />
                            </div>
                        </div>

                        <div className="auth-form-group">
                            <label className="auth-label">Confirm Password</label>
                            <div className="auth-input-wrapper">
                                <span className="auth-input-icon">🔒</span>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    placeholder="Confirm password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="auth-input"
                                    autoComplete="new-password"
                                />
                            </div>
                        </div>

                        <label className="auth-checkbox-label">
                            <input
                                type="checkbox"
                                checked={agreeTerms}
                                onChange={(e) => setAgreeTerms(e.target.checked)}
                            />
                            <span>I confirm that I am at least 18 years old and agree to the virtual play terms.</span>
                        </label>

                        <button type="submit" disabled={loading} className="auth-submit-btn">
                            {loading ? 'Creating Account…' : 'Play Now — Register'}
                        </button>
                    </form>
                )}


            </div>
        </Modal>
    )
}
