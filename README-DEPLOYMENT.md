# Guía de Deployment para Plataformas Externas

Este documento explica cómo hacer deploy del sistema ERP en plataformas externas como Render, Railway, Heroku, etc.

## 🚀 Deploy Automático en Render

### 1. Preparación
1. Sube tu código a un repositorio Git (GitHub, GitLab, etc.)
2. Ve a [Render.com](https://render.com) y crea una cuenta
3. Conecta tu repositorio

### 2. Configuración de Base de Datos
1. En Render, crea un **PostgreSQL Database**
2. Copia la **Internal Database URL** que se proporciona

### 3. Configuración del Web Service
1. Crea un nuevo **Web Service** en Render
2. Conecta tu repositorio
3. Configura los siguientes settings:

```
Name: fourone-erp
Environment: Node
Build Command: ./deploy-render.sh
Start Command: npm start
```

### 4. Variables de Entorno
Agrega las siguientes variables en Render:

```
DATABASE_URL=<tu-database-url-internal-de-render>
NODE_ENV=production
PORT=5000
```

Variables opcionales para funcionalidades completas:
```
ANTHROPIC_API_KEY=<tu-clave-de-anthropic>
GEMINI_API_KEY=<tu-clave-de-gemini>
UNSPLASH_ACCESS_KEY=<tu-clave-de-unsplash>
BREVO_API_KEY=<tu-clave-de-brevo>
PAYPAL_CLIENT_ID=<tu-client-id-de-paypal>
PAYPAL_CLIENT_SECRET=<tu-client-secret-de-paypal>
```

### 5. Deploy
1. Haz click en **Create Web Service**
2. Render ejecutará automáticamente el script de deployment
3. El sistema estará disponible en la URL proporcionada

## 🔧 Deploy Manual en Otras Plataformas

### Requisitos
- Node.js 18+
- PostgreSQL database
- Variables de entorno configuradas

### Pasos
1. Clona el repositorio
2. Instala dependencias: `npm install`
3. Configura las variables de entorno
4. Ejecuta el script de deployment: `./deploy-render.sh`
5. Inicia el servidor: `npm start`

## 📋 Scripts Disponibles

- `npm run db:setup` - Configura la base de datos completa
- `npm run build` - Construye la aplicación para producción
- `npm start` - Inicia el servidor en modo producción
- `./deploy-render.sh` - Script completo de deployment para Render

## 🎯 Características del Sistema Post-Deploy

### Usuario Administrador
- **Email**: admin@fourone.com.do
- **Contraseña**: Admin123!
- **Nota**: Cambia la contraseña inmediatamente después del primer login

### Módulos Incluidos
- ✅ Sistema POS completo
- ✅ Gestión de inventario
- ✅ Contabilidad automatizada
- ✅ Cumplimiento fiscal DGII (República Dominicana)
- ✅ Gestión de clientes y proveedores
- ✅ Recursos humanos
- ✅ Reportes y analytics
- ✅ Respaldos automáticos

### Base de Datos
- ✅ 20+ tablas creadas automáticamente
- ✅ Índices optimizados para rendimiento
- ✅ Configuración inicial completa
- ✅ Usuario y empresa por defecto
- ✅ Módulos del sistema configurados

## 🔒 Seguridad

### Configuración de Producción
- Sesiones seguras con PostgreSQL
- Contraseñas hasheadas con bcrypt
- Middleware de autenticación
- Validación de entrada con Zod
- Auditoría completa de acciones

### Variables Críticas
- `DATABASE_URL` - **OBLIGATORIO** para el funcionamiento
- `NODE_ENV=production` - Activa optimizaciones de producción
- `PORT=5000` - Puerto configurado para Render y similares

## 🚨 Solución de Problemas

### Error: "Cannot find package 'postgres'"
Ejecuta: `npm install postgres`

### Error: "DATABASE_URL not configured"
Verifica que la variable de entorno DATABASE_URL esté configurada correctamente

### Error en construcción
Verifica que todas las dependencias estén instaladas: `npm ci`

### Performance Issues
- Verifica que la base de datos esté en la misma región que tu aplicación
- Considera upgrade del plan de base de datos si tienes muchos usuarios

## 📞 Soporte

Si encuentras problemas durante el deployment:
1. Verifica que todas las variables de entorno estén configuradas
2. Revisa los logs de construcción y deployment
3. Asegúrate de que PostgreSQL esté accesible
4. Verifica que el script de deployment tenga permisos de ejecución

¡Tu sistema ERP estará listo para usar con todas las funcionalidades empresariales!