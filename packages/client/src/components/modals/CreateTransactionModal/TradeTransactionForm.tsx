import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { searchInstruments } from '../../../lib/api'
import { FormField, AmountInput } from '../../forms'
import type { IFinancialInstrument } from '@finapp/shared/models/financial_instrument'

interface TradeTransactionFormProps {
    tradeType: 'BUY' | 'SELL'
    setTradeType: (type: 'BUY' | 'SELL') => void
    ticker: string
    setTicker: (ticker: string) => void
    quantity: string
    setQuantity: (quantity: string) => void
    price: string
    setPrice: (price: string) => void
    description: string
    setDescription: (description: string) => void
    selectedInstrument: IFinancialInstrument | null
    setSelectedInstrument: (instrument: IFinancialInstrument | null) => void
    currencySymbol: string
}

/**
 * Form fields for trade (buy/sell) transactions.
 */
export function TradeTransactionForm({
    tradeType,
    setTradeType,
    ticker,
    setTicker,
    quantity,
    setQuantity,
    price,
    setPrice,
    description,
    setDescription,
    selectedInstrument,
    setSelectedInstrument,
    currencySymbol
}: TradeTransactionFormProps) {
    const [searchResults, setSearchResults] = useState<IFinancialInstrument[]>([])
    const [isSearching, setIsSearching] = useState(false)

    // Debounced instrument search
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

    const handleTickerChange = (value: string) => {
        setTicker(value)
        setSelectedInstrument(null)
    }

    const handleSelectInstrument = (result: IFinancialInstrument) => {
        setTicker((result as any).ticker || result.name)
        setSelectedInstrument(result)
        setSearchResults([])
    }

    return (
        <>
            <FormField label="Action">
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
            </FormField>

            <div className="space-y-1 relative">
                <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Instrument (Ticker)</label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <input
                        type="text"
                        value={ticker}
                        onChange={e => handleTickerChange(e.target.value)}
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
                                key={result.instrumentId}
                                className="px-4 py-2 hover:bg-zinc-800 cursor-pointer flex justify-between items-center"
                                onClick={() => handleSelectInstrument(result)}
                            >
                                <div>
                                    <div className="font-medium text-white">{(result as any).ticker}</div>
                                    <div className="text-xs text-zinc-500">{result.name}</div>
                                </div>
                                <div className="text-xs text-zinc-400">{result.type}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <FormField label="Quantity">
                    <input
                        type="number"
                        step="any"
                        required
                        value={quantity}
                        onChange={e => setQuantity(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                        placeholder="0"
                    />
                </FormField>
                <FormField label="Price per Share">
                    <AmountInput value={price} onChange={setPrice} required currencySymbol={currencySymbol} />
                </FormField>
            </div>

            <FormField label="Description">
                <input
                    type="text"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                    placeholder="Optional (defaults to Buy/Sell Ticker)"
                />
            </FormField>
        </>
    )
}
