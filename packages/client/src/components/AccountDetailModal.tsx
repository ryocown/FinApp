import { useState, useEffect } from 'react'
import { X, Save, Trash2 } from 'lucide-react'
import type { IAccount } from '@finapp/shared/models/account'

interface AccountDetailModalProps {
  isOpen: boolean
  onClose: () => void
  account: IAccount
  onUpdate: (accountId: string, updates: Partial<IAccount>) => Promise<void>
  onDelete: (account: IAccount) => void
}

export function AccountDetailModal({ isOpen, onClose, account, onUpdate, onDelete }: AccountDetailModalProps) {
  const [name, setName] = useState(account.name)
  const [accountNumber, setAccountNumber] = useState(account.accountNumber || '')
  const [loading, setLoading] = useState(false)

  // Reset state when account changes
  useEffect(() => {
    setName(account.name)
    setAccountNumber(account.accountNumber || '')
  }, [account])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onUpdate(account.accountId, {
        name,
        accountNumber
      })
      onClose()
    } catch (error) {
      console.error('Failed to update account:', error)
      alert('Failed to update account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#18181b] border border-zinc-800 rounded-xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-white">Account Details</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Account Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                required
              />
            </div>

            {/* Account Number */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Account Number (Last 4)</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                maxLength={4}
              />
            </div>

            {/* Read-only Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Type</label>
                <div className="px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-lg text-zinc-300 text-sm capitalize">
                  {account.type}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Currency</label>
                <div className="px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-lg text-zinc-300 text-sm">
                  {account.currency.code} ({account.currency.symbol})
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Current Balance</label>
              <div className="px-3 py-2 bg-zinc-900/50 border border-zinc-800 rounded-lg text-zinc-300 text-sm font-mono">
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: account.currency.code }).format(account.balance)}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
            <button
              type="button"
              onClick={() => onDelete(account)}
              className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors text-sm font-medium"
            >
              <Trash2 size={16} />
              Delete Account
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-zinc-400 hover:text-white transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
              >
                <Save size={16} />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
