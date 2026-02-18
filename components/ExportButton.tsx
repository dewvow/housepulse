'use client'

import { SuburbData } from '@/lib/types'
import { exportToCSV } from '@/lib/storage'

interface ExportButtonProps {
  suburbs: SuburbData[]
}

export function ExportButton({ suburbs }: ExportButtonProps) {
  const handleExport = () => {
    const csv = exportToCSV(suburbs)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `housepulse-data-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleExport}
      disabled={suburbs.length === 0}
      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      Export CSV ({suburbs.length} suburbs)
    </button>
  )
}
