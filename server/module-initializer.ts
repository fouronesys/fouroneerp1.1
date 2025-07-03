import { storage } from "./storage";
import { auditLogger } from "./audit-logger";

// Default system modules for Four One Solutions
const DEFAULT_MODULES = [
  {
    name: "user_management",
    displayName: "Gestión de Usuarios",
    description: "Administración de usuarios y permisos del sistema",
    category: "core",
    icon: "Users",
    version: "1.0.0",
    isCore: true,
    requiresSubscription: false,
    subscriptionTiers: [],
    dependencies: [],
    isActive: true,
    sortOrder: 1
  },
  {
    name: "company_settings",
    displayName: "Configuración de Empresa",
    description: "Configuración general de la empresa y datos fiscales",
    category: "core",
    icon: "Building",
    version: "1.0.0",
    isCore: true,
    requiresSubscription: false,
    subscriptionTiers: [],
    dependencies: [],
    isActive: true,
    sortOrder: 2
  },
  {
    name: "pos_system",
    displayName: "Sistema POS",
    description: "Punto de venta con facturación y manejo de inventario",
    category: "pos",
    icon: "CreditCard",
    version: "1.0.0",
    isCore: false,
    requiresSubscription: true,
    subscriptionTiers: ["monthly", "annual"],
    dependencies: ["user_management", "company_settings"],
    isActive: true,
    sortOrder: 10
  },
  {
    name: "inventory_management",
    displayName: "Gestión de Inventario",
    description: "Control de stock, productos y movimientos de inventario",
    category: "inventory",
    icon: "Package",
    version: "1.0.0",
    isCore: false,
    requiresSubscription: true,
    subscriptionTiers: ["monthly", "annual"],
    dependencies: ["user_management", "company_settings"],
    isActive: true,
    sortOrder: 11
  },
  {
    name: "accounting_module",
    displayName: "Módulo de Contabilidad",
    description: "Contabilidad completa con plan de cuentas y reportes fiscales",
    category: "accounting",
    icon: "BarChart3",
    version: "1.0.0",
    isCore: false,
    requiresSubscription: true,
    subscriptionTiers: ["monthly", "annual"],
    dependencies: ["user_management", "company_settings", "pos_system"],
    isActive: true,
    sortOrder: 20
  },
  {
    name: "reports_module",
    displayName: "Reportes y Analytics",
    description: "Reportes financieros, de ventas y análisis de negocio",
    category: "reports",
    icon: "FileText",
    version: "1.0.0",
    isCore: false,
    requiresSubscription: true,
    subscriptionTiers: ["monthly", "annual"],
    dependencies: ["accounting_module", "pos_system"],
    isActive: true,
    sortOrder: 21
  },
  {
    name: "hr_module",
    displayName: "Recursos Humanos",
    description: "Gestión de empleados, nómina y control de tiempo",
    category: "hr",
    icon: "Users",
    version: "1.0.0",
    isCore: false,
    requiresSubscription: true,
    subscriptionTiers: ["monthly", "annual"],
    dependencies: ["user_management", "company_settings"],
    isActive: true,
    sortOrder: 30
  },
  {
    name: "internal_chat",
    displayName: "Chat Interno",
    description: "Sistema de comunicación interna para equipos",
    category: "communication",
    icon: "MessageSquare",
    version: "1.0.0",
    isCore: false,
    requiresSubscription: false,
    subscriptionTiers: [],
    dependencies: ["user_management"],
    isActive: true,
    sortOrder: 40
  },
  {
    name: "ai_assistant",
    displayName: "Asistente IA",
    description: "Asistente de inteligencia artificial para soporte y automatización",
    category: "communication",
    icon: "Settings",
    version: "1.0.0",
    isCore: false,
    requiresSubscription: true,
    subscriptionTiers: ["monthly", "annual"],
    dependencies: ["user_management"],
    isActive: true,
    sortOrder: 41
  },
  {
    name: "fiscal_compliance",
    displayName: "Cumplimiento Fiscal DGII",
    description: "Herramientas para cumplimiento fiscal República Dominicana (DGII)",
    category: "accounting",
    icon: "Shield",
    version: "1.0.0",
    isCore: false,
    requiresSubscription: true,
    subscriptionTiers: ["monthly", "annual"],
    dependencies: ["accounting_module", "pos_system"],
    isActive: true,
    sortOrder: 22
  },
  {
    name: "mobile_app",
    displayName: "Aplicación Móvil",
    description: "Acceso móvil al sistema POS y funciones básicas",
    category: "pos",
    icon: "Wrench",
    version: "1.0.0",
    isCore: false,
    requiresSubscription: true,
    subscriptionTiers: ["monthly", "annual"],
    dependencies: ["pos_system"],
    isActive: true,
    sortOrder: 12
  },
  {
    name: "backup_restore",
    displayName: "Respaldo y Restauración",
    description: "Sistema de respaldos automáticos y restauración de datos",
    category: "core",
    icon: "Database",
    version: "1.0.0",
    isCore: false,
    requiresSubscription: true,
    subscriptionTiers: ["monthly", "annual"],
    dependencies: ["user_management"],
    isActive: true,
    sortOrder: 3
  }
];

