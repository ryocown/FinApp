import { useState, useEffect, useCallback } from 'react'
import { Plus, Building2, Wallet, ChevronDown, Trash2 } from 'lucide-react'
import type { IInstitute } from '@finapp/shared/models/institute'
import type { IAccount } from '@finapp/shared/models/account'
import { ReconcileModal } from './ReconcileModal'
import { CreateInstituteModal } from './CreateInstituteModal'
import { CreateAccountModal } from './CreateAccountModal'
import { DeleteConfirmationModal } from './DeleteConfirmationModal'

interface AccountsProps {
  userId: string
}

interface InstituteWithAccounts extends IInstitute {
  accounts: IAccount[]
  totalValue: number
}

export function Accounts({ userId }: AccountsProps) {
  const [institutes, setInstitutes] = useState<InstituteWithAccounts[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedInstitutes, setExpandedInstitutes] = useState<Set<string>>(new Set())
  const [reconcileAccount, setReconcileAccount] = useState<IAccount | null>(null)

  // Creation Modals State
  const [isCreateInstituteOpen, setIsCreateInstituteOpen] = useState(false)
  const [isCreateAccountOpen, setIsCreateAccountOpen] = useState(false)

  // Deletion State
  const [deleteInstitute, setDeleteInstitute] = useState<IInstitute | null>(null)
  const [deleteAccount, setDeleteAccount] = useState<IAccount | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      // Fetch institutes and accounts in parallel
      const [institutesRes, accountsRes, ratesRes] = await Promise.all([
        fetch(`http://localhost:3001/api/institutes/users/${userId}/institutes`),
        fetch(`http://localhost:3001/api/accounts/users/${userId}/accounts`),
        fetch(`http://localhost:3001/api/currencies/rates`)
      ])

      if (!institutesRes.ok || !accountsRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const institutesData: IInstitute[] = await institutesRes.json()
      const accountsData: IAccount[] = await accountsRes.json()
      const rates: Record<string, number> = ratesRes.ok ? await ratesRes.json() : {}

      // Group accounts by institute
      const institutesWithAccounts = institutesData.map(institute => {
        const instituteAccounts = accountsData.filter(acc => acc.instituteId === institute.instituteId)
        const totalValue = instituteAccounts.reduce((sum, acc) => {
          let balanceInUSD = acc.balance;
          if (acc.currency.code !== 'USD') {
            // Try to find rate
            // JPY -> USD: rate is JPYUSD
            // If we had USDJPY, we'd divide.
            // Assuming canonical JPYUSD (rate < 1)
            const pairId = acc.currency.code < 'USD' ? `${acc.currency.code}USD` : `USD${acc.currency.code}`;
            const rate = rates[pairId];
            if (rate) {
              balanceInUSD = acc.balance * rate;
            }
          }
          return sum + balanceInUSD;
        }, 0)

        return {
          ...institute,
          accounts: instituteAccounts,
          totalValue
        }
      })

      setInstitutes(institutesWithAccounts)
    } catch (error) {
      console.error('Error fetching accounts data:', error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const toggleInstitute = (instituteId: string) => {
    const newExpanded = new Set(expandedInstitutes)
    if (newExpanded.has(instituteId)) {
      newExpanded.delete(instituteId)
    } else {
      newExpanded.add(instituteId)
    }
    setExpandedInstitutes(newExpanded)
  }

  const handleDeleteInstitute = async () => {
    if (!deleteInstitute) return
    setIsDeleting(true)
    try {
      const res = await fetch(`http://localhost:3001/api/institutes/users/${userId}/institutes/${deleteInstitute.instituteId}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        await fetchData()
        setDeleteInstitute(null)
      } else {
        alert('Failed to delete institute')
      }
    } catch (error) {
      console.error('Error deleting institute:', error)
      alert('Error deleting institute')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!deleteAccount) return
    setIsDeleting(true)
    try {
      const res = await fetch(`http://localhost:3001/api/accounts/users/${userId}/accounts/${deleteAccount.accountId}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        await fetchData()
        setDeleteAccount(null)
      } else {
        alert('Failed to delete account')
      }
    } catch (error) {
      console.error('Error deleting account:', error)
      alert('Error deleting account')
    } finally {
      setIsDeleting(false)
    }
  }

  const formatCurrency = (amount: number, currencyCode: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex-1 bg-[#09090b] p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-[#09090b] p-8 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Accounts</h1>
            <p className="text-zinc-400">Manage your accounts across all institutes</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsCreateInstituteOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <Building2 size={16} />
              Add Institute
            </button>
            <button
              onClick={() => setIsCreateAccountOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <Plus size={16} />
              Add Account
            </button>
          </div>
        </header>

        <div className="grid gap-4">
          {institutes.map((institute) => (
            <div
              key={institute.instituteId}
              className="bg-[#18181b] border border-zinc-800 rounded-xl overflow-hidden transition-all duration-200 hover:border-zinc-700"
            >
              <button
                onClick={() => toggleInstitute(institute.instituteId)}
                className="w-full p-5 flex items-center justify-between hover:bg-zinc-800/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <Building2 size={20} />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-white text-lg">{institute.name}</h3>
                    <p className="text-sm text-zinc-400">{institute.accounts.length} Accounts</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-zinc-400 mb-0.5">Total Value</p>
                    <p className="font-mono font-medium text-emerald-400">
                      {formatCurrency(institute.totalValue)}
                    </p>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteInstitute(institute)
                    }}
                    className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors z-10"
                    title="Delete Institute"
                  >
                    <Trash2 size={20} />
                  </button>

                  <div className={`text-zinc-500 transition-transform duration-200 ${expandedInstitutes.has(institute.instituteId) ? 'rotate-180' : ''}`}>
                    <ChevronDown size={20} />
                  </div>
                </div>
              </button>

              {expandedInstitutes.has(institute.instituteId) && (
                <div className="border-t border-zinc-800 bg-zinc-900/30">
                  {institute.accounts.length > 0 ? (
                    <div className="divide-y divide-zinc-800/50">
                      {institute.accounts.map((account) => (
                        <div
                          key={account.accountId}
                          className="p-4 pl-[4.5rem] flex items-center justify-between hover:bg-zinc-800/30 transition-colors group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-md bg-zinc-800 text-zinc-400 group-hover:text-zinc-300 transition-colors">
                              <Wallet size={16} />
                            </div>
                            <div>
                              <p className="font-medium text-zinc-200">{account.name}</p>
                              <p className="text-xs text-zinc-500 font-mono capitalize">{account.AccountType}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <p className="font-mono text-zinc-300">
                              {formatCurrency(account.balance, account.currency.code)}
                            </p>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setReconcileAccount(account)
                                }}
                                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-md transition-colors opacity-0 group-hover:opacity-100"
                              >
                                Reconcile
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setDeleteAccount(account)
                                }}
                                className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                title="Delete Account"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-zinc-500 italic">
                      No accounts found for this institute.
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {reconcileAccount && (
        <ReconcileModal
          isOpen={!!reconcileAccount}
          onClose={() => setReconcileAccount(null)}
          accountId={reconcileAccount.accountId!}
          userId={userId}
          currentBalance={reconcileAccount.balance}
          onSuccess={() => {
            fetchData()
          }}
        />
      )}

      <CreateInstituteModal
        isOpen={isCreateInstituteOpen}
        onClose={() => setIsCreateInstituteOpen(false)}
        userId={userId}
        onSuccess={fetchData}
      />

      <CreateAccountModal
        isOpen={isCreateAccountOpen}
        onClose={() => setIsCreateAccountOpen(false)}
        userId={userId}
        institutes={institutes}
        onSuccess={fetchData}
      />

      <DeleteConfirmationModal
        isOpen={!!deleteInstitute}
        onClose={() => setDeleteInstitute(null)}
        onConfirm={handleDeleteInstitute}
        title="Delete Institute"
        message="Are you sure you want to delete this institute? This will permanently delete all associated accounts and transactions. This action cannot be undone."
        itemName={deleteInstitute?.name}
        loading={isDeleting}
      />

      <DeleteConfirmationModal
        isOpen={!!deleteAccount}
        onClose={() => setDeleteAccount(null)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message="Are you sure you want to delete this account? This will permanently delete all associated transactions and history. This action cannot be undone."
        itemName={deleteAccount?.name}
        loading={isDeleting}
      />
    </div>
  )
}
