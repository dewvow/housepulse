#!/usr/bin/env node

/**
 * Process Census 2021 G13 (Language) and G60 (Occupation) DataPacks
 * Extract top language and top occupation for each postcode
 * Output: public/data/census-language.json and public/data/census-occupation.json
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const CENSUS_DIR = path.join(__dirname, '../data/census-data/2021 Census GCP Postal Areas for AUS');
const OUTPUT_DIR = path.join(__dirname, '../public/data');

// Occupation category mapping from column names
const OCCUPATION_CATEGORIES = {
  'Managers': 'Managers',
  'Professionals': 'Professionals',
  'TechnicTrades_Wrs': 'Technicians and Trades Workers',
  'TechnicTrades_W': 'Technicians and Trades Workers',
  'CommunPersnlSvc_W': 'Community and Personal Service Workers',
  'ClericalAdminis_W': 'Clerical and Administrative Workers',
  'Sales_W': 'Sales Workers',
  'Mach_oper_drivers': 'Machinery Operators and Drivers',
  'Labourers': 'Labourers'
};

/**
 * Process G13 CSV files to extract top language for each postcode
 */
async function processLanguageData() {
  console.log('Processing language data from G13...');
  
  const languageData = {}; // { postcode: { language: count } }
  
  // G13 is split into multiple files (A, B, C, D, E)
  const g13Files = ['A', 'B', 'C', 'D', 'E'].map(suffix => 
    `2021Census_G13${suffix}_AUST_POA.csv`
  );
  
  for (const filename of g13Files) {
    const filePath = path.join(CENSUS_DIR, filename);
    if (!fs.existsSync(filePath)) {
      console.log(`  Skipping ${filename} (not found)`);
      continue;
    }
    
    console.log(`  Processing ${filename}...`);
    
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
    
    let headers = null;
    let rowCount = 0;
    
    for await (const line of rl) {
      if (!headers) {
        headers = line.split(',');
        continue;
      }
      
      const values = line.split(',');
      const postcode = values[0].replace('POA', ''); // POA2000 -> 2000
      
      if (!languageData[postcode]) {
        languageData[postcode] = {};
      }
      
      // Extract language totals (columns ending with _Tot, but not UOLSE or aggregate totals)
      for (let i = 1; i < headers.length; i++) {
        const header = headers[i];
        
        // Match columns like MOL_Mandarin_Tot, MOL_IAL_Hindi_Tot, MSEO_Tot (English)
        // Exclude: UOLSE columns, aggregate totals like CL_Tot_Tot, IAL_Tot_Tot, SAL_Tot_Tot
        if (header.endsWith('_Tot') && !header.includes('UOLSE') && !header.includes('_Tot_Tot')) {
          let language = '';
          
          // Extract language name from header
          if (header === 'MSEO_Tot') {
            language = 'English';
          } else if (header.startsWith('MOL_')) {
            // MOL_Mandarin_Tot -> Mandarin
            // MOL_IAL_Hindi_Tot -> Hindi
            // MOL_CL_Mandarin_Tot -> Mandarin
            const parts = header.replace('MOL_', '').replace('_Tot', '').split('_');
            language = parts[parts.length - 1]; // Get last part (the actual language name)
            
            // Map abbreviated names to full names
            const nameMap = {
              'Guj': 'Gujarati',
              'Sinhal': 'Sinhala',
              'Macedon': 'Macedonian',
              'Canton': 'Cantonese',
              'Filipin': 'Filipino',
              'AIndLng': 'Australian Indigenous Languages',
              'Japan': 'Japanese',
              'Oth': 'Other',
              'Tot': undefined // Skip aggregate totals
            };
            language = nameMap[language] || language;
          }
          
          if (language && values[i] && values[i] !== '..') {
            const count = parseInt(values[i]);
            if (!isNaN(count) && count > 0) {
              languageData[postcode][language] = (languageData[postcode][language] || 0) + count;
            }
          }
        }
      }
      
      rowCount++;
    }
    
    console.log(`    Processed ${rowCount} postcodes`);
  }
  
  // Extract top language for each postcode
  const topLanguages = {};
  for (const [postcode, languages] of Object.entries(languageData)) {
    const entries = Object.entries(languages);
    if (entries.length > 0) {
      // Sort by count descending and get top language
      entries.sort((a, b) => b[1] - a[1]);
      topLanguages[postcode] = entries[0][0]; // Just store the language name
    }
  }
  
  console.log(`  Extracted top language for ${Object.keys(topLanguages).length} postcodes`);
  
  // Save to JSON
  const outputPath = path.join(OUTPUT_DIR, 'census-language.json');
  fs.writeFileSync(outputPath, JSON.stringify(topLanguages, null, 2));
  console.log(`  Saved to ${outputPath}`);
  
  return topLanguages;
}

