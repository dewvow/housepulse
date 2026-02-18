'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { StateSelector } from '@/components/StateSelector'
import { SuburbSearch } from '@/components/SuburbSearch'
import { HotSuburbs } from '@/components/HotSuburbs'
import { DataInput } from '@/components/DataInput'
import { SuburbListItem, StateCode, SuburbData } from '@/lib/types'
import { loadSuburbs, getSuburbsByState } from '@/lib/suburbs'
import { getSuburbs, addHotSuburb } from '@/lib/storage'

export default function Home() {
  const [suburbs, setSuburbs] = useState<SuburbListItem[]>([])
  const [savedSuburbs, setSavedSuburbs] = useState<SuburbData[]>([])
  const [selectedState, setSelectedState] = useState<StateCode | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSuburbs().then(data => {
      setSuburbs(data)
      setLoading(false)
    })
    setSavedSuburbs(getSuburbs())
  }, [])

  const handleSuburbSelect = (suburb: SuburbListItem) => {
    const url = `https://www.realestate.com.au/${suburb.state.toLowerCase()}/${suburb.suburb.toLowerCase().replace(/\s+/g, '-')}-${suburb.postcode}/`
    window.open(url, '_blank')
  }

  const handleSuburbAdded = () => {
    setSavedSuburbs(getSuburbs())
  }

  const filteredSuburbs = selectedState ? getSuburbsByState(suburbs, selectedState) : suburbs

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">HousePulse</h1>
            <Link 
              href="/dashboard" 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              View Dashboard ({savedSuburbs.length} suburbs)
            </Link>
          </div>
          <p className="text-gray-600 mt-2">Australian Real Estate Market Research Tool</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Search */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-lg font-semibold mb-4">Search Suburbs</h2>
              
              <StateSelector
                selectedState={selectedState}
                onSelect={setSelectedState}
              />
              
              <div className="mt-6">
                <SuburbSearch
                  suburbs={filteredSuburbs}
                  selectedState={selectedState}
                  onSelect={handleSuburbSelect}
                />
              </div>

              {selectedState && (
                <div className="mt-6">
                  <HotSuburbs
                    selectedState={selectedState}
                    allSuburbs={savedSuburbs}
                    onSelectSuburb={(suburb) => {
                      const url = `https://www.realestate.com.au/${suburb.state.toLowerCase()}/${suburb.suburb.toLowerCase().replace(/\s+/g, '-')}-${suburb.postcode}/`
                      window.open(url, '_blank')
                    }}
                  />
                </div>
              )}
            </div>

            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="font-semibold mb-2">How to Use</h3>
              <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
                <li>Select a state or territory</li>
                <li>Search and select a suburb</li>
                <li>This opens the realestate.com.au profile page</li>
                <li>Use the bookmarklet to extract data</li>
                <li>Paste the JSON data here</li>
                <li>View results in the dashboard</li>
              </ol>
            </div>
          </div>

          {/* Right Column - Data Input */}
          <div>
            <DataInput onSuburbAdded={handleSuburbAdded} />
            
            <div className="mt-6 bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">Bookmarklet Setup</h4>
              <p className="text-sm text-yellow-700 mb-3">
                Add this bookmarklet to your browser to extract data from realestate.com.au:
              </p>
              <code className="block p-2 bg-yellow-100 rounded text-xs font-mono break-all">
                {'javascript:(function(){window.open(\'/bookmarklet.js\');})();'}
              </code>
              <p className="text-xs text-yellow-600 mt-2">
                Create a bookmark with the code above, or copy from /public/bookmarklet.js
              </p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-3xl font-bold text-blue-600">{savedSuburbs.length}</div>
            <div className="text-gray-600">Suburbs Researched</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-3xl font-bold text-green-600">
              {savedSuburbs.length > 0 
                ? (savedSuburbs.reduce((acc, s) => acc + Object.values(s.yield).reduce((a, b) => a + b, 0) / 3, 0) / savedSuburbs.length).toFixed(2)
                : '0.00'}%
            </div>
            <div className="text-gray-600">Average Yield</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="text-3xl font-bold text-orange-600">
              {savedSuburbs.filter(s => s.isHot).length}
            </div>
            <div className="text-gray-600">Hot Suburbs</div>
          </div>
        </div>
      </main>
    </div>
  )
}
