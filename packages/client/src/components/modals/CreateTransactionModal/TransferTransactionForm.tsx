import { FormField, AmountInput } from '../../forms'
import type { IAccount } from '@finapp/shared/models/account'

interface TransferTransactionFormProps {
    accounts: IAccount[]
    sourceAccountId: string
    destAccountId: string
    setDestAccountId: (id: string) => void
    transferAmount: string
    setTransferAmount: (amount: string) => void
    description: string
    setDescription: (description: string) => void
}

/**
 * Form fields for transfer transactions between accounts.
 */
export function TransferTransactionForm({
    accounts,
    sourceAccountId,
    destAccountId,
    setDestAccountId,
    transferAmount,
    setTransferAmount,
    description,
    setDescription
}: TransferTransactionFormProps) {
    return (
        <>
            <FormField label="Destination Account">
                <select
                    value={destAccountId}
                    onChange={e => setDestAccountId(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                >
                    <option value="">Select Account</option>
                    {accounts.filter(a => a.accountId !== sourceAccountId).map(account => (
                        <option key={account.accountId} value={account.accountId}>
                            {account.name}
                        </option>
                    ))}
                </select>
            </FormField>

            <FormField label="Amount">
                <AmountInput value={transferAmount} onChange={setTransferAmount} required />
            </FormField>

            <FormField label="Description">
                <input
                    type="text"
                    required
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    placeholder="e.g. Monthly Savings"
                />
            </FormField>
        </>
    )
}
