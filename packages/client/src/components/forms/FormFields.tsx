import type { ReactNode } from 'react'

interface FormFieldProps {
    label: string
    children: ReactNode
    className?: string
}

/**
 * Reusable form field wrapper with consistent styling.
 */
export function FormField({ label, children, className = '' }: FormFieldProps) {
    return (
        <div className={`space-y-1 ${className}`}>
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                {label}
            </label>
            {children}
        </div>
    )
}

interface AmountInputProps {
    value: string
    onChange: (value: string) => void
    required?: boolean
    placeholder?: string
    currencySymbol?: string
}

/**
 * Reusable amount input with currency symbol.
 */
export function AmountInput({
    value,
    onChange,
    required = false,
    placeholder = '0.00',
    currencySymbol = '$'
}: AmountInputProps) {
    return (
        <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                {currencySymbol}
            </span>
            <input
                type="number"
                step="0.01"
                required={required}
                value={value}
                onChange={e => onChange(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-7 pr-4 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                placeholder={placeholder}
            />
        </div>
    )
}

interface TextInputProps {
    value: string
    onChange: (value: string) => void
    required?: boolean
    placeholder?: string
    type?: 'text' | 'date'
}

/**
 * Reusable text input with consistent styling.
 */
export function TextInput({
    value,
    onChange,
    required = false,
    placeholder = '',
    type = 'text'
}: TextInputProps) {
    return (
        <input
            type={type}
            required={required}
            value={value}
            onChange={e => onChange(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
            placeholder={placeholder}
        />
    )
}

interface ToggleButtonGroupProps<T extends string> {
    options: { value: T; label: string; activeStyle: string }[]
    value: T
    onChange: (value: T) => void
}

/**
 * Reusable toggle button group for binary choices (Expense/Income, Buy/Sell).
 */
export function ToggleButtonGroup<T extends string>({
    options,
    value,
    onChange
}: ToggleButtonGroupProps<T>) {
    return (
        <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-800">
            {options.map(option => (
                <button
                    key={option.value}
                    type="button"
                    onClick={() => onChange(option.value)}
                    className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${value === option.value ? option.activeStyle : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
    )
}
