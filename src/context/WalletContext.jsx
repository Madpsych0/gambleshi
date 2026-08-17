import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'

const WalletContext = createContext(null)

const INITIAL_BALANCE = 50.00
const STORAGE_KEY_BALANCE = 'stake_wallet_balance'
const STORAGE_KEY_TXS = 'stake_wallet_transactions'
const STORAGE_KEY_BETS = 'stake_my_bets'

function getStoredBalance() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_BALANCE)
        if (stored !== null) {
            const parsed = parseFloat(stored)
            return isNaN(parsed) ? INITIAL_BALANCE : parsed
        }
    } catch (e) { /* ignore */ }
    return INITIAL_BALANCE
}

function getStoredTransactions() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_TXS)
        if (stored) {
            const parsed = JSON.parse(stored)
            return parsed.map(tx => ({
                ...tx,
                timestamp: new Date(tx.timestamp)
            }))
        }
    } catch (e) { /* ignore */ }
    return []
}

function getStoredBets() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_BETS)
        if (stored) {
            const parsed = JSON.parse(stored)
            return parsed.map(b => ({
                ...b,
                timestamp: new Date(b.timestamp)
            }))
        }
    } catch (e) { /* ignore */ }
    
    // Seed initial realistic demo bets so My Bets is populated immediately
    return [
        {
            id: 'bet-demo-1',
            game: 'Crash',
            gameId: 'crash',
            betAmount: 25.00,
            multiplier: 2.45,
            payout: 61.25,
            profit: 36.25,
            status: 'win',
            timestamp: new Date(Date.now() - 1000 * 60 * 12),
        },
        {
            id: 'bet-demo-2',
            game: 'Mines',
            gameId: 'mines',
            betAmount: 10.00,
            multiplier: 3.12,
            payout: 31.20,
            profit: 21.20,
            status: 'win',
            timestamp: new Date(Date.now() - 1000 * 60 * 45),
        },
        {
            id: 'bet-demo-3',
            game: 'Plinko',
            gameId: 'plinko',
            betAmount: 50.00,
            multiplier: 0.50,
            payout: 25.00,
            profit: -25.00,
            status: 'loss',
            timestamp: new Date(Date.now() - 1000 * 60 * 90),
        },
        {
            id: 'bet-demo-4',
            game: 'Dino',
            gameId: 'dino',
            betAmount: 15.00,
            multiplier: 5.80,
            payout: 87.00,
            profit: 72.00,
            status: 'win',
            timestamp: new Date(Date.now() - 1000 * 60 * 180),
        },
        {
            id: 'bet-demo-5',
            game: 'Crash',
            gameId: 'crash',
            betAmount: 100.00,
            multiplier: 1.00,
            payout: 0.00,
            profit: -100.00,
            status: 'loss',
            timestamp: new Date(Date.now() - 1000 * 60 * 300),
        }
    ]
}

export function WalletProvider({ children }) {
    const [balance, setBalance] = useState(getStoredBalance)
    const balanceRef = useRef(balance)
    const [currency, setCurrency] = useState('USD')
    const [transactions, setTransactions] = useState(getStoredTransactions)
    const [bets, setBets] = useState(getStoredBets)

    // Save transactions to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY_TXS, JSON.stringify(transactions.slice(0, 100)))
        } catch (e) { /* ignore */ }
    }, [transactions])

    // Save bets to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY_BETS, JSON.stringify(bets.slice(0, 100)))
        } catch (e) { /* ignore */ }
    }, [bets])

    // Toast system
    const [toasts, setToasts] = useState([])
    const toastIdRef = useRef(0)

    const showToast = useCallback((type, title, description, duration = 3000) => {
        const id = ++toastIdRef.current
        setToasts(prev => [...prev, { id, type, title, description }])
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
        }, duration)
    }, [])

    const setStoredBalance = useCallback((nextBalance) => {
        const rounded = parseFloat(nextBalance.toFixed(2))
        balanceRef.current = rounded
        setBalance(rounded)
        try { localStorage.setItem(STORAGE_KEY_BALANCE, rounded.toString()) } catch (e) { /* ignore */ }
        return rounded
    }, [])

    // Update balance and persist to localStorage
    const updateBalance = useCallback((newBalance) => {
        setStoredBalance(newBalance)
    }, [setStoredBalance])

    // Place a bet (deduct from balance)
    const placeBet = useCallback((amount, gameName = 'Casino') => {
        const amt = parseFloat(amount)
        if (isNaN(amt) || amt <= 0 || amt > balanceRef.current) return false

        const newBal = setStoredBalance(balanceRef.current - amt)
        setTransactions(txs => [{
            id: Date.now(),
            type: 'bet',
            game: gameName,
            amount: -amt,
            balance: newBal,
            timestamp: new Date(),
        }, ...txs].slice(0, 100))

        return true
    }, [setStoredBalance])

    // Add winnings to balance
    const addWinnings = useCallback((amount, gameName = 'Casino') => {
        const amt = parseFloat(amount)
        if (isNaN(amt) || amt <= 0) return

        const newBal = setStoredBalance(balanceRef.current + amt)
        setTransactions(txs => [{
            id: Date.now(),
            type: 'win',
            game: gameName,
            amount: amt,
            balance: newBal,
            timestamp: new Date(),
        }, ...txs].slice(0, 100))
    }, [setStoredBalance])

    // Record complete bet result for My Bets history
    const recordBetResult = useCallback(({ game, gameId, betAmount, multiplier = 1, payout = 0, profit = 0, status = 'loss', details = '' }) => {
        const newBet = {
            id: `bet-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            game: game || 'Casino',
            gameId: gameId || (game ? game.toLowerCase() : 'casino'),
            betAmount: parseFloat(betAmount) || 0,
            multiplier: parseFloat(multiplier) || 0,
            payout: parseFloat(payout) || 0,
            profit: parseFloat(profit) || 0,
            status: status, // 'win' | 'loss'
            details: details,
            timestamp: new Date(),
        }

        setBets(prev => [newBet, ...prev].slice(0, 100))
    }, [])

    // Deposit funds
    const deposit = useCallback((amount) => {
        const amt = parseFloat(amount)
        if (isNaN(amt) || amt <= 0) return

        const newBal = setStoredBalance(balanceRef.current + amt)
        setTransactions(txs => [{
            id: Date.now(),
            type: 'deposit',
            amount: amt,
            balance: newBal,
            timestamp: new Date(),
        }, ...txs].slice(0, 100))
    }, [setStoredBalance])

    // Reset balance to initial
    const resetBalance = useCallback(() => {
        updateBalance(INITIAL_BALANCE)
        setTransactions(prev => [{
            id: Date.now(),
            type: 'reset',
            amount: INITIAL_BALANCE,
            balance: INITIAL_BALANCE,
            timestamp: new Date(),
        }, ...prev])
    }, [updateBalance])

    const value = {
        balance,
        currency,
        setCurrency,
        transactions,
        bets,
        placeBet,
        addWinnings,
        recordBetResult,
        deposit,
        resetBalance,
        updateBalance,
        toasts,
        showToast,
    }

    return (
        <WalletContext.Provider value={value}>
            {children}
        </WalletContext.Provider>
    )
}

export function useWallet() {
    const context = useContext(WalletContext)
    if (!context) {
        throw new Error('useWallet must be used within a WalletProvider')
    }
    return context
}

export default WalletContext
