'use client'

import { SuburbData, BedroomType } from '@/lib/types'
import { formatCurrency, formatPercentage } from '@/lib/calculations'
import { deleteSuburb } from '@/lib/storage'

interface YieldTableProps {
  suburbs: SuburbData[]
  onDataChange: () => void
}

export function YieldTable({ suburbs, onDataChange }: YieldTableProps) {
  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this suburb?')) {
      deleteSuburb(id)
      onDataChange()
    }
  }

  const handleSort = (field: 'suburb' | 'price' | 'yield') => {
    // Sorting would be implemented here
    console.log('Sort by:', field)
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer" onClick={() => handleSort('suburb')}>
                Suburb ↕
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">State</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Beds</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer" onClick={() => handleSort('price')}>
                Sale Price ↕
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Rent/wk</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 cursor-pointer" onClick={() => handleSort('yield')}>
                Yield ↕
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {suburbs.flatMap((suburb) =>
              (['2', '3', '4+'] as BedroomType[]).map((beds, bedIndex) => {
                const bedroomData = suburb.bedrooms[beds]
                const yieldVal = suburb.yield[beds]
                
                if (!bedroomData.salePrice) return null
                
                return (
                  <tr key={`${suburb.id}-${beds}`} className="border-t hover:bg-gray-50">
                    {bedIndex === 0 && (
                      <>
                        <td className="px-4 py-3 text-sm" rowSpan={3}>
                          <div className="font-medium">{suburb.suburb}</div>
                          {suburb.isHot && <span className="text-xs">🔥 Hot</span>}
                        </td>
                        <td className="px-4 py-3 text-sm" rowSpan={3}>{suburb.state}</td>
                      </>
                    )}
                    <td className="px-4 py-3 text-sm">{beds}</td>
                    <td className="px-4 py-3 text-sm">{formatCurrency(bedroomData.salePrice)}</td>
                    <td className="px-4 py-3 text-sm">${bedroomData.rent}/wk</td>
                    <td className={`px-4 py-3 text-sm font-medium ${
                      yieldVal >= 5 ? 'text-green-600' : yieldVal >= 4 ? 'text-yellow-600' : 'text-gray-600'
                    }`}>
                      {formatPercentage(yieldVal)}
                    </td>
                    {bedIndex === 0 && (
                      <td className="px-4 py-3 text-sm" rowSpan={3}>
                        <button
                          onClick={() => handleDelete(suburb.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
      
      {suburbs.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          No suburbs found. Add some data to get started!
        </div>
      )}
    </div>
  )
}
