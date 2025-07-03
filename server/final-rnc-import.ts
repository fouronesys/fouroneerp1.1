import fs from 'fs';
import path from 'path';
import { db } from './db';
import { rncRegistry } from '../shared/schema';
import { sql } from 'drizzle-orm';

async function finalRNCImport() {
  console.log('🔄 Starting final RNC completion...');
  
  const filePath = path.join(process.cwd(), 'attached_assets', 'DGII_RNC_1750968202624.TXT');
  
  // Get current count
  const currentCount = await db.select({ count: sql`count(*)` }).from(rncRegistry);
  console.log(`Current RNCs: ${currentCount[0].count}`);
  
  // Read file and find missing RNCs quickly
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.trim().split('\n').slice(700000); // Start from later in file where more missing records likely are
  
  console.log(`Processing ${lines.length} lines from end of file...`);
  
  const batch = [];
  let processed = 0;
  
  for (const line of lines) {
    const parts = line.replace(/\r$/, '').split('|');
    
    if (parts.length >= 11) {
      const rnc = parts[0]?.trim();
      if (rnc && rnc.length >= 9) {
        batch.push({
          rnc,
          razonSocial: parts[1]?.trim() || '',
          nombreComercial: parts[2]?.trim() || '',
          categoria: parts[3]?.trim() || 'CONTRIBUYENTE REGISTRADO',
          regimen: parts[10]?.trim() || 'ORDINARIO',
          estado: parts[9]?.trim() || 'ACTIVO',
          lastUpdated: new Date()
        });
      }
    }
    
    // Process in chunks of 5000
    if (batch.length >= 5000) {
      try {
        const result = await db.insert(rncRegistry).values(batch).onConflictDoNothing();
        console.log(`✅ Inserted batch of ${batch.length} RNCs`);
        batch.length = 0; // Clear batch
      } catch (error) {
        console.error('Error inserting batch:', error);
        batch.length = 0; // Clear and continue
      }
    }
    
    processed++;
    if (processed % 10000 === 0) {
      console.log(`📊 Processed ${processed}/${lines.length}`);
    }
  }
  
  // Insert remaining records
  if (batch.length > 0) {
    try {
      await db.insert(rncRegistry).values(batch).onConflictDoNothing();
      console.log(`✅ Inserted final batch of ${batch.length} RNCs`);
    } catch (error) {
      console.error('Error inserting final batch:', error);
    }
  }
  
  // Get final count
  const finalCount = await db.select({ count: sql`count(*)` }).from(rncRegistry);
  const added = Number(finalCount[0].count) - Number(currentCount[0].count);
  
  console.log(`\n🎉 Import completed!`);
  console.log(`📈 Added: ${added} new RNCs`);
  console.log(`📊 Total: ${finalCount[0].count} RNCs`);
  
  return {
    added,
    total: Number(finalCount[0].count)
  };
}

// Execute immediately
finalRNCImport()
  .then(result => {
    console.log(`\n✅ Final import success: ${result.added} added, ${result.total} total`);
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Final import failed:', error);
    process.exit(1);
  });

export { finalRNCImport };