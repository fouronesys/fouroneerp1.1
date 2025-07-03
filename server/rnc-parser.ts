import fs from 'fs';
import { storage } from './storage';

export async function parseAndImportRNCFile(filePath: string) {
  try {
    // Try different encodings to read the file
    const encodings = ['latin1', 'utf8', 'ascii', 'utf16le'];
    let content = '';
    
    for (const encoding of encodings) {
      try {
        content = fs.readFileSync(filePath, { encoding: encoding as BufferEncoding });
        if (content && content.length > 0) {
          console.log(`Successfully read file with ${encoding} encoding`);
          break;
        }
      } catch (error) {
        console.log(`Failed to read with ${encoding} encoding`);
        continue;
      }
    }

    if (!content) {
      throw new Error('Could not read file with any encoding');
    }

    // Parse DGII pipe-delimited format
    // Format: RNC|Name|Commercial Name|Activity|...|Date|Status|Type
    const lines = content.split('\n');
    const rncRecords = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const fields = line.split('|');
      if (fields.length < 11) continue; // Ensure we have enough fields
      
      const rnc = fields[0]?.trim();
      const razonSocial = fields[1]?.trim();
      const nombreComercial = fields[2]?.trim() || null;
      const actividad = fields[3]?.trim();
      const estado = fields[9]?.trim() || 'ACTIVO';
      const tipo = fields[10]?.trim() || 'NORMAL';
      
      // Validate RNC format (9-11 digits)
      if (!/^\d{9,11}$/.test(rnc)) continue;
      
      // Ensure we have a valid business name
      if (!razonSocial || razonSocial.length < 3) continue;
      
      // Determine category based on type
      const categoria = tipo === 'RST' ? 'REGIMEN SIMPLIFICADO' : 'JURIDICA';
      const regimen = tipo === 'RST' ? 'SIMPLIFICADO' : 'ORDINARIO';
      
      rncRecords.push({
        rnc: rnc,
        razonSocial: razonSocial.toUpperCase(),
        nombreComercial: nombreComercial ? nombreComercial.toUpperCase() : null,
        categoria: categoria,
        regimen: regimen,
        estado: estado.toUpperCase()
      });
    }

    console.log(`Found ${rncRecords.length} RNC records in file`);
    
    // Check how many records are already imported to resume from correct position
    const existingCount = await storage.getRNCRegistryCount();
    console.log(`Found ${existingCount} existing records in database`);
    
    // Skip already imported records
    const startIndex = existingCount;
    console.log(`Resuming import from record ${startIndex + 1}`);
    
    // Import records to database in batches using bulk insert for efficiency
    const batchSize = 2000; // Increased batch size for better performance
    let imported = existingCount;
    
    for (let i = startIndex; i < rncRecords.length; i += batchSize) {
      const batch = rncRecords.slice(i, i + batchSize);
      
      try {
        // Use bulk insert for better performance
        const result = await storage.bulkCreateRNCRegistry(batch);
        imported += result.inserted;
        
        const batchNumber = Math.floor(i/batchSize) + 1;
        const totalBatches = Math.ceil(rncRecords.length / batchSize);
        const percentage = ((i + batch.length) / rncRecords.length * 100).toFixed(1);
        
        console.log(`Batch ${batchNumber}/${totalBatches} (${percentage}%) - Imported: ${result.inserted}, Skipped: ${result.skipped}, Total: ${imported}`);
        
        // Small delay to prevent overwhelming the database
        if (batchNumber % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`Error importing batch ${Math.floor(i/batchSize) + 1}:`, error);
        
        // Fallback to individual inserts for this batch
        for (const record of batch) {
          try {
            const existing = await storage.searchRNC(record.rnc);
            if (!existing) {
              await storage.createRNCRegistry(record);
              imported++;
            }
          } catch (error) {
            console.error(`Error importing RNC ${record.rnc}:`, error);
          }
        }
      }
    }
    
    return { total: rncRecords.length, imported };
    
  } catch (error) {
    console.error('Error parsing RNC file:', error);
    throw error;
  }
}