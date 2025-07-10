# Guía de Deployment - Sistema de Tokens

Esta guía explica cómo configurar las tablas de tokens y autenticación durante el deployment en plataformas externas.

## 🔐 Archivos Creados

### 1. Scripts SQL
- **`scripts/create-token-tables.sql`** - Script SQL completo con todas las tablas de tokens
- **`scripts/create-token-tables.js`** - Script Node.js para ejecución automatizada
- **`scripts/setup-tokens.sh`** - Script bash para deployment en plataformas Unix

### 2. Tablas de Tokens Incluidas

| Tabla | Propósito | Características |
|-------|-----------|----------------|
| `login_attempts` | Seguridad de login | Tracking de intentos, IP, user agent |
| `session_tokens` | Autenticación persistente | Tokens estilo WhatsApp, expiración |
| `password_reset_tokens` | Reseteo de contraseñas | Tokens temporales, validación email |
| `api_tokens` | Integración API | Permisos granulares, por empresa |
| `refresh_tokens` | OAuth/JWT | Renovación automática de acceso |
| `invitation_tokens` | Invitaciones empresariales | Registro por invitación, roles |
| `email_verification_tokens` | Verificación de email | Confirmación de cuentas nuevas |
| `device_tokens` | Notificaciones push | Android, iOS, Web push |

## 🚀 Métodos de Deployment

### Opción 1: Script Automático (Recomendado)
```bash
# Durante el deployment en Render/Railway/Heroku
chmod +x scripts/setup-tokens.sh
./scripts/setup-tokens.sh
```

### Opción 2: Node.js
```bash
# Requiere Node.js y postgres package
node scripts/create-token-tables.js
```

### Opción 3: SQL Directo
```bash
# Con psql disponible
psql $DATABASE_URL -f scripts/create-token-tables.sql
```

## ⚙️ Integración con Deploy Principal

### Actualizar deploy-render.sh
Agrega esto antes de la construcción de la aplicación:

```bash
# Configurar tablas de tokens
echo "🔐 Configurando sistema de tokens..."
./scripts/setup-tokens.sh

if [ $? -ne 0 ]; then
    echo "❌ Error configurando tokens"
    exit 1
fi
```

### Actualizar server/deploy-db-setup.ts
Incluye la verificación de tokens:

```typescript
import { checkTokenTablesExist } from '../scripts/create-token-tables.js';

// Dentro de setupDatabaseForDeploy()
const tokenTablesExist = await checkTokenTablesExist();
if (!tokenTablesExist) {
    console.log('🔐 Creating token tables...');
    // Ejecutar creación de tokens
}
```

## 🔧 Funciones Automáticas

### Limpieza de Tokens Expirados
```sql
-- Ejecutar manualmente
SELECT cleanup_expired_tokens();

-- Resultado: número de tokens eliminados
```

### Programar Limpieza Automática
```sql
-- Crear un cron job o scheduled task que ejecute:
SELECT cleanup_expired_tokens();
-- Recomendado: cada 24 horas
```

## 📊 Monitoreo de Tokens

### Verificar Estado de Tablas
```sql
-- Contar tokens activos por tipo
SELECT 
    'session_tokens' as table_name, 
    COUNT(*) as active_tokens,
    COUNT(*) FILTER (WHERE expires_at > NOW()) as valid_tokens
FROM session_tokens
UNION ALL
SELECT 
    'api_tokens' as table_name,
    COUNT(*) as active_tokens,
    COUNT(*) FILTER (WHERE is_active = true) as valid_tokens
FROM api_tokens;
```

### Estadísticas de Seguridad
```sql
-- Intentos de login por IP en las últimas 24 horas
SELECT 
    ip_address,
    COUNT(*) as attempts,
    COUNT(*) FILTER (WHERE success = true) as successful,
    COUNT(*) FILTER (WHERE success = false) as failed
FROM login_attempts 
WHERE attempted_at > NOW() - INTERVAL '24 hours'
GROUP BY ip_address
ORDER BY attempts DESC;
```

## 🔒 Configuración de Seguridad

### Variables de Entorno Recomendadas
```env
# Configuración de tokens
TOKEN_SECRET=your-super-secret-key-here
SESSION_TIMEOUT=3600
API_TOKEN_EXPIRY_DAYS=90
PASSWORD_RESET_EXPIRY_HOURS=1
INVITATION_EXPIRY_DAYS=7

# Rate limiting para tokens
LOGIN_ATTEMPT_LIMIT=5
LOGIN_ATTEMPT_WINDOW_MINUTES=15
```

### Índices de Performance
Los scripts incluyen índices optimizados:
- Búsqueda por token (hash index)
- Filtros por usuario y empresa
- Ordenamiento por fecha de expiración
- Consultas de seguridad por IP

## 🚨 Troubleshooting

### Error: "cannot find package 'postgres'"
```bash
npm install postgres
```

### Error: "permission denied"
```bash
chmod +x scripts/setup-tokens.sh
```

### Error: "relation already exists"
Es normal, significa que las tablas ya están creadas.

### Error de conexión PostgreSQL
Verificar que DATABASE_URL esté correctamente configurado:
```bash
echo $DATABASE_URL
psql $DATABASE_URL -c "SELECT 1;"
```

## 🎯 Casos de Uso

### 1. Autenticación Mobile (WhatsApp style)
- Usa `session_tokens` para persistencia
- Tokens de larga duración con renovación automática
- Tracking de actividad por dispositivo

### 2. API Integrations
- Usa `api_tokens` con permisos granulares
- Por empresa y por usuario
- Expiración configurable

### 3. Sistema de Invitaciones
- Usa `invitation_tokens` para registro empresarial
- Links únicos con expiración
- Control de roles desde la invitación

### 4. Seguridad Empresarial
- `login_attempts` para detección de ataques
- Rate limiting automático
- Alertas por comportamiento sospechoso

¡El sistema de tokens está listo para soportar todas las funcionalidades de autenticación y seguridad del ERP!