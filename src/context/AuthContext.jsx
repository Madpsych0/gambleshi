import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useWallet } from './WalletContext'

const AuthContext = createContext(null)

const STORAGE_KEY_USER = 'stake_auth_current_user'
const STORAGE_KEY_USERS_DB = 'stake_auth_users_db_v2'

const DEFAULT_AVATARS = [
    '👑', '🚀', '💎', '🔥', '🎲', '⚡', '🦁', '🐺', '🦊', '🐉'
]

function getStoredUser() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_USER)
        if (stored && stored !== 'null' && stored !== 'undefined') {
            return JSON.parse(stored)
        }
    } catch (e) { /* ignore */ }
    return null // Default logged out, no automatic login
}

function getStoredUsersDB() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY_USERS_DB)
        if (stored) {
            return JSON.parse(stored)
        }
    } catch (e) { /* ignore */ }
    return []
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(getStoredUser)
    const [authModalOpen, setAuthModalOpen] = useState(false)
    const [authModalTab, setAuthModalTab] = useState('login') // 'login' | 'register'
    const { updateBalance } = useWallet()

    // Persist current user
    useEffect(() => {
        try {
            if (user) {
                localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user))
            } else {
                localStorage.removeItem(STORAGE_KEY_USER)
            }
        } catch (e) { /* ignore */ }
    }, [user])

    const openAuthModal = useCallback((tab = 'login') => {
        setAuthModalTab(tab)
        setAuthModalOpen(true)
    }, [])

    const closeAuthModal = useCallback(() => {
        setAuthModalOpen(false)
    }, [])

    const login = useCallback(async (usernameOrEmail, password) => {
        // Simple client-side simulation with persistent storage
        if (!usernameOrEmail || !password) {
            throw new Error('Please enter both username and password.')
        }

        const users = getStoredUsersDB()
        const found = users.find(
            u => u.username.toLowerCase() === usernameOrEmail.toLowerCase() ||
                 u.email.toLowerCase() === usernameOrEmail.toLowerCase()
        )

        if (found) {
            setUser(found)
            setAuthModalOpen(false)
            return found
        }

        // If not found in DB, allow seamless demo sign in with entered username
        const newUser = {
            id: `user-${Date.now()}`,
            username: usernameOrEmail.includes('@') ? usernameOrEmail.split('@')[0] : usernameOrEmail,
            email: usernameOrEmail.includes('@') ? usernameOrEmail : `${usernameOrEmail}@stake.clone`,
            avatar: DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)],
            vipTier: 'Bronze',
            joinedDate: 'Today',
            totalWagered: 0,
            winsCount: 0,
            lossesCount: 0,
        }

        const updatedUsers = [...users, newUser]
        try {
            localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(updatedUsers))
        } catch (e) { /* ignore */ }

        setUser(newUser)
        updateBalance(500)
        setAuthModalOpen(false)
        return newUser
    }, [updateBalance])

    const register = useCallback(async (username, email, password, avatar = '🚀') => {
        if (!username || username.trim().length < 3) {
            throw new Error('Username must be at least 3 characters long.')
        }
        if (!email || !email.includes('@')) {
            throw new Error('Please enter a valid email address.')
        }
        if (!password || password.length < 6) {
            throw new Error('Password must be at least 6 characters long.')
        }

        const users = getStoredUsersDB()
        const exists = users.some(
            u => u.username.toLowerCase() === username.toLowerCase() ||
                 u.email.toLowerCase() === email.toLowerCase()
        )

        if (exists) {
            throw new Error('An account with this username or email already exists.')
        }

        const newUser = {
            id: `user-${Date.now()}`,
            username: username.trim(),
            email: email.trim().toLowerCase(),
            avatar: avatar || '🚀',
            vipTier: 'Bronze',
            joinedDate: 'Today',
            totalWagered: 0,
            winsCount: 0,
            lossesCount: 0,
        }

        const updatedUsers = [...users, newUser]
        try {
            localStorage.setItem(STORAGE_KEY_USERS_DB, JSON.stringify(updatedUsers))
        } catch (e) { /* ignore */ }

        setUser(newUser)
        updateBalance(500)
        setAuthModalOpen(false)
        return newUser
    }, [updateBalance])


    const logout = useCallback(() => {
        try {
            localStorage.removeItem(STORAGE_KEY_USER)
        } catch (e) { /* ignore */ }
        setUser(null)
    }, [])

    const updateProfile = useCallback((updates) => {
        setUser(prev => {
            if (!prev) return null
            const updated = { ...prev, ...updates }
            return updated
        })
    }, [])

    const value = {
        user,
        isLoggedIn: !!user,
        authModalOpen,
        authModalTab,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        logout,
        updateProfile,
        avatars: DEFAULT_AVATARS,
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export default AuthContext