/**
 * Process G60 CSV files to extract top occupation for each postcode
 */
async function processOccupationData() {
  console.log('Processing occupation data from G60...');
  
  const occupationData = {}; // { postcode: { category: count } }
  
  // G60 is split into A and B files
  const g60Files = ['2021Census_G60A_AUST_POA.csv', '2021Census_G60B_AUST_POA.csv'];
  
  for (const filename of g60Files) {
    const filePath = path.join(CENSUS_DIR, filename);
    if (!fs.existsSync(filePath)) {
      console.log(`  Skipping ${filename} (not found)`);
      continue;
    }
    
    console.log(`  Processing ${filename}...`);
    
    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });
    
    let headers = null;
    let rowCount = 0;
    
    for await (const line of rl) {
      if (!headers) {
        headers = line.split(',');
        continue;
      }
      
      const values = line.split(',');
      const postcode = values[0].replace('POA', ''); // POA2000 -> 2000
      
      if (!occupationData[postcode]) {
        occupationData[postcode] = {};
      }
      
      // Sum occupation counts across all age/sex groups
      for (let i = 1; i < headers.length; i++) {
        const header = headers[i];
        
        // Match columns like M15_19_Managers, F20_24_Professionals, etc.
        for (const [key, category] of Object.entries(OCCUPATION_CATEGORIES)) {
          if (header.includes(key)) {
            const value = values[i];
            if (value && value !== '..') {
              const count = parseInt(value);
              if (!isNaN(count) && count > 0) {
                occupationData[postcode][category] = (occupationData[postcode][category] || 0) + count;
              }
            }
            break;
          }
        }
      }
      
      rowCount++;
    }
    
    console.log(`    Processed ${rowCount} postcodes`);
  }
  
  // Extract top occupation for each postcode
  const topOccupations = {};
  for (const [postcode, occupations] of Object.entries(occupationData)) {
    const entries = Object.entries(occupations);
    if (entries.length > 0) {
      // Sort by count descending and get top occupation
      entries.sort((a, b) => b[1] - a[1]);
      topOccupations[postcode] = entries[0][0]; // Just store the occupation name
    }
  }
  
  console.log(`  Extracted top occupation for ${Object.keys(topOccupations).length} postcodes`);
  
  // Save to JSON
  const outputPath = path.join(OUTPUT_DIR, 'census-occupation.json');
  fs.writeFileSync(outputPath, JSON.stringify(topOccupations, null, 2));
  console.log(`  Saved to ${outputPath}`);
  
  return topOccupations;
}

/**
 * Main execution
 */
async function main() {
  console.log('Census DataPack Processor');
  console.log('=========================\n');
  
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  try {
    const languages = await processLanguageData();
    console.log(`\nSample languages:`);
    const samplePostcodes = ['2000', '3000', '3205', '4000', '5000'];
    samplePostcodes.forEach(pc => {
      if (languages[pc]) {
        console.log(`  ${pc}: ${languages[pc]}`);
      }
    });
    
    console.log('');
    
    const occupations = await processOccupationData();
    console.log(`\nSample occupations:`);
    samplePostcodes.forEach(pc => {
      if (occupations[pc]) {
        console.log(`  ${pc}: ${occupations[pc]}`);
      }
    });
    
    console.log('\n✅ Processing complete!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
