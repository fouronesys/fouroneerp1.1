import { db } from './db';
import { rncRegistry } from '../shared/schema';

// Dominican Republic business sectors and typical names
const businessSectors = [
  'COMERCIAL', 'INDUSTRIAL', 'SERVICIOS', 'CONSTRUCCION', 'AGRICOLA', 'GANADERO',
  'FINANCIERO', 'TURISTICO', 'TECNOLOGIA', 'SALUD', 'EDUCACION', 'TRANSPORTE'
];

const commonBusinessNames = [
  'DISTRIBUIDORA', 'COMERCIAL', 'EMPRESA', 'CORPORACION', 'COMPAÑIA', 'INVERSIONES',
  'GRUPO', 'INDUSTRIAS', 'SERVICIOS', 'CONSTRUCTORA', 'AGROPECUARIA', 'TECNOLOGIAS',
  'SOLUCIONES', 'CONSULTORES', 'DESARROLLOS', 'PRODUCTOS', 'SISTEMAS', 'NEGOCIOS'
];

const dominicanLastNames = [
  'MARTINEZ', 'GARCIA', 'RODRIGUEZ', 'FERNANDEZ', 'LOPEZ', 'GONZALEZ', 'PEREZ',
  'SANCHEZ', 'RAMIREZ', 'CRUZ', 'FLORES', 'GOMEZ', 'DIAZ', 'MORALES', 'HERRERA',
  'JIMENEZ', 'ALVAREZ', 'MEDINA', 'CASTRO', 'VARGAS', 'ORTEGA', 'RAMOS', 'REYES',
  'GUTIERREZ', 'MENDOZA', 'SILVA', 'ROJAS', 'TORRES', 'MIRANDA', 'ACOSTA',
  'GUERRERO', 'MENDEZ', 'ESPINAL', 'TAVARES', 'POLANCO', 'PAULINO', 'SANTANA',
  'VALDEZ', 'VASQUEZ', 'ESTRELLA', 'DE LOS SANTOS', 'MERCEDES', 'ROSARIO'
];

const dominicanCities = [
  'SANTO DOMINGO', 'SANTIAGO', 'SAN PEDRO DE MACORIS', 'LA ROMANA', 'SAN FRANCISCO DE MACORIS',
  'PUERTO PLATA', 'LA VEGA', 'BARAHONA', 'SAN JUAN DE LA MAGUANA', 'BONAO',
  'MOCA', 'AZUA', 'BANI', 'HIGUEY', 'MONTE CRISTI', 'NAGUA', 'MAO', 'COTUI',
  'SAN CRISTOBAL', 'BAJOS DE HAINA', 'LOS ALCARRIZOS', 'VILLA ALTAGRACIA'
];

const businessTypes = [
  'SRL', 'SA', 'EIRL', 'CXA', 'SOCIEDAD', 'EMPRESA', 'COMPAÑIA'
];

const rncCategories = [
  'GRAN CONTRIBUYENTE',
  'CONTRIBUYENTE REGISTRADO', 
  'REGIMEN SIMPLIFICADO',
  'ENTIDAD GUBERNAMENTAL',
  'ORGANIZACION SIN FINES DE LUCRO'
];

// Generate realistic RNC following Dominican patterns
function generateRNC(): string {
  // Dominican RNCs follow specific patterns:
  // 1XXXXXXXX (9 digits starting with 1)
  // 4XXXXXXXX (9 digits starting with 4) 
  // 1XXXXXXXXX (10 digits starting with 1)
  // 4XXXXXXXXX (10 digits starting with 4)
  // 1XXXXXXXXXX (11 digits starting with 1)
  
  const prefixes = ['1', '4'];
  const lengths = [9, 10, 11];
  
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const length = lengths[Math.floor(Math.random() * lengths.length)];
  
  let rnc = prefix;
  for (let i = 1; i < length; i++) {
    rnc += Math.floor(Math.random() * 10);
  }
  
  return rnc;
}

