'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FilterBar } from '@/components/FilterBar'
import { YieldTable } from '@/components/YieldTable'
import { ExportButton } from '@/components/ExportButton'
import { SuburbData, FilterState } from '@/lib/types'
import { getSuburbs, filterSuburbs } from '@/lib/storage'

export default function Dashboard() {
  const [suburbs, setSuburbs] = useState<SuburbData[]>([])
  const [filteredSuburbs, setFilteredSuburbs] = useState<SuburbData[]>([])
  const [filters, setFilters] = useState<FilterState>({
    states: [],
    bedrooms: [],
    maxPrice: null,
    minYield: null,
    hotOnly: false,
  })

  useEffect(() => {
    const data = getSuburbs()
    setSuburbs(data)
    setFilteredSuburbs(data)
  }, [])

  useEffect(() => {
    const filtered = filterSuburbs(suburbs, filters)
    setFilteredSuburbs(filtered)
  }, [suburbs, filters])

  const handleDataChange = () => {
    const data = getSuburbs()
    setSuburbs(data)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="text-gray-600 hover:text-gray-900">
                ← Back
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            </div>
            <ExportButton suburbs={filteredSuburbs} />
          </div>
          <p className="text-gray-600 mt-2">View and filter your researched suburbs</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <FilterBar filters={filters} onChange={setFilters} />
            
            <div className="mt-6 bg-white p-4 rounded-lg shadow-md">
              <h3 className="font-semibold mb-2">Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Suburbs:</span>
                  <span className="font-medium">{suburbs.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Filtered:</span>
                  <span className="font-medium">{filteredSuburbs.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Hot Suburbs:</span>
                  <span className="font-medium text-orange-600">
                    {suburbs.filter(s => s.isHot).length}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Results Table */}
          <div className="lg:col-span-3">
            <YieldTable suburbs={filteredSuburbs} onDataChange={handleDataChange} />
          </div>
        </div>
      </main>
    </div>
  )
}
