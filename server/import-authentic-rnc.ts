import { readFileSync } from 'fs';
import { db } from './db.js';
import { rncRegistry } from '../shared/schema.js';

async function importAuthenticRNC() {
  console.log('Iniciando importación de RNCs auténticos del DGII...');
  
  try {
    // Leer el archivo DGII auténtico
    const fileContent = readFileSync('../attached_assets/DGII_RNC_1750968202624.TXT', 'latin1');
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    console.log(`Total de líneas a procesar: ${lines.length}`);
    
    const batchSize = 1000;
    let processedCount = 0;
    let insertedCount = 0;
    
    for (let i = 0; i < lines.length; i += batchSize) {
      const batch = lines.slice(i, i + batchSize);
      const records = [];
      
      for (const line of batch) {
        try {
          const fields = line.split('|');
          
          if (fields.length >= 11) {
            const rnc = fields[0]?.trim();
            const razonSocial = fields[1]?.trim();
            const nombreComercial = fields[2]?.trim() || razonSocial;
            const actividadEconomica = fields[3]?.trim();
            const fechaConstitucion = fields[9]?.trim();
            const estado = fields[10]?.trim();
            const tipo = fields[11]?.trim() || 'NORMAL';
            
            // Validar RNC (debe ser numérico y tener longitud apropiada)
            if (rnc && /^\d{8,11}$/.test(rnc) && razonSocial) {
              // Determinar categoría basada en el tipo y actividad
              let categoria = 'CONTRIBUYENTE REGISTRADO';
              
              if (tipo === 'GC' || (actividadEconomica && actividadEconomica.includes('GRAN'))) {
                categoria = 'GRAN CONTRIBUYENTE';
              } else if (tipo === 'EG' || razonSocial.includes('MINISTERIO') || 
                        razonSocial.includes('AYUNTAMIENTO') || 
                        razonSocial.includes('GOBIERNO') ||
                        razonSocial.includes('DIRECCION GENERAL') ||
                        razonSocial.includes('SECRETARIA DE ESTADO')) {
                categoria = 'ENTIDAD GUBERNAMENTAL';
              } else if (tipo === 'ONGS' || razonSocial.includes('FUNDACION') || 
                        razonSocial.includes('ASOCIACION') ||
                        razonSocial.includes('SIN FINES DE LUCRO')) {
                categoria = 'ORGANIZACION SIN FINES DE LUCRO';
              }
              
              // Preservar estado original del archivo DGII
              const estadoFinal = estado || 'ACTIVO';
              
              records.push({
                rnc: rnc, // Preservar formato original del archivo DGII
                razonSocial: razonSocial.substring(0, 200), // Limitar longitud
                nombreComercial: nombreComercial.substring(0, 200),
                categoria,
                regimen: tipo === 'RST' ? 'REGIMEN ESPECIAL' : 'ORDINARIO',
                estado: estadoFinal,
                lastUpdated: new Date()
              });
            }
          }
        } catch (error) {
          console.log(`Error procesando línea: ${line.substring(0, 50)}...`);
        }
      }
      
      // Insertar lote en la base de datos
      if (records.length > 0) {
        try {
          await db.insert(rncRegistry).values(records);
          insertedCount += records.length;
          console.log(`Lote ${Math.floor(i/batchSize) + 1}: Insertados ${records.length} registros. Total: ${insertedCount}`);
        } catch (error) {
          console.log(`Error insertando lote: ${error}`);
        }
      }
      
      processedCount += batch.length;
    }
    
    console.log(`\n=== IMPORTACIÓN COMPLETADA ===`);
    console.log(`Líneas procesadas: ${processedCount}`);
    console.log(`RNCs insertados: ${insertedCount}`);
    
    // Verificar conteo final
    const totalInDB = await db.select().from(rncRegistry);
    console.log(`Total en base de datos: ${totalInDB.length}`);
    
  } catch (error) {
    console.error('Error durante la importación:', error);
  }
}

// Ejecutar importación
importAuthenticRNC().catch(console.error);