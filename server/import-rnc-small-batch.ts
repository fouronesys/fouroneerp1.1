import { readFileSync } from 'fs';
import { db } from './db.js';
import { rncRegistry } from '../shared/schema.js';

async function smallBatchImport() {
  console.log('Importación por lotes pequeños - RNCs DGII...');
  
  try {
    // Verificar registros actuales
    const currentCount = await db.select().from(rncRegistry);
    console.log(`Registros actuales: ${currentCount.length}`);
    
    // Leer el archivo DGII auténtico
    const fileContent = readFileSync('../attached_assets/DGII_RNC_1750968202624.TXT', 'latin1');
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    // Procesar solo 10,000 registros por sesión (lotes pequeños)
    const startLine = currentCount.length;
    const endLine = Math.min(startLine + 10000, lines.length);
    const linesToProcess = lines.slice(startLine, endLine);
    
    console.log(`Procesando líneas ${startLine} a ${endLine} (${linesToProcess.length} registros)`);
    
    const batchSize = 500; // Lotes muy pequeños para evitar sobrecarga
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
            const tipo = fields[11]?.trim() || 'NORMAL';
            
            // Validar RNC (solo números de 8-11 dígitos)
            if (rnc && /^\d{8,11}$/.test(rnc) && razonSocial && razonSocial.length > 3) {
              
              // Determinar categoría basada en contenido
              let categoria = 'CONTRIBUYENTE REGISTRADO';
              const razonUpper = razonSocial.toUpperCase();
              
              if (razonUpper.includes('MINISTERIO') || 
                  razonUpper.includes('AYUNTAMIENTO') || 
                  razonUpper.includes('ALCALDIA') ||
                  razonUpper.includes('DIRECCION GENERAL') ||
                  razonUpper.includes('SECRETARIA DE ESTADO')) {
                categoria = 'ENTIDAD GUBERNAMENTAL';
              } else if (razonUpper.includes('FUNDACION') || 
                        razonUpper.includes('ASOCIACION') ||
                        razonUpper.includes('COOPERATIVA')) {
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
          // Continuar con siguiente registro si hay error
        }
      }
      
      // Insertar lote pequeño
      if (records.length > 0) {
        try {
          await db.insert(rncRegistry).values(records).onConflictDoNothing();
          insertedCount += records.length;
          console.log(`Lote ${Math.floor(i/batchSize) + 1}: +${records.length} | Total sesión: ${insertedCount}`);
        } catch (error) {
          console.log(`Error en lote: ${error.message}`);
        }
      }
      
      // Pausa pequeña entre lotes para no sobrecargar
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`\n=== SESIÓN COMPLETADA ===`);
    console.log(`Registros procesados: ${linesToProcess.length}`);
    console.log(`Registros insertados: ${insertedCount}`);
    
    // Verificar total final
    const finalCount = await db.select().from(rncRegistry);
    const progressPercent = (finalCount.length / 739590 * 100).toFixed(2);
    console.log(`Total en DB: ${finalCount.length} (${progressPercent}% del archivo)`);
    
  } catch (error) {
    console.error('Error en importación:', error);
  }
}

// Ejecutar importación de lote pequeño
smallBatchImport().catch(console.error);