import { useState, useEffect } from 'react'
import { Save, Loader2, ArrowRightLeft, TrendingUp, Receipt } from 'lucide-react'
import { useAccounts } from '../../../lib/hooks'
import { createTransaction, createTransfer } from '../../../lib/api'
import { TransactionType, TransferTransaction } from '@finapp/shared/models/transaction'
import type { IFinancialInstrument } from '@finapp/shared/models/financial_instrument'
import { ModalWrapper } from '../ModalWrapper'
import { FormField } from '../../forms'
import { GeneralTransactionForm } from './GeneralTransactionForm'
import { TradeTransactionForm } from './TradeTransactionForm'
import { TransferTransactionForm } from './TransferTransactionForm'

interface CreateTransactionModalProps {
    isOpen: boolean
    onClose: () => void
    userId: string
    onSuccess?: () => void
}

type TabType = 'GENERAL' | 'TRADE' | 'TRANSFER'

/**
 * Modal for creating new transactions (general, trade, or transfer).
 * Refactored to use extracted form components.
 */
export function CreateTransactionModal({ isOpen, onClose, userId, onSuccess }: CreateTransactionModalProps) {
    const { accounts } = useAccounts(userId)
    const [activeTab, setActiveTab] = useState<TabType>('GENERAL')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Common State
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [description, setDescription] = useState('')
    const [accountId, setAccountId] = useState('')

    // General State
    const [amount, setAmount] = useState('')
    const [generalType, setGeneralType] = useState<'EXPENSE' | 'INCOME'>('EXPENSE')
    const [category, setCategory] = useState('')

    // Trade State
    const [ticker, setTicker] = useState('')
    const [quantity, setQuantity] = useState('')
    const [price, setPrice] = useState('')
    const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY')
    const [selectedInstrument, setSelectedInstrument] = useState<IFinancialInstrument | null>(null)

    // Transfer State
    const [destAccountId, setDestAccountId] = useState('')
    const [transferAmount, setTransferAmount] = useState('')

    // Set default account
    useEffect(() => {
        if (accounts.length > 0 && !accountId) {
            setAccountId(accounts[0].accountId)
        }
    }, [accounts, accountId])

    // Reset error when tab changes
    useEffect(() => {
        setError(null)
    }, [activeTab])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsSubmitting(true)

        try {
            if (!accountId) throw new Error('Please select an account')

            const selectedAccount = accounts.find(a => a.accountId === accountId)
            if (!selectedAccount) throw new Error('Invalid account')

            if (activeTab === 'GENERAL') {
                if (!amount) throw new Error('Please enter an amount')
                if (!description) throw new Error('Please enter a description')

                const numAmount = parseFloat(amount)
                if (isNaN(numAmount)) throw new Error('Invalid amount')

                const finalAmount = generalType === 'EXPENSE' ? -Math.abs(numAmount) : Math.abs(numAmount)

                await createTransaction(userId, {
                    accountId,
                    date: new Date(date),
                    description,
                    amount: finalAmount,
                    currency: selectedAccount.currency,
                    transactionType: TransactionType.General,
                    categoryId: category || 'Uncategorized',
                    tagIds: []
                })

            } else if (activeTab === 'TRADE') {
                if (!quantity || !price) throw new Error('Please enter quantity and price')
                if (!selectedInstrument) throw new Error('Please select a valid instrument from search')

                const numQty = parseFloat(quantity)
                const numPrice = parseFloat(price)
                const totalValue = numQty * numPrice
                const finalAmount = tradeType === 'BUY' ? -Math.abs(totalValue) : Math.abs(totalValue)

                await createTransaction(userId, {
                    accountId,
                    date: new Date(date),
                    description: description || `${tradeType} ${(selectedInstrument as any).ticker || ticker}`,
                    amount: finalAmount,
                    currency: selectedAccount.currency,
                    transactionType: TransactionType.Trade,
                    instrumentId: selectedInstrument.instrumentId,
                    quantity: numQty,
                    price: numPrice,
                    tagIds: []
                } as any)

            } else if (activeTab === 'TRANSFER') {
                if (!destAccountId) throw new Error('Please select a destination account')
                if (!transferAmount) throw new Error('Please enter an amount')

                const destAccount = accounts.find(a => a.accountId === destAccountId)
                if (!destAccount) throw new Error('Invalid destination account')

                const numAmount = parseFloat(transferAmount)

                const [sourceTx, destTx] = TransferTransaction.createTransferPair(
                    accountId,
                    destAccountId,
                    userId,
                    -Math.abs(numAmount),
                    selectedAccount.currency,
                    Math.abs(numAmount),
                    destAccount.currency,
                    new Date(date),
                    description || 'Transfer'
                )

                await createTransfer(userId, { source: sourceTx, destination: destTx })
            }

            onSuccess?.()
            onClose()
            resetForm()
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setIsSubmitting(false)
        }
    }

    const resetForm = () => {
        setDescription('')
        setAmount('')
        setCategory('')
        setDate(new Date().toISOString().split('T')[0])
        setTicker('')
        setQuantity('')
        setPrice('')
        setTransferAmount('')
        setSelectedInstrument(null)
    }

    const selectedAccount = accounts.find(a => a.accountId === accountId)

    return (
        <ModalWrapper isOpen={isOpen} onClose={onClose} title="New Transaction" maxWidth="2xl">
            {/* Tabs */}
            <div className="flex border-b border-zinc-800 shrink-0">
                <button
                    onClick={() => setActiveTab('GENERAL')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'GENERAL' ? 'bg-zinc-800 text-white border-b-2 border-indigo-500' : 'text-zinc-400 hover:text-zinc-200'}`}
                >
                    <Receipt size={16} />
                    General
                </button>
                <button
                    onClick={() => setActiveTab('TRADE')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'TRADE' ? 'bg-zinc-800 text-white border-b-2 border-indigo-500' : 'text-zinc-400 hover:text-zinc-200'}`}
                >
                    <TrendingUp size={16} />
                    Trade
                </button>
                <button
                    onClick={() => setActiveTab('TRANSFER')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${activeTab === 'TRANSFER' ? 'bg-zinc-800 text-white border-b-2 border-indigo-500' : 'text-zinc-400 hover:text-zinc-200'}`}
                >
                    <ArrowRightLeft size={16} />
                    Transfer
                </button>
            </div>

            {/* Form Content */}
            <div className="p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Common Fields */}
                    <div className="grid grid-cols-2 gap-4">
                        <FormField label="Date">
                            <input
                                type="date"
                                required
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                            />
                        </FormField>
                        <FormField label="Account">
                            <select
                                value={accountId}
                                onChange={e => setAccountId(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                            >
                                {accounts.map(account => (
                                    <option key={account.accountId} value={account.accountId}>
                                        {account.name}
                                    </option>
                                ))}
                            </select>
                        </FormField>
                    </div>

                    {/* Tab-specific forms */}
                    {activeTab === 'GENERAL' && (
                        <GeneralTransactionForm
                            generalType={generalType}
                            setGeneralType={setGeneralType}
                            amount={amount}
                            setAmount={setAmount}
                            description={description}
                            setDescription={setDescription}
                            category={category}
                            setCategory={setCategory}
                            currencySymbol={selectedAccount?.currency.symbol || '$'}
                        />
                    )}

                    {activeTab === 'TRADE' && (
                        <TradeTransactionForm
                            tradeType={tradeType}
                            setTradeType={setTradeType}
                            ticker={ticker}
                            setTicker={setTicker}
                            quantity={quantity}
                            setQuantity={setQuantity}
                            price={price}
                            setPrice={setPrice}
                            description={description}
                            setDescription={setDescription}
                            selectedInstrument={selectedInstrument}
                            setSelectedInstrument={setSelectedInstrument}
                            currencySymbol={selectedAccount?.currency.symbol || '$'}
                        />
                    )}

                    {activeTab === 'TRANSFER' && (
                        <TransferTransactionForm
                            accounts={accounts}
                            sourceAccountId={accountId}
                            destAccountId={destAccountId}
                            setDestAccountId={setDestAccountId}
                            transferAmount={transferAmount}
                            setTransferAmount={setTransferAmount}
                            description={description}
                            setDescription={setDescription}
                            currencySymbol={selectedAccount?.currency.symbol || '$'}
                        />
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-6"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 size={18} className="animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Save size={18} />
                                Create Transaction
                            </>
                        )}
                    </button>
                </form>
            </div>
        </ModalWrapper>
    )
}
