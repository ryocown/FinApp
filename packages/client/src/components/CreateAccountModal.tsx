import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { IInstitute } from '@finapp/shared/models/institute'
import { AccountType } from '@finapp/shared/models/account'
import { INSTITUTE_SUPPORTED_ACCOUNTS } from '@finapp/shared/importer/capabilities'

interface CreateAccountModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  institutes: IInstitute[]
  onSuccess: () => void
}

export function CreateAccountModal({ isOpen, onClose, userId, institutes, onSuccess }: CreateAccountModalProps) {
  const [name, setName] = useState('')
  const [instituteId, setInstituteId] = useState(institutes[0]?.instituteId || '')
  const [type, setType] = useState<AccountType | ''>('')
  const [currency, setCurrency] = useState('USD')
  const [accountNumber, setAccountNumber] = useState('')

  // Update type when institute changes
  useEffect(() => {
    const selectedInstitute = institutes.find(i => i.instituteId === instituteId)
    if (selectedInstitute) {
      const allowedTypes = INSTITUTE_SUPPORTED_ACCOUNTS[selectedInstitute.name]
      if (allowedTypes && allowedTypes.length > 0) {
        setType(allowedTypes[0])
      } else {
        setType('')
      }
    }
  }, [instituteId, institutes])

  // Initial Reconciliation
  const [initialBalance, setInitialBalance] = useState('')
  const [initialDate, setInitialDate] = useState(new Date().toISOString().split('T')[0])

  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = {
        name,
        instituteId,
        type,
        currency: { code: currency, symbol: currency === 'USD' ? '$' : currency === 'JPY' ? '¥' : '£' },
        accountNumber,
        userId,
        balance: 0, // Default, will be overwritten if initialBalance is set
        balanceDate: new Date().toISOString(),
        // Optional fields for initial reconciliation
        initialBalance: initialBalance ? Number(initialBalance) : undefined,
        initialDate: initialBalance ? new Date(initialDate).toISOString() : undefined
      }

      const res = await fetch(`http://localhost:3001/api/accounts/users/${userId}/accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error('Failed to create account')

      onSuccess()
      onClose()
      // Reset form
      setName('')
      setAccountNumber('')
      setInitialBalance('')
    } catch (error) {
      console.error('Error creating account:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#18181b] border border-zinc-800 rounded-xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 sticky top-0 bg-[#18181b] z-10">
          <h2 className="text-lg font-semibold text-white">Add New Account</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Institute Selection */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Institute</label>
            <select
              value={instituteId}
              onChange={(e) => setInstituteId(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
              required
            >
              <option value="" disabled>Select Institute</option>
              {institutes.map(inst => (
                <option key={inst.instituteId} value={inst.instituteId}>{inst.name}</option>
              ))}
            </select>
          </div>

          {/* Account Name */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Account Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="e.g. Sapphire Preferred"
              required
            />
          </div>

          {/* Account Number (Last 4) */}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Account Number (Last 4)</label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="e.g. 1234"
              maxLength={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AccountType)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
              >
                {(() => {
                  const selectedInstitute = institutes.find(i => i.instituteId === instituteId);
                  const allowedTypes = selectedInstitute ? INSTITUTE_SUPPORTED_ACCOUNTS[selectedInstitute.name] : [];

                  // Fallback to all types if no restriction found (or handle as empty)
                  // But ideally we should have restrictions for all.
                  // For now, if no allowedTypes, show allowedTypes if present.

                  if (allowedTypes && allowedTypes.length > 0) {
                    return allowedTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ));
                  }

                  return <option disabled>No supported types</option>;
                })()}
              </select>
            </div>

            {/* Currency */}
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="USD">USD ($)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="GBP">GBP (£)</option>
                <option value="EUR">EUR (€)</option>
              </select>
            </div>
          </div>

          {/* Initial Reconciliation Section */}
          <div className="pt-4 border-t border-zinc-800">
            <h3 className="text-sm font-medium text-zinc-300 mb-3">Initial Balance (Optional)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Balance</label>
                <input
                  type="number"
                  step="0.01"
                  value={initialBalance}
                  onChange={(e) => setInitialBalance(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Date</label>
                <input
                  type="date"
                  value={initialDate}
                  onChange={(e) => setInitialDate(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>
            <p className="text-xs text-zinc-500 mt-2">
              If set, this will create an initial reconciliation record for your account.
            </p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
