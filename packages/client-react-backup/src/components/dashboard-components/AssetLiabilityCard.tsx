interface AssetLiabilityCardProps {
    title: 'Assets' | 'Liabilities'
    total: number
    loading: boolean
    color: 'blue' | 'red'
    id?: string
}

/**
 * Summary card for assets or liabilities totals.
 */
export function AssetLiabilityCard({ id, title, total, loading, color }: AssetLiabilityCardProps) {
    return (
        <div id={id} className="bg-[#18181b] p-6 rounded-xl border border-zinc-800 shadow-sm">
            <h3 className="text-lg font-semibold mb-4 text-zinc-100">{title}</h3>
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Total {title}</span>
                    <span className="font-medium text-zinc-200">
                        {loading ? '...' : `$${total.toLocaleString()}`}
                    </span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-2">
                    <div className={`${color === 'blue' ? 'bg-blue-500' : 'bg-red-500'} h-2 rounded-full`} style={{ width: '100%' }}></div>
                </div>
            </div>
        </div>
    )
}
