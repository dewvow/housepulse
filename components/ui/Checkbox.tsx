import { InputHTMLAttributes } from 'react'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
}

export function Checkbox({ label, className = '', ...props }: CheckboxProps) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        className={`
          w-4 h-4 text-blue-600 border-gray-300 rounded
          focus:ring-blue-500
          ${className}
        `}
        {...props}
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  )
}
