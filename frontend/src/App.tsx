import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@/store/authStore'
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications'

// Pages
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import DashboardLayout from '@/pages/DashboardLayout'
import InboxPage from '@/pages/inbox/InboxPage'
import EmailDetailPage from '@/pages/inbox/EmailDetailPage'
import CalendarPage from '@/pages/calendar/CalendarPage'
import AgentPage from '@/pages/agent/AgentPage'
import SearchPage from '@/pages/search/SearchPage'
import SettingsPage from '@/pages/settings/SettingsPage'
import ActionCenterPage from '@/pages/actions/ActionCenterPage'

// Command palette
import { CommandPalette } from '@/components/CommandPalette'
import { useCommandPaletteStore } from '@/store/uiStore'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  const { isAuthenticated, user } = useAuthStore()
  const { isOpen: cmdOpen } = useCommandPaletteStore()
  const location = useLocation()

  useRealtimeNotifications(isAuthenticated ? user?.id : undefined)

  return (
    <>
      <AnimatePresence>
        {cmdOpen && <CommandPalette key="cmd" />}
      </AnimatePresence>

      <Routes location={location}>
        {/* Public */}
        <Route path="/login"    element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected shell */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/inbox" replace />} />
          <Route path="inbox"    element={<InboxPage />} />
          <Route path="inbox/:id" element={<EmailDetailPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="agent"    element={<AgentPage />} />
          <Route path="search"   element={<SearchPage />} />
          <Route path="actions"  element={<ActionCenterPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/inbox" replace />} />
      </Routes>
    </>
  )
}
