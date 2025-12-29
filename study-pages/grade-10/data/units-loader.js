/**
 * Units Data Loader
 * Loads all unit modules and combines them
 */

window.UNIT_DATA = {};

// Unit file paths
const UNIT_FILES = [
  'units/unit-1.js',
  'units/unit-2.js',
  'units/unit-3.js',
  'units/unit-4.js',
  'units/unit-5.js'
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
