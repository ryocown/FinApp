import { useState, useEffect } from 'react'
import { X, Save, Loader2, ArrowRightLeft, TrendingUp, Receipt, Search, ChevronDown } from 'lucide-react'
import { useAccounts } from '../lib/hooks'
import { createTransaction, createTransfer, searchInstruments } from '../lib/api'
import { TransactionType, TransferTransaction } from '@finapp/shared/models/transaction'
import { ExpenseTree } from '@finapp/shared/models/category'

interface CreateTransactionModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  onSuccess?: () => void
}

type TabType = 'GENERAL' | 'TRADE' | 'TRANSFER'

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
  const [isCategoryOpen, setIsCategoryOpen] = useState(false)
  // Category Search State
  const [categorySearch, setCategorySearch] = useState('')
  const [filteredCategories, setFilteredCategories] = useState<any[]>([])

  // Trade State
  const [ticker, setTicker] = useState('')
  const [quantity, setQuantity] = useState('')
  const [price, setPrice] = useState('')
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedInstrument, setSelectedInstrument] = useState<any>(null)

  // Transfer State
  const [destAccountId, setDestAccountId] = useState('')
  const [transferAmount, setTransferAmount] = useState('')

  // Set default account
  useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].accountId)
    }
  }, [accounts, accountId])

  // Reset state when tab changes
  useEffect(() => {
    setError(null)
  }, [activeTab])

  // Instrument Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (ticker && !selectedInstrument) {
        setIsSearching(true)
        try {
          const results = await searchInstruments(ticker)
          setSearchResults(results)
        } catch (err) {
          console.error(err)
        } finally {
          setIsSearching(false)
        }
      } else {
        setSearchResults([])
      }
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [ticker, selectedInstrument])

  // Filter categories when search changes
  useEffect(() => {
    if (!categorySearch) {
      setFilteredCategories(Object.values(ExpenseTree.Expense))
      return
    }
    const lower = categorySearch.toLowerCase()
    const filtered = Object.values(ExpenseTree.Expense).filter(c =>
      c.name.toLowerCase().includes(lower) || c.category.toLowerCase().includes(lower)
    )
    setFilteredCategories(filtered)
  }, [categorySearch])

  // Initialize filtered categories
  useEffect(() => {
    setFilteredCategories(Object.values(ExpenseTree.Expense))
  }, [])

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

        const payload = {
          accountId,
          date: new Date(date).toISOString(),
          description,
          amount: finalAmount,
          currency: selectedAccount.currency,
          transactionType: TransactionType.General,
          categoryId: category || 'Uncategorized',
          tagIds: []
        }

        await createTransaction(userId, payload)

      } else if (activeTab === 'TRADE') {
        if (!quantity || !price) throw new Error('Please enter quantity and price')
        if (!ticker && !selectedInstrument) throw new Error('Please select an instrument')

        const numQty = parseFloat(quantity)
        const numPrice = parseFloat(price)

        // Buy = Negative Amount (Cash Out), Sell = Positive Amount (Cash In)
        // Amount = Quantity * Price
        const totalValue = numQty * numPrice
        const finalAmount = tradeType === 'BUY' ? -Math.abs(totalValue) : Math.abs(totalValue)

        const payload = {
          accountId,
          date: new Date(date).toISOString(),
          description: description || `${tradeType} ${selectedInstrument?.ticker || ticker}`,
          amount: finalAmount,
          currency: selectedAccount.currency,
          transactionType: TransactionType.Trade,
          instrumentId: selectedInstrument?.id || 'manual', // Backend should handle manual or we need to create it first? 
          // For now assuming backend handles 'manual' or we just pass the ticker in description/metadata if instrumentId is required.
          // Actually, the model requires `instrumentId`. If we don't have one, we might fail.
          // Let's assume the user MUST pick from search or we create one on the fly?
          // The backend `POST /instruments` creates one.
          // For this MVP, let's require selecting from search or just passing a placeholder if not found (which might fail validation).
          // Let's use the ticker as ID if no instrument selected (hacky but works if ID is arbitrary string).
          // Better: If selectedInstrument is null, we can't proceed easily without creating it.
          // Let's enforce selection for now or use a "Manual" ID.
          quantity: numQty,
          price: numPrice,
          tagIds: []
        }

        // If we have a selected instrument, use its ID. If not, we might need to create it first?
        // Let's assume for now we only support selected instruments.
        if (!selectedInstrument) throw new Error('Please select a valid instrument from search')

        payload.instrumentId = selectedInstrument.id

        await createTransaction(userId, payload)

      } else if (activeTab === 'TRANSFER') {
        if (!destAccountId) throw new Error('Please select a destination account')
        if (!transferAmount) throw new Error('Please enter an amount')

        const destAccount = accounts.find(a => a.accountId === destAccountId)
        if (!destAccount) throw new Error('Invalid destination account')

        const numAmount = parseFloat(transferAmount)

        // Create Transfer Pair
        // Source: Negative Amount
        // Dest: Positive Amount
        // We use the helper from TransferTransaction

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
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setDescription('')
    setAmount('')
    setCategory('')
    setCategorySearch('')
    setDate(new Date().toISOString().split('T')[0])
    setTicker('')
    setQuantity('')
    setPrice('')
    setTransferAmount('')
    setSelectedInstrument(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-[#18181b] border border-zinc-800 rounded-xl shadow-xl flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-[#18181b] shrink-0">
          <h2 className="text-lg font-semibold text-white">New Transaction</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

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
        <div className="flex-1 overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Common Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Account</label>
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
              </div>
            </div>

            {/* General Tab */}
            {activeTab === 'GENERAL' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Type</label>
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
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-7 pr-4 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Description</label>
                  <input
                    type="text"
                    required
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    placeholder="e.g. Groceries"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Category</label>
                  <div className="relative">
                    {!isCategoryOpen ? (
                      <div
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white cursor-pointer flex justify-between items-center hover:border-zinc-700 transition-colors"
                        onClick={() => setIsCategoryOpen(true)}
                      >
                        <span className={!category ? 'text-zinc-500' : ''}>{category || 'Select Category'}</span>
                        <ChevronDown size={16} />
                      </div>
                    ) : (
                      <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-2 border-b border-zinc-800 flex items-center gap-2">
                          <Search size={14} className="text-zinc-500" />
                          <input
                            type="text"
                            value={categorySearch}
                            onChange={e => setCategorySearch(e.target.value)}
                            className="flex-1 bg-transparent text-sm text-white focus:outline-none placeholder:text-zinc-600"
                            placeholder="Search categories..."
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setIsCategoryOpen(false)
                              setCategorySearch('')
                            }}
                            className="text-zinc-500 hover:text-white"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                          {filteredCategories.length === 0 ? (
                            <div className="px-4 py-3 text-sm text-zinc-500 text-center">No categories found</div>
                          ) : (
                            filteredCategories.map((value: any) => (
                              <div
                                key={value.name}
                                className="px-4 py-2 hover:bg-zinc-800 cursor-pointer text-sm text-zinc-300 border-l-2 border-transparent hover:border-indigo-500"
                                onClick={() => {
                                  setCategory(value.name)
                                  setIsCategoryOpen(false)
                                  setCategorySearch('')
                                }}
                              >
                                <div className="font-medium text-white">{value.name}</div>
                                <div className="text-xs text-zinc-500">{value.category}</div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Trade Tab */}
            {activeTab === 'TRADE' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Action</label>
                  <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setTradeType('BUY')}
                      className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${tradeType === 'BUY'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                        : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                    >
                      Buy
                    </button>
                    <button
                      type="button"
                      onClick={() => setTradeType('SELL')}
                      className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${tradeType === 'SELL'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/20'
                        : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                    >
                      Sell
                    </button>
                  </div>
                </div>

                <div className="space-y-1 relative">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Instrument (Ticker)</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <input
                      type="text"
                      value={ticker}
                      onChange={e => {
                        setTicker(e.target.value)
                        setSelectedInstrument(null)
                      }}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-4 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                      placeholder="Search ticker (e.g. AAPL)"
                    />
                  </div>

                  {/* Search Results Dropdown */}
                  {(searchResults.length > 0 || isSearching) && ticker && !selectedInstrument && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-[#18181b] border border-zinc-800 rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto">
                      {isSearching && <div className="p-3 text-center text-zinc-500 text-sm">Searching...</div>}
                      {!isSearching && searchResults.map(result => (
                        <div
                          key={result.id}
                          className="px-4 py-2 hover:bg-zinc-800 cursor-pointer flex justify-between items-center"
                          onClick={() => {
                            setTicker(result.ticker || result.name)
                            setSelectedInstrument(result)
                            setSearchResults([])
                          }}
                        >
                          <div>
                            <div className="font-medium text-white">{result.ticker}</div>
                            <div className="text-xs text-zinc-500">{result.name}</div>
                          </div>
                          <div className="text-xs text-zinc-400">{result.type}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Quantity</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={quantity}
                      onChange={e => setQuantity(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Price per Share</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={price}
                        onChange={e => setPrice(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-7 pr-4 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    placeholder="Optional (defaults to Buy/Sell Ticker)"
                  />
                </div>
              </>
            )}

            {/* Transfer Tab */}
            {activeTab === 'TRANSFER' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Destination Account</label>
                  <select
                    value={destAccountId}
                    onChange={e => setDestAccountId(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                  >
                    <option value="">Select Account</option>
                    {accounts.filter(a => a.accountId !== accountId).map(account => (
                      <option key={account.accountId} value={account.accountId}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={transferAmount}
                      onChange={e => setTransferAmount(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-7 pr-4 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Description</label>
                  <input
                    type="text"
                    required
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    placeholder="e.g. Monthly Savings"
                  />
                </div>
              </>
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
      </div>
    </div>
  )
}
