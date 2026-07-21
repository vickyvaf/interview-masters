import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import DashboardLayout from './components/DashboardLayout'
import DashboardHome from './pages/DashboardHome'
import Practice from './pages/Practice'
import History from './pages/History'
import Billing from './pages/Billing'
import Settings from './pages/Settings'
import Organization from './pages/Organization'
import Interview from './pages/Interview'
import Login from './pages/Login'
import Register from './pages/Register'

import { Flex, Spinner, Text } from '@radix-ui/themes'

function setSessionCookie(session: any) {
  if (session) {
    const data = {
      user: {
        id: session.user.id,
        email: session.user.email,
        user_metadata: {
          avatar_url: session.user.user_metadata?.avatar_url,
          full_name: session.user.user_metadata?.full_name,
        }
      }
    };
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `im_session=${encodeURIComponent(JSON.stringify(data))}; path=/; expires=${expires}; SameSite=Lax`;
  } else {
    document.cookie = 'im_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax';
  }
}

function syncSessionToLanding(session: any) {
  const landingUrl = import.meta.env.VITE_LANDING_URL || (
    window.location.hostname === 'localhost'
      ? 'http://localhost:4321'
      : 'https://interviewmasters.id'
  );

  if (session) {
    const currentSynced = localStorage.getItem('im_session_synced_user');
    if (currentSynced === session.user.id) {
      return; // Already synced this user
    }
    const data = {
      user: {
        id: session.user.id,
        email: session.user.email,
        user_metadata: {
          avatar_url: session.user.user_metadata?.avatar_url,
          full_name: session.user.user_metadata?.full_name,
        }
      }
    };
    localStorage.setItem('im_session_synced_user', session.user.id);
    window.location.href = `${landingUrl}/sync-session?data=${encodeURIComponent(JSON.stringify(data))}&returnTo=${encodeURIComponent(window.location.href)}`;
  } else {
    const currentSynced = localStorage.getItem('im_session_synced_user');
    if (currentSynced) {
      localStorage.removeItem('im_session_synced_user');
      window.location.href = `${landingUrl}/sync-session?logout=true&returnTo=${encodeURIComponent(window.location.href)}`;
    }
  }
}

function App() {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setSessionCookie(session)
      syncSessionToLanding(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setSessionCookie(session)
      syncSessionToLanding(session)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <Flex 
        height="100vh" 
        align="center" 
        justify="center" 
        direction="column" 
        gap="3" 
        style={{ backgroundColor: 'var(--color-background)' }}
      >
        <Spinner size="3" />
        <Text size="2" color="gray" style={{ letterSpacing: '0.05em', fontWeight: 500 }}>MEMUAT DASHBOARD...</Text>
      </Flex>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={session ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/register" element={session ? <Navigate to="/dashboard" replace /> : <Register />} />
        <Route
          path="/dashboard"
          element={
            session ? (
              <DashboardLayout>
                <DashboardHome />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/practice"
          element={session ? <Practice /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/history"
          element={
            session ? (
              <DashboardLayout>
                <History />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/billing"
          element={
            session ? (
              <DashboardLayout>
                <Billing />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/settings"
          element={
            session ? (
              <DashboardLayout>
                <Settings />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/organization"
          element={
            session ? (
              <DashboardLayout>
                <Organization />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/interview"
          element={
            session ? (
              <DashboardLayout>
                <Interview />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
