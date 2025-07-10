-- =================================================================
-- Script SQL para crear todas las tablas de tokens y autenticación
-- Para deployment en plataformas externas (Render, Railway, Heroku)
-- =================================================================

-- 1. Tabla de intentos de login (seguridad)
CREATE TABLE IF NOT EXISTS "login_attempts" (
    "id" SERIAL PRIMARY KEY,
    "email" VARCHAR(255) NOT NULL,
    "ip_address" VARCHAR(45) NOT NULL,
    "user_agent" TEXT,
    "success" BOOLEAN NOT NULL,
    "failure_reason" TEXT,
    "attempted_at" TIMESTAMP DEFAULT NOW()
);

-- 2. Tabla de tokens de sesión (autenticación estilo WhatsApp)
CREATE TABLE IF NOT EXISTS "session_tokens" (
    "id" SERIAL PRIMARY KEY,
    "token" VARCHAR(64) UNIQUE NOT NULL,
    "user_id" VARCHAR NOT NULL,
    "session_data" TEXT NOT NULL,
    "expires_at" TIMESTAMP NOT NULL,
    "last_activity" TIMESTAMP DEFAULT NOW(),
    "created_at" TIMESTAMP DEFAULT NOW()
);

-- 3. Tabla de tokens de reseteo de contraseña
CREATE TABLE IF NOT EXISTS "password_reset_tokens" (
    "id" SERIAL PRIMARY KEY,
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "token" VARCHAR(255) UNIQUE NOT NULL,
    "expires_at" TIMESTAMP NOT NULL,
    "is_recovery" BOOLEAN DEFAULT FALSE,
    "created_at" TIMESTAMP DEFAULT NOW()
);

-- 4. Tabla de API tokens para integraciones externas
CREATE TABLE IF NOT EXISTS "api_tokens" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "token" VARCHAR(255) UNIQUE NOT NULL,
    "user_id" VARCHAR NOT NULL,
    "company_id" INTEGER NOT NULL,
    "permissions" TEXT[] DEFAULT '{}',
    "last_used_at" TIMESTAMP,
    "expires_at" TIMESTAMP,
    "is_active" BOOLEAN DEFAULT TRUE,
    "created_at" TIMESTAMP DEFAULT NOW(),
    "updated_at" TIMESTAMP DEFAULT NOW()
);

-- 5. Tabla de refresh tokens para OAuth
CREATE TABLE IF NOT EXISTS "refresh_tokens" (
    "id" SERIAL PRIMARY KEY,
    "token" VARCHAR(255) UNIQUE NOT NULL,
    "user_id" VARCHAR NOT NULL,
    "access_token" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMP NOT NULL,
    "is_revoked" BOOLEAN DEFAULT FALSE,
    "created_at" TIMESTAMP DEFAULT NOW()
);

-- 6. Tabla de tokens de invitación de empresa
CREATE TABLE IF NOT EXISTS "invitation_tokens" (
    "id" SERIAL PRIMARY KEY,
    "token" VARCHAR(255) UNIQUE NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "company_id" INTEGER NOT NULL,
    "role" VARCHAR(50) DEFAULT 'user',
    "invited_by" VARCHAR NOT NULL,
    "expires_at" TIMESTAMP NOT NULL,
    "used_at" TIMESTAMP,
    "is_used" BOOLEAN DEFAULT FALSE,
    "created_at" TIMESTAMP DEFAULT NOW()
);

-- 7. Tabla de verificación de email
CREATE TABLE IF NOT EXISTS "email_verification_tokens" (
    "id" SERIAL PRIMARY KEY,
    "email" VARCHAR(255) NOT NULL,
    "token" VARCHAR(255) UNIQUE NOT NULL,
    "user_id" VARCHAR NOT NULL,
    "expires_at" TIMESTAMP NOT NULL,
    "verified_at" TIMESTAMP,
    "is_verified" BOOLEAN DEFAULT FALSE,
    "created_at" TIMESTAMP DEFAULT NOW()
);

-- 8. Tabla de tokens de dispositivos (notificaciones push)
CREATE TABLE IF NOT EXISTS "device_tokens" (
    "id" SERIAL PRIMARY KEY,
    "user_id" VARCHAR NOT NULL,
    "device_type" VARCHAR(20) NOT NULL,
    "token" TEXT NOT NULL,
    "device_info" JSONB,
    "is_active" BOOLEAN DEFAULT TRUE,
    "last_used_at" TIMESTAMP DEFAULT NOW(),
    "created_at" TIMESTAMP DEFAULT NOW()
);

-- =================================================================
-- ÍNDICES PARA OPTIMIZACIÓN DE PERFORMANCE
-- =================================================================

-- Índices para login_attempts
CREATE INDEX IF NOT EXISTS "idx_login_attempts_email" ON "login_attempts" ("email");
CREATE INDEX IF NOT EXISTS "idx_login_attempts_ip" ON "login_attempts" ("ip_address");
CREATE INDEX IF NOT EXISTS "idx_login_attempts_attempted_at" ON "login_attempts" ("attempted_at");

