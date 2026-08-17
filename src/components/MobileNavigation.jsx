import { useEffect } from 'react'
import { Drawer } from 'antd'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { GAMES } from '../games'
import { useThemeSettings } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import './MobileNavigation.css'

const primaryRoutes = [
    { path: '/', label: 'Home', icon: '⌂' },
    ...GAMES.map(game => ({ path: game.path, label: game.name, icon: '◆' })),
]

const comingSoon = ['VIP Club', 'Rakeback', 'Affiliate', 'Sportsbook']

function MobileNavigation({ drawerOpen, onClose, returnFocusRef }) {
    const location = useLocation()
    const { paletteId, palettes, setPaletteId } = useThemeSettings()
    const { user, isLoggedIn, openAuthModal, logout } = useAuth()

    useEffect(() => onClose(), [location.pathname, onClose])

    return (
        <>
            <Drawer
                title="Menu"
                placement="left"
                width="min(88vw, 360px)"
                open={drawerOpen}
                onClose={onClose}
                afterOpenChange={open => {
                    if (!open) returnFocusRef.current?.focus()
                }}
                rootClassName="mobile-navigation-drawer"
            >
                {/* User Auth Banner in Drawer */}
                <div style={{
                    background: '#1a2c38',
                    border: '1px solid #2f4553',
                    borderRadius: '10px',
                    padding: '12px',
                    marginBottom: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                }}>
                    {isLoggedIn ? (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '24px' }}>{user.avatar || '👑'}</span>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: '700', color: '#fff', fontSize: '14px' }}>{user.username}</span>
                                    <span style={{ fontSize: '11px', color: '#00e701' }}>{user.vipTier || 'VIP'} Member</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <Link
                                    to="/my-bets"
                                    onClick={onClose}
                                    style={{
                                        flex: 1,
                                        padding: '8px 0',
                                        background: '#2f4553',
                                        color: '#fff',
                                        textAlign: 'center',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontWeight: '700',
                                        textDecoration: 'none'
                                    }}
                                >
                                    🎲 My Bets
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => { logout(); onClose(); }}
                                    style={{
                                        padding: '8px 12px',
                                        background: 'rgba(237, 66, 69, 0.15)',
                                        color: '#ff6b6e',
                                        border: 'none',
                                        borderRadius: '6px',
                                        fontSize: '12px',
                                        fontWeight: '700',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Log Out
                                </button>
                            </div>
                        </>
                    ) : (
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                type="button"
                                onClick={() => { openAuthModal('login'); onClose(); }}
                                style={{
                                    flex: 1,
                                    padding: '9px 0',
                                    background: '#2f4553',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontWeight: '700',
                                    cursor: 'pointer'
                                }}
                            >
                                Sign In
                            </button>
                            <button
                                type="button"
                                onClick={() => { openAuthModal('register'); onClose(); }}
                                style={{
                                    flex: 1,
                                    padding: '9px 0',
                                    background: '#00e701',
                                    color: '#000',
                                    border: 'none',
                                    borderRadius: '6px',
                                    fontWeight: '700',
                                    cursor: 'pointer'
                                }}
                            >
                                Register
                            </button>
                        </div>
                    )}
                </div>

                <label className="mobile-drawer-field">
                    <span>Search</span>
                    <input type="search" placeholder="Search your game" />
                </label>
                <label className="mobile-drawer-field">
                    <span>Palette</span>
                    <select value={paletteId} onChange={event => setPaletteId(event.target.value)}>
                        {palettes.map(palette => (
                            <option key={palette.id} value={palette.id}>{palette.name}</option>
                        ))}
                    </select>
                </label>
                <div className="mobile-drawer-actions" aria-label="Account shortcuts">
                    <Link
                        to="/my-bets"
                        onClick={onClose}
                        style={{
                            display: 'block',
                            width: '100%',
                            padding: '10px 14px',
                            background: '#1a2c38',
                            color: '#fff',
                            borderRadius: '8px',
                            textDecoration: 'none',
                            fontWeight: '600',
                            textAlign: 'center',
                            marginBottom: '6px'
                        }}
                    >
                        🎲 My Bets History
                    </Link>
                </div>
                <div className="mobile-coming-soon" aria-label="Coming soon">
                    {comingSoon.map(label => (
                        <button key={label} type="button" disabled>
                            <span>{label}</span>
                            <small>Coming soon</small>
                        </button>
                    ))}
                </div>
            </Drawer>

            <nav className="mobile-bottom-nav" aria-label="Primary navigation">
                {primaryRoutes.map(route => (
                    <NavLink
                        key={route.path}
                        to={route.path}
                        end={route.path === '/'}
                        className={({ isActive }) => isActive ? 'active' : ''}
                    >
                        <span aria-hidden="true">{route.icon}</span>
                        <span>{route.label}</span>
                    </NavLink>
                ))}
            </nav>
        </>
    )
}

export default MobileNavigation
