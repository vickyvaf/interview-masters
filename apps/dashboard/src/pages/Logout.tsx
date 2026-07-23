import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Logout() {
  useEffect(() => {
    async function performLogout() {
      // 1. Clear local storage & cookies on dashboard
      localStorage.removeItem('im_session_synced_user')
      localStorage.removeItem('sb-dcouzpirkktfxklgqqwv-auth-token')
      document.cookie = 'im_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax;'

      // 2. Invalidate Supabase Auth session
      try {
        await supabase.auth.signOut()
      } catch (e) {
        console.error('Logout error:', e)
      }

      // 3. Sync logout back to landing page and redirect
      const landingUrl = import.meta.env.VITE_LANDING_URL || (
        window.location.hostname === 'localhost'
          ? 'http://localhost:4321'
          : 'https://interviewmasters.netlify.app'
      )
      
      const searchParams = new URLSearchParams(window.location.search)
      const returnTo = searchParams.get('returnTo') || `${landingUrl}`
      
      window.location.href = `${landingUrl}/sync-session?logout=true&returnTo=${encodeURIComponent(returnTo)}`
    }

    performLogout()
  }, [])

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      flexDirection: 'column',
      gap: '12px',
      backgroundColor: 'var(--color-background)',
      color: 'var(--gray-12)'
    }}>
      <span style={{ fontSize: '14px', letterSpacing: '0.05em' }}>KELUAR DARI SESI...</span>
    </div>
  )
}
