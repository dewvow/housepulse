import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import { join } from 'path'
import { SuburbData, SuburbListItem, StateCode } from '@/lib/types'
import { getDistanceToCapital } from '@/lib/capital-distances'

const DATA_FILE = join(process.cwd(), 'data', 'suburbs-data.json')
const SUBURBS_REFERENCE_FILE = join(process.cwd(), 'public', 'data', 'suburbs.json')

let suburbsReferenceCache: SuburbListItem[] | null = null

async function loadSuburbsReference(): Promise<SuburbListItem[]> {
  if (suburbsReferenceCache) return suburbsReferenceCache
  
  try {
    const data = await fs.readFile(SUBURBS_REFERENCE_FILE, 'utf-8')
    const json = JSON.parse(data)
    const suburbs = json.data || json
    
    suburbsReferenceCache = suburbs.map((item: any) => ({
      suburb: item.suburb || item.name || item.locality,
      state: item.state?.toUpperCase(),
      postcode: String(item.postcode || item.zip || ''),
      sscCode: item.ssc_code,
      lat: item.lat,
      lng: item.lng,
      population: item.population,
      medianIncome: item.median_income
    }))
    
    return suburbsReferenceCache || []
  } catch (error) {
    console.error('Error loading suburbs reference:', error)
    return []
  }
}

function enrichSuburbData(suburb: SuburbData, reference: SuburbListItem[]): SuburbData {
  const match = reference.find(r => 
    r.suburb.toLowerCase() === suburb.suburb.toLowerCase() &&
    r.state === suburb.state &&
    String(r.postcode) === String(suburb.postcode)
  )
  
  if (match) {
    // Calculate distance if we have coordinates
    const distance = match.lat && match.lng 
      ? getDistanceToCapital(suburb.state as StateCode, match.lat, match.lng)
      : suburb.distanceToCapital || 0
    
    return {
      ...suburb,
      sscCode: match.sscCode,
      lat: match.lat,
      lng: match.lng,
      population: match.population,
      medianIncome: match.medianIncome,
      distanceToCapital: distance
    }
  }
  
  return suburb
}

async function readData(): Promise<SuburbData[]> {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8')
    const suburbs = JSON.parse(data)
    const reference = await loadSuburbsReference()
    
    return suburbs.map((s: SuburbData) => enrichSuburbData(s, reference))
  } catch (error) {
    return []
  }
}

async function writeData(suburbs: SuburbData[]): Promise<void> {
  await fs.writeFile(DATA_FILE, JSON.stringify(suburbs, null, 2), 'utf-8')
}

export async function GET() {
  try {
    const suburbs = await readData()
    return NextResponse.json(suburbs)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to read data' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const suburb: SuburbData = await request.json()
    const suburbs = await readData()
    
    const existingIndex = suburbs.findIndex(s => s.id === suburb.id)
    if (existingIndex >= 0) {
      suburbs[existingIndex] = suburb
    } else {
      suburbs.push(suburb)
    }
    
    await writeData(suburbs)
    return NextResponse.json(suburb)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save suburb' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }
    
    const suburbs = await readData()
    const filtered = suburbs.filter(s => s.id !== id)
    await writeData(filtered)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete suburb' }, { status: 500 })
  }
}

export async function PUT() {
  try {
    await writeData([])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to clear data' }, { status: 500 })
  }
}
