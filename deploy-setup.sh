#!/bin/bash

# Script de configuración para deployment en Replit
echo "🚀 Iniciando configuración de deployment..."

# Verificar que DATABASE_URL esté configurado
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL no está configurado"
    echo "Por favor configura la variable de entorno DATABASE_URL"
    exit 1
fi

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Configurar base de datos
echo "🗄️ Configurando base de datos..."
npm run db:setup

# Construir la aplicación
echo "🔨 Construyendo aplicación..."
npm run build

# Verificar que la construcción fue exitosa
if [ $? -eq 0 ]; then
    echo "✅ Deployment configurado correctamente"
    echo "🎉 Listo para ejecutar con: npm start"
else
    echo "❌ Error durante la construcción"
    exit 1
fi