-- Índices para session_tokens
CREATE INDEX IF NOT EXISTS "idx_session_tokens_token" ON "session_tokens" ("token");
CREATE INDEX IF NOT EXISTS "idx_session_tokens_user_id" ON "session_tokens" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_session_tokens_expires_at" ON "session_tokens" ("expires_at");

-- Índices para password_reset_tokens
CREATE INDEX IF NOT EXISTS "idx_password_reset_tokens_email" ON "password_reset_tokens" ("email");
CREATE INDEX IF NOT EXISTS "idx_password_reset_tokens_token" ON "password_reset_tokens" ("token");
CREATE INDEX IF NOT EXISTS "idx_password_reset_tokens_expires_at" ON "password_reset_tokens" ("expires_at");

-- Índices para api_tokens
CREATE INDEX IF NOT EXISTS "idx_api_tokens_token" ON "api_tokens" ("token");
CREATE INDEX IF NOT EXISTS "idx_api_tokens_user_id" ON "api_tokens" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_api_tokens_company_id" ON "api_tokens" ("company_id");
CREATE INDEX IF NOT EXISTS "idx_api_tokens_is_active" ON "api_tokens" ("is_active");

-- Índices para refresh_tokens
CREATE INDEX IF NOT EXISTS "idx_refresh_tokens_token" ON "refresh_tokens" ("token");
CREATE INDEX IF NOT EXISTS "idx_refresh_tokens_user_id" ON "refresh_tokens" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_refresh_tokens_access_token" ON "refresh_tokens" ("access_token");

-- Índices para invitation_tokens
CREATE INDEX IF NOT EXISTS "idx_invitation_tokens_token" ON "invitation_tokens" ("token");
CREATE INDEX IF NOT EXISTS "idx_invitation_tokens_email" ON "invitation_tokens" ("email");
CREATE INDEX IF NOT EXISTS "idx_invitation_tokens_company_id" ON "invitation_tokens" ("company_id");

-- Índices para email_verification_tokens
CREATE INDEX IF NOT EXISTS "idx_email_verification_tokens_email" ON "email_verification_tokens" ("email");
CREATE INDEX IF NOT EXISTS "idx_email_verification_tokens_token" ON "email_verification_tokens" ("token");
CREATE INDEX IF NOT EXISTS "idx_email_verification_tokens_user_id" ON "email_verification_tokens" ("user_id");

-- Índices para device_tokens
CREATE INDEX IF NOT EXISTS "idx_device_tokens_user_id" ON "device_tokens" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_device_tokens_device_type" ON "device_tokens" ("device_type");
CREATE INDEX IF NOT EXISTS "idx_device_tokens_is_active" ON "device_tokens" ("is_active");

-- =================================================================
-- FUNCIÓN DE LIMPIEZA AUTOMÁTICA DE TOKENS EXPIRADOS
-- =================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
    temp_count INTEGER;
BEGIN
    -- Limpiar session_tokens expirados
    DELETE FROM session_tokens WHERE expires_at < NOW();
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Limpiar password_reset_tokens expirados
    DELETE FROM password_reset_tokens WHERE expires_at < NOW();
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Limpiar api_tokens expirados
    DELETE FROM api_tokens WHERE expires_at < NOW();
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Limpiar refresh_tokens expirados
    DELETE FROM refresh_tokens WHERE expires_at < NOW();
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Limpiar invitation_tokens expirados
    DELETE FROM invitation_tokens WHERE expires_at < NOW();
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Limpiar email_verification_tokens expirados
    DELETE FROM email_verification_tokens WHERE expires_at < NOW();
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Limpiar login_attempts antiguos (más de 30 días)
    DELETE FROM login_attempts WHERE attempted_at < NOW() - INTERVAL '30 days';
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =================================================================
-- TRIGGERS PARA ACTUALIZACIÓN AUTOMÁTICA DE TIMESTAMPS
-- =================================================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para api_tokens
CREATE TRIGGER update_api_tokens_updated_at
    BEFORE UPDATE ON api_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =================================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- =================================================================

COMMENT ON TABLE login_attempts IS 'Registro de intentos de login para seguridad';
COMMENT ON TABLE session_tokens IS 'Tokens de sesión para autenticación persistente';
COMMENT ON TABLE password_reset_tokens IS 'Tokens temporales para reseteo de contraseñas';
COMMENT ON TABLE api_tokens IS 'Tokens de API para integraciones externas';
COMMENT ON TABLE refresh_tokens IS 'Tokens de actualización para OAuth y JWT';
COMMENT ON TABLE invitation_tokens IS 'Tokens de invitación para registro empresarial';
COMMENT ON TABLE email_verification_tokens IS 'Tokens para verificación de email';
COMMENT ON TABLE device_tokens IS 'Tokens de dispositivos para notificaciones push';

-- =================================================================
-- INSTRUCCIONES DE USO
-- =================================================================

-- Para ejecutar este script:
-- psql $DATABASE_URL -f create-token-tables.sql

-- Para limpiar tokens expirados manualmente:
-- SELECT cleanup_expired_tokens();

-- Para programar limpieza automática (ejemplo con cron):
-- 0 2 * * * psql $DATABASE_URL -c "SELECT cleanup_expired_tokens();"