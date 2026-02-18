import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import { join } from 'path'
import { SuburbData } from '@/lib/types'

const DATA_FILE = join(process.cwd(), 'data', 'suburbs-data.json')

async function readData(): Promise<SuburbData[]> {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8')
    return JSON.parse(data)
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
