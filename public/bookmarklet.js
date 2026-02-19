// HousePulse Bookmarklet - Extract property data from realestate.com.au suburb pages
// Fixed version - extracts from table cells only, not page text

(function() {
  'use strict';
  
  console.clear();
  console.log('%c HousePulse Bookmarklet v2.1 ', 'background: #10b981; color: white; font-size: 16px; padding: 5px;');
  
  if (!window.location.hostname.includes('realestate.com.au')) {
    alert('This bookmarklet only works on realestate.com.au');
    return;
  }

  console.log('Starting extraction...');

  // Extract suburb info from URL
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  let state = '';
  let suburb = '';
  let postcode = '';

  if (pathParts.length >= 2) {
    state = pathParts[0].toUpperCase();
    const locationPart = pathParts[1];
    const match = locationPart.match(/^(.+)-(\d{4})$/);
    if (match) {
      suburb = match[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      postcode = match[2];
    }
  }

  // Check for Hot 100
  const isHotPage = document.body.textContent.includes('Hot 100') || 
                    document.body.textContent.includes('Hot Suburbs') ||
                    window.location.pathname.includes('hot');

  // Parse number from text (removes $, commas, and "per week")
  const parseNumber = (text) => {
    if (!text) return 0;
    const match = text.match(/\$?([\d,]+)/);
    if (!match) return 0;
    const num = parseInt(match[1].replace(/,/g, ''), 10);
    return isNaN(num) ? 0 : num;
  };

  // Find the median price snapshot table specifically
  const findPriceTable = () => {
    console.log('Looking for price table...');
    
    const snapshotSection = document.querySelector('section[class*="median-price-snapshot"]');
    console.log('Found median-price-snapshot section:', snapshotSection ? 'YES' : 'NO');
    
    if (snapshotSection) {
      const table = snapshotSection.querySelector('table');
      if (table) {
        console.log('Found table in median-price-snapshot section');
        return table;
      }
    }
    
    console.log('Trying fallback: searching all tables for bed data...');
    const tables = document.querySelectorAll('table');
    console.log('Total tables found:', tables.length);
    
    for (let i = 0; i < tables.length; i++) {
      const table = tables[i];
      const hasBedData = table.querySelector('[data-testid*="-bed-"]');
      if (hasBedData) {
        console.log('Found price table (table #' + i + ') by bed data');
        return table;
      }
    }
    
    console.log('ERROR: Could not find any table with bed data');
    return null;
  };

  // Extract prices from table
  const extractPricesFromTable = (table, label) => {
    const prices = {};
    
    if (!table) {
      console.log('ERROR: No table provided to extractPricesFromTable');
      return prices;
    }
    
    console.log('=== EXTRACTING ' + label + ' PRICES ===');
    
    const rows = table.querySelectorAll('tbody tr, tr');
    console.log('Found ' + rows.length + ' rows in table');
    
    if (rows.length === 0) {
      console.log('WARNING: No rows found in table!');
      console.log('Table innerHTML:', table.innerHTML.substring(0, 500));
    }
    
    rows.forEach((row, index) => {
      console.log('--- Row ' + index + ' ---');
      
      const testIdEl = row.querySelector('[data-testid*="-bed-"]');
      if (!testIdEl) {
        console.log('  No data-testid element found in this row');
        return;
      }
      
      const testId = testIdEl.getAttribute('data-testid');
      console.log('  testid:', testId);
      
      const match = testId.match(/^(\d+)-bed-(house|unit)$/);
      if (!match) {
        console.log('  testid does not match pattern');
        return;
      }
      
      const beds = match[1];
      const propType = match[2];
      const key = propType + '-' + beds;
      
      const cells = row.querySelectorAll('td');
      console.log('  cells found:', cells.length);
      
      if (cells.length < 2) {
        console.log('  ERROR: Less than 2 cells in row');
        return;
      }
      
      const priceCell = cells[1];
      const priceText = priceCell.textContent.trim();
      
      console.log('  price text:', priceText);
      
      prices[key] = parseNumber(priceText);
      console.log('  EXTRACTED:', key, '=', prices[key]);
    });
    
    console.log('=== ' + label + ' PRICES SUMMARY ===');
    console.log(JSON.stringify(prices, null, 2));
    
    return prices;
  };

  // Main extraction
  const extractData = async () => {
    console.log('Step 1: Starting extraction...');
    
    const table = findPriceTable();
    
    if (!table) {
      throw new Error('Could not find the median price table. Make sure the "Median price snapshot" section is visible.');
    }
    
    console.log('Step 2: Found table, extracting Buy prices...');

    const result = {
      house: {
        '2': { buyPrice: 0, rentPrice: 0 },
        '3': { buyPrice: 0, rentPrice: 0 },
        '4+': { buyPrice: 0, rentPrice: 0 }
      },
      unit: {
        '1': { buyPrice: 0, rentPrice: 0 },
        '2': { buyPrice: 0, rentPrice: 0 },
        '3': { buyPrice: 0, rentPrice: 0 }
      }
    };

    const section = table.closest('section') || table.parentElement;
    
    console.log('=== EXTRACTING BUY PRICES ===');
    const buyPrices = extractPricesFromTable(table, 'Buy');
    
    Object.keys(buyPrices).forEach(key => {
      const parts = key.split('-');
      const propType = parts[0];
      const beds = parts[1];
      const bedKey = beds === '4' ? '4+' : beds;
      if (result[propType] && result[propType][bedKey]) {
        result[propType][bedKey].buyPrice = buyPrices[key];
      }
    });

    console.log('Step 3: Buy prices extracted:', JSON.stringify(buyPrices, null, 2));

    const allButtons = section.querySelectorAll('button[role="tab"]');
    let rentButton = null;
    let buyButton = null;
    
    allButtons.forEach(btn => {
      const text = btn.textContent.trim();
      console.log('Found button:', text, '- selected:', btn.getAttribute('aria-selected'));
      if (text.toLowerCase().includes('rent')) rentButton = btn;
      if (text.toLowerCase().includes('buy')) buyButton = btn;
    });

    if (!rentButton) {
      console.log('Could not find Rent button in section, checking all buttons...');
      document.querySelectorAll('button').forEach(btn => {
        const text = btn.textContent.trim().toLowerCase();
        if (text === 'rent' || text.includes('rent')) {
          console.log('Found rent button elsewhere:', btn);
          rentButton = btn;
        }
      });
    }

    if (rentButton) {
      console.log('Step 4: Found Rent button, clicking it...');
      rentButton.click();
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const rentTable = findPriceTable();
      
      if (rentTable) {
        console.log('Step 5: Found table after Rent click, extracting...');
        const rentPrices = extractPricesFromTable(rentTable, 'Rent');
        
        Object.keys(rentPrices).forEach(key => {
          const parts = key.split('-');
          const propType = parts[0];
          const beds = parts[1];
          const bedKey = beds === '4' ? '4+' : beds;
          if (result[propType] && result[propType][bedKey]) {
            result[propType][bedKey].rentPrice = rentPrices[key];
          }
        });

        console.log('Step 6: Rent prices extracted:', JSON.stringify(rentPrices, null, 2));
      } else {
        console.log('ERROR: Could not find table after clicking Rent!');
      }

      if (buyButton) {
        console.log('Switching back to Buy tab...');
        buyButton.click();
      }
    } else {
      console.log('WARNING: No Rent button found!');
    }

    console.log('Step 7: Extraction complete!');
    return result;
  };

  // Execute
  extractData().then(bedroomData => {
    console.log('=== FINAL DATA ===');
    console.log(JSON.stringify(bedroomData, null, 2));

    const calculateYield = (buyPrice, rentPrice) => {
      if (buyPrice <= 0 || rentPrice <= 0) return 0;
      return ((rentPrice * 52) / buyPrice) * 100;
    };

    const result = {
      suburb: suburb,
      state: state,
      postcode: postcode,
      isHot: isHotPage,
      source: window.location.href,
      date: new Date().toISOString().split('T')[0],
      house: {
        bedrooms: {
          '2': bedroomData.house['2'],
          '3': bedroomData.house['3'],
          '4+': bedroomData.house['4+']
        },
        yield: {
          '2': calculateYield(bedroomData.house['2'].buyPrice, bedroomData.house['2'].rentPrice),
          '3': calculateYield(bedroomData.house['3'].buyPrice, bedroomData.house['3'].rentPrice),
          '4+': calculateYield(bedroomData.house['4+'].buyPrice, bedroomData.house['4+'].rentPrice)
        }
      },
      unit: {
        bedrooms: {
          '1': bedroomData.unit['1'],
          '2': bedroomData.unit['2'],
          '3': bedroomData.unit['3']
        },
        yield: {
          '1': calculateYield(bedroomData.unit['1'].buyPrice, bedroomData.unit['1'].rentPrice),
          '2': calculateYield(bedroomData.unit['2'].buyPrice, bedroomData.unit['2'].rentPrice),
          '3': calculateYield(bedroomData.unit['3'].buyPrice, bedroomData.unit['3'].rentPrice)
        }
      }
    };

    // Copy to clipboard
    const jsonString = JSON.stringify(result, null, 2);
    console.log('Copying to clipboard:', jsonString);
    navigator.clipboard.writeText(jsonString).then(() => {
      // Show detailed notification
      const houseData = Object.entries(bedroomData.house)
        .filter(([k, v]) => v.buyPrice > 0 || v.rentPrice > 0)
        .map(([k, v]) => `${k}br: $${v.buyPrice.toLocaleString()}/$${v.rentPrice}/wk`)
        .join('<br>');
      
      const unitData = Object.entries(bedroomData.unit)
        .filter(([k, v]) => v.buyPrice > 0 || v.rentPrice > 0)
        .map(([k, v]) => `${k}br: $${v.buyPrice.toLocaleString()}/$${v.rentPrice}/wk`)
        .join('<br>');
      
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-family: sans-serif;
        font-size: 13px;
        max-width: 450px;
        max-height: 80vh;
        overflow-y: auto;
      `;
      
      notification.innerHTML = `
        <strong style="font-size: 16px;">[OK] Data Extracted!</strong><br>
        <strong>${suburb}, ${state} ${postcode}</strong><br>
        <div style="margin-top: 10px; font-size: 12px; line-height: 1.5;">
          <strong>Houses:</strong><br>${houseData || 'No data'}<br><br>
          <strong>Units:</strong><br>${unitData || 'No data'}
        </div>
        <small style="opacity: 0.9; margin-top: 10px; display: block;">
          ${isHotPage ? '[HOT] Hot Suburb! ' : ''}Copied to clipboard!
        </small>
      `;
      
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 10000);
      
      console.log('Success! Data copied to clipboard');
      
      // Close the tab after a brief delay so user sees the notification
      setTimeout(() => window.close(), 2000);
    });
  }).catch(err => {
    console.error('Error:', err);
    alert('Error: ' + err.message + ' - Check browser console (F12) for debug info.');
  });
})();
