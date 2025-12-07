import { LayoutDashboard, Wallet, CreditCard, Menu, PieChart, Building, ChevronDown, ChevronRight } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useInstitutes, useAccounts } from '../lib/hooks'
import type { IAccount } from '@finapp/shared/models/account'
import type { IInstitute } from '@finapp/shared/models/institute'

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
  userId: string
}

export function Sidebar({ isOpen, setIsOpen, currentView, setCurrentView, userId }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const { institutes } = useInstitutes(userId)
  const { accounts } = useAccounts(userId)
  const [expandedInstitutes, setExpandedInstitutes] = useState<Set<string>>(new Set())
  const [isAccountsExpanded, setIsAccountsExpanded] = useState(false)

  // Group accounts by institute
  const institutesWithAccounts = institutes.map((inst: IInstitute) => ({
    ...inst,
    accounts: accounts.filter((acc: IAccount) => acc.instituteId === inst.instituteId)
  }))

  const toggleInstitute = (instituteId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newExpanded = new Set(expandedInstitutes)
    if (newExpanded.has(instituteId)) {
      newExpanded.delete(instituteId)
    } else {
      newExpanded.add(instituteId)
    }
    setExpandedInstitutes(newExpanded)
  }

  const handleAccountClick = (accountId: string) => {
    navigate(`/transactions?account=${accountId}`)
  }

  return (
    <aside className={`${isOpen ? 'w-64' : 'w-16'} bg-[#18181b] border-r border-zinc-800 transition-all duration-300 flex flex-col h-screen fixed left-0 top-0 z-40`}>
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
        <div className="space-y-1">
          {/* Accounts Split Button */}
          <div className={`flex items-center rounded-md transition-colors ${currentView === 'accounts' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'}`}>
            <button
              onClick={() => setCurrentView('accounts')}
              className="flex-1 flex items-center gap-3 px-3 py-2.5 rounded-l-md"
            >
              <div className={`${currentView === 'accounts' ? 'text-indigo-400' : ''}`}><Building size={20} /></div>
              {isOpen && <span className="font-medium">Accounts</span>}
            </button>

            {isOpen && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setIsAccountsExpanded(!isAccountsExpanded)
                }}
                className="p-2.5 rounded-r-md hover:bg-zinc-700/50 transition-colors"
              >
                <ChevronDown size={16} className={`transition-transform duration-200 ${isAccountsExpanded ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>

          {/* Animated Nested List */}
          <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${isOpen && isAccountsExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
            <div className="overflow-hidden">
              <div className="pl-4 space-y-1 pt-1">
                {institutesWithAccounts.map(inst => (
                  <div key={inst.instituteId} className="space-y-1">
                    <button
                      onClick={(e) => toggleInstitute(inst.instituteId, e)}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30 rounded-md transition-colors group"
                    >
                      <span className="truncate group-hover:text-white transition-colors">{inst.name}</span>
                      <ChevronRight size={14} className={`transition-transform duration-200 ${expandedInstitutes.has(inst.instituteId) ? 'rotate-90' : ''}`} />
                    </button>

                    {/* Nested Accounts Animation */}
                    <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${expandedInstitutes.has(inst.instituteId) ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                      <div className="overflow-hidden">
                        <div className="pl-3 space-y-0.5 pb-1">
                          {inst.accounts.map(acc => (
                            <button
                              key={acc.accountId}
                              onClick={() => handleAccountClick(acc.accountId)}
                              className={`w-full text-left px-3 py-1.5 text-sm rounded-md transition-all truncate flex items-center gap-2 ${location.search.includes(`account=${acc.accountId}`)
                                  ? 'text-indigo-400 bg-indigo-500/10 font-medium translate-x-1'
                                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30 hover:translate-x-1'
                                }`}
                            >
                              <div className={`w-1.5 h-1.5 rounded-full ${location.search.includes(`account=${acc.accountId}`) ? 'bg-indigo-500' : 'bg-zinc-600'}`} />
                              {acc.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <NavItem icon={<Wallet size={20} />} label="Assets" isOpen={isOpen} />
        <NavItem icon={<CreditCard size={20} />} label="Debts" isOpen={isOpen} />
      </nav>


    </aside>
  )
}