function generateBusinessName(): string {
  const templates = [
    () => `${commonBusinessNames[Math.floor(Math.random() * commonBusinessNames.length)]} ${dominicanLastNames[Math.floor(Math.random() * dominicanLastNames.length)]}`,
    () => `${dominicanLastNames[Math.floor(Math.random() * dominicanLastNames.length)]} ${commonBusinessNames[Math.floor(Math.random() * commonBusinessNames.length)]}`,
    () => `${businessSectors[Math.floor(Math.random() * businessSectors.length)]} ${dominicanLastNames[Math.floor(Math.random() * dominicanLastNames.length)]}`,
    () => `${dominicanLastNames[Math.floor(Math.random() * dominicanLastNames.length)]} Y ${dominicanLastNames[Math.floor(Math.random() * dominicanLastNames.length)]}`,
    () => `CENTRO ${businessSectors[Math.floor(Math.random() * businessSectors.length)]} ${dominicanCities[Math.floor(Math.random() * dominicanCities.length)]}`,
    () => `${dominicanLastNames[Math.floor(Math.random() * dominicanLastNames.length)]} ${businessTypes[Math.floor(Math.random() * businessTypes.length)]}`
  ];
  
  const template = templates[Math.floor(Math.random() * templates.length)];
  return template().toUpperCase();
}

function generateCommercialName(businessName: string): string {
  // Sometimes commercial name is shorter or different
  if (Math.random() < 0.3) {
    const parts = businessName.split(' ');
    return parts.slice(0, Math.min(3, parts.length)).join(' ');
  }
  return businessName;
}

function getRandomCategory(): string {
  const weights = [0.05, 0.70, 0.20, 0.03, 0.02]; // Distribution weights
  const rand = Math.random();
  let cumulative = 0;
  
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (rand <= cumulative) {
      return rncCategories[i];
    }
  }
  
  return rncCategories[1]; // Default to CONTRIBUYENTE REGISTRADO
}

async function populateRNCDatabase(batchSize: number = 1000, totalRecords: number = 100000) {
  console.log(`Starting to populate RNC database with ${totalRecords} records...`);
  
  const existingRNCs = new Set<string>();
  
  // Get existing RNCs to avoid duplicates
  const existing = await db.select({ rnc: rncRegistry.rnc }).from(rncRegistry);
  existing.forEach(record => existingRNCs.add(record.rnc));
  
  console.log(`Found ${existingRNCs.size} existing RNCs, generating ${totalRecords} new ones...`);
  
  const batches = Math.ceil(totalRecords / batchSize);
  
  for (let batch = 0; batch < batches; batch++) {
    const batchData = [];
    const currentBatchSize = Math.min(batchSize, totalRecords - (batch * batchSize));
    
    console.log(`Processing batch ${batch + 1}/${batches} (${currentBatchSize} records)...`);
    
    for (let i = 0; i < currentBatchSize; i++) {
      let rnc;
      let attempts = 0;
      
      // Generate unique RNC
      do {
        rnc = generateRNC();
        attempts++;
      } while (existingRNCs.has(rnc) && attempts < 100);
      
      if (attempts >= 100) {
        console.warn('Could not generate unique RNC after 100 attempts, skipping...');
        continue;
      }
      
      existingRNCs.add(rnc);
      
      const razonSocial = generateBusinessName();
      const nombreComercial = generateCommercialName(razonSocial);
      const categoria = getRandomCategory();
      const estado = Math.random() < 0.95 ? 'ACTIVO' : 'INACTIVO'; // 95% active
      const regimen = categoria === 'ENTIDAD GUBERNAMENTAL' ? 'REGIMEN ESPECIAL' : 'ORDINARIO';
      
      batchData.push({
        rnc,
        razonSocial,
        nombreComercial,
        categoria,
        regimen,
        estado,
        lastUpdated: new Date()
      });
    }
    
    if (batchData.length > 0) {
      await db.insert(rncRegistry).values(batchData);
      console.log(`Inserted batch ${batch + 1}/${batches} - ${batchData.length} records`);
    }
    
    // Small delay to avoid overwhelming the database
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Get final count
  const finalCount = await db.select({ count: rncRegistry.id }).from(rncRegistry);
  console.log(`RNC database population completed. Total records: ${finalCount.length}`);
}

// Export for use in other files
export { populateRNCDatabase };

// If running directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  populateRNCDatabase(2000, 150000)
    .then(() => {
      console.log('RNC database population completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error populating RNC database:', error);
      process.exit(1);
    });
}