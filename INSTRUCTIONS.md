# HousePulse Setup Instructions

## Overview
HousePulse is a real estate market research tool for finding investment properties in Australia by state, suburb, price, and rental yield. It extracts data from realestate.com.au's "Median Price Snapshot" feature, which supports both **House** and **Unit** data for 2, 3, and 4+ bedroom properties.

## Project Structure

```
/
├── app/
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Home page with search
│   ├── dashboard/
│   │   └── page.tsx         # Dashboard with filters
│   └── globals.css          # Global styles
├── components/              # React components
├── lib/                     # Utility functions
├── data/
│   └── suburbs-data.json    # Persisted suburb data
├── public/
│   ├── data/
│   │   └── suburbs.json     # Australian suburbs data (~5MB)
│   └── bookmarklet.js       # Browser extraction script
└── INSTRUCTIONS.md          # This file
```

## Step 1: Install Dependencies

Run in the project root:
```bash
npm install
```

## Step 2: Download Suburbs Data

**File:** `public/data/suburbs.json` (~5MB)

This file contains ~40,000 Australian suburbs with state and postcode data.

### Download Options:

#### Option A: From GitHub (Recommended)
Download from: `https://raw.githubusercontent.com/michalsn/australian-suburbs/master/data/suburbs.json`

#### Option B: From data.gov.au
1. Visit: `https://data.gov.au/data/dataset/suburb-boundaries`
2. Download JSON format
3. Save as `public/data/suburbs.json`

### File Format Expected:
```json
[
  {
    "suburb": "East Albury",
    "state": "NSW",
    "postcode": "2640",
    "latitude": -36.09041,
    "longitude": 146.93912
  }
]
```

## Step 3: Configure Bookmarklet

The bookmarklet extracts property data from realestate.com.au's "Median Price Snapshot" section, which shows buy and rent prices for different bedroom counts.

### Bookmarklet Setup

**Option A: Create a Bookmark (Recommended)**

1. Right-click your browser's bookmark bar → "Add page" or "Add bookmark"
2. Name: **HousePulse Extract**
3. URL: Copy and paste this entire line:

