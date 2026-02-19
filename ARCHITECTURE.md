# HousePulse Architecture

## Overview

HousePulse is a Next.js application for real estate market research in Australia. It helps investors research properties by state, suburb, price, and rental yield.

## Tech Stack

- **Framework**: Next.js 14.2.5 (App Router)
- **Language**: TypeScript 5.5.4
- **UI**: React 18.3.1
- **Styling**: Tailwind CSS 3.4.7
- **Build**: Next.js built-in build system

## Project Structure

```
HousePulse/
├── app/                          # Next.js App Router
│   ├── api/suburbs/route.ts      # API endpoint for suburbs
│   ├── dashboard/page.tsx        # Main dashboard
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
├── components/                   # React components
│   ├── DataInput.tsx             # Data entry form
│   ├── ExportButton.tsx          # CSV export
│   ├── FilterBar.tsx             # Filter controls
│   ├── HotSuburbs.tsx            # Hot suburbs list
│   ├── icons.tsx                 # SVG icons
│   ├── StateSelector.tsx         # State picker
│   ├── SuburbSearch.tsx          # Suburb search
│   └── YieldTable.tsx            # Main data table
├── lib/                          # Utilities and types
│   ├── calculations.ts           # Yield calculations
│   ├── storage.ts                # Data persistence
│   ├── suburbs.ts                # Suburb data
│   └── types.ts                  # TypeScript types
├── public/                       # Static assets
└── INSTRUCTIONS.md               # User documentation
```

## Data Model

### Core Types

```typescript
interface SuburbData {
  id: string
  suburb: string
  state: StateCode
  postcode: string
  isHot: boolean
  house: PropertyData
  unit: PropertyData
  dateAdded: string
  lastUpdated: string
}

interface PropertyData {
  bedrooms: Record<BedroomType, BedroomPriceData>
  yield: Record<BedroomType, number>
}

interface FilterState {
  states: StateCode[]
  bedrooms: BedroomType[]
  propertyTypes: PropertyType[]
  maxPrice: number | null
  minYield: number | null
  hotOnly: boolean
}
```

### Storage

- **Local Storage**: Client-side persistence using `localStorage`
- **Data Key**: `housepulse-data`
- **Backup/Restore**: JSON import/export via DataInput component

## Component Architecture

### Data Flow

1. **DataInput** → User inputs property data
2. **storage.ts** → Persists to localStorage
3. **dashboard/page.tsx** → Loads data, manages filters
4. **FilterBar** → User adjusts filters
5. **YieldTable** → Displays filtered results

### Key Components

| Component | Purpose | Location |
|-----------|---------|----------|
| DataInput | Entry form for new property data | `components/DataInput.tsx` |
| FilterBar | Multi-filter sidebar (states, bedrooms, price, yield) | `components/FilterBar.tsx` |
| YieldTable | Expandable table showing yield data by suburb | `components/YieldTable.tsx` |
| ExportButton | CSV export functionality | `components/ExportButton.tsx` |
| HotSuburbs | Lists "hot" suburbs with special indicators | `components/HotSuburbs.tsx` |

## State Management

### Dashboard State

```typescript
const [suburbs, setSuburbs] = useState<SuburbData[]>([])
const [filteredSuburbs, setFilteredSuburbs] = useState<SuburbData[]>([])
const [filters, setFilters] = useState<FilterState>({
  states: [],
  bedrooms: [],
  propertyTypes: [],
  maxPrice: null,
  minYield: null,
  hotOnly: false,
})
```

### Filter Flow

1. User changes filters in `FilterBar`
2. `setFilters` updates state
3. `useEffect` triggers filtering
4. `filterSuburbs()` applies all active filters
5. `YieldTable` re-renders with filtered data

## API Routes

### GET /api/suburbs

Returns list of all Australian suburbs for autocomplete.

**Response**: `SuburbListItem[]`

```typescript
{
  suburb: string
  state: StateCode
  postcode: string
}
```

## Features

### 1. Data Entry
- Manual entry via DataInput form
- JSON import/export for backup
- Bookmarklet for extracting data from realestate.com.au

### 2. Filtering
- Multi-select: States, Bedrooms, Property Types
- Range: Max Price (in thousands), Min Yield %
- Boolean: Hot Suburbs Only

### 3. Display
- Expandable table: One row per suburb, expand for details
- Color-coded yields: Green (≥5%), Yellow (≥4%), Gray (<4%)
- Summary statistics in sidebar

### 4. Export
- CSV export with all filtered data
- Filename: `suburbs-[date].csv`

## Bookmarklet Integration

Users can install a bookmarklet to extract data from realestate.com.au. The bookmarklet:
1. Scrapes listing data (buy price, rent price)
2. Copies to clipboard as JSON
3. Can be pasted into DataInput

## Build Commands

```bash
# Development
npm run dev

# Build
npm run build

# Production
npm run start

# Lint
npm run lint
```

## Type Safety

All data structures use TypeScript:
- Strict null checks enabled
- No `any` types used
- Const assertions for literal unions

## Future Considerations

- **Database**: Currently localStorage; could migrate to Supabase/Firebase
- **Authentication**: No auth currently; could add user accounts
- **Mobile**: Responsive but could optimize mobile UX further
- **Charts**: Could add yield trend visualization
- **API**: Could add real-time price fetching
