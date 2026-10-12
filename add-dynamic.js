const fs = require('fs');
const path = require('path');

function getAllRouteFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllRouteFiles(fullPath));
    } else if (file === 'route.ts') {
      results.push(fullPath);
    }
  });
  return results;
}

const apiDir = path.join(__dirname, 'src', 'app', 'api');
const files = getAllRouteFiles(apiDir);
let updated = 0;
let skipped = 0;

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes("force-dynamic")) {
    console.log('SKIP:', filePath.replace(__dirname, ''));
    skipped++;
    return;
  }
  // Insert after last import line
  const lines = content.split('\n');
  let lastImportIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('import ') || lines[i].startsWith("'use ")) {
      lastImportIdx = i;
    }
  }
  const insertAt = lastImportIdx + 1;
  lines.splice(insertAt, 0, '', "export const dynamic = 'force-dynamic';");
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  console.log('UPDATED:', filePath.replace(__dirname, ''));
  updated++;
});

console.log(`\nDone. Updated: ${updated}, Skipped: ${skipped}`);
