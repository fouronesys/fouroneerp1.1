const fs = require('fs');

// Read the storage.ts file
const content = fs.readFileSync('server/storage.ts', 'utf8');

// Find all function definitions
const functionPattern = /async\s+(\w+)\s*\(/g;
const functions = {};
const lines = content.split('\n');

// Track function occurrences
lines.forEach((line, index) => {
  const match = line.match(/^\s*async\s+(\w+)\s*\(/);
  if (match) {
    const funcName = match[1];
    if (!functions[funcName]) {
      functions[funcName] = [];
    }
    functions[funcName].push(index);
  }
});

// Find duplicates
const duplicates = {};
Object.entries(functions).forEach(([name, indices]) => {
  if (indices.length > 1) {
    duplicates[name] = indices;
    console.log(`Duplicate function: ${name} at lines ${indices.map(i => i + 1).join(', ')}`);
  }
});

// Remove duplicate functions (keep the first occurrence)
const linesToRemove = new Set();
Object.entries(duplicates).forEach(([name, indices]) => {
  // Keep the first occurrence, remove the rest
  for (let i = 1; i < indices.length; i++) {
    const startLine = indices[i];
    let endLine = startLine;
    let braceCount = 0;
    let inFunction = false;
    
    // Find the end of the function
    for (let j = startLine; j < lines.length; j++) {
      const line = lines[j];
      if (line.includes('{')) {
        braceCount += (line.match(/{/g) || []).length;
        inFunction = true;
      }
      if (line.includes('}')) {
        braceCount -= (line.match(/}/g) || []).length;
      }
      
      if (inFunction && braceCount === 0) {
        endLine = j;
        break;
      }
    }
    
    // Mark lines for removal
    for (let j = startLine; j <= endLine; j++) {
      linesToRemove.add(j);
    }
  }
});

// Create new content without duplicate functions
const newLines = lines.filter((line, index) => !linesToRemove.has(index));
const newContent = newLines.join('\n');

// Write the fixed file
fs.writeFileSync('server/storage.ts', newContent);

console.log(`\nRemoved ${linesToRemove.size} lines containing duplicate functions.`);
console.log('Fixed storage.ts file.');