import { useState, useCallback } from 'react'

type SortDirection = 'asc' | 'desc'

interface SortState<T> {
  field: T
  direction: SortDirection
}

interface UseSortOptions<T> {
  defaultField: T
  defaultDirection?: SortDirection
}

interface UseSortReturn<T> {
  sortField: T
  sortDirection: SortDirection
  setSort: (field: T) => void
  toggleDirection: () => void
}

export function useSort<T extends string>(
  options: UseSortOptions<T>
): UseSortReturn<T> {
  const [sortField, setSortField] = useState<T>(options.defaultField)
  const [sortDirection, setSortDirection] = useState<SortDirection>(
    options.defaultDirection || 'asc'
  )

  const setSort = useCallback((field: T) => {
    setSortField((currentField) => {
      if (currentField === field) {
        // Toggle direction if same field
        setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
        return currentField
      } else {
        // New field, reset to default direction
        setSortDirection('asc')
        return field
      }
    })
  }, [])

  const toggleDirection = useCallback(() => {
    setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
  }, [])

  return {
    sortField,
    sortDirection,
    setSort,
    toggleDirection,
  }
}

export function useSortWithDirection<T extends string>(
  options: UseSortOptions<T> & { preferDescFor?: T[] }
): UseSortReturn<T> {
  const { defaultField, defaultDirection = 'asc', preferDescFor = [] } = options
  
  const [sortField, setSortField] = useState<T>(defaultField)
  const [sortDirection, setSortDirection] = useState<SortDirection>(defaultDirection)

  const setSort = useCallback((field: T) => {
    setSortField((currentField) => {
      if (currentField === field) {
        // Toggle direction if same field
        setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
        return currentField
      } else {
        // New field, check if we should prefer descending
        const shouldPreferDesc = preferDescFor.includes(field)
        setSortDirection(shouldPreferDesc ? 'desc' : 'asc')
        return field
      }
    })
  }, [preferDescFor])

  const toggleDirection = useCallback(() => {
    setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
  }, [])

  return {
    sortField,
    sortDirection,
    setSort,
    toggleDirection,
  }
}
