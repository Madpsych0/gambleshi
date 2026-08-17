import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { App as AntApp } from 'antd'
import Layout from './components/Layout'
import { useAuth } from './context/AuthContext'

const HomePage = lazy(() => import('./pages/HomePage'))
const CrashPage = lazy(() => import('./pages/CrashPage'))
const PlinkoPage = lazy(() => import('./pages/PlinkoPage'))
const DinoPage = lazy(() => import('./pages/DinoPage'))
const MinesPage = lazy(() => import('./pages/MinesPage'))
const MyBetsPage = lazy(() => import('./pages/MyBetsPage'))

const ProtectedRoute = ({ children }) => {
    const { isLoggedIn } = useAuth()
    if (!isLoggedIn) {
        return <Navigate to="/" replace />
    }
    return children
}

function App() {
    return (
        <AntApp>
            <Suspense
                fallback={
                    <div className="route-loading" role="status" aria-live="polite">
                        Loading…
                    </div>
                }
            >
                <Routes>
                    <Route path="/" element={<Layout />}>
                        <Route index element={<HomePage />} />
                        <Route path="crash" element={<ProtectedRoute><CrashPage /></ProtectedRoute>} />
                        <Route path="plinko" element={<ProtectedRoute><PlinkoPage /></ProtectedRoute>} />
                        <Route path="dino" element={<ProtectedRoute><DinoPage /></ProtectedRoute>} />
                        <Route path="mines" element={<ProtectedRoute><MinesPage /></ProtectedRoute>} />
                        <Route path="my-bets" element={<ProtectedRoute><MyBetsPage /></ProtectedRoute>} />
                    </Route>
                </Routes>
            </Suspense>
        </AntApp>
    )
}

export default App
