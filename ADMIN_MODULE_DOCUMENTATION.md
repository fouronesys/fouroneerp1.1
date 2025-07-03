# Four One Solutions - Documentación del Sistema de Gestión de Módulos

## Descripción General

El Sistema de Gestión de Módulos permite a los administradores del sistema controlar qué funcionalidades están disponibles para cada empresa, administrar configuraciones globales del sistema y mantener un control granular sobre las características del software.

## Arquitectura del Sistema

### 1. Tablas de Base de Datos

#### `system_modules`
Almacena la definición de todos los módulos disponibles en el sistema.

**Campos principales:**
- `name`: Identificador único del módulo (ej: "pos_system")
- `displayName`: Nombre para mostrar (ej: "Sistema POS")
- `description`: Descripción del módulo
- `category`: Categoría del módulo (core, pos, accounting, hr, etc.)
- `icon`: Nombre del icono de Lucide React
- `version`: Versión del módulo
- `isCore`: Si es un módulo esencial que no se puede deshabilitar
- `requiresSubscription`: Si requiere suscripción paga
- `subscriptionTiers`: Niveles de suscripción requeridos
- `dependencies`: Módulos de los que depende
- `isActive`: Si el módulo está activo en el sistema
- `sortOrder`: Orden de visualización

#### `company_modules`
Gestiona qué módulos están habilitados para cada empresa.

**Campos principales:**
- `companyId`: ID de la empresa
- `moduleId`: ID del módulo del sistema
- `isEnabled`: Si está habilitado para esta empresa
- `enabledAt`/`enabledBy`: Auditoría de habilitación
- `disabledAt`/`disabledBy`: Auditoría de deshabilitación
- `settings`: Configuraciones específicas del módulo para la empresa

#### `system_config`
Configuraciones globales del sistema.

**Campos principales:**
- `key`: Clave única de configuración
- `value`: Valor de la configuración
- `valueType`: Tipo de dato (string, number, boolean, json)
- `category`: Categoría de la configuración
- `description`: Descripción de la configuración
- `isEditable`: Si puede ser editada por administradores
- `isPublic`: Si puede ser accedida desde el frontend

### 2. Módulos Predefinidos del Sistema

#### Módulos Core (Esenciales)
- **Gestión de Usuarios**: Administración de usuarios y permisos
- **Configuración de Empresa**: Datos fiscales y configuración general
- **Respaldo y Restauración**: Sistema de respaldos automáticos

#### Módulos POS
- **Sistema POS**: Punto de venta con facturación
- **Gestión de Inventario**: Control de stock y productos
- **Aplicación Móvil**: Acceso móvil al sistema

#### Módulos de Contabilidad
- **Módulo de Contabilidad**: Sistema contable completo
- **Reportes y Analytics**: Reportes financieros y análisis
- **Cumplimiento Fiscal DGII**: Herramientas para cumplimiento fiscal

#### Módulos de Recursos Humanos
- **Recursos Humanos**: Gestión de empleados y nómina

#### Módulos de Comunicación
- **Chat Interno**: Sistema de comunicación interna
- **Asistente IA**: Asistente de inteligencia artificial

## API Endpoints

### Gestión de Módulos del Sistema

#### `GET /api/admin/modules`
Obtiene todos los módulos del sistema.

**Autenticación:** Requerida (super_admin)

**Respuesta:**
```json
{
  "modules": [
    {
      "id": 1,
      "name": "pos_system",
      "displayName": "Sistema POS",
      "description": "Punto de venta con facturación",
      "category": "pos",
      "icon": "CreditCard",
      "version": "1.0.0",
      "isCore": false,
      "requiresSubscription": true,
      "subscriptionTiers": ["monthly", "annual"],
      "dependencies": ["user_management"],
      "isActive": true,
      "sortOrder": 10
    }
  ]
}
```

#### `POST /api/admin/modules`
Crea un nuevo módulo del sistema.

**Autenticación:** Requerida (super_admin)

**Cuerpo de la petición:**
```json
{
  "name": "nuevo_modulo",
  "displayName": "Nuevo Módulo",
  "description": "Descripción del módulo",
  "category": "custom",
  "icon": "Settings",
  "version": "1.0.0",
  "isCore": false,
  "requiresSubscription": false,
  "subscriptionTiers": [],
  "dependencies": [],
  "isActive": true,
  "sortOrder": 100
}
```

#### `PUT /api/admin/modules/:id`
Actualiza un módulo existente.

**Autenticación:** Requerida (super_admin)

### Gestión de Módulos por Empresa

#### `GET /api/admin/company/:companyId/modules`
Obtiene los módulos habilitados para una empresa específica.

**Autenticación:** Requerida (super_admin)

#### `POST /api/admin/company/:companyId/modules/:moduleId/enable`
Habilita un módulo para una empresa.

**Autenticación:** Requerida (super_admin)

#### `POST /api/admin/company/:companyId/modules/:moduleId/disable`
Deshabilita un módulo para una empresa.

**Autenticación:** Requerida (super_admin)

### Configuración del Sistema

#### `GET /api/admin/config`
Obtiene configuraciones del sistema.

