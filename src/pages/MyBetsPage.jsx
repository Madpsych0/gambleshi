import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '../context/WalletContext'
import { useAuth } from '../context/AuthContext'
import { GAMES } from '../games'
import '../styles/mybets.css'

const GAME_ICONS = {
    crash: '🚀',
    mines: '💣',
    plinko: '⚡',
    dino: '🦖',
    casino: '🎲'
}

export default function MyBetsPage() {
    const { bets, balance, deposit, resetBalance } = useWallet()
    const { user, isLoggedIn, openAuthModal } = useAuth()

    const [selectedGame, setSelectedGame] = useState('all')
    const [outcomeFilter, setOutcomeFilter] = useState('all') // 'all' | 'win' | 'loss'
    const [searchTerm, setSearchTerm] = useState('')

    // Derived statistics
    const stats = useMemo(() => {
        const totalBets = bets.length
        const totalWagered = bets.reduce((acc, b) => acc + (b.betAmount || 0), 0)
        const totalPayout = bets.reduce((acc, b) => acc + (b.payout || 0), 0)
        const netProfit = bets.reduce((acc, b) => acc + (b.profit || 0), 0)
        const winsCount = bets.filter(b => b.status === 'win' || b.profit > 0).length
        const winRate = totalBets > 0 ? ((winsCount / totalBets) * 100).toFixed(1) : '0.0'
        const bestMultiplier = bets.reduce((max, b) => Math.max(max, b.multiplier || 0), 0)

        return {
            totalBets,
            totalWagered,
            totalPayout,
            netProfit,
            winRate,
            bestMultiplier: bestMultiplier.toFixed(2),
        }
    }, [bets])

    // Filtered bets
    const filteredBets = useMemo(() => {
        return bets.filter(bet => {
            const matchesGame = selectedGame === 'all' || 
                (bet.gameId && bet.gameId.toLowerCase() === selectedGame.toLowerCase()) ||
                (bet.game && bet.game.toLowerCase() === selectedGame.toLowerCase())
            
            const isWin = bet.status === 'win' || bet.profit > 0
            const matchesOutcome = outcomeFilter === 'all' || 
                (outcomeFilter === 'win' && isWin) || 
                (outcomeFilter === 'loss' && !isWin)

            const matchesSearch = searchTerm === '' ||
                bet.game.toLowerCase().includes(searchTerm.toLowerCase()) ||
                bet.id.toLowerCase().includes(searchTerm.toLowerCase())

            return matchesGame && matchesOutcome && matchesSearch
        })
    }, [bets, selectedGame, outcomeFilter, searchTerm])

    return (
        <div className="my-bets-page-container">
            {/* Page Header */}
            <div className="my-bets-header-banner">
                <div className="my-bets-header-content">
                    <div className="my-bets-title-row">
                        <div className="my-bets-title-group">
                            <span className="my-bets-icon-badge">🎲</span>
                            <div>
                                <h1 className="my-bets-title">My Bets & Wallet History</h1>
                                <p className="my-bets-subtitle">
                                    Track your live bets, profitability, and game analytics across all EzBet Originals.
                                </p>
                            </div>
                        </div>

                        {/* Player / Wallet quick widget */}
                        <div className="my-bets-user-badge">
                            {isLoggedIn ? (
                                <>
                                    <div className="my-bets-user-avatar">
                                        {user?.avatar || '👑'}
                                    </div>
                                    <div className="my-bets-user-info">
                                        <div className="my-bets-user-name">
                                            {user?.username}
                                            <span className="my-bets-vip-tag">{user?.vipTier || 'VIP'}</span>
                                        </div>
                                        <div className="my-bets-balance-text">
                                            Balance: <strong>₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div className="my-bets-user-avatar">👤</div>
                                    <div className="my-bets-user-info">
                                        <div className="my-bets-user-name">Guest Mode</div>
                                        <div className="my-bets-balance-text">
                                            Balance: <strong>₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => openAuthModal('login')}
                                        style={{
                                            padding: '6px 14px',
                                            background: '#00e701',
                                            color: '#000',
                                            fontWeight: '700',
                                            borderRadius: '6px',
                                            border: 'none',
                                            cursor: 'pointer',
                                            marginLeft: '8px'
                                        }}
                                    >
                                        Sign In
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="my-bets-main-content">
                {/* Statistics Cards */}
                <div className="my-bets-stats-grid">
                    <div className="my-bets-stat-card">
                        <span className="my-bets-stat-label">Total Bets Placed</span>
                        <div className="my-bets-stat-value">{stats.totalBets}</div>
                        <span className="my-bets-stat-sub">Across all 4 originals</span>
                    </div>

                    <div className="my-bets-stat-card">
                        <span className="my-bets-stat-label">Total Wagered</span>
                        <div className="my-bets-stat-value">₹{stats.totalWagered.toFixed(2)}</div>
                        <span className="my-bets-stat-sub">Gross volume</span>
                    </div>

                    <div className={`my-bets-stat-card ${stats.netProfit >= 0 ? 'is-profit' : 'is-loss'}`}>
                        <span className="my-bets-stat-label">Net Profit / P&L</span>
                        <div className={`my-bets-stat-value ${stats.netProfit >= 0 ? 'green' : 'red'}`}>
                            {stats.netProfit >= 0 ? '+' : ''}₹{stats.netProfit.toFixed(2)}
                        </div>
                        <span className="my-bets-stat-sub">
                            {stats.netProfit >= 0 ? '▲ In the green' : '▼ In the red'}
                        </span>
                    </div>

                    <div className="my-bets-stat-card">
                        <span className="my-bets-stat-label">Win Rate</span>
                        <div className="my-bets-stat-value">{stats.winRate}%</div>
                        <span className="my-bets-stat-sub">Winning sessions</span>
                    </div>

                    <div className="my-bets-stat-card">
                        <span className="my-bets-stat-label">Best Multiplier</span>
                        <div className="my-bets-stat-value highlight-multiplier">
                            {stats.bestMultiplier}×
                        </div>
                        <span className="my-bets-stat-sub">Highest round peak</span>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="my-bets-controls-bar">
                    <div className="my-bets-tabs-group">
                        <div className="my-bets-chip-list" role="tablist">
                            <button
                                type="button"
                                className={`my-bets-filter-chip ${selectedGame === 'all' ? 'active' : ''}`}
                                onClick={() => setSelectedGame('all')}
                            >
                                All Games
                            </button>
                            {GAMES.map(g => (
                                <button
                                    key={g.id}
                                    type="button"
                                    className={`my-bets-filter-chip ${selectedGame === g.id ? 'active' : ''}`}
                                    onClick={() => setSelectedGame(g.id)}
                                >
                                    <span>{GAME_ICONS[g.id] || '🎲'}</span>
                                    <span>{g.name}</span>
                                </button>
                            ))}
                        </div>

                        <div className="my-bets-outcome-segmented">
                            <button
                                type="button"
                                className={`segmented-btn ${outcomeFilter === 'all' ? 'active' : ''}`}
                                onClick={() => setOutcomeFilter('all')}
                            >
                                All
                            </button>
                            <button
                                type="button"
                                className={`segmented-btn ${outcomeFilter === 'win' ? 'active' : ''}`}
                                onClick={() => setOutcomeFilter('win')}
                            >
                                Wins Only
                            </button>
                            <button
                                type="button"
                                className={`segmented-btn ${outcomeFilter === 'loss' ? 'active' : ''}`}
                                onClick={() => setOutcomeFilter('loss')}
                            >
                                Losses
                            </button>
                        </div>
                    </div>

                    <div className="my-bets-search-box">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="#8c9cb0">
                            <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                        </svg>
                        <input
                            type="text"
                            placeholder="Filter by game or ID…"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Bets Table */}
                <div className="my-bets-table-card">
                    <div className="my-bets-table-responsive">
                        <table className="my-bets-table">
                            <thead>
                                <tr>
                                    <th>Game</th>
                                    <th>Bet Amount</th>
                                    <th>Multiplier</th>
                                    <th>Payout</th>
                                    <th>Profit</th>
                                    <th>Status</th>
                                    <th>Time</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBets.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="my-bets-empty-cell">
                                            <div className="my-bets-empty-state">
                                                <span className="empty-state-icon">🎲</span>
                                                <h3>No bets recorded yet in this category</h3>
                                                <p>Pick a game to place a bet and start building your record!</p>
                                                <div className="empty-game-links">
                                                    {GAMES.map(g => (
                                                        <Link key={g.id} to={g.path} className="empty-play-btn">
                                                            Play {g.name}
                                                        </Link>
                                                    ))}
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredBets.map(bet => {
                                        const isWin = bet.status === 'win' || bet.profit > 0
                                        const gameIcon = GAME_ICONS[bet.gameId] || GAME_ICONS[bet.game?.toLowerCase()] || '🎲'
                                        const gamePath = `/${bet.gameId || bet.game?.toLowerCase() || 'crash'}`

                                        return (
                                            <tr key={bet.id} className={isWin ? 'row-win' : 'row-loss'}>
                                                <td>
                                                    <Link to={gamePath} className="bet-game-cell">
                                                        <span className="bet-game-icon">{gameIcon}</span>
                                                        <span className="bet-game-name">{bet.game}</span>
                                                    </Link>
                                                </td>
                                                <td>
                                                    <span className="bet-amount-value">
                                                        ₹{Number(bet.betAmount).toFixed(2)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`bet-multiplier-badge ${isWin ? 'win' : 'loss'}`}>
                                                        {Number(bet.multiplier).toFixed(2)}×
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="bet-payout-value">
                                                        ₹{Number(bet.payout || 0).toFixed(2)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`bet-profit-value ${bet.profit >= 0 ? 'positive' : 'negative'}`}>
                                                        {bet.profit >= 0 ? '+' : ''}₹{Number(bet.profit).toFixed(2)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`bet-status-pill ${isWin ? 'pill-win' : 'pill-loss'}`}>
                                                        {isWin ? 'WIN' : 'LOSS'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className="bet-time-label">
                                                        {bet.timestamp instanceof Date 
                                                            ? bet.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                            : 'Just now'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <Link to={gamePath} className="bet-replay-link">
                                                        Play Again →
                                                    </Link>
                                                </td>
                                            </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