// Default system configuration
const DEFAULT_SYSTEM_CONFIG = [
  {
    key: "system.name",
    value: "Four One Solutions",
    valueType: "string",
    category: "general",
    description: "Nombre del sistema",
    isEditable: false,
    isPublic: true
  },
  {
    key: "system.version",
    value: "1.0.0",
    valueType: "string",
    category: "general",
    description: "Versión del sistema",
    isEditable: false,
    isPublic: true
  },
  {
    key: "system.currency",
    value: "DOP",
    valueType: "string",
    category: "general",
    description: "Moneda por defecto del sistema",
    isEditable: true,
    isPublic: true
  },
  {
    key: "system.timezone",
    value: "America/Santo_Domingo",
    valueType: "string",
    category: "general",
    description: "Zona horaria por defecto",
    isEditable: true,
    isPublic: true
  },

  {
    key: "subscription.monthly_price",
    value: "3500",
    valueType: "number",
    category: "subscription",
    description: "Precio mensual en DOP",
    isEditable: true,
    isPublic: true
  },
  {
    key: "subscription.annual_price",
    value: "24000",
    valueType: "number",
    category: "subscription",
    description: "Precio anual en DOP",
    isEditable: true,
    isPublic: true
  },
  {
    key: "dgii.auto_update",
    value: "false",
    valueType: "boolean",
    category: "fiscal",
    description: "Actualización automática del registro RNC de DGII",
    isEditable: true,
    isPublic: false
  },
  {
    key: "security.session_timeout",
    value: "3600",
    valueType: "number",
    category: "security",
    description: "Tiempo de sesión en segundos",
    isEditable: true,
    isPublic: false
  },
  {
    key: "pos.default_tax_rate",
    value: "0.18",
    valueType: "number",
    category: "pos",
    description: "Tasa de impuesto por defecto (ITBIS 18%)",
    isEditable: true,
    isPublic: false
  },
  {
    key: "pos.tip_rate",
    value: "0.10",
    valueType: "number",
    category: "pos",
    description: "Tasa de propina por defecto (10%)",
    isEditable: true,
    isPublic: false
  },
  {
    key: "ai.enabled",
    value: "true",
    valueType: "boolean",
    category: "ai",
    description: "Habilitar funciones de IA",
    isEditable: true,
    isPublic: false
  },
  {
    key: "backup.auto_enabled",
    value: "true",
    valueType: "boolean",
    category: "backup",
    description: "Respaldos automáticos habilitados",
    isEditable: true,
    isPublic: false
  },
  {
    key: "backup.frequency_hours",
    value: "24",
    valueType: "number",
    category: "backup",
    description: "Frecuencia de respaldo en horas",
    isEditable: true,
    isPublic: false
  }
];

export class ModuleInitializer {
  private static instance: ModuleInitializer;

  public static getInstance(): ModuleInitializer {
    if (!ModuleInitializer.instance) {
      ModuleInitializer.instance = new ModuleInitializer();
    }
    return ModuleInitializer.instance;
  }

