import { Search } from 'lucide-react'
import type { Account } from '@finapp/shared/models/account'

interface TransactionFiltersProps {
    searchTerm: string
    setSearchTerm: (term: string) => void
    limitCount: number
    onLimitChange: (limit: number) => void
    selectedAccountId: string
    onAccountChange: (accountId: string) => void
    accounts: Account[]
}

/**
 * Search and filter bar for transactions.
 */
export function TransactionFilters({
    searchTerm,
    setSearchTerm,
    limitCount,
    onLimitChange,
    selectedAccountId,
    onAccountChange,
    accounts
}: TransactionFiltersProps) {
    return (
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
                onChange={(e) => onLimitChange(Number(e.target.value))}
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
                onChange={(e) => onAccountChange(e.target.value)}
            >
                <option value="all">All Accounts</option>
                {accounts.map(account => (
                    <option key={account.accountId} value={account.accountId}>{account.name}</option>
                ))}
            </select>
        </div>
    )
}
