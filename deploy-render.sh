#!/bin/bash

# Script de deployment optimizado para Render y otras plataformas externas
echo "🚀 Iniciando deployment en plataforma externa..."

# Verificar variables de entorno esenciales
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL no está configurado"
    echo "Por favor configura la variable de entorno DATABASE_URL"
    exit 1
fi

# Mostrar información del entorno
echo "📍 Entorno de deployment:"
echo "   - NODE_ENV: ${NODE_ENV:-development}"
echo "   - Base de datos: PostgreSQL (configurada)"
echo "   - Plataforma: $(uname -s)"

# Instalar dependencias
echo "📦 Instalando dependencias de producción..."
npm ci --only=production

# Configurar base de datos completa
echo "🗄️ Configurando base de datos completa..."
npm run db:setup

if [ $? -ne 0 ]; then
    echo "❌ Error configurando la base de datos"
    exit 1
fi

# Construir la aplicación
echo "🔨 Construyendo aplicación para producción..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Error durante la construcción"
    exit 1
fi

# Verificar que los archivos de construcción existen
if [ ! -d "dist" ]; then
    echo "❌ Error: Directorio dist no encontrado después de la construcción"
    exit 1
fi

echo "✅ Deployment completado exitosamente"
echo "🎉 La aplicación está lista para ejecutar con: npm start"
echo ""
echo "📋 Información del deployment:"
echo "   - Base de datos: Configurada y lista"
echo "   - Archivos: Construidos en ./dist"
echo "   - Puerto: 5000 (configurado automáticamente)"
echo "   - Admin: admin@fourone.com.do (password: Admin123!)"
echo ""
echo "⚠️  IMPORTANTE: Cambia la contraseña del admin después del primer login"