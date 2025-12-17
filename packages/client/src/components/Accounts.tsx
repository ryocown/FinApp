import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Building2 } from 'lucide-react'
import type { IInstitute } from '@finapp/shared/models/institute'
import type { Account } from '@finapp/shared/models/account'
import { ReconcileModal } from './ReconcileModal'
import { CreateInstituteModal } from './CreateInstituteModal'
import { CreateAccountModal } from './CreateAccountModal'
import { ImportModal } from './modals/ImportModal'
import { DeleteConfirmationModal } from './DeleteConfirmationModal'
import { AccountDetailModal } from './AccountDetailModal'
import { InstituteSection } from './account-components'

interface AccountsProps {
  userId: string
}

interface InstituteWithAccounts extends IInstitute {
  accounts: Account[]
  totalValue: number
}

export function Accounts({ userId }: AccountsProps) {
  const navigate = useNavigate()
  const [institutes, setInstitutes] = useState<InstituteWithAccounts[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedInstitutes, setExpandedInstitutes] = useState<Set<string>>(new Set())
  const [reconcileAccount, setReconcileAccount] = useState<Account | null>(null)
  const [importAccount, setImportAccount] = useState<Account | null>(null)
  const [detailAccount, setDetailAccount] = useState<Account | null>(null)

  // Creation Modals State
  const [isCreateInstituteOpen, setIsCreateInstituteOpen] = useState(false)
  const [isCreateAccountOpen, setIsCreateAccountOpen] = useState(false)

  // Deletion State
  const [deleteInstitute, setDeleteInstitute] = useState<IInstitute | null>(null)
  const [deleteAccount, setDeleteAccount] = useState<Account | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [institutesRes, accountsRes, ratesRes] = await Promise.all([
        fetch(`http://localhost:3001/api/institutes/users/${userId}/institutes`),
        fetch(`http://localhost:3001/api/accounts/users/${userId}/accounts`),
        fetch(`http://localhost:3001/api/currencies/rates`)
      ])

      if (!institutesRes.ok || !accountsRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const institutesData: IInstitute[] = await institutesRes.json()
      const accountsData: Account[] = await accountsRes.json()
      const rates: Record<string, number> = ratesRes.ok ? await ratesRes.json() : {}

      const institutesWithAccounts = institutesData.map(institute => {
        const instituteAccounts = accountsData.filter(acc => acc.instituteId === institute.instituteId)
        const totalValue = instituteAccounts.reduce((sum, acc) => {
          let balanceInUSD = acc.balance;
          if (acc.currency.code !== 'USD') {
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

  const handleUpdateAccount = async (accountId: string, updates: Partial<Account>) => {
    try {
      const res = await fetch(`http://localhost:3001/api/accounts/users/${userId}/accounts/${accountId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (res.ok) {
        await fetchData()
      } else {
        alert('Failed to update account')
      }
    } catch (error) {
      console.error('Error updating account:', error)
      alert('Error updating account')
    }
  }

  const formatCurrency = (amount: number, currencyCode: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(amount)
  }

  const handleAccountClick = (accountId: string) => {
    navigate(`/transactions?account=${accountId}`)
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

        {/* Institute Sections - Using extracted component */}
        <div className="grid gap-4">
          {institutes.map((institute) => (
            <InstituteSection
              key={institute.instituteId}
              institute={institute}
              isExpanded={expandedInstitutes.has(institute.instituteId)}
              onToggle={toggleInstitute}
              onDeleteInstitute={setDeleteInstitute}
              onReconcileAccount={setReconcileAccount}
              onImportAccount={setImportAccount}
              onDeleteAccount={setDeleteAccount}
              onViewDetailsAccount={setDetailAccount}
              formatCurrency={formatCurrency}
              onAccountClick={handleAccountClick}
            />
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
          currencyCode={reconcileAccount.currency.code}
          onSuccess={() => {
            fetchData()
          }}
        />
      )}

      {importAccount && (
        <ImportModal
          isOpen={!!importAccount}
          onClose={() => setImportAccount(null)}
          account={importAccount}
          instituteName={institutes.find(i => i.instituteId === importAccount.instituteId)?.name || ''}
          userId={userId}
          onSuccess={() => {
            fetchData()
          }}
        />
      )}

      {detailAccount && (
        <AccountDetailModal
          isOpen={!!detailAccount}
          onClose={() => setDetailAccount(null)}
          account={detailAccount}
          onUpdate={handleUpdateAccount}
          onDelete={(account) => {
            setDetailAccount(null)
            setDeleteAccount(account)
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