**Parámetros de consulta:**
- `category`: Filtrar por categoría (opcional)

#### `PUT /api/admin/config/:key`
Actualiza una configuración del sistema.

## Interfaz de Administración

### Componente ModuleManager

El componente `ModuleManager` proporciona una interfaz completa para:

1. **Gestión de Módulos del Sistema:**
   - Visualización de todos los módulos
   - Filtrado por categoría y búsqueda
   - Creación y edición de módulos
   - Gestión de dependencias

2. **Gestión de Permisos por Empresa:**
   - Selección de empresa
   - Habilitación/deshabilitación de módulos
   - Visualización del estado actual

### Características de la Interfaz

- **Diseño Responsivo**: Adaptado para dispositivos móviles y escritorio
- **Filtros Avanzados**: Búsqueda y filtrado por categoría
- **Gestión Visual**: Iconos y badges para identificar tipos de módulos
- **Validación**: Formularios con validación usando Zod
- **Auditoría**: Registro de todas las acciones administrativas

## Configuraciones del Sistema

### Categorías de Configuración

#### General
- `system.name`: Nombre del sistema
- `system.version`: Versión del sistema
- `system.currency`: Moneda por defecto
- `system.timezone`: Zona horaria

#### Suscripción
- `subscription.trial_days`: Días de prueba gratuita
- `subscription.monthly_price`: Precio mensual
- `subscription.annual_price`: Precio anual

#### POS
- `pos.default_tax_rate`: Tasa de impuesto por defecto
- `pos.tip_rate`: Tasa de propina por defecto

#### Fiscal
- `dgii.auto_update`: Actualización automática del registro RNC

#### Seguridad
- `security.session_timeout`: Tiempo de sesión

#### IA
- `ai.enabled`: Funciones de IA habilitadas

#### Respaldos
- `backup.auto_enabled`: Respaldos automáticos
- `backup.frequency_hours`: Frecuencia de respaldo

## Inicialización del Sistema

### Clase ModuleInitializer

La clase `ModuleInitializer` se encarga de:

1. **Inicialización de Módulos**: Crear módulos predefinidos si no existen
2. **Configuración Inicial**: Establecer configuraciones por defecto
3. **Habilitación Automática**: Habilitar módulos esenciales para nuevas empresas

### Métodos Principales

- `initializeSystem()`: Inicialización completa del sistema
- `initializeSystemModules()`: Crear módulos predefinidos
- `initializeSystemConfig()`: Establecer configuraciones por defecto
- `enableDefaultModulesForCompany()`: Habilitar módulos para nueva empresa
- `getCompanyModuleStatus()`: Obtener estado de módulos de una empresa

## Seguridad y Auditoría

### Control de Acceso
- Solo usuarios con rol `super_admin` pueden acceder al sistema de gestión de módulos
- Todas las acciones son registradas en el sistema de auditoría
- Validación de permisos en cada endpoint

### Registro de Auditoría
- Creación/modificación de módulos
- Habilitación/deshabilitación de módulos por empresa
- Cambios en configuración del sistema
- Incluye información de usuario, timestamp y datos modificados

## Extensibilidad

### Agregar Nuevos Módulos

1. **Definir el Módulo**: Crear entrada en `system_modules`
2. **Implementar Funcionalidad**: Desarrollar la lógica del módulo
3. **Configurar Dependencias**: Establecer módulos requeridos
4. **Documentar**: Actualizar esta documentación

### Configuraciones Personalizadas

1. **Agregar Configuración**: Insertar en `system_config`
2. **Implementar Lógica**: Usar la configuración en el código
3. **Interfaz de Usuario**: Agregar controles en el panel de administración

## Mejores Prácticas

### Desarrollo de Módulos
- Seguir convenciones de nomenclatura
- Documentar dependencias claramente
- Implementar verificación de permisos
- Mantener compatibilidad hacia atrás

### Administración
- Revisar dependencias antes de deshabilitar módulos
- Hacer respaldos antes de cambios importantes
- Monitorear el uso de módulos por empresa
- Mantener documentación actualizada

### Seguridad
- Validar todas las entradas
- Registrar acciones administrativas
- Revisar permisos regularmente
- Mantener principio de menor privilegio

## Resolución de Problemas

### Problemas Comunes

1. **Módulo no se puede deshabilitar**
   - Verificar si es módulo core
   - Revisar dependencias de otros módulos

2. **Error de dependencias**
   - Habilitar módulos dependientes primero
   - Verificar orden de inicialización

3. **Configuración no se aplica**
   - Verificar permisos de edición
   - Comprobar tipo de dato correcto
   - Revisar caché del sistema

### Logs y Diagnóstico
- Revisar logs de auditoría para acciones administrativas
- Verificar estado de módulos en base de datos
- Comprobar configuraciones en `system_config`

## Futuras Mejoras

### Funcionalidades Planificadas
- Marketplace de módulos
- Versioning automático
- Instalación dinámica de módulos
- Configuración per-usuario
- API pública para desarrolladores externos

### Optimizaciones
- Caché de configuraciones
- Lazy loading de módulos
- Compresión de dependencias
- Métricas de uso avanzadas