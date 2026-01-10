import { useState, useEffect } from 'react'
import { X, Copy, Check, Trash2, Edit2, Save } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { type ITransaction, TransactionType } from '@finapp/shared/models/transaction'
import { deleteTransaction, updateTransaction } from '../lib/api'
import { CategoryPicker } from './forms/CategoryPicker'

// Extend ITransaction to include fields that might be enriched by the API or present in specific subtypes
interface EnrichedTransaction extends Omit<ITransaction, 'transactionType'> {
  category?: string; // Enriched category name
  merchant?: { name: string } | null; // From IGeneralTransaction
  transactionType: TransactionType | string; // Allow any string for display
}

interface TransactionDetailModalProps {
  isOpen: boolean
  onClose: () => void
  transaction: EnrichedTransaction | null
  userId: string
  onDelete?: () => void
  onUpdate?: () => void
}

export function TransactionDetailModal({ isOpen, onClose, transaction, userId, onDelete, onUpdate }: TransactionDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'normal' | 'raw'>('normal')
  const [copied, setCopied] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<Partial<ITransaction>>({})

  useEffect(() => {
    if (transaction) {
      setFormData({
        amount: transaction.amount,
        date: new Date(transaction.date),
        description: transaction.description,
        transactionType: transaction.transactionType as TransactionType,
        categoryId: transaction.categoryId
      })
      setIsEditing(false)
    }
  }, [transaction])

  if (!isOpen || !transaction) return null

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(transaction, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    try {
      await deleteTransaction(userId, transaction.transactionId)
      onDelete?.()
      onClose()
    } catch (error) {
      console.error('Failed to delete transaction:', error)
      alert('Failed to delete transaction. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateTransaction(userId, transaction.transactionId, formData)
      onUpdate?.()
      setIsEditing(false)
      // Ideally we should update the local transaction object or refetch
    } catch (error) {
      console.error('Failed to update transaction:', error)
      alert('Failed to update transaction. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const formatDateForInput = (date: Date | string) => {
    const d = new Date(date)
    return d.toISOString().slice(0, 16) // YYYY-MM-DDThh:mm
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
          <div className="flex items-center gap-2">
            {!isEditing && activeTab === 'normal' && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-zinc-400 hover:text-white transition-colors rounded-md hover:bg-zinc-800"
                title="Edit Transaction"
              >
                <Edit2 size={18} />
              </button>
            )}
            <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors p-2 rounded-md hover:bg-zinc-800">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'normal' ? (
            <div className="space-y-6">
              {/* Primary Info */}
              <div className="flex justify-between items-start">
                <div className="flex-1 mr-4">
                  {isEditing ? (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Description</label>
                      <input
                        type="text"
                        value={formData.description || ''}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      />
                      <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Date</label>
                      <input
                        type="datetime-local"
                        value={formData.date ? formatDateForInput(formData.date as Date) : ''}
                        onChange={e => setFormData({ ...formData, date: new Date(e.target.value) })}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  ) : (
                    <>
                      <h3 className="text-2xl font-bold text-white mb-1">
                        {transaction.description || 'No Description'}
                      </h3>
                      <p className="text-zinc-400">
                        {new Date(transaction.date).toLocaleDateString(undefined, {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </>
                  )}
                </div>
                <div className="text-right flex flex-col items-end">
                  {isEditing ? (
                    <div className="space-y-2 w-full max-w-[150px]">
                      <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider block text-right">Amount</label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.amount || 0}
                        onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-right focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  ) : (
                    <div className={`text-2xl font-bold ${transaction.amount >= 0 ? 'text-emerald-400' : 'text-white'}`}>
                      {transaction.amount >= 0 ? '+' : ''}
                      {transaction.amount.toLocaleString('en-US', { style: 'currency', currency: transaction.currency.code })}
                    </div>
                  )}
                </div>
              </div>

              {/* Grid Details */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Category</label>
                  {isEditing ? (
                    <CategoryPicker
                      value={formData.categoryId || ''}
                      onChange={(value) => setFormData({ ...formData, categoryId: value })}
                    />
                  ) : (
                    <div className="text-zinc-200 bg-zinc-900/50 px-3 py-2 rounded-lg border border-zinc-800/50">
                      {transaction.category || transaction.categoryId || 'Uncategorized'}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Type</label>
                  {isEditing ? (
                    <select
                      value={formData.transactionType as string}
                      onChange={e => setFormData({ ...formData, transactionType: e.target.value as TransactionType })}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    >
                      {Object.values(TransactionType).map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  ) : (
                    <div className="text-zinc-200 bg-zinc-900/50 px-3 py-2 rounded-lg border border-zinc-800/50">
                      {String(transaction.transactionType)}
                    </div>
                  )}
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

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-[#18181b] flex justify-between items-center">
          {isEditing ? (
            <div className="flex gap-2 w-full justify-end">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <Save size={18} />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          ) : (
            <div className="flex w-full justify-end">
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors disabled:opacity-50"
              >
                <Trash2 size={18} />
                {isDeleting ? 'Deleting...' : 'Delete Transaction'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
