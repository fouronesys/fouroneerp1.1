import { db } from "./db";
import { sql } from "drizzle-orm";

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  uptime: number;
  checks: {
    database: {
      status: 'healthy' | 'unhealthy';
      responseTime: number;
      error?: string;
    };
    memory: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      usage: number;
      limit: number;
    };
    disk: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      usage: number;
    };
  };
}

export class HealthChecker {
  async performHealthCheck(): Promise<HealthStatus> {
    const startTime = Date.now();
    
    const health: HealthStatus = {
      status: 'healthy',
      timestamp: new Date(),
      uptime: process.uptime(),
      checks: {
        database: { status: 'unhealthy', responseTime: 0 },
        memory: { status: 'healthy', usage: 0, limit: 0 },
        disk: { status: 'healthy', usage: 0 }
      }
    };

    // Database health check
    try {
      const dbStart = Date.now();
      await db.execute(sql`SELECT 1`);
      health.checks.database = {
        status: 'healthy',
        responseTime: Date.now() - dbStart
      };
    } catch (error) {
      health.checks.database = {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown database error'
      };
      health.status = 'unhealthy';
    }

    // Memory health check
    const memUsage = process.memoryUsage();
    const memUsageMB = memUsage.heapUsed / 1024 / 1024;
    const memLimitMB = memUsage.heapTotal / 1024 / 1024;
    
    health.checks.memory = {
      status: memUsageMB > memLimitMB * 0.9 ? 'unhealthy' : 
              memUsageMB > memLimitMB * 0.7 ? 'degraded' : 'healthy',
      usage: memUsageMB,
      limit: memLimitMB
    };

    // Disk usage (simplified)
    health.checks.disk = {
      status: 'healthy',
      usage: 0
    };

    // Overall status determination
    if (health.checks.database.status === 'unhealthy') {
      health.status = 'unhealthy';
    } else if (health.checks.memory.status === 'degraded') {
      health.status = 'degraded';
    }

    return health;
  }
}

export const healthChecker = new HealthChecker();