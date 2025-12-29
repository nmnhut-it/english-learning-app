/**
 * Script to split units-data.js into modular files
 * Run: node split-units.js
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data', 'units-data.js');
const UNITS_DIR = path.join(__dirname, 'data', 'units');

// Read the original file
const content = fs.readFileSync(DATA_FILE, 'utf-8');

// Extract UNIT_DATA object using regex
const match = content.match(/window\.UNIT_DATA\s*=\s*(\{[\s\S]*?\n\};)/);
if (!match) {
  console.error('Could not find UNIT_DATA in file');
  process.exit(1);
}

// Parse the data (eval is safe here as we control the input)
let UNIT_DATA;
try {
  eval('UNIT_DATA = ' + match[1]);
} catch (e) {
  console.error('Failed to parse UNIT_DATA:', e.message);
  process.exit(1);
}

// Create units directory if not exists
if (!fs.existsSync(UNITS_DIR)) {
  fs.mkdirSync(UNITS_DIR, { recursive: true });
}

// Split each unit into separate file
const unitNumbers = Object.keys(UNIT_DATA).sort((a, b) => parseInt(a) - parseInt(b));

console.log(`Found ${unitNumbers.length} units to split...`);

unitNumbers.forEach(unitNum => {
  const unit = UNIT_DATA[unitNum];
  const fileName = `unit-${unitNum}.js`;
  const filePath = path.join(UNITS_DIR, fileName);

  const fileContent = `/**
 * Unit ${unitNum}: ${unit.title}
 * Grade 10 English - Global Success
 */

window.UNITS = window.UNITS || {};
window.UNITS[${unitNum}] = ${JSON.stringify(unit, null, 2)};
`;

  fs.writeFileSync(filePath, fileContent, 'utf-8');
  console.log(`✓ Created ${fileName} (${unit.vocabulary?.length || 0} vocab, ${unit.exercises?.length || 0} exercises)`);
});

// Create main loader file
const loaderContent = `/**
 * Units Data Loader
 * Loads all unit modules and combines them
 */

window.UNIT_DATA = {};

// Unit file paths
const UNIT_FILES = [
${unitNumbers.map(n => `  'units/unit-${n}.js'`).join(',\n')}
];

// Load units dynamically
async function loadUnits() {
  for (const file of UNIT_FILES) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'data/' + file;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Copy loaded units to UNIT_DATA
  if (window.UNITS) {
    Object.assign(window.UNIT_DATA, window.UNITS);
  }

  console.log('All units loaded:', Object.keys(window.UNIT_DATA));

  // Dispatch event when ready
  window.dispatchEvent(new CustomEvent('unitsLoaded'));
}

// Auto-load
loadUnits();
`;

fs.writeFileSync(path.join(__dirname, 'data', 'units-loader.js'), loaderContent, 'utf-8');
console.log(`✓ Created units-loader.js`);

// Summary
console.log('\n=== SPLIT COMPLETE ===');
console.log(`Units split: ${unitNumbers.length}`);
console.log(`Files created in: ${UNITS_DIR}`);
console.log('\nTo use, update index.html to load units-loader.js instead of units-data.js');
