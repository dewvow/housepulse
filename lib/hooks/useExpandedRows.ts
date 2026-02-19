import { useState, useCallback } from 'react'

interface UseExpandedRowsReturn {
  expandedRows: Set<string>
  isExpanded: (id: string) => boolean
  toggleExpand: (id: string) => void
  expand: (id: string) => void
  collapse: (id: string) => void
  collapseAll: () => void
  expandAll: (ids: string[]) => void
}

export function useExpandedRows(): UseExpandedRowsReturn {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const isExpanded = useCallback((id: string): boolean => {
    return expandedRows.has(id)
  }, [expandedRows])

  const toggleExpand = useCallback((id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const expand = useCallback((id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }, [])

  const collapse = useCallback((id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }, [])

  const collapseAll = useCallback(() => {
    setExpandedRows(new Set())
  }, [])

  const expandAll = useCallback((ids: string[]) => {
    setExpandedRows(new Set(ids))
  }, [])

  return {
    expandedRows,
    isExpanded,
    toggleExpand,
    expand,
    collapse,
    collapseAll,
    expandAll,
  }
}
