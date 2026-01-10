import { useState } from 'react'
import { X, Info } from 'lucide-react'
import { SupportedInstitute } from '@finapp/shared/models/institute'

interface CreateInstituteModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  onSuccess: () => void
}

export function CreateInstituteModal({ isOpen, onClose, userId, onSuccess }: CreateInstituteModalProps) {
  const [name, setName] = useState('')
  const [country, setCountry] = useState('US')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`http://localhost:3001/api/institutes/users/${userId}/institutes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          country,
          userId
        })
      })

      if (!res.ok) throw new Error('Failed to create institute')

      onSuccess()
      onClose()
      setName('')
      setCountry('US')
    } catch (error) {
      console.error('Error creating institute:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#18181b] border border-zinc-800 rounded-xl shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-white">Add New Institute</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className="block text-sm font-medium text-zinc-400">Institute Name</label>
              <div className="group relative flex items-center">
                <Info size={14} className="text-zinc-500 hover:text-zinc-300 cursor-help transition-colors" />
                <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 w-64 p-2 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl text-xs text-zinc-300 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                  im only currently allowing institutes with properly implemented importers. this is restrictive by design until i figure out a way to implement dynamic schemas for every new arbitrary institute.
                  <div className="absolute left-1/2 top-full -translate-x-1/2 -mt-1 border-4 border-transparent border-t-zinc-700"></div>
                </div>
              </div>
            </div>
            <select
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
              required
            >
              <option value="" disabled>Select an institute</option>
              {Object.values(SupportedInstitute).map((inst) => (
                <option key={inst} value={inst}>{inst}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">Country</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500 transition-colors"
            >
              <option value="US">United States</option>
              <option value="JP">Japan</option>
              <option value="GB">United Kingdom</option>
              <option value="CA">Canada</option>
              <option value="AU">Australia</option>
            </select>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Institute'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
