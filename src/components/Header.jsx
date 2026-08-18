import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { useThemeSettings } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import AuthModal from './Auth/AuthModal'
import { isGamePath } from '../games'

// Reusable INR currency icon component
const InrIcon = ({ size = 20, fontSize = 12 }) => (
    <div style={{
        width: size,
        height: size,
        minWidth: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #10b981, #059669)',
        color: '#fff',
        fontWeight: 800,
        fontSize: fontSize,
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
        lineHeight: 1,
    }}>₹</div>
)

function Header({ menuOpen, menuButtonRef, onMenuClick }) {
    const location = useLocation()
    const { balance, deposit, resetBalance, transactions, toasts } = useWallet()
    const { paletteId, palettes, setPaletteId } = useThemeSettings()
    const { user, isLoggedIn, openAuthModal, logout } = useAuth()
    
    const [showWalletDropdown, setShowWalletDropdown] = useState(false)
    const [showProfileDropdown, setShowProfileDropdown] = useState(false)
    const [depositAmount, setDepositAmount] = useState('')
    const dropdownRef = useRef(null)
    const profileDropdownRef = useRef(null)

    const isGamePage = isGamePath(location.pathname)
    const isHomePage = location.pathname === '/'

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowWalletDropdown(false)
            }
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
                setShowProfileDropdown(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleDeposit = () => {
        const amt = parseFloat(depositAmount)
        if (!isNaN(amt) && amt > 0) {
            deposit(amt)
            setDepositAmount('')
        }
    }

    const formattedBalance = balance.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })

    return (
        <header className={`header ${isHomePage ? 'header-home' : ''}`}>
            <AuthModal />

            <div className="header-left">
                <Link to="/" className="logo-link">
                    <span className="logo" style={{ color: 'var(--text-primary)' }}>EzBet</span>
                </Link>
            </div>

            <div className="header-center">
                <div className="header-wallet">
                    {isLoggedIn && (
                        <>
                            <button
                                type="button"
                                className="mobile-wallet-balance"
                                aria-label={`Open wallet, balance ${formattedBalance}`}
                                aria-expanded={showWalletDropdown}
                                onClick={() => setShowWalletDropdown(!showWalletDropdown)}
                            >
                                <InrIcon size={18} fontSize={11} />
                                <span>₹{formattedBalance}</span>
                            </button>
                            <div className="wallet-balance-display">
                                <InrIcon size={18} fontSize={11} />
                                <span className="wallet-balance-amount">₹{formattedBalance}</span>
                                <button
                                    className="wallet-dropdown-toggle"
                                    onClick={() => setShowWalletDropdown(!showWalletDropdown)}
                                >
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                                        <path d="M7 10l5 5 5-5z" />
                                    </svg>
                                </button>
                            </div>
                            <button className="wallet-btn" onClick={() => setShowWalletDropdown(!showWalletDropdown)}>
                                Wallet
                            </button>
                        </>
                    )}

                    {/* Wallet Dropdown */}
                    {showWalletDropdown && (
                        <div className="wallet-dropdown" ref={dropdownRef}>
                            <div className="wallet-dropdown-header">
                                <h4>Wallet</h4>
                                <button className="wallet-close-btn" onClick={() => setShowWalletDropdown(false)}>
                                    ✕
                                </button>
                            </div>

                            <div className="wallet-balance-section">
                                <div className="wallet-balance-label">Total Balance</div>
                                <div className="wallet-balance-big">
                                    <InrIcon size={28} fontSize={16} />
                                    ₹{formattedBalance}
                                </div>
                            </div>

                            <div className="wallet-actions">
                                <div className="wallet-deposit-row">
                                    <input
                                        type="number"
                                        value={depositAmount}
                                        onChange={(e) => setDepositAmount(e.target.value)}
                                        placeholder="Enter amount in ₹..."
                                        className="wallet-deposit-input"
                                        min="0"
                                        step="1"
                                    />
                                    <button className="wallet-deposit-btn" onClick={handleDeposit}>
                                        Deposit
                                    </button>
                                </div>
                                <div className="wallet-quick-amounts">
                                    {[100, 500, 1000, 5000].map(amt => (
                                        <button key={amt} className="wallet-quick-btn" onClick={() => deposit(amt)}>
                                            +₹{amt}
                                        </button>
                                    ))}
                                </div>
                                <button className="wallet-reset-btn" onClick={resetBalance}>
                                    Reset to ₹1,000.00
                                </button>
                            </div>

                            {/* Recent Transactions */}
                            <div className="wallet-transactions">
                                <h5>Recent Activity</h5>
                                {transactions.length === 0 ? (
                                    <div className="wallet-no-tx">No transactions yet</div>
                                ) : (
                                    <div className="wallet-tx-list">
                                        {transactions.slice(0, 8).map(tx => (
                                            <div key={tx.id} className={`wallet-tx-item ${tx.type}`}>
                                                <div className="wallet-tx-info">
                                                    <span className="wallet-tx-type">
                                                        {tx.type === 'bet' && '🎲 Bet'}
                                                        {tx.type === 'win' && '🏆 Win'}
                                                        {tx.type === 'deposit' && '💰 Deposit'}
                                                        {tx.type === 'reset' && '🔄 Reset'}
                                                    </span>
                                                    <span className="wallet-tx-time">
                                                        {tx.timestamp.toLocaleTimeString()}
                                                    </span>
                                                </div>
                                                <span className={`wallet-tx-amount ${tx.amount >= 0 ? 'positive' : 'negative'}`}>
                                                    {tx.amount >= 0 ? '+' : ''}₹{Math.abs(tx.amount).toFixed(2)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Game Toasts — below wallet */}
                    {isGamePage && toasts.length > 0 && (
                        <div className="wallet-toast-container">
                            {toasts.map(toast => (
                                <div key={toast.id} className={`wallet-toast wallet-toast-${toast.type}`}>
                                    <div className="wallet-toast-icon">
                                        {toast.type === 'bet' && (
                                            <InrIcon size={20} fontSize={11} />
                                        )}
                                        {toast.type === 'win' && (
                                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        )}
                                        {toast.type === 'loss' && (
                                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ed4245" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <line x1="18" y1="6" x2="6" y2="18" />
                                                <line x1="6" y1="6" x2="18" y2="18" />
                                            </svg>
                                        )}
                                        {toast.type === 'error' && (
                                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#f7931a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="10" />
                                                <line x1="12" y1="8" x2="12" y2="12" />
                                                <line x1="12" y1="16" x2="12.01" y2="16" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="wallet-toast-content">
                                        <span className="wallet-toast-title">{toast.title}</span>
                                        <span className="wallet-toast-desc">{toast.description}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                {!isGamePage && null}
            </div>

            <div className="header-right">
                <label className="palette-select-label">
                    <span className="palette-select-text">Palette</span>
                    <select
                        className="palette-select"
                        value={paletteId}
                        onChange={(event) => setPaletteId(event.target.value)}
                        aria-label="Color palette"
                    >
                        {palettes.map((palette) => (
                            <option key={palette.id} value={palette.id}>{palette.name}</option>
                        ))}
                    </select>
                </label>

                {isLoggedIn ? (
                    <div className="user-profile-nav" ref={profileDropdownRef} style={{ position: 'relative' }}>
                        <button
                            type="button"
                            className="user-profile-badge-btn"
                            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                            aria-label="User profile menu"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: '#1a2c38',
                                border: '1px solid #2f4553',
                                borderRadius: '24px',
                                padding: '4px 12px 4px 6px',
                                color: '#fff',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            <span style={{ fontSize: '18px', width: '28px', height: '28px', borderRadius: '50%', background: '#2f4553', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {user.avatar || '👑'}
                            </span>
                            <span style={{ fontSize: '13px', fontWeight: '700' }}>
                                {user.username}
                            </span>
                            <span style={{
                                fontSize: '10px',
                                fontWeight: '800',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: user.vipTier === 'Gold' ? 'rgba(255, 193, 7, 0.2)' : 'rgba(0, 231, 1, 0.2)',
                                color: user.vipTier === 'Gold' ? '#ffc107' : '#00e701',
                                textTransform: 'uppercase'
                            }}>
                                {user.vipTier || 'VIP'}
                            </span>
                        </button>

                        {/* Profile Dropdown */}
                        {showProfileDropdown && (
                            <div className="profile-dropdown-menu" style={{
                                position: 'absolute',
                                top: 'calc(100% + 8px)',
                                right: 0,
                                width: '240px',
                                background: '#0f212e',
                                border: '1px solid #2f4553',
                                borderRadius: '12px',
                                boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
                                zIndex: 1000,
                                padding: '12px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px'
                            }}>
                                <div style={{ padding: '8px', borderBottom: '1px solid #2f4553', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '24px' }}>{user.avatar || '👑'}</span>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: '700', fontSize: '14px', color: '#fff' }}>{user.username}</span>
                                        <span style={{ fontSize: '11px', color: '#8c9cb0' }}>{user.email || 'Verified player'}</span>
                                    </div>
                                </div>

                                <Link
                                    to="/my-bets"
                                    onClick={() => setShowProfileDropdown(false)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '9px 12px',
                                        borderRadius: '6px',
                                        color: '#fff',
                                        textDecoration: 'none',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        background: 'rgba(47, 69, 83, 0.4)'
                                    }}
                                >
                                    <span>🎲</span>
                                    <span>My Bets Dashboard</span>
                                </Link>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowProfileDropdown(false)
                                        setShowWalletDropdown(true)
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '9px 12px',
                                        borderRadius: '6px',
                                        color: '#fff',
                                        border: 'none',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        background: 'rgba(47, 69, 83, 0.4)',
                                        cursor: 'pointer',
                                        textAlign: 'left'
                                    }}
                                >
                                    <span>💰</span>
                                    <span>Wallet & Deposit</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowProfileDropdown(false)
                                        logout()
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '9px 12px',
                                        borderRadius: '6px',
                                        color: '#ff6b6e',
                                        border: 'none',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        background: 'rgba(237, 66, 69, 0.1)',
                                        cursor: 'pointer',
                                        marginTop: '4px'
                                    }}
                                >
                                    <span>🚪</span>
                                    <span>Log Out</span>
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <button
                            type="button"
                            className="btn btn-login"
                            onClick={() => openAuthModal('login')}
                        >
                            Sign In
                        </button>
                        <button
                            type="button"
                            className="btn btn-register"
                            onClick={() => openAuthModal('register')}
                        >
                            Register
                        </button>
                    </>
                )}

                <button
                    ref={menuButtonRef}
                    type="button"
                    className="mobile-menu-button"
                    aria-label="Open navigation menu"
                    aria-haspopup="dialog"
                    aria-expanded={menuOpen}
                    onClick={onMenuClick}
                >
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                        <path d="M3 6h18v2H3V6m0 5h18v2H3v-2m0 5h18v2H3v-2z" />
                    </svg>
                </button>
            </div>
        </header>
    )
}

export default Header