```javascript
javascript:(function() { 'use strict'; console.clear(); console.log('%c HousePulse Bookmarklet v2.1 ', 'background: #10b981; color: white; font-size: 16px; padding: 5px;'); if (!window.location.hostname.includes('realestate.com.au')) { alert('This bookmarklet only works on realestate.com.au'); return; } console.log('Starting extraction...'); const pathParts = window.location.pathname.split('/').filter(Boolean); let state = ''; let suburb = ''; let postcode = ''; if (pathParts.length >= 2) { state = pathParts[0].toUpperCase(); const locationPart = pathParts[1]; const match = locationPart.match(/^(.+)-(\d{4})$/); if (match) { suburb = match[1].replace(/-/g, ' ').replace(/\w/g, l => l.toUpperCase()); postcode = match[2]; } } const isHotPage = document.body.textContent.includes('Hot 100') || document.body.textContent.includes('Hot Suburbs') || window.location.pathname.includes('hot'); const parseNumber = (text) => { if (!text) return 0; const match = text.match(/\$?([\d,]+)/); if (!match) return 0; const num = parseInt(match[1].replace(/,/g, ''), 10); return isNaN(num) ? 0 : num; }; const findPriceTable = () => { console.log('Looking for price table...'); const snapshotSection = document.querySelector('section[class*="median-price-snapshot"]'); console.log('Found median-price-snapshot section:', snapshotSection ? 'YES' : 'NO'); if (snapshotSection) { const table = snapshotSection.querySelector('table'); if (table) { console.log('Found table in median-price-snapshot section'); return table; } } console.log('Trying fallback: searching all tables for bed data...'); const tables = document.querySelectorAll('table'); console.log('Total tables found:', tables.length); for (let i = 0; i < tables.length; i++) { const table = tables[i]; const hasBedData = table.querySelector('[data-testid*="-bed-"]'); if (hasBedData) { console.log('Found price table (table #' + i + ') by bed data'); return table; } } console.log('ERROR: Could not find any table with bed data'); return null; }; const extractPricesFromTable = (table, label) => { const prices = {}; if (!table) { console.log('ERROR: No table provided to extractPricesFromTable'); return prices; } console.log('=== EXTRACTING ' + label + ' PRICES ==='); const rows = table.querySelectorAll('tbody tr, tr'); console.log('Found ' + rows.length + ' rows in table'); if (rows.length === 0) { console.log('WARNING: No rows found in table!'); console.log('Table innerHTML:', table.innerHTML.substring(0, 500)); } rows.forEach((row, index) => { console.log('--- Row ' + index + ' ---'); const testIdEl = row.querySelector('[data-testid*="-bed-"]'); if (!testIdEl) { console.log(' No data-testid element found in this row'); return; } const testId = testIdEl.getAttribute('data-testid'); console.log(' testid:', testId); const match = testId.match(/^(\d+)-bed-(house|unit)$/); if (!match) { console.log(' testid does not match pattern'); return; } const beds = match[1]; const propType = match[2]; const key = propType + '-' + beds; const cells = row.querySelectorAll('td'); console.log(' cells found:', cells.length); if (cells.length < 2) { console.log(' ERROR: Less than 2 cells in row'); return; } const priceCell = cells[1]; const priceText = priceCell.textContent.trim(); console.log(' price text:', priceText); prices[key] = parseNumber(priceText); console.log(' EXTRACTED:', key, '=', prices[key]); }); console.log('=== ' + label + ' PRICES SUMMARY ==='); console.log(JSON.stringify(prices, null, 2)); return prices; }; const extractData = async () => { console.log('Step 1: Starting extraction...'); const table = findPriceTable(); if (!table) { throw new Error('Could not find the median price table. Make sure the "Median price snapshot" section is visible.'); } console.log('Step 2: Found table, extracting Buy prices...'); const result = { house: { '2': { buyPrice: 0, rentPrice: 0 }, '3': { buyPrice: 0, rentPrice: 0 }, '4+': { buyPrice: 0, rentPrice: 0 } }, unit: { '1': { buyPrice: 0, rentPrice: 0 }, '2': { buyPrice: 0, rentPrice: 0 }, '3': { buyPrice: 0, rentPrice: 0 } } }; const section = table.closest('section') || table.parentElement; console.log('=== EXTRACTING BUY PRICES ==='); const buyPrices = extractPricesFromTable(table, 'Buy'); Object.keys(buyPrices).forEach(key => { const parts = key.split('-'); const propType = parts[0]; const beds = parts[1]; const bedKey = beds === '4' ? '4+' : beds; if (result[propType] && result[propType][bedKey]) { result[propType][bedKey].buyPrice = buyPrices[key]; } }); console.log('Step 3: Buy prices extracted:', JSON.stringify(buyPrices, null, 2)); const allButtons = section.querySelectorAll('button[role="tab"]'); let rentButton = null; let buyButton = null; allButtons.forEach(btn => { const text = btn.textContent.trim(); console.log('Found button:', text, '- selected:', btn.getAttribute('aria-selected')); if (text.toLowerCase().includes('rent')) rentButton = btn; if (text.toLowerCase().includes('buy')) buyButton = btn; }); if (!rentButton) { console.log('Could not find Rent button in section, checking all buttons...'); document.querySelectorAll('button').forEach(btn => { const text = btn.textContent.trim().toLowerCase(); if (text === 'rent' || text.includes('rent')) { console.log('Found rent button elsewhere:', btn); rentButton = btn; } }); } if (rentButton) { console.log('Step 4: Found Rent button, clicking it...'); rentButton.click(); await new Promise(resolve => setTimeout(resolve, 1500)); const rentTable = findPriceTable(); if (rentTable) { console.log('Step 5: Found table after Rent click, extracting...'); const rentPrices = extractPricesFromTable(rentTable, 'Rent'); Object.keys(rentPrices).forEach(key => { const parts = key.split('-'); const propType = parts[0]; const beds = parts[1]; const bedKey = beds === '4' ? '4+' : beds; if (result[propType] && result[propType][bedKey]) { result[propType][bedKey].rentPrice = rentPrices[key]; } }); console.log('Step 6: Rent prices extracted:', JSON.stringify(rentPrices, null, 2)); } else { console.log('ERROR: Could not find table after clicking Rent!'); } if (buyButton) { console.log('Switching back to Buy tab...'); buyButton.click(); } } else { console.log('WARNING: No Rent button found!'); } console.log('Step 7: Extraction complete!'); return result; }; extractData().then(bedroomData => { console.log('=== FINAL DATA ==='); console.log(JSON.stringify(bedroomData, null, 2)); const calculateYield = (buyPrice, rentPrice) => { if (buyPrice <= 0 || rentPrice <= 0) return 0; return ((rentPrice * 52) / buyPrice) * 100; }; const result = { suburb: suburb, state: state, postcode: postcode, isHot: isHotPage, source: window.location.href, date: new Date().toISOString().split('T')[0], house: { bedrooms: { '2': bedroomData.house['2'], '3': bedroomData.house['3'], '4+': bedroomData.house['4+'] }, yield: { '2': calculateYield(bedroomData.house['2'].buyPrice, bedroomData.house['2'].rentPrice), '3': calculateYield(bedroomData.house['3'].buyPrice, bedroomData.house['3'].rentPrice), '4+': calculateYield(bedroomData.house['4+'].buyPrice, bedroomData.house['4+'].rentPrice) } }, unit: { bedrooms: { '1': bedroomData.unit['1'], '2': bedroomData.unit['2'], '3': bedroomData.unit['3'] }, yield: { '1': calculateYield(bedroomData.unit['1'].buyPrice, bedroomData.unit['1'].rentPrice), '2': calculateYield(bedroomData.unit['2'].buyPrice, bedroomData.unit['2'].rentPrice), '3': calculateYield(bedroomData.unit['3'].buyPrice, bedroomData.unit['3'].rentPrice) } } }; const jsonString = JSON.stringify(result, null, 2); console.log('Copying to clipboard:', jsonString); navigator.clipboard.writeText(jsonString).then(() => { const houseData = Object.entries(bedroomData.house) .filter(([k, v]) => v.buyPrice > 0 || v.rentPrice > 0) .map(([k, v]) => `${k}br: $${v.buyPrice.toLocaleString()}/$${v.rentPrice}/wk`) .join('<br>'); const unitData = Object.entries(bedroomData.unit) .filter(([k, v]) => v.buyPrice > 0 || v.rentPrice > 0) .map(([k, v]) => `${k}br: $${v.buyPrice.toLocaleString()}/$${v.rentPrice}/wk`) .join('<br>'); const notification = document.createElement('div'); notification.style.cssText = ` position: fixed; top: 20px; right: 20px; background: #10b981; color: white; padding: 16px 24px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10000; font-family: sans-serif; font-size: 13px; max-width: 450px; max-height: 80vh; overflow-y: auto; `; notification.innerHTML = ` <strong style="font-size: 16px;">[OK] Data Extracted!</strong><br> <strong>${suburb}, ${state} ${postcode}</strong><br> <div style="margin-top: 10px; font-size: 12px; line-height: 1.5;"> <strong>Houses:</strong><br>${houseData || 'No data'}<br><br> <strong>Units:</strong><br>${unitData || 'No data'} </div> <small style="opacity: 0.9; margin-top: 10px; display: block;"> ${isHotPage ? '[HOT] Hot Suburb! ' : ''}Copied to clipboard! </small> `; document.body.appendChild(notification); setTimeout(() => notification.remove(), 10000); console.log('Success! Data copied to clipboard'); setTimeout(() => window.close(), 2000); }); }).catch(err => { console.error('Error:', err); alert('Error: ' + err.message + ' - Check browser console (F12) for debug info.'); }); })();

