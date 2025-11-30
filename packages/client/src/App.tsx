import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { Dashboard } from './components/Dashboard'
import { Budget } from './components/Budget'
import { Transactions } from './components/Transactions'

function AppContent() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const userId = 'fake-user-id-yxt06l'
  const location = useLocation()
  const navigate = useNavigate()

  // Map current path to view name for Sidebar
  const currentView = location.pathname.split('/')[1] || 'dashboard'
  const setCurrentView = (view: string) => {
    navigate(`/${view}`)
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex font-sans">
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        currentView={currentView as any}
        setCurrentView={setCurrentView}
      />
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard userId={userId} />} />
        <Route path="/budget" element={<Budget userId={userId} />} />
        <Route path="/transactions" element={<Transactions userId={userId} />} />
        {/* Add more routes as needed */}
      </Routes>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
