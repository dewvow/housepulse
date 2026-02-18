// HousePulse Bookmarklet - Extract property data from realestate.com.au suburb pages
// Usage: Run this code in your browser console on a realestate.com.au suburb profile page

(function() {
  'use strict';
  
  // Check if we're on realestate.com.au
  if (!window.location.hostname.includes('realestate.com.au')) {
    alert('This bookmarklet only works on realestate.com.au');
    return;
  }

  // Helper functions
  function extractText(selector) {
    const el = document.querySelector(selector);
    return el ? el.textContent.trim() : null;
  }

  function extractPrice(text) {
    if (!text) return 0;
    const match = text.match(/[\d,]+/g);
    if (!match) return 0;
    const num = parseInt(match.join('').replace(/,/g, ''), 10);
    return num || 0;
  }

  function extractRent(text) {
    if (!text) return 0;
    const match = text.match(/\$?([\d,]+)/);
    if (!match) return 0;
    return parseInt(match[1].replace(/,/g, ''), 10) || 0;
  }

  // Extract suburb info from URL or page
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  let state = '';
  let suburb = '';
  let postcode = '';

  // Parse URL: /vic/armadale-3143/
  if (pathParts.length >= 2) {
    state = pathParts[0].toUpperCase();
    const locationPart = pathParts[1];
    const match = locationPart.match(/^(.+)-(\d{4})$/);
    if (match) {
      suburb = match[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      postcode = match[2];
    }
  }

  // Check if this is a Hot 100 page
  const isHotPage = document.body.textContent.includes('Hot 100') || 
                    document.body.textContent.includes('Hot Suburbs') ||
                    window.location.pathname.includes('hot');

  // Extract bedroom data
  // Note: This needs to be adapted based on realestate.com.au's actual DOM structure
  const bedroomData = {
    '2': { salePrice: 0, rent: 0 },
    '3': { salePrice: 0, rent: 0 },
    '4+': { salePrice: 0, rent: 0 }
  };

  // Try to find data for each bedroom type
  // Look for elements with bedroom indicators
  document.querySelectorAll('[data-testid*="bed"], [class*="bed"]').forEach(el => {
    const text = el.textContent || '';
    
    // Extract bedroom count
    let beds = null;
    if (text.includes('2 bed') || text.includes('2 Bed')) beds = '2';
    else if (text.includes('3 bed') || text.includes('3 Bed')) beds = '3';
    else if (text.includes('4 bed') || text.includes('4 Bed') || text.includes('4+')) beds = '4+';
    
    if (beds) {
      // Look for nearby price elements
      const parent = el.closest('div, section, article');
      if (parent) {
        const priceEl = parent.querySelector('[data-testid*="price"], .price, [class*="price"]');
        const rentEl = parent.querySelector('[data-testid*="rent"], .rent, [class*="rent"]');
        
        if (priceEl) {
          bedroomData[beds].salePrice = extractPrice(priceEl.textContent);
        }
        if (rentEl) {
          bedroomData[beds].rent = extractRent(rentEl.textContent);
        }
      }
    }
  });

  // Fallback: Try to extract from page title and general content
  const pageTitle = document.title;
  const pageContent = document.body.innerText;

  // Look for median price patterns
  const priceMatch = pageContent.match(/Median\s+(?:house\s+)?price[:\s]+\$?([\d,\.]+[MK]?)/i);
  const rentMatch = pageContent.match(/Median\s+(?:weekly\s+)?rent[:\s]+\$?([\d,]+)/i);

  if (priceMatch && !bedroomData['3'].salePrice) {
    bedroomData['3'].salePrice = extractPrice(priceMatch[1]);
  }
  if (rentMatch && !bedroomData['3'].rent) {
    bedroomData['3'].rent = extractRent(rentMatch[1]);
  }

  // Build the result object
  const result = {
    suburb: suburb,
    state: state,
    postcode: postcode,
    isHot: isHotPage,
    bedrooms: bedroomData,
    source: window.location.href,
    date: new Date().toISOString().split('T')[0]
  };

  // Copy to clipboard
  const jsonString = JSON.stringify(result, null, 2);
  navigator.clipboard.writeText(jsonString).then(() => {
    // Show success message
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
      font-size: 14px;
      max-width: 400px;
    `;
    notification.innerHTML = `
      <strong>✓ Data Extracted!</strong><br>
      ${suburb}, ${state} ${postcode}<br>
      <small style="opacity: 0.9">${isHotPage ? '🔥 Hot Suburb!' : ''}</small><br>
      <small style="opacity: 0.9">Copied to clipboard - paste in HousePulse</small>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 5000);

    console.log('HousePulse: Data extracted', result);
  }).catch(err => {
    alert('Failed to copy to clipboard. Data:\n\n' + jsonString);
  });
})();
