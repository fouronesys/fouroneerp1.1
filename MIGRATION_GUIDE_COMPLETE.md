# Four One Solutions ERP - Complete Migration Guide

Esta guía completa proporciona todo lo necesario para migrar, respaldar y restaurar el sistema Four One Solutions ERP en diferentes entornos.

## Opciones de Migración Rápida

### Opción 1: Script de Migración Automatizado (Recomendado)

```bash
# Crear paquete completo de migración
chmod +x migration_complete.sh
./migration_complete.sh
```

Esto crea un paquete con timestamp que incluye:
- Esquema completo de base de datos
- Datos esenciales del sistema
- Registro RNC de muestra (1000 registros)
- Script de restauración automatizado
- Documentación completa

### Opción 2: Script de Recreación Completa de Base de Datos

Usar el script `create_database_script.sql` para instalaciones limpias:

```bash
psql $DATABASE_URL -f create_database_script.sql
```

Este script crea:
- Todas las 70+ tablas de base de datos con relaciones apropiadas
- Usuario super admin (admin@fourone.com.do)
- Empresa y almacén por defecto
- Módulos del sistema y permisos
- Configuraciones esenciales

## Estrategias de Respaldo

### 1. Respaldo Completo del Sistema (Producción)

```bash
# Respaldo completo incluyendo todos los datos
pg_dump $DATABASE_URL --no-owner --no-privileges > erp_full_backup_$(date +%Y%m%d).sql
```

**Advertencia**: Esto incluye 772,166+ registros RNC (~2GB archivo)

### 2. Respaldo de Esquema + Datos Esenciales (Recomendado)

```bash
# Solo esquema
pg_dump $DATABASE_URL --schema-only --no-owner --no-privileges > erp_schema.sql

# Solo datos esenciales
pg_dump $DATABASE_URL --data-only --no-owner --no-privileges \
    --table=users \
    --table=companies \
    --table=warehouses \
    --table=product_categories \
    --table=permissions \
    --table=user_permissions \
    --table=system_configurations \
    --table=system_modules > erp_essential_data.sql
```

### 3. Respaldo de Registro RNC (Opcional)

```bash
# Registro RNC completo (archivo grande)
pg_dump $DATABASE_URL --data-only --table=dgii_rnc_registry > rnc_full.sql

# Datos RNC de muestra (para pruebas)
pg_dump $DATABASE_URL --data-only --table=dgii_rnc_registry \
    --limit=1000 > rnc_sample.sql
```

## Procedimientos de Restauración

### Restauración Completa del Sistema

1. **Preparar Base de Datos Objetivo**:
```bash
# Crear nueva base de datos
createdb erp_new

# Establecer cadena de conexión
export DATABASE_URL='postgresql://user:pass@host:port/erp_new'
```

2. **Restaurar Esquema**:
```bash
psql $DATABASE_URL -f erp_schema.sql
```

3. **Restaurar Datos Esenciales**:
```bash
psql $DATABASE_URL -f erp_essential_data.sql
```

4. **Restaurar Registro RNC** (si está disponible):
```bash
psql $DATABASE_URL -f rnc_sample.sql  # o rnc_full.sql
```

### Instalación Limpia

Para nuevos despliegues, usar el script completo de creación de base de datos:

```bash
# Descargar y ejecutar configuración completa
psql $DATABASE_URL -f create_database_script.sql
```

## Configuración del Entorno

### Variables de Entorno Requeridas

```bash
# Base de datos
export DATABASE_URL='postgresql://username:password@host:port/database'

# Sesiones
export SESSION_SECRET='your-secure-session-secret-here'

# Servicios de IA (Opcional)
export ANTHROPIC_API_KEY='sk-ant-api03-...'

# Procesamiento de Pagos (Opcional)
export PAYPAL_CLIENT_ID='your-paypal-client-id'
export PAYPAL_CLIENT_SECRET='your-paypal-client-secret'

# Servicios de Email (Opcional)
export SENDGRID_API_KEY='SG.your-sendgrid-api-key'
export BREVO_API_KEY='your-brevo-api-key'
```

### Configuración de Producción

```bash
# Configuraciones de producción
export NODE_ENV='production'
export PORT='5000'

# Seguridad
export SESSION_SECRET='generate-strong-32-char-secret'
export BCRYPT_ROUNDS='12'

# Rendimiento
export DATABASE_POOL_SIZE='20'
export SESSION_TIMEOUT='86400'
```

## Requisitos del Sistema

### Requisitos Mínimos
- **CPU**: 2 núcleos, 2.4 GHz
- **RAM**: 4GB (8GB recomendado)
- **Almacenamiento**: 20GB (100GB recomendado con RNC completo)
- **Base de Datos**: PostgreSQL 12+
- **Node.js**: 18+

### Requisitos de Producción
- **CPU**: 4+ núcleos, 3.0+ GHz
- **RAM**: 16GB+
- **Almacenamiento**: 100GB+ SSD
- **Base de Datos**: PostgreSQL 14+ con connection pooling
- **Node.js**: 20+ LTS

## Lista de Verificación Pre-Migración

- [ ] Probar conectividad de base de datos
- [ ] Verificar espacio en disco (mínimo 10GB libre)
- [ ] Respaldar sistema actual
- [ ] Preparar variables de entorno
- [ ] Probar restauración en entorno de staging
- [ ] Planificar ventana de mantenimiento

## Proceso de Migración

### Paso 1: Preparación del Entorno

