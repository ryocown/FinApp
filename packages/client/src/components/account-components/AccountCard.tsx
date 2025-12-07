import { Wallet, Trash2 } from 'lucide-react'
import type { IAccount } from '@finapp/shared/models/account'

interface AccountCardProps {
    account: IAccount
    onReconcile: (account: IAccount) => void
    onDelete: (account: IAccount) => void
    formatCurrency: (amount: number, currencyCode?: string) => string
}

/**
 * Single account card displayed within an institute section.
 */
export function AccountCard({
    account,
    onReconcile,
    onDelete,
    formatCurrency
}: AccountCardProps) {
    return (
        <div
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
                            onReconcile(account)
                        }}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-md transition-colors opacity-0 group-hover:opacity-100"
                    >
                        Reconcile
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onDelete(account)
                        }}
                        className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete Account"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}
