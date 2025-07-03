import { readFileSync } from 'fs';
import { db } from './db.js';
import { rncRegistry } from '../shared/schema.js';

async function mediumBatchImport() {
  console.log('Importación lotes medianos - 8,000 registros DGII...');
  
  try {
    const currentCount = await db.select().from(rncRegistry);
    console.log(`Registros actuales: ${currentCount.length}`);
    
    const fileContent = readFileSync('../attached_assets/DGII_RNC_1750968202624.TXT', 'latin1');
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    // Procesar 8,000 registros por sesión
    const startLine = currentCount.length;
    const endLine = Math.min(startLine + 8000, lines.length);
    const linesToProcess = lines.slice(startLine, endLine);
    
    console.log(`Procesando ${linesToProcess.length} registros (líneas ${startLine} a ${endLine})`);
    console.log(`Progreso: ${((startLine / lines.length) * 100).toFixed(1)}% del archivo total`);
    
    const batchSize = 500; // Lotes de 500 registros
    let insertedCount = 0;
    let processedCount = 0;
    
    for (let i = 0; i < linesToProcess.length; i += batchSize) {
      const batch = linesToProcess.slice(i, i + batchSize);
      const records = [];
      
      for (const line of batch) {
        processedCount++;
        try {
          const fields = line.split('|');
          
          if (fields.length >= 11) {
            const rnc = fields[0]?.trim();
            const razonSocial = fields[1]?.trim();
            const nombreComercial = fields[2]?.trim() || razonSocial;
            const estado = fields[10]?.trim();
            const tipo = fields[11]?.trim() || 'NORMAL';
            
            // Validar RNC
            if (rnc && /^\d{8,11}$/.test(rnc) && razonSocial && razonSocial.length > 2) {
              
              // Determinar categoría
              let categoria = 'CONTRIBUYENTE REGISTRADO';
              const razonUpper = razonSocial.toUpperCase();
              
              if (razonUpper.includes('MINISTERIO') || 
                  razonUpper.includes('AYUNTAMIENTO') || 
                  razonUpper.includes('DIRECCION GENERAL')) {
                categoria = 'ENTIDAD GUBERNAMENTAL';
              } else if (razonUpper.includes('FUNDACION') || 
                        razonUpper.includes('ASOCIACION')) {
                categoria = 'ORGANIZACION SIN FINES DE LUCRO';
              }
              
              records.push({
                rnc: rnc, // Preservar formato original del archivo DGII
                razonSocial: razonSocial.substring(0, 200),
                nombreComercial: nombreComercial.substring(0, 200),
                categoria,
                regimen: tipo === 'RST' ? 'REGIMEN ESPECIAL' : 'ORDINARIO',
                estado: estado || 'ACTIVO',
                lastUpdated: new Date()
              });
            }
          }
        } catch (error) {
          // Continuar con siguiente registro
        }
      }
      
      // Insertar lote
      if (records.length > 0) {
        try {
          await db.insert(rncRegistry).values(records).onConflictDoNothing();
          insertedCount += records.length;
          
          const batchNum = Math.floor(i/batchSize) + 1;
          const totalBatches = Math.ceil(linesToProcess.length/batchSize);
          console.log(`Lote ${batchNum}/${totalBatches}: +${records.length} | Total insertados: ${insertedCount}`);
        } catch (error) {
          console.log(`Error en lote: ${error.message}`);
        }
      }
      
      // Pequeña pausa entre lotes
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log(`\n=== SESIÓN COMPLETADA ===`);
    console.log(`Registros procesados: ${processedCount}`);
    console.log(`Registros insertados: ${insertedCount}`);
    
    // Verificar total final
    const finalCount = await db.select().from(rncRegistry);
    const progressPercent = (finalCount.length / 739590 * 100).toFixed(2);
    console.log(`Total en DB: ${finalCount.length} (${progressPercent}% del archivo DGII)`);
    console.log(`Restantes: ${739590 - finalCount.length} registros`);
    
    // Mostrar algunas empresas recién importadas
    if (insertedCount > 0) {
      console.log(`\n=== EMPRESAS RECIÉN IMPORTADAS ===`);
      const recentRncs = await db
        .select({
          rnc: rncRegistry.rnc,
          razonSocial: rncRegistry.razonSocial,
          nombreComercial: rncRegistry.nombreComercial
        })
        .from(rncRegistry)
        .orderBy(rncRegistry.lastUpdated)
        .limit(5);
      
      recentRncs.forEach(empresa => {
        console.log(`${empresa.rnc} - ${empresa.razonSocial} (${empresa.nombreComercial})`);
      });
    }
    
  } catch (error) {
    console.error('Error en importación:', error);
  }
}

mediumBatchImport().catch(console.error);