```bash
# Instalar dependencias
npm install

# Configurar entorno
cp .env.example .env
# Editar .env con su configuración

# Probar conexión de base de datos
npm run db:check
```

### Paso 2: Migración de Base de Datos

```bash
# Opción A: Usar paquete de migración
tar -xzf erp_migration_TIMESTAMP.tar.gz
cd erp_migration_TIMESTAMP
./restore_database.sh

# Opción B: Restauración manual
psql $DATABASE_URL -f create_database_script.sql
```

### Paso 3: Inicio de Aplicación

```bash
# Build de producción
npm run build

# Iniciar aplicación
npm run start

# O modo desarrollo
npm run dev
```

### Paso 4: Verificación

1. **Verificación de Base de Datos**:
```sql
SELECT 'Empresas: ' || COUNT(*) FROM companies;
SELECT 'Usuarios: ' || COUNT(*) FROM users;
SELECT 'Registros RNC: ' || COUNT(*) FROM dgii_rnc_registry;
```

2. **Verificación de Salud de Aplicación**:
   - Visitar: http://localhost:5000/api/health
   - Login: admin@fourone.com.do / admin123
   - Probar módulos principales: Dashboard, POS, Facturación

3. **Monitoreo del Sistema**:
   - Verificar logs por errores
   - Verificar que todos los módulos cargan correctamente
   - Probar funcionalidad de validación RNC

## Tareas Post-Migración

### Configuración de Seguridad

1. **Cambiar Contraseñas Por Defecto**:
   - Cambiar contraseña del admin
   - Actualizar configuración de la empresa

2. **Configurar Respaldos**:
```bash
# Configurar respaldos automáticos diarios
crontab -e
# Agregar: 0 2 * * * /path/to/backup-script.sh
```

### Sincronización de Datos

1. **Actualización de Registro RNC**:
   - Navegar a: Sistema → DGII → Actualizar RNC
   - Importar registro completo si es necesario

2. **Catálogo de Productos**:
   - Importar productos existentes
   - Configurar almacenes
   - Configurar proveedores y clientes

3. **Configuración Fiscal**:
   - Configurar secuencias NCF
   - Configurar reportes DGII
   - Verificar cálculos de impuestos

## Solución de Problemas

### Problemas Comunes

1. **Errores de Conexión de Base de Datos**:
```bash
# Probar conexión
pg_isready -h hostname -p port

# Verificar credenciales
psql $DATABASE_URL -c "SELECT version();"
```

2. **Dependencias Faltantes**:
```bash
# Reinstalar módulos de node
rm -rf node_modules package-lock.json
npm install
```

3. **Errores de Permisos**:
```sql
-- Verificar permisos de usuario
SELECT * FROM user_permissions WHERE user_id = 1;

-- Otorgar permisos faltantes
INSERT INTO user_permissions (user_id, permission_id, granted_by)
SELECT 1, p.id, 1 FROM permissions p
WHERE p.name = 'required_permission_name';
```

## Procedimientos de Rollback

### Rollback de Emergencia

1. **Detener Aplicación**:
```bash
pm2 stop erp-app  # o kill process
```

2. **Restaurar Base de Datos Anterior**:
```bash
dropdb erp_database
createdb erp_database
psql erp_database < backup_pre_migration.sql
```

3. **Reiniciar Aplicación**:
```bash
npm run start
```

## Validación de Migración

### Pruebas Automatizadas

```bash
# Ejecutar suite de pruebas
npm test

# Verificación de integridad de base de datos
npm run db:check

# Verificación de salud de API
curl http://localhost:5000/api/health
```

### Verificación Manual

1. **Funcionalidad Principal**:
   - [ ] Login/logout funciona
   - [ ] Dashboard carga datos
   - [ ] POS procesa ventas
   - [ ] Facturación genera PDFs
   - [ ] Validación RNC funciona

2. **Integridad de Datos**:
   - [ ] Todos los usuarios migrados
   - [ ] Productos e inventario correcto
   - [ ] Datos de clientes completos
   - [ ] Registros financieros precisos

## Archivos de Respaldo Creados

Los siguientes archivos han sido creados en tu sistema:

1. **erp_schema_backup.sql** - Esquema completo de base de datos
2. **erp_essential_data_backup.sql** - Datos esenciales del sistema
3. **create_database_script.sql** - Script completo de recreación
4. **migration_complete.sh** - Script de migración automatizado

## Credenciales Por Defecto

Después de la restauración, usar estas credenciales para acceder:

- **Email**: admin@fourone.com.do
- **Contraseña**: admin123

**IMPORTANTE**: Cambiar estas credenciales inmediatamente después de la primera conexión.

## Soporte y Mantenimiento

### Programación de Respaldos

- **Diario**: Respaldo de datos esenciales
- **Semanal**: Respaldo completo del sistema
- **Mensual**: Archivo de respaldo a almacenamiento externo

### Monitoreo

- **Tamaño de Base de Datos**: Monitorear crecimiento
- **Rendimiento**: Tiempos de ejecución de consultas
- **Seguridad**: Intentos de login fallidos
- **Registro RNC**: Estado de actualización

### Información de Contacto

- **Soporte Técnico**: admin@fourone.com.do
- **Contacto de Emergencia**: +1-809-555-0100
- **Documentación**: Sistema → Ayuda

---

**Migración Completada Exitosamente**: Su sistema Four One Solutions ERP está listo para uso en producción.