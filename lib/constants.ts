// UI Constants
export const UI = {
  // Emojis and icons
  HOT_ICON: '🔥',
  SORT_ASC: '↑',
  SORT_DESC: '↓',
  SORT_BOTH: '↕',
  EXPAND_ICON: '▶',
  COLLAPSE_ICON: '▼',
  
  // Table column headers
  HEADERS: {
    SUBURB: 'Suburb',
    STATE: 'State',
    TYPE_BEDS: 'Type / Beds',
    YIELD: 'Yield',
    PRICE: 'Price',
    LAST_UPDATED: 'Last Updated',
    ACTIONS: 'Actions',
    PROPERTY_TYPE: 'Property Type',
    BEDS: 'Beds',
    BUY_PRICE: 'Buy Price',
    WEEKLY_RENT: 'Rent/wk',
    YIELD_PERCENT: 'Yield %',
    DATE_ADDED: 'Date Added',
    HOT: 'Hot',
  },
  
  // Empty states
  NO_DATA: 'No data',
  NO_SUBURBS: 'No suburbs found. Add some data to get started!',
  NO_HOT_SUBURBS: 'No hot suburbs marked yet. Use the bookmarklet on Hot 100 pages to mark suburbs as hot.',
} as const

// CSV Export
export const CSV = {
  HEADERS: [
    'Suburb',
    'State', 
    'Postcode',
    'Hot',
    'Property Type',
    'Beds',
    'Buy Price',
    'Weekly Rent',
    'Yield %',
    'Date Added',
    'Last Updated',
  ],
  FILENAME_PREFIX: 'housepulse-data',
  HOT_YES: 'Yes',
  HOT_NO: 'No',
} as const

// External URLs
export const URLS = {
  REA_BASE: 'https://www.realestate.com.au',
  getReaSuburbUrl: (suburb: string, state: string, postcode: string): string => {
    const slug = `${state.toLowerCase()}/${suburb.toLowerCase().replace(/\s+/g, '-')}-${postcode}`
    return `${URLS.REA_BASE}/${slug}/`
  },
} as const

// Yield colors
export const YIELD_COLORS = {
  HIGH: 'text-green-600',    // >= 5%
  MEDIUM: 'text-yellow-600', // >= 4%
  LOW: 'text-gray-600',      // < 4%
} as const

// Property type badges
export const PROPERTY_BADGES = {
  house: 'bg-blue-100 text-blue-800',
  unit: 'bg-green-100 text-green-800',
} as const

// Bedroom types
export const BEDROOM_TYPES = ['2', '3', '4+'] as const
export type BedroomTypeValue = typeof BEDROOM_TYPES[number]

// Property types
export const PROPERTY_TYPES = ['house', 'unit'] as const
export type PropertyTypeValue = typeof PROPERTY_TYPES[number]

// Form placeholders
export const PLACEHOLDERS = {
  SUBURB_NAME: 'Suburb name',
  POSTCODE: 'Postcode',
  BUY_PRICE: 'Buy price',
  RENT_WEEK: 'Rent/week',
  JSON_INPUT: 'Paste JSON data from bookmarklet here...',
  MAX_PRICE: 'e.g. 750',
  SEARCH_SUBURB: 'Type to search suburbs...',
} as const

// Labels
export const LABELS = {
  ADD_SUBURB_DATA: 'Add Suburb Data',
  PASTE_JSON: 'Paste JSON',
  MANUAL_ENTRY: 'Manual Entry',
  ADD_SUBURB: 'Add Suburb',
  MARK_HOT: 'Mark as Hot Suburb',
  SEARCH_SUBURB: 'Search Suburb',
  SELECT_STATE: 'Select State/Territory',
  ALL_STATES: 'All States',
  MAX_PRICE: 'Max Price ($K)',
  MIN_YIELD: 'Min Yield %',
  NO_LIMIT: 'No limit',
  NO_MINIMUM: 'No minimum',
  SHOW_HOT_ONLY: 'Show Hot Suburbs Only',
  EXPORT_CSV: (count: number) => `Export CSV (${count} suburbs)`,
  TOTAL_SUBURBS: 'Total Suburbs:',
  FILTERED: 'Filtered:',
  HOT_SUBURBS: 'Hot Suburbs:',
  HOUSE_PRICES: 'House Prices',
  UNIT_PRICES: 'Unit Prices',
} as const

// Error messages
export const ERRORS = {
  INVALID_JSON: 'Invalid JSON',
  MISSING_FIELDS: 'Missing required fields: suburb, state, postcode',
  CLIPBOARD_MISMATCH: (clicked: string, clipboard: string) => 
    `Clipboard data doesn't match. You clicked on "${clicked}" but the clipboard contains "${clipboard}".`,
  DELETE_CONFIRM: 'Are you sure you want to delete this suburb?',
  PASTE_FAILED: (msg: string) => `Failed to paste: ${msg}`,
  REQUIRED_FIELDS: 'Please fill in all required fields',
} as const

// Sorting
export const SORT = {
  FIELDS: ['suburb', 'yield', 'price'] as const,
  DIRECTIONS: ['asc', 'desc'] as const,
} as const
