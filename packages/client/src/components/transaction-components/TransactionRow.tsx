import { getCategoryColor } from '../../lib/utils'
import type { ITransaction } from '@finapp/shared/models/transaction'
import type { IAccount } from '@finapp/shared/models/account'

interface TransactionRowProps {
    transaction: ITransaction
    accounts: IAccount[]
    onClick: (transaction: ITransaction) => void
    showBalance: boolean
    runningBalance?: number
}

/**
 * Single transaction row component.
 */
export function TransactionRow({
    transaction,
    accounts,
    onClick,
    showBalance,
    runningBalance
}: TransactionRowProps) {
    const getAccountName = (accountId: string, accountName?: string) => {
        if (accountId) {
            const account = accounts.find(a => a.accountId === accountId)
            if (account) return account.name
        }
        return accountName || accountId || 'Unknown'
    }

    return (
        <tr
            className="hover:bg-zinc-800/50 transition-colors group cursor-pointer"
            onClick={() => onClick(transaction)}
        >
            <td className="px-6 py-4 text-sm text-zinc-300 whitespace-nowrap">
                {new Date(transaction.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </td>
            <td className="px-6 py-4 text-sm font-medium text-zinc-100 truncate" title={transaction.description || ''}>
                {transaction.description}
            </td>
            <td className="px-6 py-4 text-sm text-zinc-400 whitespace-nowrap">
                {transaction.transactionType.charAt(0).toUpperCase() + transaction.transactionType.slice(1).toLowerCase()}
            </td>
            <td className="px-6 py-4 text-sm">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${getCategoryColor(transaction.categoryId)}`}>
                    {transaction.categoryId || 'Uncategorized'}
                </span>
            </td>
            <td className="px-6 py-4 text-sm text-zinc-400 truncate">
                {getAccountName(transaction.accountId)}
            </td>
            <td className={`px-6 py-4 text-sm font-medium text-right whitespace-nowrap ${transaction.amount >= 0 ? 'text-emerald-400' : 'text-zinc-100'}`}>
                {transaction.amount >= 0 ? '+' : ''}{transaction.amount.toLocaleString('en-US', { style: 'currency', currency: transaction.currency?.code || 'USD' })}
            </td>
            {showBalance && runningBalance !== undefined && (
                <td className="px-6 py-4 text-sm text-zinc-400 text-right whitespace-nowrap">
                    {runningBalance.toLocaleString('en-US', { style: 'currency', currency: transaction.currency?.code || 'USD' })}
                </td>
            )}
        </tr>
    )
}
