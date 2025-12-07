import { useState } from 'react'
import { Filter, Download, ArrowUpDown, CheckCircle, Plus } from 'lucide-react'
import { useTransactions, useAccounts } from '../lib/hooks'
import { ReconcileModal } from './ReconcileModal'
import { TransactionDetailModal } from './TransactionDetailModal'
import { CheckpointTimeline } from './CheckpointTimeline'
import { CreateTransactionModal } from './CreateTransactionModal'
import { TransactionFilters, TransactionRow } from './transaction-components'
import type { ITransaction } from '@finapp/shared/models/transaction'

interface TransactionsProps {
  userId: string
}

export function Transactions({ userId }: TransactionsProps) {
  const [limitCount, setLimitCount] = useState(50)
  const [pageToken, setPageToken] = useState<string | null>(null)
  const [pageHistory, setPageHistory] = useState<{ token: string | null; balanceOffset: number }[]>([{ token: null, balanceOffset: 0 }])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all')
  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false)

  // Detail Modal State
  const [selectedTransaction, setSelectedTransaction] = useState<ITransaction | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const { transactions, nextPageToken, error } = useTransactions(userId, limitCount, pageToken, selectedAccountId)
  const { accounts } = useAccounts(userId)

  // Reset pagination when filters change
  const handleFilterChange = (newAccountId: string) => {
    setSelectedAccountId(newAccountId)
    setPageToken(null)
    setPageHistory([{ token: null, balanceOffset: 0 }])
  }

  const handleLimitChange = (limit: number) => {
    setLimitCount(limit)
    setPageToken(null)
    setPageHistory([{ token: null, balanceOffset: 0 }])
  }

  const getAccountName = (accountId: string, accountName?: string) => {
    if (accountId) {
      const account = accounts.find(a => a.accountId === accountId);
      if (account) return account.name;
    }
    return accountName || accountId || 'Unknown';
  };

  const filteredTransactions = transactions.filter(t => {
    const txn = t as ITransaction & { account?: string; category?: string }
    const accountName = getAccountName(t.accountId, txn.account);
    const matchesSearch = (t.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (txn.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (accountName || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  })

  const handleNextPage = () => {
    if (nextPageToken) {
      const currentPageSum = transactions.reduce((sum, t) => sum + t.amount, 0);
      const currentOffset = pageHistory[pageHistory.length - 1].balanceOffset;
      setPageHistory([...pageHistory, { token: nextPageToken, balanceOffset: currentOffset + currentPageSum }])
      setPageToken(nextPageToken)
    }
  }

  const handlePrevPage = () => {
    if (pageHistory.length > 1) {
      const newHistory = [...pageHistory]
      newHistory.pop()
      const prevPage = newHistory[newHistory.length - 1]
      setPageHistory(newHistory)
      setPageToken(prevPage.token)
    }
  }

  const [columnWidths, setColumnWidths] = useState({
    date: 140,
    category: 150,
    account: 180,
    amount: 120,
    balance: 120
  });

  const handleMouseDown = (column: keyof typeof columnWidths, e: React.MouseEvent) => {
    const startX = e.pageX;
    const startWidth = columnWidths[column];

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(50, startWidth + (moveEvent.pageX - startX));
      setColumnWidths(prev => ({ ...prev, [column]: newWidth }));
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleRowClick = (transaction: ITransaction) => {
    setSelectedTransaction(transaction)
    setIsDetailModalOpen(true)
  }

  // Calculate running balance for a transaction
  const calculateRunningBalance = (_transaction: ITransaction, index: number): number => {
    const account = accounts.find(a => a.accountId === selectedAccountId);
    const anchorBalance = account?.balance || 0;
    const pageOffset = pageHistory[pageHistory.length - 1].balanceOffset;
    const startBalance = anchorBalance - pageOffset;
    const previousRowsSum = filteredTransactions.slice(0, index).reduce((sum, t) => sum + t.amount, 0);
    return startBalance - previousRowsSum;
  }

  const [isErrorExpanded, setIsErrorExpanded] = useState(false)

  return (
    <main className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="p-6 border-b border-zinc-800 flex justify-between items-center bg-[#09090b]/80 backdrop-blur-md z-10">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Transactions</h1>
          <p className="text-zinc-400 text-sm">View and manage your financial transactions</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-md text-sm font-medium text-white transition-colors flex items-center gap-2"
          >
            <Plus size={18} />
            New Transaction
          </button>
          {selectedAccountId !== 'all' && (
            <button
              onClick={() => setIsReconcileModalOpen(true)}
              className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-md text-sm font-medium text-zinc-200 transition-colors flex items-center gap-2"
            >
              <CheckCircle size={18} />
              Reconcile
            </button>
          )}
          <button className="bg-zinc-800 hover:bg-zinc-700 p-2 rounded-md text-zinc-200 transition-colors" title="Export">
            <Download size={20} />
          </button>
          <button className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-md text-sm font-medium text-zinc-200 transition-colors flex items-center gap-2">
            <Filter size={18} />
            Filter
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {error && (
            <div
              className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg cursor-pointer hover:bg-red-500/20 transition-colors"
              onClick={() => setIsErrorExpanded(!isErrorExpanded)}
            >
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="font-medium">Error loading transactions (click to see details)</span>
              </div>
              {isErrorExpanded && (
                <pre className="mt-2 text-xs bg-black/30 p-2 rounded overflow-x-auto whitespace-pre-wrap font-mono">
                  {error}
                </pre>
              )}
            </div>
          )}

          {/* Search and Filter Bar - Using extracted component */}
          <TransactionFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            limitCount={limitCount}
            onLimitChange={handleLimitChange}
            selectedAccountId={selectedAccountId}
            onAccountChange={handleFilterChange}
            accounts={accounts}
          />

          {/* Transactions Table */}
          <div className="bg-[#18181b] rounded-xl border border-zinc-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-fixed">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/50">
                    <th className="px-6 py-4 text-sm font-medium text-zinc-400 relative group" style={{ width: columnWidths.date }}>
                      <div className="flex items-center gap-1 cursor-pointer hover:text-zinc-200 transition-colors">
                        Date <ArrowUpDown size={14} />
                      </div>
                      <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500/50 group-hover:bg-zinc-700 transition-colors" onMouseDown={(e) => handleMouseDown('date', e)} />
                    </th>
                    <th className="px-6 py-4 text-sm font-medium text-zinc-400">Description</th>
                    <th className="px-6 py-4 text-sm font-medium text-zinc-400 relative group" style={{ width: columnWidths.category }}>
                      Category
                      <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500/50 group-hover:bg-zinc-700 transition-colors" onMouseDown={(e) => handleMouseDown('category', e)} />
                    </th>
                    <th className="px-6 py-4 text-sm font-medium text-zinc-400 relative group" style={{ width: columnWidths.account }}>
                      Account
                      <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500/50 group-hover:bg-zinc-700 transition-colors" onMouseDown={(e) => handleMouseDown('account', e)} />
                    </th>
                    <th className="px-6 py-4 text-sm font-medium text-zinc-400 text-right relative group" style={{ width: columnWidths.amount }}>
                      Amount
                      <div className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500/50 group-hover:bg-zinc-700 transition-colors" onMouseDown={(e) => handleMouseDown('amount', e)} />
                    </th>
                    {selectedAccountId !== 'all' && (
                      <th className="px-6 py-4 text-sm font-medium text-zinc-400 text-right relative group" style={{ width: columnWidths.balance }}>
                        Balance
                        <div className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-indigo-500/50 group-hover:bg-zinc-700 transition-colors" onMouseDown={(e) => handleMouseDown('balance', e)} />
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {filteredTransactions.map((transaction, index) => (
                    <TransactionRow
                      key={transaction.transactionId}
                      transaction={transaction}
                      accounts={accounts}
                      onClick={handleRowClick}
                      showBalance={selectedAccountId !== 'all'}
                      runningBalance={selectedAccountId !== 'all' ? calculateRunningBalance(transaction, index) : undefined}
                    />
                  ))}
                  {filteredTransactions.length === 0 && (
                    <tr>
                      <td colSpan={selectedAccountId !== 'all' ? 6 : 5} className="px-6 py-12 text-center text-zinc-500">
                        No transactions found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-between text-sm text-zinc-400">
              <span>Showing {filteredTransactions.length} transactions</span>
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 rounded border border-zinc-800 hover:bg-zinc-800 transition-colors disabled:opacity-50"
                  onClick={handlePrevPage}
                  disabled={pageHistory.length <= 1}
                >
                  Previous
                </button>
                <button
                  className="px-3 py-1 rounded border border-zinc-800 hover:bg-zinc-800 transition-colors disabled:opacity-50"
                  onClick={handleNextPage}
                  disabled={!nextPageToken}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        {selectedAccountId !== 'all' && (
          <CheckpointTimeline userId={userId} accountId={selectedAccountId} />
        )}
      </div>

      {selectedAccountId !== 'all' && (
        <ReconcileModal
          isOpen={isReconcileModalOpen}
          onClose={() => setIsReconcileModalOpen(false)}
          accountId={selectedAccountId}
          userId={userId}
          currentBalance={accounts.find(a => a.accountId === selectedAccountId)?.balance || 0}
          onSuccess={() => {
            window.location.reload()
          }}
        />
      )}

      <TransactionDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        transaction={selectedTransaction}
        userId={userId}
        onDelete={() => {
          window.location.reload()
        }}
      />

      <CreateTransactionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        userId={userId}
        onSuccess={() => {
          window.location.reload()
        }}
      />
    </main>
  )
}
