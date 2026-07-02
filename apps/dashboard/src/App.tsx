import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from './components/DashboardLayout'
import DashboardHome from './pages/DashboardHome'
import Playground from './pages/Playground'
import History from './pages/History'
import Billing from './pages/Billing'
import Settings from './pages/Settings'
import Organization from './pages/Organization'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route
          path="/dashboard"
          element={
            <DashboardLayout>
              <DashboardHome />
            </DashboardLayout>
          }
        />
        <Route path="/playground" element={<Playground />} />
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
      </Routes>
    </BrowserRouter>
  )
}

export default App
