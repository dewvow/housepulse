'use client'

import { SuburbData } from '@/lib/types'
import { exportToCSV } from '@/lib/storage'
import { Button } from '@/components/ui'
import { LABELS, CSV } from '@/lib/constants'

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
    a.download = `${CSV.FILENAME_PREFIX}-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Button
      onClick={handleExport}
      disabled={suburbs.length === 0}
      variant="primary"
    >
      {LABELS.EXPORT_CSV(suburbs.length)}
    </Button>
  )
}
