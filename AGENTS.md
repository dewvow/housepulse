# Agent Notes

## Table Design Patterns

### Grouped Rows with Expandable Details

For displaying grouped data (e.g., suburbs with multiple yields), use this pattern:

```typescript
// Main row shows summary (first/best item)
// Click to expand and see all items

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

**Benefits:**
- Reduces visual clutter
- Allows sorting by best/average values
- Maintains full data access via expansion

### Helper Functions for Styling

Extract conditional styling logic to helper functions to avoid duplication:

```typescript
const getYieldColorClass = (yieldValue: number): string => {
  if (yieldValue >= 5) return 'text-green-600'
  if (yieldValue >= 4) return 'text-yellow-600'
  return 'text-gray-600'
}
```

### Component Extraction

When a component grows >300 lines, extract into sub-components:

1. **Icons**: Extract SVG icons to separate file (`components/icons.tsx`)
2. **Sub-components**: Break into logical units (Header, Row, Expanded view)
3. **Event Handlers**: Use `useCallback` for all handlers passed to children

## Debugging Bookmarklets

When debugging bookmarklets that extract data from websites (like realestate.com.au), note that:

- The user can paste HTML content directly for analysis
- This is useful when:
  - The website blocks automated fetching (429 errors)
  - The content requires authentication
  - The DOM structure needs to be inspected

## Workflow

1. If fetching fails, ask the user to paste the relevant HTML
2. Use the pasted HTML to debug extraction logic
3. Update the bookmarklet code accordingly

## Bookmarklet Updates

**IMPORTANT**: When updating `public/bookmarklet.js`, you MUST also update `INSTRUCTIONS.md`:

1. Minify the bookmarklet code using:
   ```bash
   cat public/bookmarklet.js | sed '1,2d' | sed 's/\/\/.*$//' | tr '\n' ' ' | sed 's/  */ /g' | sed 's/\/\*[^*]*\*\+\([^\/][^*]*\*\+\)*\// /g' | sed 's/  */ /g' | sed 's/^ *//' | sed 's/ *$//'
   ```
   
   **Important**: The `sed 's/\/\/.*$//'` removes single-line comments BEFORE converting newlines to spaces. If comments aren't removed first, they'll consume the rest of the code when newlines become spaces, causing "Unexpected end of input" errors.
2. Replace the bookmarklet code in INSTRUCTIONS.md (after "URL: Copy and paste this entire line:")
3. The INSTRUCTIONS.md contains the minified bookmarklet that users copy-paste
4. Keep both files in sync so users get the latest version

## ABS Census Data Integration

### Problem: ABS REST API Limitations

The ABS Census 2021 REST API has significant limitations for detailed demographic data:

- **G13 (Language)** and **G60 (Occupation)** tables are **NOT accessible** via REST API for POA (postcode) geography
- Even with correct SDMX query format, API returns "NoRecordsFound" for all postcodes
- Only simple summary tables like **G02 (Medians)** work via REST API
- Detailed cross-tabulation tables may only be available via DataPacks (CSV downloads)

**Tested postcodes**: 2000 (Sydney), 3000 (Melbourne), 4000 (Brisbane) - all failed for G13/G60

### Solution: Pre-processed Census DataPacks

Use the offline DataPack approach instead of API calls:

1. **Download Census DataPacks** from https://www.abs.gov.au/census/find-census-data/datapacks
   - File: `2021_GCP_POA_for_AUS_short-header.zip` (37 MB)
   - Contains G13 and G60 CSV files for all ~2,600 Australian postcodes

2. **Process CSV files** to extract top language and occupation per postcode
   - G13: 5 CSV files (A-E) with language proficiency cross-tabulations
   - G60: 2 CSV files (A-B) with occupation by age and sex
   - Extract columns ending with `_Tot` (totals), excluding `UOLSE` (unclear proficiency) and aggregate subtotals like `CL_Tot_Tot`
   - Sum across all age/sex groups to get overall occupation totals

3. **Generate compact JSON lookups**:
   - `/public/data/census-language.json` - Simple `{postcode: language}` mapping
   - `/public/data/census-occupation.json` - Simple `{postcode: occupation}` mapping
   - Files are ~200KB total (vs 37MB raw data)

4. **Client-side loading**:
   - Load JSON files via fetch on first use
   - Cache in memory for subsequent lookups
   - Instant response (no API delays)

### Processing Script

Location: `/scripts/process-census-data.js`

Run to regenerate lookup files:
```bash
node scripts/process-census-data.js
```

**Important parsing rules:**

**Language (G13):**
- Column format: `MOL_{Language}_Tot` (e.g., `MOL_Mandarin_Tot`, `MOL_IAL_Hindi_Tot`)
- `MSEO_Tot` = English
- Exclude: `UOLSE` columns, aggregate totals like `CL_Tot_Tot`, `IAL_Tot_Tot`
- Map abbreviations: `Guj` → Gujarati, `Canton` → Cantonese, etc.

**Occupation (G60):**
- Column format: `{Sex}{Age}_{Occupation}` (e.g., `M15_19_Managers`, `F20_24_Professionals`)
- Sum across all sex/age groups for each occupation category
- Categories: Managers, Professionals, Technicians and Trades Workers, Community and Personal Service Workers, Clerical and Administrative Workers, Sales Workers, Machinery Operators and Drivers, Labourers

### Data Quality

**Language coverage:** 2,639 postcodes
- English: 2,617 (99.2%)
- Arabic: 4 (e.g., Bankstown 2200)
- Mandarin: 4
- Vietnamese: 3
- Other languages: <10 total

**Occupation coverage:** 2,636 postcodes
- Professionals: Dominant in metro areas
- Coverage: ~99% of postcodes

### Hybrid Approach

The final implementation uses a **hybrid approach**:
- **G02 (Median Age/Income)**: Fetched from ABS REST API (works reliably)
- **G13 (Language)**: Loaded from pre-processed JSON
- **G60 (Occupation)**: Loaded from pre-processed JSON

**Benefits:**
- Real-time income data (may be updated by ABS)
- Offline language/occupation data (instant, no API failures)
- Complete Census 2021 data for all fields
