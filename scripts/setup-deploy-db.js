#!/usr/bin/env node

/**
 * Script independiente para configurar la base de datos durante el deployment
 * Este script se puede ejecutar antes del inicio del servidor principal
 */

import { setupDatabaseForDeploy, isDatabaseReady } from '../server/deploy-db-setup.js';

async function main() {
  console.log('🚀 Iniciando configuración de base de datos para deployment...');
  
  try {
    // Verificar que DATABASE_URL esté configurado
    if (!process.env.DATABASE_URL) {
      console.error('❌ ERROR: DATABASE_URL no está configurado');
      console.error('Por favor configura la variable de entorno DATABASE_URL antes del deployment');
      process.exit(1);
    }

    console.log('🔍 Verificando estado actual de la base de datos...');
    
    // Verificar si la base de datos ya está configurada
    const isReady = await isDatabaseReady();
    
    if (isReady) {
      console.log('✅ Base de datos ya está configurada correctamente');
      console.log('🎉 No se requiere configuración adicional');
    } else {
      console.log('⚙️ Configurando base de datos por primera vez...');
      
      // Configurar la base de datos
      await setupDatabaseForDeploy();
      
      console.log('✅ Base de datos configurada exitosamente');
    }

    console.log('🎯 Base de datos lista para el deployment');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error durante la configuración de la base de datos:', error.message);
    console.error('Detalles del error:', error);
    process.exit(1);
  }
}

// Ejecutar solo si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}