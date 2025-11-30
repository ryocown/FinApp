import { NetWorthChart } from './NetWorthChart'
import { useAccounts } from '../lib/hooks'

interface DashboardProps {
  userId: string
}

export function Dashboard({ userId }: DashboardProps) {
  const { accounts, loading } = useAccounts(userId)

  const totalAssets = accounts
    .filter(a => a.type === 'asset' || a.type === 'investment' || a.type === 'checking' || a.type === 'savings')
    .reduce((acc, curr) => acc + (curr.balance || 0), 0)

  const totalLiabilities = accounts
    .filter(a => a.type === 'liability' || a.type === 'credit_card')
    .reduce((acc, curr) => acc + (curr.balance || 0), 0)

  const netWorth = totalAssets - totalLiabilities

  return (
    <main className="flex-1 overflow-auto">
      <header className="p-6 border-b border-zinc-800 flex justify-between items-center bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Welcome back, Rico</h1>
          <p className="text-zinc-400 text-sm">Here's what's happening with your finances</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-md text-sm font-medium text-zinc-200 transition-colors">
            Last 30 Days
          </button>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Net Worth Card */}
        <div className="bg-[#18181b] p-6 rounded-xl border border-zinc-800 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-zinc-400 text-sm font-medium">Net Worth</p>
              <h2 className="text-4xl font-bold mt-1 text-zinc-100">
                {loading ? 'Loading...' : `$${netWorth.toLocaleString()}`}
              </h2>
              <p className="text-emerald-400 text-sm mt-1 flex items-center gap-1">
                <span>↑ $407,313.94 (101.6%)</span>
                <span className="text-zinc-500">vs last month</span>
              </p>
            </div>
          </div>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-zinc-800 rounded-lg bg-zinc-900/50 overflow-hidden">
            <NetWorthChart />
          </div>
        </div>

        {/* Assets & Liabilities Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-[#18181b] p-6 rounded-xl border border-zinc-800 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-zinc-100">Assets</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Total Assets</span>
                <span className="font-medium text-zinc-200">
                  {loading ? '...' : `$${totalAssets.toLocaleString()}`}
                </span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
              {/* Individual accounts could go here */}
            </div>
          </div>
          <div className="bg-[#18181b] p-6 rounded-xl border border-zinc-800 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-zinc-100">Liabilities</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Total Liabilities</span>
                <span className="font-medium text-zinc-200">
                  {loading ? '...' : `$${totalLiabilities.toLocaleString()}`}
                </span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
              {/* Individual accounts could go here */}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
