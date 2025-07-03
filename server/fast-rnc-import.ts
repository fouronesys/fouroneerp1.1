import fs from 'fs';
import path from 'path';
import { db } from './db';
import { rncRegistry } from '../shared/schema';
import { sql } from 'drizzle-orm';

async function fastRNCImport() {
  const filePath = path.join(process.cwd(), 'attached_assets', 'DGII_RNC_1750968202624.TXT');
  
  console.log('🚀 Starting fast RNC import...');
  
  // Get current count
  const currentCount = await db.select({ count: sql`count(*)` }).from(rncRegistry);
  console.log(`Current RNCs in database: ${currentCount[0].count}`);
  
  // Create temporary table for new data
  console.log('📋 Creating temporary import table...');
  await db.execute(sql`
    CREATE TEMPORARY TABLE temp_rnc_import (
      rnc VARCHAR(20) PRIMARY KEY,
      razon_social VARCHAR(500),
      nombre_comercial VARCHAR(500),
      categoria VARCHAR(200),
      regimen VARCHAR(100),
      estado VARCHAR(50),
      last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Read and process file in chunks
  console.log('📁 Reading RNC file...');
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const lines = fileContent.trim().split('\n');
  
  console.log(`Total lines to process: ${lines.length}`);
  
  // Process in smaller chunks for better memory management
  const chunkSize = 10000;
  let processedLines = 0;
  let insertedRecords = 0;
  
  for (let i = 0; i < lines.length; i += chunkSize) {
    const chunk = lines.slice(i, i + chunkSize);
    const values: string[] = [];
    
    for (const line of chunk) {
      const cleanLine = line.replace(/\r$/, '');
      const parts = cleanLine.split('|');
      
      if (parts.length >= 11) {
        const rnc = parts[0]?.trim();
        const razonSocial = parts[1]?.trim().replace(/'/g, "''") || '';
        const nombreComercial = parts[2]?.trim().replace(/'/g, "''") || '';
        const categoria = parts[3]?.trim().replace(/'/g, "''") || 'CONTRIBUYENTE REGISTRADO';
        const estado = parts[9]?.trim() || 'ACTIVO';
        const regimen = parts[10]?.trim() || 'ORDINARIO';
        
        if (rnc && rnc.length >= 9) {
          values.push(`('${rnc}', '${razonSocial}', '${nombreComercial}', '${categoria}', '${regimen}', '${estado}', CURRENT_TIMESTAMP)`);
        }
      }
    }
    
    if (values.length > 0) {
      try {
        // Insert into temporary table
        await db.execute(sql.raw(`
          INSERT INTO temp_rnc_import (rnc, razon_social, nombre_comercial, categoria, regimen, estado, last_updated)
          VALUES ${values.join(', ')}
          ON CONFLICT (rnc) DO NOTHING
        `));
        
        insertedRecords += values.length;
      } catch (error) {
        console.error(`Error processing chunk ${i}-${i + chunkSize}:`, error);
      }
    }
    
    processedLines += chunk.length;
    if (processedLines % 50000 === 0) {
      console.log(`📊 Processed ${processedLines}/${lines.length} lines (${Math.round(processedLines/lines.length*100)}%)`);
    }
  }
  
  console.log(`✅ Temporary table populated with ${insertedRecords} records`);
  
  // Insert only new records from temp table to main table
  console.log('🔄 Transferring new records to main table...');
  const insertResult = await db.execute(sql`
    INSERT INTO rnc_registry (rnc, razon_social, nombre_comercial, categoria, regimen, estado, last_updated)
    SELECT rnc, razon_social, nombre_comercial, categoria, regimen, estado, last_updated
    FROM temp_rnc_import
    WHERE rnc NOT IN (SELECT rnc FROM rnc_registry)
  `);
  
  // Get final count
  const finalCount = await db.select({ count: sql`count(*)` }).from(rncRegistry);
  const newRecords = Number(finalCount[0].count) - Number(currentCount[0].count);
  
  console.log(`\n🎉 Import completed successfully!`);
  console.log(`📈 Records added: ${newRecords}`);
  console.log(`📊 Total RNCs in database: ${finalCount[0].count}`);
  
  // Show some examples of the data
  const samples = await db.select({
    rnc: rncRegistry.rnc,
    razonSocial: rncRegistry.razonSocial
  }).from(rncRegistry).limit(5);
  
  console.log('\n📋 Sample records:');
  samples.forEach(record => {
    console.log(`  ${record.rnc} - ${record.razonSocial}`);
  });
  
  // Drop temporary table
  await db.execute(sql`DROP TABLE temp_rnc_import`);
  
  return {
    totalRecords: Number(finalCount[0].count),
    newRecords,
    processedLines
  };
}

// Run if called directly
const isMainModule = process.argv[1] === new URL(import.meta.url).pathname;
if (isMainModule) {
  fastRNCImport()
    .then((result) => {
      console.log('\n🏁 Fast RNC import completed successfully!');
      console.log(`Total: ${result.totalRecords}, New: ${result.newRecords}, Processed: ${result.processedLines} lines`);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Fast RNC import failed:', error);
      process.exit(1);
    });
}

export { fastRNCImport };