4. Click Save

**Option B: Use the Console (For Testing)**

1. Open a realestate.com.au suburb page
2. Open DevTools (F12 or Cmd+Option+I) → Console tab
3. Copy the contents of `public/bookmarklet.js` and paste it
4. Press Enter

### What the Bookmarklet Extracts

- Suburb name, state, postcode (from URL)
- **House data**: Buy price and rent for 2, 3, and 4+ bedrooms
- **Unit data**: Buy price and rent for 2, 3, and 4+ bedrooms
- "Hot" status (detects if page is from Hot 100 list)
- Source URL and extraction date
- **Yield calculation**: Automatically calculated from buy price and weekly rent

### Data Format

The bookmarklet extracts data in this format:
```json
{
  "suburb": "Armadale",
  "state": "VIC",
  "postcode": "3143",
  "isHot": false,
  "house": {
    "bedrooms": {
      "2": { "buyPrice": 1200000, "rentPrice": 650 },
      "3": { "buyPrice": 1800000, "rentPrice": 850 },
      "4+": { "buyPrice": 2500000, "rentPrice": 1100 }
    },
    "yield": { "2": 2.82, "3": 2.46, "4+": 2.29 }
  },
  "unit": {
    "bedrooms": {
      "2": { "buyPrice": 750000, "rentPrice": 550 },
      "3": { "buyPrice": 950000, "rentPrice": 700 },
      "4+": { "buyPrice": 0, "rentPrice": 0 }
    },
    "yield": { "2": 3.81, "3": 3.83, "4+": 0 }
  },
  "source": "https://www.realestate.com.au/vic/armadale-3143/",
  "date": "2025-02-18"
}
```