  /**
   * Initialize default system modules if they don't exist
   */
  async initializeSystemModules(): Promise<void> {
    console.log("Initializing system modules...");
    
    try {
      const existingModules = await storage.getSystemModules();
      
      if (existingModules.length === 0) {
        console.log("No modules found. Creating default modules...");
        
        for (const moduleData of DEFAULT_MODULES) {
          try {
            await storage.createSystemModule(moduleData);
            console.log(`Created module: ${moduleData.displayName}`);
          } catch (error) {
            console.error(`Error creating module ${moduleData.name}:`, error);
          }
        }
        
        console.log(`Successfully created ${DEFAULT_MODULES.length} default modules`);
      } else {
        console.log(`Found ${existingModules.length} existing modules. Skipping initialization.`);
      }
    } catch (error) {
      console.error("Error initializing system modules:", error);
    }
  }

  /**
   * Initialize default system configuration
   */
  async initializeSystemConfig(): Promise<void> {
    console.log("Initializing system configuration...");
    
    try {
      for (const configData of DEFAULT_SYSTEM_CONFIG) {
        try {
          await storage.upsertSystemConfig(configData);
          console.log(`Upserted config: ${configData.key}`);
        } catch (error) {
          console.error(`Error upserting config ${configData.key}:`, error);
        }
      }
      
      console.log(`Successfully initialized ${DEFAULT_SYSTEM_CONFIG.length} system configurations`);
    } catch (error) {
      console.error("Error initializing system configuration:", error);
    }
  }

  /**
   * Enable default modules for a new company
   */
  async enableDefaultModulesForCompany(companyId: number, enabledBy: string): Promise<void> {
    console.log(`Enabling default modules for company ${companyId}...`);
    
    try {
      const systemModules = await storage.getSystemModules();
      
      for (const module of systemModules) {
        // Enable core modules and basic modules for all companies
        const shouldEnable = module.isCore || 
                           module.name === "internal_chat" || 
                           module.name === "pos_system" ||
                           module.name === "inventory_management";
        
        if (shouldEnable) {
          try {
            await storage.enableCompanyModule(companyId, module.id, enabledBy);
            console.log(`Enabled module ${module.displayName} for company ${companyId}`);
          } catch (error) {
            console.error(`Error enabling module ${module.name} for company ${companyId}:`, error);
          }
        }
      }
      
      // Log the company module initialization
      await auditLogger.logUserAction(
        enabledBy || "system",
        companyId,
        "initialize_company_modules",
        "company_modules",
        companyId.toString(),
        undefined,
        { companyId, action: "enable_default_modules" }
      );
      
      console.log(`Successfully enabled default modules for company ${companyId}`);
    } catch (error) {
      console.error(`Error enabling default modules for company ${companyId}:`, error);
    }
  }

  /**
   * Full system initialization
   */
  async initializeSystem(): Promise<void> {
    console.log("Starting full system initialization...");
    
    await this.initializeSystemModules();
    await this.initializeSystemConfig();
    
    console.log("System initialization completed successfully");
  }

  /**
   * Get module status for a specific company
   */
  async getCompanyModuleStatus(companyId: number): Promise<any> {
    try {
      const companyModules = await storage.getCompanyModules(companyId);
      const systemModules = await storage.getSystemModules();
      
      const moduleStatus = systemModules.map(systemModule => {
        const companyModule = companyModules.find(cm => cm.moduleId === systemModule.id);
        
        return {
          ...systemModule,
          isEnabled: companyModule?.isEnabled || false,
          enabledAt: companyModule?.enabledAt,
          enabledBy: companyModule?.enabledBy,
          settings: companyModule?.settings || {}
        };
      });
      
      return {
        companyId,
        totalModules: systemModules.length,
        enabledModules: moduleStatus.filter(m => m.isEnabled).length,
        coreModules: moduleStatus.filter(m => m.isCore).length,
        subscriptionModules: moduleStatus.filter(m => m.requiresSubscription).length,
        modules: moduleStatus
      };
    } catch (error) {
      console.error(`Error getting module status for company ${companyId}:`, error);
      throw error;
    }
  }
}

export const moduleInitializer = ModuleInitializer.getInstance();