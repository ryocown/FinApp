import { FormField, AmountInput } from '../../forms'
import { CategoryPicker } from '../../forms/CategoryPicker'

interface GeneralTransactionFormProps {
    generalType: 'EXPENSE' | 'INCOME'
    setGeneralType: (type: 'EXPENSE' | 'INCOME') => void
    amount: string
    setAmount: (amount: string) => void
    description: string
    setDescription: (description: string) => void
    category: string
    setCategory: (category: string) => void
    currencySymbol: string
}

/**
 * Form fields for general expense/income transactions.
 */
export function GeneralTransactionForm({
    generalType,
    setGeneralType,
    amount,
    setAmount,
    description,
    setDescription,
    category,
    setCategory,
    currencySymbol
}: GeneralTransactionFormProps) {
    return (
        <>
            <FormField label="Type">
                <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
                    <button
                        type="button"
                        onClick={() => setGeneralType('EXPENSE')}
                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${generalType === 'EXPENSE'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/20'
                            : 'text-zinc-400 hover:text-zinc-200'
                            }`}
                    >
                        Expense
                    </button>
                    <button
                        type="button"
                        onClick={() => setGeneralType('INCOME')}
                        className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${generalType === 'INCOME'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                            : 'text-zinc-400 hover:text-zinc-200'
                            }`}
                    >
                        Income
                    </button>
                </div>
            </FormField>

            <FormField label="Amount">
                <AmountInput value={amount} onChange={setAmount} required currencySymbol={currencySymbol} />
            </FormField>

            <FormField label="Description">
                <input
                    type="text"
                    required
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    placeholder="e.g. Groceries"
                />
            </FormField>

            <FormField label="Category">
                <CategoryPicker value={category} onChange={setCategory} />
            </FormField>
        </>
    )
}
