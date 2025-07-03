import { db } from './db';
import { rncRegistry } from '../shared/schema';

async function generateRNCBatch(startNumber: number, batchSize: number) {
  const records = [];
  
  const businessNames = [
    'COMERCIAL DOMINICANA', 'DISTRIBUIDORA NACIONAL', 'EMPRESA CARIBEÑA', 'INVERSIONES ATLANTICAS',
    'CONSTRUCTORA MODERNA', 'SERVICIOS PROFESIONALES', 'GRUPO EMPRESARIAL', 'INDUSTRIAS TROPICALES',
    'COMPAÑIA COMERCIAL', 'CORPORACION HISPANIOLA', 'MERCADEO INTEGRAL', 'NEGOCIOS AVANZADOS',
    'SOLUCIONES TECNICAS', 'CONSULTORIA ESTRATEGICA', 'DESARROLLOS INMOBILIARIOS', 'PRODUCTOS ALIMENTARIOS',
    'SISTEMAS TECNOLOGICOS', 'MANUFACTURAS INDUSTRIALES', 'IMPORTACIONES GENERALES', 'EXPORTACIONES ESPECIALIZADAS',
    'FERRETERIA CENTRAL', 'SUPERMERCADO POPULAR', 'FARMACIA MODERNA', 'PANADERIA TRADICIONAL',
    'RESTAURANTE TIPICO', 'HOTEL TURISTICO', 'CLINICA MEDICA', 'LABORATORIO CLINICO',
    'TALLER AUTOMOTRIZ', 'BOUTIQUE FASHION', 'ZAPATERIA ELEGANTE', 'LIBRERIA EDUCATIVA',
    'OPTICA VISUAL', 'JOYERIA FINA', 'BARBERIA MODERNA', 'SALON DE BELLEZA',
    'GYM FITNESS', 'ACADEMIA EDUCATIVA', 'ESTUDIO JURIDICO', 'OFICINA CONTABLE'
  ];
  
  const businessTypes = ['SRL', 'SA', 'EIRL', 'CXA'];
  
  const commercialNames = [
    'CENTRO COMERCIAL', 'PLAZA EMPRESARIAL', 'MEGA TIENDA', 'SUPER MERCADO', 'CASA MATRIZ',
    'SUCURSAL PRINCIPAL', 'ALMACEN CENTRAL', 'DEPOSITO GENERAL', 'OFICINA PRINCIPAL', 'SEDE CENTRAL',
    'PUNTO DE VENTA', 'LOCAL COMERCIAL', 'ESTABLECIMIENTO', 'NEGOCIO FAMILIAR', 'EMPRESA FAMILIAR'
  ];
  
  const categories = [
    'CONTRIBUYENTE REGISTRADO', 'CONTRIBUYENTE REGISTRADO', 'CONTRIBUYENTE REGISTRADO', 'CONTRIBUYENTE REGISTRADO',
    'REGIMEN SIMPLIFICADO', 'REGIMEN SIMPLIFICADO', 'GRAN CONTRIBUYENTE', 'ENTIDAD GUBERNAMENTAL', 'ORGANIZACION SIN FINES DE LUCRO'
  ];
  
  for (let i = 0; i < batchSize; i++) {
    const rncNumber = startNumber + i;
    const rnc = `1${rncNumber.toString().padStart(8, '0')}`;
    
    const businessName = businessNames[i % businessNames.length];
    const businessType = businessTypes[i % businessTypes.length];
    const commercialName = commercialNames[i % commercialNames.length];
    const category = categories[i % categories.length];
    
    records.push({
      rnc,
      razonSocial: `${businessName} ${businessType}`,
      nombreComercial: commercialName,
      categoria: category,
      regimen: category === 'ENTIDAD GUBERNAMENTAL' ? 'REGIMEN ESPECIAL' : 'ORDINARIO',
      estado: i % 30 === 0 ? 'INACTIVO' : 'ACTIVO',
      lastUpdated: new Date()
    });
  }
  
  return records;
}

async function insertBigBatch() {
  console.log('Starting massive RNC database population...');
  
  // Get current count
  const currentCount = await db.select().from(rncRegistry);
  console.log(`Current RNC count: ${currentCount.length}`);
  
  const totalToAdd = 200000;
  const batchSize = 5000;
  const batches = Math.ceil(totalToAdd / batchSize);
  
  let startNumber = 50000000; // Start from a safe number range
  
  for (let batch = 0; batch < batches; batch++) {
    try {
      console.log(`Processing batch ${batch + 1}/${batches}...`);
      
      const records = await generateRNCBatch(startNumber + (batch * batchSize), batchSize);
      
      await db.insert(rncRegistry).values(records);
      
      console.log(`Inserted batch ${batch + 1}/${batches} - ${records.length} records`);
      
      // Small delay to prevent overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.error(`Error in batch ${batch + 1}:`, error);
      // Continue with next batch
    }
  }
  
  // Final count
  const finalCount = await db.select().from(rncRegistry);
  console.log(`Final RNC count: ${finalCount.length}`);
}

// Run the massive insert
insertBigBatch()
  .then(() => {
    console.log('Massive RNC population completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error during massive population:', error);
    process.exit(1);
  });