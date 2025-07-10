#!/bin/bash

# Script de configuración de tablas de tokens para deployment
echo "🔐 Configurando sistema de tokens y autenticación..."

# Verificar que DATABASE_URL esté configurado
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL no está configurado"
    echo "Por favor configura la variable de entorno DATABASE_URL"
    exit 1
fi

# Función para verificar si una tabla existe
check_table_exists() {
    local table_name=$1
    local result=$(psql "$DATABASE_URL" -t -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = '$table_name');" 2>/dev/null)
    
    if [[ "$result" == *"t"* ]]; then
        return 0  # Tabla existe
    else
        return 1  # Tabla no existe
    fi
}

# Verificar conexión a la base de datos
echo "📊 Verificando conexión a la base de datos..."
if ! psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ No se pudo conectar a la base de datos"
    echo "Verificar DATABASE_URL: $DATABASE_URL"
    exit 1
fi

echo "✅ Conexión a la base de datos exitosa"

# Verificar si las tablas ya existen
echo "🔍 Verificando estado actual de las tablas..."

tables=("login_attempts" "session_tokens" "password_reset_tokens" "api_tokens" "refresh_tokens" "invitation_tokens" "email_verification_tokens" "device_tokens")
existing_tables=0

for table in "${tables[@]}"; do
    if check_table_exists "$table"; then
        echo "   ✅ $table - Ya existe"
        ((existing_tables++))
    else
        echo "   ❌ $table - No existe"
    fi
done

# Decidir si crear las tablas
if [ $existing_tables -eq ${#tables[@]} ]; then
    echo "🎉 Todas las tablas de tokens ya están creadas"
    echo "Sistema de tokens listo para usar"
else
    echo "🔨 Creando tablas faltantes..."
    
    # Método 1: Usar el script Node.js si está disponible
    if command -v node >/dev/null 2>&1 && [ -f "scripts/create-token-tables.js" ]; then
        echo "📋 Ejecutando script Node.js..."
        node scripts/create-token-tables.js
        
        if [ $? -eq 0 ]; then
            echo "✅ Tablas creadas exitosamente con Node.js"
        else
            echo "❌ Error ejecutando script Node.js, intentando con SQL directo..."
        fi
    fi
    
    # Método 2: Ejecutar SQL directamente si Node.js falló o no está disponible
    if [ -f "scripts/create-token-tables.sql" ]; then
        echo "📋 Ejecutando SQL directamente..."
        psql "$DATABASE_URL" -f scripts/create-token-tables.sql
        
        if [ $? -eq 0 ]; then
            echo "✅ Tablas creadas exitosamente con SQL directo"
        else
            echo "❌ Error ejecutando SQL directo"
            exit 1
        fi
    else
        echo "❌ No se encontró el archivo SQL"
        exit 1
    fi
fi

# Verificación final
echo "🔍 Verificación final de tablas..."
all_created=true

for table in "${tables[@]}"; do
    if check_table_exists "$table"; then
        echo "   ✅ $table"
    else
        echo "   ❌ $table - FALTA"
        all_created=false
    fi
done

if [ "$all_created" = true ]; then
    echo ""
    echo "🎉 ¡Sistema de tokens configurado exitosamente!"
    echo ""
    echo "📋 Tablas disponibles:"
    for table in "${tables[@]}"; do
        echo "   - $table"
    done
    echo ""
    echo "⚙️ Funciones disponibles:"
    echo "   - cleanup_expired_tokens() - Limpia tokens expirados"
    echo ""
    echo "🔧 Para ejecutar limpieza manual:"
    echo "   psql \"\$DATABASE_URL\" -c \"SELECT cleanup_expired_tokens();\""
else
    echo "❌ Algunas tablas no se pudieron crear"
    exit 1
fi