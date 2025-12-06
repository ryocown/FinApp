import { useState } from 'react'
import { getCategoryColor } from '../lib/utils'
import { Search, Filter, Download, ArrowUpDown, CheckCircle } from 'lucide-react'
import { useTransactions, useAccounts } from '../lib/hooks'
import { ReconcileModal } from './ReconcileModal'
import { TransactionDetailModal } from './TransactionDetailModal'
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

  const { transactions, nextPageToken, error } = useTransactions(userId, limitCount, pageToken, selectedAccountId)
  const { accounts } = useAccounts(userId)

  // Reset pagination when filters change
  const handleFilterChange = (newAccountId: string) => {
    setSelectedAccountId(newAccountId)
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
    const accountName = getAccountName(t.accountId, t.account);
    const matchesSearch = (t.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.category || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (accountName || '').toLowerCase().includes(searchTerm.toLowerCase());
    // Server already filters by account, but we keep this for search filtering and safety
    return matchesSearch;
  })

  const handleNextPage = () => {
    if (nextPageToken) {
      // Calculate offset for the next page (sum of current page amounts)
      // Note: We are walking backwards in time, so we subtract the amounts?
      // No, to get the starting balance of the NEXT page (older), 
      // we need to subtract all amounts of the CURRENT page from the current start balance.
      // Offset tracks how much we have subtracted from the Anchor.
      const currentPageSum = transactions.reduce((sum, t) => sum + t.amount, 0);
      const currentOffset = pageHistory[pageHistory.length - 1].balanceOffset;

      setPageHistory([...pageHistory, { token: nextPageToken, balanceOffset: currentOffset + currentPageSum }])
      setPageToken(nextPageToken)
    }
  }

  const handlePrevPage = () => {
    if (pageHistory.length > 1) {
      const newHistory = [...pageHistory]
      newHistory.pop() // Remove current page
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

  const [isErrorExpanded, setIsErrorExpanded] = useState(false)

  return (
    <main className="flex-1 overflow-auto">
      {/* ... header ... */}
      <header className="p-6 border-b border-zinc-800 flex justify-between items-center bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Transactions</h1>
          <p className="text-zinc-400 text-sm">View and manage your financial transactions</p>
        </div>
        <div className="flex items-center gap-2">
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

      {selectedAccountId !== 'all' && (
        <ReconcileModal
          isOpen={isReconcileModalOpen}
          onClose={() => setIsReconcileModalOpen(false)}
          accountId={selectedAccountId}
          userId={userId}
          currentBalance={accounts.find(a => a.accountId === selectedAccountId)?.balance || 0}
          onSuccess={() => {
            // Ideally refresh accounts here, but for MVP a reload or just updated balance is fine
            // We can force a refresh if we exposed a refresh function from useAccounts
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
          // Refresh transactions
          // We can do this by resetting the page token or invalidating the cache
          // For now, let's just reload the current view by toggling a refresh trigger or similar
          // But since useTransactions depends on [userId, limitCount, pageToken, accountId], 
          // we can just force a re-fetch if we had a way.
          // A simple way is to reload the page or reset pagination.
          // Let's reset pagination to the start.
          setPageToken(null)
          setPageHistory([{ token: null, balanceOffset: 0 }])
          // We might need to toggle a dummy state to force re-fetch if params didn't change,
          // but setPageToken(null) usually triggers it if we were not on the first page.
          // If we were on the first page, we need another way.
          // Actually, useTransactions runs on dependency change.
          // Let's add a refresh key to useTransactions?
          // For now, let's just reload the window as a simple MVP solution, similar to ReconcileModal
          window.location.reload()
        }}
      />

      <div className="p-6 space-y-6">
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
        {/* Search and Filter Bar */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
            <input
              type="text"
              placeholder="Search transactions..."
              className="w-full bg-[#18181b] border border-zinc-800 rounded-lg pl-10 pr-4 py-2.5 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            id="pagination-limit"
            className="bg-[#18181b] border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
            value={limitCount}
            onChange={(e) => {
              setLimitCount(Number(e.target.value))
              setPageToken(null)
              setPageHistory([{ token: null, balanceOffset: 0 }])
            }}
          >
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
            <option value={150}>150 per page</option>
            <option value={200}>200 per page</option>
          </select>
          <select
            id="account-filter"
            className="bg-[#18181b] border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
            value={selectedAccountId}
            onChange={(e) => {
              handleFilterChange(e.target.value)
            }}
          >
            <option value="all">All Accounts</option>
            {accounts.map(account => (
              <option key={account.accountId} value={account.accountId}>{account.name}</option>
            ))}
          </select>
        </div>

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
                {filteredTransactions.map((transaction) => (
                  <tr
                    key={transaction.transactionId}
                    className="hover:bg-zinc-800/50 transition-colors group cursor-pointer"
                    onClick={() => handleRowClick(transaction)}
                  >
                    <td className="px-6 py-4 text-sm text-zinc-300 whitespace-nowrap">
                      {new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-zinc-100 truncate" title={transaction.description || ''}>
                      {transaction.description}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${getCategoryColor(transaction.category || transaction.categoryId)}`}>
                        {transaction.category || transaction.categoryId || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-400 truncate">
                      {getAccountName(transaction.accountId, transaction.account)}
                    </td>
                    <td className={`px-6 py-4 text-sm font-medium text-right whitespace-nowrap ${transaction.amount >= 0 ? 'text-emerald-400' : 'text-zinc-100'}`}>
                      {transaction.amount >= 0 ? '+' : ''}{transaction.amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                    </td>
                    {selectedAccountId !== 'all' && (() => {
                      // Calculate running balance for this row
                      // Start with Account Balance (Anchor)
                      const account = accounts.find(a => a.accountId === selectedAccountId);
                      const anchorBalance = account?.balance || 0;

                      // Subtract offset from previous pages
                      const pageOffset = pageHistory[pageHistory.length - 1].balanceOffset;
                      const startBalance = anchorBalance - pageOffset;

                      // Calculate balance for this specific row
                      // We need the sum of all transactions in THIS page BEFORE this row
                      // filteredTransactions is the current page list
                      const index = filteredTransactions.findIndex(t => t.transactionId === transaction.transactionId);
                      // Sum of amounts from 0 to index-1
                      const previousRowsSum = filteredTransactions.slice(0, index).reduce((sum, t) => sum + t.amount, 0);

                      // Balance at this row = StartBalance - PreviousRowsSum
                      const rowBalance = startBalance - previousRowsSum;

                      return (
                        <td className="px-6 py-4 text-sm text-zinc-400 text-right whitespace-nowrap">
                          {rowBalance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                        </td>
                      );
                    })()}
                  </tr>
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
    </main>
  )
}
