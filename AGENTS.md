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
   cat public/bookmarklet.js | tr '\n' ' ' | sed 's/  */ /g' | sed 's/\/\*[^*]*\*\+\([^\/][^*]*\*\+\)*\// /g' | sed 's/  */ /g'
   ```
2. Replace the bookmarklet code in INSTRUCTIONS.md (after "URL: Copy and paste this entire line:")
3. The INSTRUCTIONS.md contains the minified bookmarklet that users copy-paste
4. Keep both files in sync so users get the latest version
