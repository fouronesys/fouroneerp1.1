#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧹 Starting system cleanup...\n');

// Function to delete old files
function deleteOldFiles(directory, pattern, daysToKeep) {
  const now = Date.now();
  const cutoffTime = now - (daysToKeep * 24 * 60 * 60 * 1000);
  let deletedCount = 0;

  try {
    const files = fs.readdirSync(directory);
    files.forEach(file => {
      if (file.match(pattern)) {
        const filePath = path.join(directory, file);
        const stats = fs.statSync(filePath);
        if (stats.mtime.getTime() < cutoffTime) {
          fs.unlinkSync(filePath);
          console.log(`❌ Deleted: ${file}`);
          deletedCount++;
        }
      }
    });
  } catch (error) {
    console.error(`Error cleaning ${directory}:`, error.message);
  }

  return deletedCount;
}

// 1. Clean old backups (keep only last 7 days)
console.log('📁 Cleaning old database backups...');
const backupsDeleted = deleteOldFiles(
  path.join(__dirname, 'downloads/backups'),
  /^backup_full_.*\.sql$/,
  7
);
console.log(`✅ Deleted ${backupsDeleted} old backup files\n`);

// 2. Clean temporary files
console.log('🗑️ Cleaning temporary files...');
const tempDirs = [
  'temp',
  'tmp',
  '.tmp',
  'node_modules/.cache'
];

let tempFilesDeleted = 0;
tempDirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (fs.existsSync(fullPath)) {
    try {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`❌ Deleted directory: ${dir}`);
      tempFilesDeleted++;
    } catch (error) {
      console.error(`Error deleting ${dir}:`, error.message);
    }
  }
});

// 3. Clean log files older than 30 days
console.log('\n📋 Cleaning old log files...');
const logsDeleted = deleteOldFiles(
  __dirname,
  /\.log$/,
  30
);
console.log(`✅ Deleted ${logsDeleted} old log files\n`);

// 4. Remove duplicate NCF module zips (keep only the latest)
console.log('📦 Cleaning duplicate NCF module zips...');
const ncfFiles = fs.readdirSync(__dirname)
  .filter(file => file.startsWith('ncf_dominicano') && file.endsWith('.zip'))
  .sort();

// Keep only the last 2 versions
const ncfToDelete = ncfFiles.slice(0, -2);
ncfToDelete.forEach(file => {
  try {
    fs.unlinkSync(path.join(__dirname, file));
    console.log(`❌ Deleted: ${file}`);
  } catch (error) {
    console.error(`Error deleting ${file}:`, error.message);
  }
});
console.log(`✅ Deleted ${ncfToDelete.length} old NCF module files\n`);

// 5. Clean empty directories
console.log('🗂️ Cleaning empty directories...');
function cleanEmptyDirs(dir) {
  let cleaned = 0;
  
  try {
    const entries = fs.readdirSync(dir);
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory() && !entry.startsWith('.') && entry !== 'node_modules') {
        cleaned += cleanEmptyDirs(fullPath);
        
        // Check if directory is now empty
        const remaining = fs.readdirSync(fullPath);
        if (remaining.length === 0) {
          fs.rmdirSync(fullPath);
          console.log(`❌ Deleted empty directory: ${fullPath.replace(__dirname, '.')}`);
          cleaned++;
        }
      }
    }
  } catch (error) {
    // Ignore errors
  }
  
  return cleaned;
}

const emptyCleaned = cleanEmptyDirs(__dirname);
console.log(`✅ Deleted ${emptyCleaned} empty directories\n`);

// 6. Report disk usage
const getDirSize = (dirPath) => {
  let size = 0;
  try {
    const files = fs.readdirSync(dirPath);
    files.forEach(file => {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      if (stats.isFile()) {
        size += stats.size;
      }
    });
  } catch (error) {
    // Ignore
  }
  return size;
};

console.log('💾 Disk usage report:');
const directories = [
  'downloads/backups',
  'uploads',
  'node_modules',
  'dist',
  '.cache'
];

directories.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (fs.existsSync(fullPath)) {
    const size = getDirSize(fullPath);
    console.log(`  ${dir}: ${(size / 1024 / 1024).toFixed(2)} MB`);
  }
});

console.log('\n✨ Cleanup completed!');