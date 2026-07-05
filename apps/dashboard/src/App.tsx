import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <DashboardLayout>
              <DashboardHome />
            </DashboardLayout>
          }
        />
        <Route path="/practice" element={<Practice />} />
        <Route
          path="/history"
          element={
            <DashboardLayout>
              <History />
            </DashboardLayout>
          }
        />
        <Route
          path="/billing"
          element={
            <DashboardLayout>
              <Billing />
            </DashboardLayout>
          }
        />
        <Route
          path="/settings"
          element={
            <DashboardLayout>
              <Settings />
            </DashboardLayout>
          }
        />
        <Route
          path="/organization"
          element={
            <DashboardLayout>
              <Organization />
            </DashboardLayout>
          }
        />
        <Route
          path="/interview"
          element={
            <DashboardLayout>
              <Interview />
            </DashboardLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
