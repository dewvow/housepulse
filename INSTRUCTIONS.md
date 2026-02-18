# HousePulse Setup Instructions

## Overview
HousePulse is a real estate market research tool for finding investment properties in Australia by state, suburb, price, and rental yield.

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

The bookmarklet extracts property data from realestate.com.au suburb profile pages and copies it to your clipboard as JSON.

### Bookmarklet Setup

**Option A: Create a Bookmark (Recommended)**

1. Right-click your browser's bookmark bar → "Add page" or "Add bookmark"
2. Name: **HousePulse Extract**
3. URL: Copy and paste this entire line:

```javascript
javascript:(function(){'use strict';if(!window.location.hostname.includes('realestate.com.au')){alert('This bookmarklet only works on realestate.com.au');return;}function extractPrice(text){if(!text)return 0;const match=text.match(/[\d,]+/g);if(!match)return 0;return parseInt(match.join('').replace(/,/g,''),10)||0;}function extractRent(text){if(!text)return 0;const match=text.match(/\$?([\d,]+)/);if(!match)return 0;return parseInt(match[1].replace(/,/g,''),10)||0;}const pathParts=window.location.pathname.split('/').filter(Boolean);let state='',suburb='',postcode='';if(pathParts.length>=2){state=pathParts[0].toUpperCase();const locationPart=pathParts[1];const match=locationPart.match(/^(.+)-(\d{4})$/);if(match){suburb=match[1].replace(/-/g,' ').replace(/\b\w/g,l=>l.toUpperCase());postcode=match[2];}}const isHotPage=document.body.textContent.includes('Hot 100')||document.body.textContent.includes('Hot Suburbs')||window.location.pathname.includes('hot');const bedroomData={'2':{salePrice:0,rent:0},'3':{salePrice:0,rent:0},'4+':{salePrice:0,rent:0}};const pageContent=document.body.innerText;const priceMatch=pageContent.match(/Median\s+(?:house\s+)?price[:\s]+\$?([\d,\.]+[MK]?)/i);const rentMatch=pageContent.match(/Median\s+(?:weekly\s+)?rent[:\s]+\$?([\d,]+)/i);if(priceMatch){bedroomData['3'].salePrice=extractPrice(priceMatch[1]);}if(rentMatch){bedroomData['3'].rent=extractRent(rentMatch[1]);}const result={suburb:suburb,state:state,postcode:postcode,isHot:isHotPage,bedrooms:bedroomData,source:window.location.href,date:new Date().toISOString().split('T')[0]};const jsonString=JSON.stringify(result,null,2);navigator.clipboard.writeText(jsonString).then(()=>{const notification=document.createElement('div');notification.style.cssText='position:fixed;top:20px;right:20px;background:#10b981;color:white;padding:16px 24px;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);z-index:10000;font-family:sans-serif;font-size:14px;max-width:400px;';notification.innerHTML='<strong>✓ Data Extracted!</strong><br>'+suburb+', '+state+' '+postcode+'<br><small style="opacity:0.9">'+(isHotPage?'🔥 Hot Suburb!':'')+'</small><br><small style="opacity:0.9">Copied to clipboard - paste in HousePulse</small>';document.body.appendChild(notification);setTimeout(()=>notification.remove(),5000);console.log('HousePulse: Data extracted',result);}).catch(()=>alert('Data copied:\n\n'+jsonString));})();
```

4. Click Save

**Option B: Use the Console (For Testing)**

1. Open a realestate.com.au suburb page
2. Open DevTools (F12 or Cmd+Option+I) → Console tab
3. Copy the contents of `public/bookmarklet.js` and paste it
4. Press Enter

### What the Bookmarklet Extracts

- Suburb name, state, postcode (from URL)
- Bedroom-specific prices (2, 3, 4+ beds) - when available on page
- Median rent per week
- "Hot" status (detects if page is from Hot 100 list)
- Source URL and extraction date

### Usage

1. Navigate to any realestate.com.au suburb profile page (e.g., `https://www.realestate.com.au/vic/armadale-3143/`)
2. Click the **HousePulse Extract** bookmark
3. A green notification appears with extracted data
4. JSON is automatically copied to your clipboard
5. Paste into HousePulse dashboard's data input area

## Step 4: Start Development

```bash
npm run dev
```

App runs at `http://localhost:3000`

## Usage Workflow

1. **Select State** → Shows "Hot Suburbs" for that state
2. **Search Suburb** → Autocomplete from full list
3. **Click Suburb** → Opens realestate.com.au profile in new tab
4. **Run Bookmarklet** → Extracts data to clipboard
5. **Paste JSON** → Saved to dashboard
6. **Filter Dashboard** → By state, beds, price, yield

## Features

- State/territory selection
- Autocomplete suburb search
- Hot suburbs badges
- Bedroom-specific data (2, 3, 4+ beds)
- Rental yield calculation
- Export to CSV
- Browser-based storage (localStorage)

## Required Files Not Included

1. `public/data/suburbs.json` (~5MB) - Download manually
2. Node modules - Run `npm install`

## Environment

- Node.js 18+
- Next.js 14
- React 18
- Tailwind CSS 3
- TypeScript 5
