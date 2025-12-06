import React from 'react'
import { LayoutDashboard, Wallet, CreditCard, Plus, Menu, PieChart, Building } from 'lucide-react'

interface NavItemProps {
  icon: React.ReactNode
  label: string
  isOpen: boolean
  active?: boolean
  onClick?: () => void
}

function NavItem({ icon, label, isOpen, active = false, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${active ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'}`}
    >
      <div className={`${active ? 'text-indigo-400' : ''}`}>{icon}</div>
      {isOpen && <span className="font-medium">{label}</span>}
    </button>
  )
}

interface SidebarProps {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
  currentView: 'dashboard' | 'budget' | 'transactions' | 'accounts'
  setCurrentView: (view: 'dashboard' | 'budget' | 'transactions' | 'accounts') => void
}

export function Sidebar({ isOpen, setIsOpen, currentView, setCurrentView }: SidebarProps) {
  return (
    <aside className={`${isOpen ? 'w-64' : 'w-16'} bg-[#18181b] border-r border-zinc-800 transition-all duration-300 flex flex-col h-full`}>
      <div className="p-4 flex items-center justify-between border-b border-zinc-800">
        {isOpen && <span className="font-bold text-xl tracking-tight">FinApp</span>}
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 hover:bg-zinc-800 rounded-md text-zinc-400">
          <Menu size={20} />
        </button>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        <NavItem
          icon={<LayoutDashboard size={20} />}
          label="Dashboard"
          isOpen={isOpen}
          active={currentView === 'dashboard'}
          onClick={() => setCurrentView('dashboard')}
        />
        <NavItem
          icon={<PieChart size={20} />}
          label="Budget"
          isOpen={isOpen}
          active={currentView === 'budget'}
          onClick={() => setCurrentView('budget')}
        />
        <NavItem
          icon={<CreditCard size={20} />}
          label="Transactions"
          isOpen={isOpen}
          active={currentView === 'transactions'}
          onClick={() => setCurrentView('transactions')}
        />
        <NavItem
          icon={<Building size={20} />}
          label="Accounts"
          isOpen={isOpen}
          active={currentView === 'accounts'}
          onClick={() => setCurrentView('accounts')}
        />
        <NavItem icon={<Wallet size={20} />} label="Assets" isOpen={isOpen} />
        <NavItem icon={<CreditCard size={20} />} label="Debts" isOpen={isOpen} />
      </nav>

      <div className="p-4 border-t border-zinc-800">
        <button className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-md transition-colors">
          <Plus size={18} />
          {isOpen && <span>New Transaction</span>}
        </button>
      </div>
    </aside>
  )
}
