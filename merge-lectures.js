const fs = require('fs');
const path = require('path');

const BULK_DIR = path.join(__dirname, 'v2/data/voice-lectures/bulk_generated');
const DEST_DIR = path.join(__dirname, 'v2/data/voice-lectures');

// List of units we manually refactored and want to keep
const PRESERVED_UNITS = {
    'g6': ['unit-07', 'unit-08'],
    'g7': ['unit-07', 'unit-08'],
    'g8': ['unit-07', 'unit-08'],
    'g9': ['unit-07', 'unit-08', 'unit-09']
};

function walk(dir, callback) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walk(fullPath, callback);
        } else {
            callback(fullPath);
        }
    }
}

let movedCount = 0;
let skippedCount = 0;

walk(BULK_DIR, (filePath) => {
    const relativePart = path.relative(BULK_DIR, filePath);
    const destPath = path.join(DEST_DIR, relativePart);

    const parts = relativePart.split(path.sep);
    if (parts.length < 2) return;
    const [grade, unit] = parts;

    if (PRESERVED_UNITS[grade] && PRESERVED_UNITS[grade].includes(unit)) {
        if (fs.existsSync(destPath)) {
            console.log(`Skipping preserved: ${relativePart}`);
            skippedCount++;
            return;
        }
    }

    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.copyFileSync(filePath, destPath);
    movedCount++;
});

console.log(`\nMerge complete:`);
console.log(`  Moved/Updated: ${movedCount}`);
console.log(`  Skipped (preserved): ${skippedCount}`);
