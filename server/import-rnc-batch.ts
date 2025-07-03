import { readFileSync } from 'fs';
import { db } from './db.js';
import { rncRegistry } from '../shared/schema.js';

async function continueBatchImport() {
  console.log('Continuando importación de RNCs auténticos del DGII...');
  
  try {
    // Verificar registros actuales
    const currentCount = await db.select().from(rncRegistry);
    console.log(`Registros actuales en DB: ${currentCount.length}`);
    
    // Leer el archivo DGII auténtico
    const fileContent = readFileSync('../attached_assets/DGII_RNC_1750968202624.TXT', 'latin1');
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    console.log(`Total de líneas en archivo: ${lines.length}`);
    
    // Comenzar desde donde se quedó (línea 54,000)
    const startLine = currentCount.length;
    const endLine = Math.min(startLine + 50000, lines.length); // Procesar 50K más
    const linesToProcess = lines.slice(startLine, endLine);
    
    console.log(`Procesando líneas ${startLine} a ${endLine}`);
    
    const batchSize = 2000; // Lotes más grandes para eficiencia
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
            const actividadEconomica = fields[3]?.trim();
            const estado = fields[10]?.trim();
            const tipo = fields[11]?.trim() || 'NORMAL';
            
            // Validar RNC
            if (rnc && /^\d{8,11}$/.test(rnc) && razonSocial) {
              // Determinar categoría
              let categoria = 'CONTRIBUYENTE REGISTRADO';
              
              const razonUpper = razonSocial.toUpperCase();
              if (tipo === 'GC' || razonUpper.includes('GRAN CONTRIBUYENTE')) {
                categoria = 'GRAN CONTRIBUYENTE';
              } else if (tipo === 'EG' || 
                        razonUpper.includes('MINISTERIO') || 
                        razonUpper.includes('AYUNTAMIENTO') || 
                        razonUpper.includes('GOBIERNO') ||
                        razonUpper.includes('DIRECCION GENERAL') ||
                        razonUpper.includes('SECRETARIA DE ESTADO') ||
                        razonUpper.includes('ALCALDIA') ||
                        razonUpper.includes('JUNTA MUNICIPAL')) {
                categoria = 'ENTIDAD GUBERNAMENTAL';
              } else if (tipo === 'ONGS' || 
                        razonUpper.includes('FUNDACION') || 
                        razonUpper.includes('ASOCIACION') ||
                        razonUpper.includes('SIN FINES DE LUCRO') ||
                        razonUpper.includes('COOPERATIVA')) {
                categoria = 'ORGANIZACION SIN FINES DE LUCRO';
              }
              
              // Preservar estado original del archivo DGII
              const estadoFinal = estado || 'ACTIVO';
              
              records.push({
                rnc: rnc, // Preservar formato original del archivo DGII
                razonSocial: razonSocial.substring(0, 200),
                nombreComercial: nombreComercial.substring(0, 200),
                categoria,
                regimen: tipo === 'RST' ? 'REGIMEN ESPECIAL' : 'ORDINARIO',
                estado: estadoFinal,
                lastUpdated: new Date()
              });
            }
          }
        } catch (error) {
          // Continuar con el siguiente registro si hay error
        }
      }
      
      // Insertar lote
      if (records.length > 0) {
        try {
          await db.insert(rncRegistry).values(records);
          insertedCount += records.length;
          const totalNow = startLine + insertedCount;
          console.log(`Lote: +${records.length} | Total insertados en esta sesión: ${insertedCount} | Total en DB: ${totalNow}`);
        } catch (error) {
          console.log(`Error insertando lote: ${error}`);
        }
      }
    }
    
    console.log(`\n=== LOTE COMPLETADO ===`);
    console.log(`Nuevos registros insertados: ${insertedCount}`);
    
    // Verificar conteo final
    const finalCount = await db.select().from(rncRegistry);
    console.log(`Total final en base de datos: ${finalCount.length}`);
    
  } catch (error) {
    console.error('Error durante la importación:', error);
  }
}

// Ejecutar importación de lote
continueBatchImport().catch(console.error);