#!/usr/bin/env node

/**
 * Script independiente para crear tablas de tokens
 * Puede ejecutarse durante el deployment en plataformas externas
 */

import postgres from 'postgres';
import fs from 'fs';
import path from 'path';

async function createTokenTables() {
  console.log('🔐 Iniciando creación de tablas de tokens...');
  
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ ERROR: DATABASE_URL no está configurado');
    console.error('Por favor configura la variable de entorno DATABASE_URL');
    process.exit(1);
  }

  try {
    // Crear conexión a la base de datos
    const client = postgres(databaseUrl, { max: 2 });
    
    console.log('📊 Conectando a la base de datos...');
    
    // Leer el archivo SQL
    const sqlFilePath = path.join(path.dirname(new URL(import.meta.url).pathname), 'create-token-tables.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Dividir el SQL en statements individuales
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`🔨 Ejecutando ${statements.length} comandos SQL...`);
    
    // Ejecutar cada statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      if (statement.includes('CREATE TABLE')) {
        const tableName = statement.match(/CREATE TABLE IF NOT EXISTS "(\w+)"/)?.[1];
        console.log(`📋 Creando tabla: ${tableName || 'desconocida'}`);
      } else if (statement.includes('CREATE INDEX')) {
        const indexName = statement.match(/CREATE INDEX IF NOT EXISTS "(\w+)"/)?.[1];
        console.log(`🔍 Creando índice: ${indexName || 'desconocido'}`);
      } else if (statement.includes('CREATE OR REPLACE FUNCTION')) {
        const functionName = statement.match(/CREATE OR REPLACE FUNCTION (\w+)/)?.[1];
        console.log(`⚙️ Creando función: ${functionName || 'desconocida'}`);
      }
      
      try {
        await client.unsafe(statement);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️ Ya existe, continuando...`);
        } else {
          console.error(`❌ Error ejecutando statement ${i + 1}:`, error.message);
          throw error;
        }
      }
    }
    
    // Verificar que las tablas fueron creadas
    console.log('🔍 Verificando creación de tablas...');
    
    const tokenTables = [
      'login_attempts',
      'session_tokens', 
      'password_reset_tokens',
      'api_tokens',
      'refresh_tokens',
      'invitation_tokens',
      'email_verification_tokens',
      'device_tokens'
    ];
    
    for (const tableName of tokenTables) {
      const result = await client`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = ${tableName}
        )
      `;
      
      if (result[0].exists) {
        console.log(`✅ Tabla confirmada: ${tableName}`);
      } else {
        console.error(`❌ Tabla no encontrada: ${tableName}`);
      }
    }
    
    // Probar la función de limpieza
    console.log('🧹 Probando función de limpieza...');
    const cleanupResult = await client`SELECT cleanup_expired_tokens() as deleted_count`;
    console.log(`✅ Función de limpieza funcionando: ${cleanupResult[0].deleted_count} tokens expirados eliminados`);
    
    // Cerrar conexión
    await client.end();
    
    console.log('🎉 Creación de tablas de tokens completada exitosamente!');
    console.log('');
    console.log('📋 Tablas creadas:');
    tokenTables.forEach(table => console.log(`   - ${table}`));
    console.log('');
    console.log('⚙️ Funciones disponibles:');
    console.log('   - cleanup_expired_tokens() - Limpia tokens expirados');
    console.log('');
    console.log('🔧 Para ejecutar limpieza manual:');
    console.log('   SELECT cleanup_expired_tokens();');
    
  } catch (error) {
    console.error('❌ Error durante la creación de tablas de tokens:', error.message);
    console.error('Detalles completos:', error);
    process.exit(1);
  }
}

// Función para verificar si las tablas de tokens existen
export async function checkTokenTablesExist() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return false;
  
  try {
    const client = postgres(databaseUrl, { max: 1 });
    
    const result = await client`
      SELECT COUNT(*) as table_count
      FROM information_schema.tables 
      WHERE table_name IN ('login_attempts', 'session_tokens', 'password_reset_tokens', 'api_tokens')
    `;
    
    await client.end();
    return parseInt(result[0].table_count) >= 4;
  } catch {
    return false;
  }
}

// Ejecutar solo si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  createTokenTables();
}