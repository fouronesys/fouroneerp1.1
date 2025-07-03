import fs from 'fs';
import path from 'path';
import { db } from './db';
import { rncRegistry } from '../shared/schema';
import { sql } from 'drizzle-orm';

interface RNCRecord {
  rnc: string;
  razonSocial: string;
  nombreComercial: string;
  categoria: string;
  regimen: string;
  estado: string;
  lastUpdated: Date;
}

async function getExistingRNCs(): Promise<Set<string>> {
  const existingRNCs = await db.select({ rnc: rncRegistry.rnc }).from(rncRegistry);
  return new Set(existingRNCs.map(r => r.rnc));
}

function parseRNCLine(line: string): RNCRecord | null {
  try {
    const cleanLine = line.replace(/\r$/, '');
    const parts = cleanLine.split('|');
    
    if (parts.length < 11) return null;
    
    const rnc = parts[0]?.trim();
    const razonSocial = parts[1]?.trim() || '';
    const nombreComercial = parts[2]?.trim() || '';
    const categoria = parts[3]?.trim() || 'CONTRIBUYENTE REGISTRADO';
    const estado = parts[9]?.trim() || 'ACTIVO';
    const regimen = parts[10]?.trim() || 'ORDINARIO';
    
    if (!rnc || rnc.length < 9) return null;
    
    return {
      rnc,
      razonSocial,
      nombreComercial,
      categoria,
      regimen,
      estado,
      lastUpdated: new Date()
    };
  } catch (error) {
    return null;
  }
}

async function importRemainingRNCs() {
  const filePath = path.join(process.cwd(), 'attached_assets', 'DGII_RNC_1750968202624.TXT');
  
  if (!fs.existsSync(filePath)) {
    console.error('RNC file not found:', filePath);
    return;
  }
  
  console.log('Loading existing RNCs from database...');
  const existingRNCs = await getExistingRNCs();
  console.log(`Found ${existingRNCs.size} existing RNCs in database`);
  
  console.log('Reading RNC file...');
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const lines = fileContent.trim().split('\n');
  console.log(`Total lines in file: ${lines.length}`);
  
  const newRNCs: RNCRecord[] = [];
  let processed = 0;
  let skipped = 0;
  
  console.log('Processing RNC records...');
  for (const line of lines) {
    const record = parseRNCLine(line);
    if (record && !existingRNCs.has(record.rnc)) {
      newRNCs.push(record);
    } else {
      skipped++;
    }
    
    processed++;
    if (processed % 50000 === 0) {
      console.log(`Processed ${processed}/${lines.length} lines, found ${newRNCs.length} new RNCs`);
    }
  }
  
  console.log(`Processing complete: ${newRNCs.length} new RNCs to import, ${skipped} already exist`);
  
  if (newRNCs.length === 0) {
    console.log('No new RNCs to import. Database is up to date.');
    return;
  }
  
  console.log('Starting batch import...');
  const batchSize = 5000;
  let importedCount = 0;
  
  for (let i = 0; i < newRNCs.length; i += batchSize) {
    const batch = newRNCs.slice(i, i + batchSize);
    
    try {
      await db.insert(rncRegistry).values(batch).onConflictDoNothing();
      importedCount += batch.length;
      console.log(`Imported batch ${Math.ceil((i + 1) / batchSize)}/${Math.ceil(newRNCs.length / batchSize)} - ${importedCount}/${newRNCs.length} RNCs`);
    } catch (error) {
      console.error(`Error importing batch ${Math.ceil((i + 1) / batchSize)}:`, error);
      // Continue with next batch
    }
  }
  
  // Verify final count
  const finalCount = await db.select({ count: sql`count(*)` }).from(rncRegistry);
  console.log(`\n✅ Import complete! Total RNCs in database: ${finalCount[0].count}`);
  
  // Show some examples of newly imported records
  if (newRNCs.length > 0) {
    console.log('\nExamples of newly imported RNCs:');
    for (let i = 0; i < Math.min(5, newRNCs.length); i++) {
      const rnc = newRNCs[i];
      console.log(`  ${rnc.rnc} - ${rnc.razonSocial}`);
    }
  }
}

// Run if called directly
const isMainModule = process.argv[1] === new URL(import.meta.url).pathname;
if (isMainModule) {
  importRemainingRNCs()
    .then(() => {
      console.log('Import script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Import script failed:', error);
      process.exit(1);
    });
}

export { importRemainingRNCs };