### Usage

1. Navigate to any realestate.com.au suburb profile page (e.g., `https://www.realestate.com.au/vic/armadale-3143/`)
2. Make sure the "Median price snapshot" section is visible on the page
3. Click the **HousePulse Extract** bookmark
4. A green notification appears with extracted data
5. JSON is automatically copied to your clipboard
6. Paste into HousePulse dashboard's data input area

## Step 4: Start Development

```bash
npm run dev
```

App runs at `http://localhost:3000`

## Usage Workflow

1. **Select State** → Shows "Hot Suburbs" for that state
2. **Search Suburb** → Autocomplete from full list
3. **Click Suburb** → Opens realestate.com.au profile in new tab
4. **Run Bookmarklet** → Extracts House & Unit data to clipboard
5. **Paste JSON** → Saved to file-based storage
6. **Filter Dashboard** → By state, property type (House/Unit), beds, price, yield

## Features

- State/territory selection
- Autocomplete suburb search
- Hot suburbs badges
- **Property type filtering** (House vs Unit)
- Bedroom-specific data (2, 3, 4+ beds)
- Rental yield calculation (annual rent / buy price)
- **File-based persistence** (data survives server restarts)
- Export to CSV
- Toggle between Buy and Rent views

## Data Storage

Suburb data is stored in `data/suburbs-data.json` and persists across:
- Browser sessions
- Server restarts
- Application updates

## Required Files Not Included

1. `public/data/suburbs.json` (~5MB) - Download manually
2. Node modules - Run `npm install`

## Environment

- Node.js 18+
- Next.js 14
- React 18
- Tailwind CSS 3
- TypeScript 5

## Tips

- Toggle between "Buy" and "Rent" tabs on realestate.com.au to see different data
- The bookmarklet extracts both House and Unit data when available
- Use the Property Type filter in the dashboard to compare House vs Unit yields
- Hot suburbs are marked automatically when extracting from Hot 100 pages
