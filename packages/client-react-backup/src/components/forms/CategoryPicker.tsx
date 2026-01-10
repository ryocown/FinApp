import { useState } from 'react'
import { Search, ChevronDown, X } from 'lucide-react'
import { ExpenseTree } from '@finapp/shared/models/category'

interface CategoryPickerProps {
    value: string
    onChange: (value: string) => void
}

interface CategoryItem {
    name: string
    category: string
}

/**
 * Hierarchical category picker with search functionality.
 */
export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [search, setSearch] = useState('')
    // Derive filtered categories directly
    const filteredCategories = (() => {
        const allCategories = Object.values(ExpenseTree.Expense) as CategoryItem[]
        if (!search) return allCategories
        const lower = search.toLowerCase()
        return allCategories.filter(c =>
            c.name.toLowerCase().includes(lower) || c.category.toLowerCase().includes(lower)
        )
    })()

    const handleSelect = (categoryName: string) => {
        onChange(categoryName)
        setIsOpen(false)
        setSearch('')
    }

    const handleClose = (e: React.MouseEvent) => {
        e.stopPropagation()
        setIsOpen(false)
        setSearch('')
    }

    if (!isOpen) {
        return (
            <div
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white cursor-pointer flex justify-between items-center hover:border-zinc-700 transition-colors"
                onClick={() => setIsOpen(true)}
            >
                <span className={!value ? 'text-zinc-500' : ''}>{value || 'Select Category'}</span>
                <ChevronDown size={16} />
            </div>
        )
    }

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-2 border-b border-zinc-800 flex items-center gap-2">
                <Search size={14} className="text-zinc-500" />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 bg-transparent text-sm text-white focus:outline-none placeholder:text-zinc-600"
                    placeholder="Search categories..."
                    autoFocus
                />
                <button
                    type="button"
                    onClick={handleClose}
                    className="text-zinc-500 hover:text-white"
                >
                    <X size={14} />
                </button>
            </div>
            <div className="max-h-60 overflow-y-auto">
                {filteredCategories.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-zinc-500 text-center">No categories found</div>
                ) : (
                    filteredCategories.map((item) => (
                        <div
                            key={item.name}
                            className="px-4 py-2 hover:bg-zinc-800 cursor-pointer text-sm text-zinc-300 border-l-2 border-transparent hover:border-indigo-500"
                            onClick={() => handleSelect(item.name)}
                        >
                            <div className="font-medium text-white">{item.name}</div>
                            <div className="text-xs text-zinc-500">{item.category}</div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
