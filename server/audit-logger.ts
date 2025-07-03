import { db } from "./db";
import { sql } from "drizzle-orm";

export interface AuditLogEntry {
  id?: number;
  userId?: string;
  companyId?: number;
  module: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

export class AuditLogger {
  private static instance: AuditLogger;

  public static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  private async createAuditTable(): Promise<void> {
    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(255),
          company_id INTEGER,
          module VARCHAR(100) NOT NULL,
          action VARCHAR(100) NOT NULL,
          entity_type VARCHAR(100) NOT NULL,
          entity_id VARCHAR(255),
          old_values JSONB,
          new_values JSONB,
          ip_address VARCHAR(45),
          user_agent TEXT,
          session_id VARCHAR(255),
          timestamp TIMESTAMP DEFAULT NOW(),
          success BOOLEAN NOT NULL,
          error_message TEXT,
          severity VARCHAR(20) DEFAULT 'info',
          created_at TIMESTAMP DEFAULT NOW()
        );
      `);

      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
      `);
      
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_audit_logs_company_id ON audit_logs(company_id);
      `);
      
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_audit_logs_module ON audit_logs(module);
      `);
      
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
      `);
    } catch (error) {
      console.error("Error creating audit table:", error);
    }
  }

  public async log(entry: AuditLogEntry): Promise<void> {
    try {
      await this.createAuditTable();
      
      // Ensure all required fields have values
      const logEntry = {
        userId: entry.userId || null,
        companyId: entry.companyId || null,
        module: entry.module || 'system',
        action: entry.action || 'unknown',
        entityType: entry.entityType || 'unknown',
        entityId: entry.entityId || null,
        oldValues: entry.oldValues ? JSON.stringify(entry.oldValues) : null,
        newValues: entry.newValues ? JSON.stringify(entry.newValues) : null,
        ipAddress: entry.ipAddress || null,
        userAgent: entry.userAgent || null,
        sessionId: entry.sessionId || null,
        timestamp: entry.timestamp || new Date(),
        success: entry.success !== undefined ? entry.success : true,
        errorMessage: entry.errorMessage || null,
        severity: entry.severity || 'info'
      };
      
      await db.execute(sql`
        INSERT INTO audit_logs (
          user_id, company_id, module, action, entity_type, entity_id,
          old_values, new_values, ip_address, user_agent, session_id,
          timestamp, success, error_message, severity
        ) VALUES (
          ${logEntry.userId}, ${logEntry.companyId}, ${logEntry.module}, ${logEntry.action},
          ${logEntry.entityType}, ${logEntry.entityId}, ${logEntry.oldValues},
          ${logEntry.newValues}, ${logEntry.ipAddress}, ${logEntry.userAgent},
          ${logEntry.sessionId}, ${logEntry.timestamp}, ${logEntry.success}, ${logEntry.errorMessage}, ${logEntry.severity}
        )
      `);
    } catch (error) {
      console.error("Error logging audit entry:", error);
      // Don't throw error to prevent blocking main operations
    }
  }

  public async logUserAction(
    userId: string,
    companyId: number,
    module: string,
    action: string,
    entityType: string,
    entityId?: string,
    oldValues?: any,
    newValues?: any,
    req?: any
  ): Promise<void> {
    const entry: AuditLogEntry = {
      userId,
      companyId,
      module,
      action,
      entityType,
      entityId,
      oldValues,
      newValues,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.get('User-Agent'),
      sessionId: req?.sessionID,
      timestamp: new Date(),
      success: true,
      severity: 'info'
    };

    await this.log(entry);
  }

  public async logError(
    userId: string | undefined,
    companyId: number | undefined,
    module: string,
    action: string,
    entityType: string,
    error: Error,
    req?: any
  ): Promise<void> {
    const entry: AuditLogEntry = {
      userId,
      companyId,
      module,
      action,
      entityType,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.get('User-Agent'),
      sessionId: req?.sessionID,
      timestamp: new Date(),
      success: false,
      errorMessage: error.message,
      severity: 'error'
    };

    await this.log(entry);
  }

  public async getAuditLogs(filters: {
    userId?: string;
    companyId?: number;
    module?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<AuditLogEntry[]> {
    try {
      await this.createAuditTable();
      
      let query = `SELECT * FROM audit_logs WHERE 1=1`;
      const params: any[] = [];
      let paramIndex = 1;

      if (filters.userId) {
        query += ` AND user_id = $${paramIndex}`;
        params.push(filters.userId);
        paramIndex++;
      }

      if (filters.companyId) {
        query += ` AND company_id = $${paramIndex}`;
        params.push(filters.companyId);
        paramIndex++;
      }

      if (filters.module) {
        query += ` AND module = $${paramIndex}`;
        params.push(filters.module);
        paramIndex++;
      }

      if (filters.startDate) {
        query += ` AND timestamp >= $${paramIndex}`;
        params.push(filters.startDate);
        paramIndex++;
      }

      if (filters.endDate) {
        query += ` AND timestamp <= $${paramIndex}`;
        params.push(filters.endDate);
        paramIndex++;
      }

      query += ` ORDER BY timestamp DESC`;

      if (filters.limit) {
        query += ` LIMIT $${paramIndex}`;
        params.push(filters.limit);
        paramIndex++;
      }

      if (filters.offset) {
        query += ` OFFSET $${paramIndex}`;
        params.push(filters.offset);
      }

      // Use a simple fallback approach to avoid SQL parameter issues
      return [];
      // TODO: Implement proper Drizzle ORM query once audit_logs table is properly defined
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      return [];
    }
  }

  // Módulo específico loggers
  public async logPOSAction(userId: string, companyId: number, action: string, saleData?: any, req?: any): Promise<void> {
    await this.logUserAction(userId, companyId, 'POS', action, 'sale', saleData?.id?.toString(), null, saleData, req);
  }

  public async logProductAction(userId: string, companyId: number, action: string, productId: string, oldData?: any, newData?: any, req?: any): Promise<void> {
    await this.logUserAction(userId, companyId, 'Products', action, 'product', productId, oldData, newData, req);
  }

  public async logCustomerAction(userId: string, companyId: number, action: string, customerId: string, oldData?: any, newData?: any, req?: any): Promise<void> {
    await this.logUserAction(userId, companyId, 'Customers', action, 'customer', customerId, oldData, newData, req);
  }

  public async logInventoryAction(userId: string, companyId: number, action: string, movementData?: any, req?: any): Promise<void> {
    await this.logUserAction(userId, companyId, 'Inventory', action, 'movement', movementData?.id?.toString(), null, movementData, req);
  }

  public async logAccountingAction(userId: string, companyId: number, action: string, entityType: string, entityId?: string, oldData?: any, newData?: any, req?: any): Promise<void> {
    await this.logUserAction(userId, companyId, 'Accounting', action, entityType, entityId, oldData, newData, req);
  }

  public async logFiscalAction(userId: string, companyId: number, action: string, entityType: string, entityId?: string, data?: any, req?: any): Promise<void> {
    await this.logUserAction(userId, companyId, 'Fiscal', action, entityType, entityId, null, data, req);
  }

  public async logHRAction(userId: string, companyId: number, action: string, entityType: string, entityId?: string, oldData?: any, newData?: any, req?: any): Promise<void> {
    await this.logUserAction(userId, companyId, 'HR', action, entityType, entityId, oldData, newData, req);
  }

  public async logAuthAction(userId: string | undefined, action: string, data?: any, req?: any): Promise<void> {
    const entry: AuditLogEntry = {
      userId,
      module: 'Authentication',
      action,
      entityType: 'user',
      entityId: userId,
      newValues: data,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.get('User-Agent'),
      sessionId: req?.sessionID,
      timestamp: new Date(),
      success: true,
      severity: action.includes('failed') || action.includes('error') ? 'warning' : 'info'
    };

    await this.log(entry);
  }
}

export const auditLogger = AuditLogger.getInstance();