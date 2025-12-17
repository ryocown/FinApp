import { useState } from 'react'
import { X } from 'lucide-react'

interface ReconcileModalProps {
  isOpen: boolean
  onClose: () => void
  accountId: string
  currentBalance: number
  userId: string
  currencyCode: string
  onSuccess: () => void
}

export function ReconcileModal({ isOpen, onClose, accountId, currentBalance, userId, currencyCode, onSuccess }: ReconcileModalProps) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [balance, setBalance] = useState(currentBalance.toString())
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`http://localhost:3001/api/accounts/users/${userId}/accounts/${accountId}/reconcile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date: new Date(date).toISOString(),
          balance: Number(balance)
        })
      })

      if (!res.ok) {
        throw new Error('Failed to reconcile')
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error reconciling:', error)
      alert('Failed to save reconciliation')
    } finally {
      setLoading(false)
    }
  }

  const diff = Number(balance) - currentBalance

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#18181b] border border-zinc-800 rounded-xl p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-zinc-100">Reconcile Account</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-200">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Date</label>
            <input
              type="date"
              className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Actual Balance</label>
            <input
              type="number"
              step="0.01"
              className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              required
            />
          </div>

          <div className="p-4 bg-zinc-900/50 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Current System Balance:</span>
              <span className="text-zinc-200">{currentBalance.toLocaleString('en-US', { style: 'currency', currency: currencyCode })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Difference:</span>
              <span className={`${diff === 0 ? 'text-zinc-200' : diff > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {diff > 0 ? '+' : ''}{diff.toLocaleString('en-US', { style: 'currency', currency: currencyCode })}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Saving...' : 'Save Reconciliation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
