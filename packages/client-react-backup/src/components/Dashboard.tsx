import { NetWorthChart } from './NetWorthChart'
import { useAccounts } from '../lib/hooks'
import { useEffect, useState } from 'react'
import { AccountType } from '@finapp/shared/models/account'
import { NetWorthBar } from './dashboard-components/NetWorthBar'

interface DashboardProps {
  userId: string
}

export function Dashboard({ userId }: DashboardProps) {
  const { accounts, loading } = useAccounts(userId)

  const [rates, setRates] = useState<Record<string, number>>({})

  useEffect(() => {
    fetch('http://localhost:3001/api/currencies/rates')
      .then(res => res.json())
      .then(data => setRates(data))
      .catch(err => console.error('Failed to fetch rates:', err))
  }, [])

  const getBalanceInUSD = (account: { currency: { code: string }; balance: number }) => {
    if (account.currency.code === 'USD') return account.balance || 0;

    const pairId = account.currency.code < 'USD' ? `${account.currency.code}USD` : `USD${account.currency.code}`;
    const rate = rates[pairId];
    if (rate) {
      return (account.balance || 0) * rate;
    }
    return account.balance || 0;
  }

  const totalAssets = accounts
    .filter(a => ![AccountType.CREDIT_CARD, AccountType.LOAN].includes(a.type))
    .reduce((acc, curr) => acc + getBalanceInUSD(curr), 0)

  console.log(accounts)

  const totalLiabilities = accounts
    .filter(a => [AccountType.CREDIT_CARD, AccountType.LOAN].includes(a.type))
    .reduce((acc, curr) => acc + getBalanceInUSD(curr), 0) * -1

  const netWorth = totalAssets - totalLiabilities

  const [range, setRange] = useState('30d')
  const [netWorthHistory, setNetWorthHistory] = useState<{ date: string; value: number }[]>([])

  useEffect(() => {
    if (userId) {
      fetch(`http://localhost:3001/api/analytics/users/${userId}/net-worth?range=${range}`)
        .then(res => res.json())
        .then(data => setNetWorthHistory(data))
        .catch(err => console.error('Failed to fetch net worth history:', err))
    }
  }, [userId, range])

  return (
    <main className="flex-1 overflow-auto">
      <header className="p-6 border-b border-zinc-800 flex justify-between items-center bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Welcome back, Rico</h1>
          <p className="text-zinc-400 text-sm">Here's what's happening with your finances</p>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Net Worth Card */}
        <div className="bg-[#18181b] p-6 rounded-xl border border-zinc-800 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-zinc-400 text-sm font-medium">Net Worth</p>
              <h2 id="dashboard-net-worth-value" className="text-4xl font-bold mt-1 text-zinc-100">
                {loading ? 'Loading...' : `$${netWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              </h2>
              {(() => {
                if (netWorthHistory.length < 2) return null;
                const today = new Date();
                const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30));

                let pastEntry = netWorthHistory.find(h => new Date(h.date) >= thirtyDaysAgo);
                if (!pastEntry) pastEntry = netWorthHistory[0];

                const diff = netWorth - pastEntry.value;
                let percentDisplay = '0.0%';
                if (pastEntry.value !== 0) {
                  const percent = (diff / Math.abs(pastEntry.value)) * 100;
                  percentDisplay = `${Math.abs(percent).toFixed(1)}%`;
                } else if (netWorth !== 0) {
                  percentDisplay = '∞';
                }

                const isPositive = diff >= 0;

                return (
                  <p className={`${isPositive ? 'text-emerald-400' : 'text-red-400'} text-sm mt-1 flex items-center gap-1`}>
                    <span>{isPositive ? '↑' : '↓'} ${Math.abs(diff).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({percentDisplay})</span>
                    <span className="text-zinc-500">vs {pastEntry === netWorthHistory[0] && netWorthHistory.length < 30 ? 'start' : 'last month'}</span>
                  </p>
                );
              })()}
            </div>
          </div>
          <div className="h-64 flex items-center justify-center rounded-lg bg-zinc-900/30 border border-zinc-800/50 overflow-hidden mb-6">
            <NetWorthChart data={netWorthHistory} />
          </div>

          {/* Date Range Selector */}
          <div className="flex justify-center">
            <div className="flex items-center gap-1 bg-zinc-900/50 p-1 rounded-lg border border-zinc-800/50">
              {[
                { label: '30D', value: '30d' },
                { label: '3M', value: '90d' },
                { label: '1Y', value: '1y' },
                { label: 'ALL', value: 'all' },
              ].map((item) => (
                <button
                  key={item.value}
                  onClick={() => setRange(item.value)}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${range === item.value
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                    }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Assets & Liabilities Visualization */}
        <div className="bg-[#18181b] p-6 rounded-xl border border-zinc-800 shadow-sm">
          <NetWorthBar assets={totalAssets} liabilities={Math.abs(totalLiabilities)} />
        </div>
      </div>
    </main>
  )
}
