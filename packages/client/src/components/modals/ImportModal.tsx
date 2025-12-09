import { useState, useCallback, useMemo } from 'react'
import { X, Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { AccountType, type IAccount } from '@finapp/shared/models/account'
import type { ITransaction } from '@finapp/shared/models/transaction'
import { getImporterForInstitute } from '@finapp/shared/importer/capabilities'
import { format } from 'date-fns'

import { fromExcelToCsv } from '@finapp/shared/lib/from_excel_to_csv'

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  account: IAccount
  instituteName: string
  userId: string
  onSuccess: () => void
}

type ImportState = 'idle' | 'parsing' | 'preview' | 'uploading' | 'success' | 'error'

export function ImportModal({ isOpen, onClose, account, instituteName, userId, onSuccess }: ImportModalProps) {
  const [state, setState] = useState<ImportState>('idle')
  const [transactions, setTransactions] = useState<ITransaction[]>([])
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [stats, setStats] = useState({ imported: 0, duplicates: 0 })

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setState('parsing')
    setError(null)

    try {
      let text = ''

      if (file.name.toLowerCase().endsWith('.xlsx')) {
        const buffer = await file.arrayBuffer()
        // Returns array of CSV strings (one per sheet). default to first sheet
        const csvs = fromExcelToCsv(buffer)
        if (csvs.length === 0) {
          throw new Error('No sheets found in Excel file')
        }
        text = csvs[0]
      } else {
        text = await file.text()
      }

      // Handle case where property might be 'type' (from DB) or 'AccountType' (from model)
      let accountType = account.type;

      // Map legacy/DB types to AccountType enum
      const typeStr = String(accountType);
      if (typeStr === 'credit_card') accountType = AccountType.CREDIT_CARD;
      if (typeStr === 'checking' || typeStr === 'savings') accountType = AccountType.BANK;
      if (typeStr === 'investment') accountType = AccountType.INVESTMENT;

      const importer = getImporterForInstitute(instituteName, accountType, account.accountId, userId)

      if (!importer) {
        throw new Error(`No importer found for ${instituteName}`)
      }

      const statement = await importer.import(text)
      setTransactions(statement.transactions)
      setState('preview')
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to parse file')
      setState('error')
    }
  }, [account, instituteName, userId])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1
  })

  const summary = useMemo(() => {
    if (transactions.length === 0) return null
    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0)
    const sorted = [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime())
    const startDate = sorted[0]?.date
    const endDate = sorted[sorted.length - 1]?.date
    return { totalAmount, startDate, endDate, count: transactions.length }
  }, [transactions])

  const handleImport = async () => {
    setState('uploading')
    setProgress(0)
    setStats({ imported: 0, duplicates: 0 })

    try {
      const BATCH_SIZE = 200
      let imported = 0
      let duplicates = 0
      const total = transactions.length

      for (let i = 0; i < total; i += BATCH_SIZE) {
        const batch = transactions.slice(i, i + BATCH_SIZE)

        const res = await fetch(`http://localhost:3001/api/transactions/users/${userId}/accounts/${account.accountId}/transactions/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transactions: batch,
            skipDuplicates: true
          })
        })

        if (!res.ok) throw new Error('Failed to upload batch')

        const data = await res.json()
        imported += data.importedCount
        duplicates += data.duplicateCount || 0

        setProgress(Math.min(100, Math.round(((i + BATCH_SIZE) / total) * 100)))
      }

      setStats({ imported, duplicates })
      setState('success')
      onSuccess()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Upload failed')
      setState('error')
    }
  }

  const handleReset = () => {
    setState('idle')
    setTransactions([])
    setError(null)
    setProgress(0)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-3xl bg-[#18181b] border border-zinc-800 rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-white">Import Transactions - {account.name}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {state === 'idle' && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${isDragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-zinc-700 hover:border-zinc-600 hover:bg-zinc-800/50'
                }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 text-zinc-500 mb-4" />
              <p className="text-lg font-medium text-white mb-2">
                {isDragActive ? 'Drop the CSV file here' : 'Drag & drop CSV file here'}
              </p>
              <p className="text-sm text-zinc-400">or click to select file</p>
            </div>
          )}

          {state === 'parsing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
              <p className="text-zinc-400">Parsing file...</p>
            </div>
          )}

          {state === 'error' && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Import Failed</h3>
              <p className="text-red-400 mb-6">{error}</p>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {state === 'preview' && summary && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
                  <p className="text-sm text-zinc-400 mb-1">Transactions</p>
                  <p className="text-2xl font-bold text-white">{summary.count}</p>
                </div>
                <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
                  <p className="text-sm text-zinc-400 mb-1">Net Amount</p>
                  <p className={`text-2xl font-bold ${summary.totalAmount >= 0 ? 'text-emerald-400' : 'text-white'}`}>
                    {transactions[0]?.currency.symbol || account.currency.symbol || '$'}{summary.totalAmount.toFixed(2)}
                  </p>
                </div>
                <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
                  <p className="text-sm text-zinc-400 mb-1">Date Range</p>
                  <p className="text-sm font-medium text-white">
                    {summary.startDate && format(summary.startDate, 'MMM d, yyyy')} -{' '}
                    {summary.endDate && format(summary.endDate, 'MMM d, yyyy')}
                  </p>
                </div>
              </div>

              <div className="border border-zinc-800 rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-zinc-900 text-zinc-400">
                    <tr>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Description</th>
                      <th className="px-4 py-3 font-medium text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {transactions.slice(0, 10).map((t, i) => (
                      <tr key={i} className="hover:bg-zinc-900/50">
                        <td className="px-4 py-3 text-zinc-300">{format(t.date, 'MMM d, yyyy')}</td>
                        <td className="px-4 py-3 text-white">{t.description}</td>
                        <td className={`px-4 py-3 text-right font-medium ${t.amount > 0 ? 'text-emerald-400' : 'text-white'}`}>
                          {t.currency.symbol}{t.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {transactions.length > 10 && (
                  <div className="px-4 py-3 bg-zinc-900/50 text-center text-zinc-500 text-xs border-t border-zinc-800">
                    And {transactions.length - 10} more...
                  </div>
                )}
              </div>
            </div>
          )}

          {state === 'uploading' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-full max-w-md bg-zinc-800 rounded-full h-2 mb-4 overflow-hidden">
                <div
                  className="bg-indigo-500 h-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-zinc-400">Importing transactions... {progress}%</p>
            </div>
          )}

          {state === 'success' && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle className="w-16 h-16 text-emerald-500 mb-6" />
              <h3 className="text-2xl font-bold text-white mb-2">Import Complete</h3>
              <p className="text-zinc-400 mb-8">
                Successfully processed {transactions.length} transactions.
              </p>

              <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-8">
                <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
                  <p className="text-sm text-zinc-400 mb-1">New</p>
                  <p className="text-2xl font-bold text-emerald-400">{stats.imported}</p>
                </div>
                <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
                  <p className="text-sm text-zinc-400 mb-1">Duplicates</p>
                  <p className="text-2xl font-bold text-amber-400">{stats.duplicates}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors"
                >
                  Done
                </button>
                <button
                  onClick={handleReset}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                >
                  Import Another
                </button>
              </div>
            </div>
          )}
        </div>

        {state === 'preview' && (
          <div className="p-4 border-t border-zinc-800 flex justify-end gap-3 bg-zinc-900/50">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-colors"
            >
              Import {transactions.length} Transactions
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
