import { Building2, ChevronDown, Trash2 } from 'lucide-react'
import type { IInstitute } from '@finapp/shared/models/institute'
import type { Account } from '@finapp/shared/models/account'
import { AccountCard } from './AccountCard'

interface InstituteWithAccounts extends IInstitute {
    accounts: Account[]
    totalValue: number
}

interface InstituteSectionProps {
    institute: InstituteWithAccounts
    isExpanded: boolean
    onToggle: (instituteId: string) => void
    onDeleteInstitute: (institute: IInstitute) => void
    onReconcileAccount: (account: Account) => void
    onImportAccount: (account: Account) => void
    onDeleteAccount: (account: Account) => void
    onViewDetailsAccount: (account: Account) => void
    formatCurrency: (amount: number, currencyCode?: string) => string
    onAccountClick: (accountId: string) => void
}

/**
 * Collapsible institute section with accounts list.
 */
export function InstituteSection({
    institute,
    isExpanded,
    onToggle,
    onDeleteInstitute,
    onReconcileAccount,
    onImportAccount,
    onDeleteAccount,
    onViewDetailsAccount,
    formatCurrency,
    onAccountClick
}: InstituteSectionProps) {
    return (
        <div className="bg-[#18181b] border border-zinc-800 rounded-xl overflow-hidden transition-all duration-200 hover:border-zinc-700">
            <div
                role="button"
                tabIndex={0}
                onClick={() => onToggle(institute.instituteId)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onToggle(institute.instituteId)
                    }
                }}
                className="w-full p-5 flex items-center justify-between hover:bg-zinc-800/50 transition-colors cursor-pointer outline-none focus:ring-1 focus:ring-inset focus:ring-indigo-500/50"
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
                            onDeleteInstitute(institute)
                        }}
                        className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors z-10"
                        title="Delete Institute"
                    >
                        <Trash2 size={20} />
                    </button>

                    <div className={`text-zinc-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown size={20} />
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="border-t border-zinc-800 bg-zinc-900/30">
                    {institute.accounts.length > 0 ? (
                        <div className="divide-y divide-zinc-800/50">
                            {institute.accounts.map((account) => (
                                <AccountCard
                                    key={account.accountId}
                                    account={account}
                                    onReconcile={onReconcileAccount}
                                    onImport={onImportAccount}
                                    onDelete={onDeleteAccount}
                                    onViewDetails={onViewDetailsAccount}
                                    formatCurrency={formatCurrency}
                                    onClick={() => onAccountClick(account.accountId)}
                                />
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
    )
}
