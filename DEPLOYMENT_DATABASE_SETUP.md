# Configuración de Base de Datos para Deployment

## Resumen

Se ha creado un sistema automatizado para configurar la base de datos durante el deployment que garantiza que todas las tablas necesarias se creen automáticamente si no existen.

## Archivos Creados

### 1. `server/deploy-db-setup.ts`
Script principal que maneja la configuración de la base de datos:
- Verifica la conexión a la base de datos
- Crea todas las tablas necesarias si no existen
- Configura índices para optimizar el rendimiento
- Maneja errores de manera robusta

### 2. `scripts/setup-deploy-db.js`
Script independiente para configuración manual:
- Se puede ejecutar antes del deployment
- Verifica el estado de la base de datos
- Proporciona mensajes detallados sobre el proceso

### 3. `deploy-setup.sh`
Script bash para deployment completo:
- Instala dependencias
- Configura la base de datos
- Construye la aplicación
- Verifica que todo esté correcto

## Tablas que se Crean Automáticamente

El sistema creará las siguientes tablas principales:

1. **users** - Usuarios del sistema
2. **companies** - Empresas registradas
3. **system_modules** - Módulos del sistema ERP
4. **system_config** - Configuración del sistema
5. **rnc_registry** - Registro de RNC de DGII
6. **login_attempts** - Intentos de login para seguridad
7. **products** - Catálogo de productos
8. **customers** - Gestión de clientes
9. **suppliers** - Gestión de proveedores

Todas las tablas incluyen índices optimizados para mejor rendimiento.

## Cómo Usar el Sistema

### Opción 1: Automático (Recomendado)
El sistema se ejecuta automáticamente al iniciar el servidor. No requiere intervención manual.

### Opción 2: Manual
```bash
# Ejecutar solo la configuración de BD
npm run db:setup

# O usar el script bash completo
./deploy-setup.sh
```

### Opción 3: Deployment Completo
```bash
# Configurar, construir e iniciar
npm run deploy:init
npm start
```

## Variables de Entorno Requeridas

```env
DATABASE_URL=postgresql://usuario:password@host:puerto/database
```

## Verificación

El sistema verifica automáticamente:
- ✅ Conexión a la base de datos
- ✅ Existencia de tablas necesarias
- ✅ Configuración de índices
- ✅ Estado general del sistema

## Logs de Deployment

Durante el proceso verás mensajes como:
```
🚀 Starting database setup for deployment...
📦 Running database migrations...
🔍 Checking and creating tables if needed...
✅ Database tables created successfully
🎉 Database setup completed successfully for deployment!
```

## Beneficios

1. **Deployment Automático**: No necesitas configurar manualmente la BD
2. **Idempotente**: Se puede ejecutar múltiples veces sin problemas
3. **Robusto**: Maneja errores y casos edge
4. **Rápido**: Solo crea lo que no existe
5. **Seguro**: Usa transacciones y validaciones

## Integración con Replit

El sistema está totalmente integrado con el entorno Replit:
- Se ejecuta automáticamente al hacer deploy
- Usa las variables de entorno de Replit
- Compatible con la base de datos PostgreSQL de Replit
- Optimizado para el runtime de Replit

## Notas Técnicas

- Usa `CREATE TABLE IF NOT EXISTS` para seguridad
- Implementa rollback automático en caso de error
- Compatible con PostgreSQL 12+
- Optimizado para entornos de producción
- Incluye logging detallado para debugging