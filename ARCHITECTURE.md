# HousePulse Architecture

## Overview

HousePulse is a Next.js application for real estate market research in Australia. It helps investors research properties by state, suburb, price, and rental yield.

## Tech Stack

- **Framework**: Next.js 14.2.5 (App Router)
- **Language**: TypeScript 5.5.4
- **UI**: React 18.3.1
- **Styling**: Tailwind CSS 3.4.7
- **Validation**: Zod
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
│   ├── ui/                      # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Checkbox.tsx
│   │   └── TextArea.tsx
│   ├── DataInput.tsx            # Data entry form
│   ├── ExportButton.tsx         # CSV export
│   ├── FilterBar.tsx            # Filter controls
│   ├── HotSuburbs.tsx           # Hot suburbs list
│   ├── icons.tsx                # SVG icons
│   ├── StateSelector.tsx        # State picker
│   ├── SuburbSearch.tsx         # Suburb search
│   └── YieldTable.tsx           # Main data table
├── lib/                         # Utilities and types
│   ├── calculations.ts          # Yield calculations
│   ├── storage.ts               # Data persistence
│   ├── suburbs.ts               # Suburb data
│   ├── types.ts                 # TypeScript types
│   ├── constants.ts             # App constants
│   ├── validation.ts            # Zod validation schemas
│   ├── bedroom-utils.ts         # Bedroom data utilities
│   ├── date-utils.ts           # Date formatting
│   ├── url-builder.ts           # External URL builders
│   └── hooks/                   # Custom React hooks
│       ├── useClipboard.ts
│       ├── useSort.ts
│       ├── useExpandedRows.ts
│       └── useAsync.ts
├── public/                      # Static assets
└── INSTRUCTIONS.md              # User documentation
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

- **File-based**: Data persisted to `data/suburbs-data.json`
- **API**: REST endpoints via `/api/suburbs`
- **Backup/Restore**: JSON import/export via DataInput component

## Component Architecture

### Data Flow

1. **DataInput** → User inputs property data
2. **storage.ts** → Persists to file via API
3. **dashboard/page.tsx** → Loads data, manages filters
4. **FilterBar** → User adjusts filters
5. **YieldTable** → Displays filtered results

### UI Component Library

Located in `components/ui/`:

| Component | Props | Purpose |
|-----------|-------|---------|
| Button | variant, size, fullWidth | Reusable button with variants (primary, secondary, outline, danger, ghost) |
| Input | label, error | Text input with label and error states |
| Select | label, error, options | Dropdown select with options |
| Checkbox | label | Accessible checkbox with label |
| TextArea | label, error | Multi-line text input |

### Key Components

| Component | Purpose | Location |
|-----------|---------|----------|
| DataInput | Entry form for new property data | `components/DataInput.tsx` |
| FilterBar | Multi-filter sidebar (states, bedrooms, price, yield) | `components/FilterBar.tsx` |
| YieldTable | Expandable table showing yield data by suburb | `components/YieldTable.tsx` |
| ExportButton | CSV export functionality | `components/ExportButton.tsx` |
| HotSuburbs | Lists "hot" suburbs with special indicators | `components/HotSuburbs.tsx` |

## Utilities

### Constants (`lib/constants.ts`)

Centralized constants for:
- UI labels and placeholders
- CSV export configuration
- External URLs (realestate.com.au)
- Yield color thresholds
- Error messages

### Validation (`lib/validation.ts`)

Zod schemas for runtime validation:
- `SuburbDataSchema` - Full suburb data validation
- `BookmarkletDataSchema` - Bookmarklet import validation
- `FilterStateSchema` - Filter state validation
- Migration support for old data formats

### Bedroom Utilities (`lib/bedroom-utils.ts`)

- `forEachBedroom()` - Iterate over bedroom types
- `mapBedroom()` - Map bedroom types to values
- `createEmptyBedroomData()` - Initialize empty bedroom data
- `convertOldBedroomFormat()` - Migrate legacy data

### Custom Hooks (`lib/hooks/`)

- `useClipboard` - Clipboard read/write operations
- `useSort` / `useSortWithDirection` - Sort state management
- `useExpandedRows` - Expandable row state
- `useAsync` - Async operation state

### Date Utilities (`lib/date-utils.ts`)

- `formatDate()` - Localized date formatting
- `formatRelativeDate()` - Relative time ("2 days ago")
- `toDate()` / `isValidDate()` - Date conversion/validation

### URL Builder (`lib/url-builder.ts`)

- `buildReaSuburbUrl()` - Realestate.com.au suburb page
- `buildReaSearchUrl()` - Search results page
- `buildGoogleMapsUrl()` - Google Maps location

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

Returns all saved suburbs.

### POST /api/suburbs

Save a new suburb or update existing.

### DELETE /api/suburbs?id={id}

Delete a suburb by ID.

### PUT /api/suburbs

Clear all suburbs.

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
- Filename: `housepulse-data-[date].csv`

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
- Zod validation at runtime
- No `any` types used
- Const assertions for literal unions

## Design Patterns

### Expandable Rows with Details

```typescript
const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

const toggleExpand = useCallback((id: string) => {
  setExpandedRows(prev => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })
}, [])
```

### Helper Functions for Styling

```typescript
const getYieldColorClass = (yieldValue: number): string => {
  if (yieldValue >= 5) return 'text-green-600'
  if (yieldValue >= 4) return 'text-yellow-600'
  return 'text-gray-600'
}
```

## Future Considerations

- **Database**: Currently file-based; could migrate to Supabase/Firebase
- **Authentication**: No auth currently; could add user accounts
- **Mobile**: Responsive but could optimize mobile UX further
- **Charts**: Could add yield trend visualization
- **API**: Could add real-time price fetching
