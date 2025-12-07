import type { ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalWrapperProps {
    isOpen: boolean
    onClose: () => void
    title: string
    children: ReactNode
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
}

/**
 * Reusable modal wrapper with consistent styling.
 * Provides backdrop, close button, and title.
 */
export function ModalWrapper({
    isOpen,
    onClose,
    title,
    children,
    maxWidth = 'md'
}: ModalWrapperProps) {
    if (!isOpen) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div
                className={`w-full ${maxWidthClasses[maxWidth]} bg-[#18181b] border border-zinc-800 rounded-xl shadow-xl flex flex-col max-h-[90vh]`}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-[#18181b] shrink-0">
                    <h2 className="text-lg font-semibold text-white">{title}</h2>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    )
}
