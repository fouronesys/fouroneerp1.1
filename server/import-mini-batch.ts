import { readFileSync } from 'fs';
import { db } from './db.js';
import { rncRegistry } from '../shared/schema.js';

async function miniBatchImport() {
  console.log('Mini lotes - RNCs DGII (muy controlado)');
  
  try {
    const currentCount = await db.select().from(rncRegistry);
    console.log(`Registros actuales: ${currentCount.length}`);
    
    const fileContent = readFileSync('../attached_assets/DGII_RNC_1750968202624.TXT', 'latin1');
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    // Solo 2,000 registros por sesión - muy conservador
    const startLine = currentCount.length;
    const endLine = Math.min(startLine + 2000, lines.length);
    const linesToProcess = lines.slice(startLine, endLine);
    
    console.log(`Procesando ${linesToProcess.length} registros (${startLine} a ${endLine})`);
    
    const batchSize = 100; // Mini lotes de solo 100 registros
    let insertedCount = 0;
    
    for (let i = 0; i < linesToProcess.length; i += batchSize) {
      const batch = linesToProcess.slice(i, i + batchSize);
      const records = [];
      
      for (const line of batch) {
        try {
          const fields = line.split('|');
          
          if (fields.length >= 11) {
            const rnc = fields[0]?.trim();
            const razonSocial = fields[1]?.trim();
            const nombreComercial = fields[2]?.trim() || razonSocial;
            const estado = fields[10]?.trim();
            
            if (rnc && /^\d{8,11}$/.test(rnc) && razonSocial && razonSocial.length > 2) {
              records.push({
                rnc: rnc, // Preservar formato original del archivo DGII
                razonSocial: razonSocial.substring(0, 200),
                nombreComercial: nombreComercial.substring(0, 200),
                categoria: 'CONTRIBUYENTE REGISTRADO',
                regimen: 'ORDINARIO',
                estado: estado || 'ACTIVO',
                lastUpdated: new Date()
              });
            }
          }
        } catch (error) {
          // Continuar
        }
      }
      
      if (records.length > 0) {
        try {
          await db.insert(rncRegistry).values(records).onConflictDoNothing();
          insertedCount += records.length;
          console.log(`+${records.length} (${insertedCount} total)`);
        } catch (error) {
          console.log(`Error: ${error.message}`);
        }
      }
      
      // Pausa de 200ms entre mini lotes
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    const finalCount = await db.select().from(rncRegistry);
    console.log(`\nCompletado: ${insertedCount} nuevos | Total: ${finalCount.length}`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

miniBatchImport().catch(console.error);