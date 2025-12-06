import { useState } from 'react'
import { X, Copy, Check } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import type { ITransaction } from '@finapp/shared/models/transaction'

// Extend ITransaction to include fields that might be enriched by the API or present in specific subtypes
interface EnrichedTransaction extends ITransaction {
  category?: string; // Enriched category name
  merchant?: { name: string } | null; // From IGeneralTransaction
  transactionType: any; // Allow any string for display
}

interface TransactionDetailModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: EnrichedTransaction | null
}

export function TransactionDetailModal({ isOpen, onClose, transaction }: TransactionDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'normal' | 'raw'>('normal')
  const [copied, setCopied] = useState(false)

  if (!isOpen || !transaction) return null

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(transaction, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-[#18181b] border border-zinc-800 rounded-xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-[#18181b]">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-white">Transaction Details</h2>
            <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
              <button
                onClick={() => setActiveTab('normal')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${activeTab === 'normal'
                  ? 'bg-indigo-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
                  }`}
              >
                Normal
              </button>
              <button
                onClick={() => setActiveTab('raw')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${activeTab === 'raw'
                  ? 'bg-indigo-600 text-white'
                  : 'text-zinc-400 hover:text-zinc-200'
                  }`}
              >
                Raw JSON
              </button>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'normal' ? (
            <div className="space-y-6">
              {/* Primary Info */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">
                    {transaction.description || 'No Description'}
                  </h3>
                  <p className="text-zinc-400">
                    {new Date(transaction.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className={`text-2xl font-bold ${transaction.amount >= 0 ? 'text-emerald-400' : 'text-white'}`}>
                  {transaction.amount >= 0 ? '+' : ''}
                  {transaction.amount.toLocaleString('en-US', { style: 'currency', currency: transaction.currency.code })}
                </div>
              </div>

              {/* Grid Details */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Category</label>
                  <div className="text-zinc-200 bg-zinc-900/50 px-3 py-2 rounded-lg border border-zinc-800/50">
                    {transaction.category || transaction.categoryId || 'Uncategorized'}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Type</label>
                  <div className="text-zinc-200 bg-zinc-900/50 px-3 py-2 rounded-lg border border-zinc-800/50">
                    {String(transaction.transactionType)}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Account ID</label>
                  <div className="text-zinc-400 text-sm font-mono bg-zinc-900/50 px-3 py-2 rounded-lg border border-zinc-800/50 truncate" title={transaction.accountId}>
                    {transaction.accountId}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Transaction ID</label>
                  <div className="text-zinc-400 text-sm font-mono bg-zinc-900/50 px-3 py-2 rounded-lg border border-zinc-800/50 truncate" title={transaction.transactionId}>
                    {transaction.transactionId}
                  </div>
                </div>
              </div>

              {/* Additional Details based on Type */}
              {transaction.merchant && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Merchant</label>
                  <div className="text-zinc-200 bg-zinc-900/50 px-3 py-2 rounded-lg border border-zinc-800/50">
                    {transaction.merchant.name}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="relative group">
              <button
                onClick={handleCopy}
                className="absolute right-2 top-2 p-2 bg-zinc-800 hover:bg-zinc-700 rounded-md text-zinc-400 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
                title="Copy JSON"
              >
                {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
              </button>
              <SyntaxHighlighter
                language="json"
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  backgroundColor: '#18181b',
                  border: '1px solid #27272a'
                }}
              >
                {JSON.stringify(transaction, null, 2)}
              </SyntaxHighlighter>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
