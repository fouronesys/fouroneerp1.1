import { randomBytes } from 'crypto';
import { db } from './db';
import { eq, and, lt } from 'drizzle-orm';
import { sessionTokens } from '../shared/schema';

export interface SessionData {
  userId: string;
  companyId?: number;
  role: string;
  email: string;
  isAuthenticated: boolean;
  expiresAt: Date;
  lastActivity: Date;
}

export interface TokenInfo {
  token: string;
  expiresAt: Date;
  sessionData: SessionData;
}

export class SessionManager {
  private static instance: SessionManager;
  private readonly TOKEN_LIFETIME = 7 * 24 * 60 * 60 * 1000; // 7 días como WhatsApp
  private readonly ACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutos de inactividad
  private readonly CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hora

  constructor() {
    // Limpiar tokens expirados cada hora
    setInterval(() => {
      this.cleanupExpiredTokens();
    }, this.CLEANUP_INTERVAL);
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  /**
   * Crear un nuevo token de sesión
   */
  public async createSession(userData: {
    userId: string;
    companyId?: number;
    role: string;
    email: string;
  }): Promise<TokenInfo> {
    const token = this.generateSecureToken();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.TOKEN_LIFETIME);

    const sessionData: SessionData = {
      ...userData,
      isAuthenticated: true,
      expiresAt,
      lastActivity: now
    };

    // Guardar en base de datos
    await db.insert(sessionTokens).values({
      token,
      userId: userData.userId,
      sessionData: JSON.stringify(sessionData),
      expiresAt,
      lastActivity: now,
      createdAt: now
    });

    return {
      token,
      expiresAt,
      sessionData
    };
  }

  /**
   * Validar y renovar token de sesión
   */
  public async validateAndRenewSession(token: string): Promise<SessionData | null> {
    if (!token) return null;

    try {
      const sessionRecord = await db
        .select()
        .from(sessionTokens)
        .where(eq(sessionTokens.token, token))
        .limit(1);

      if (!sessionRecord || sessionRecord.length === 0) {
        return null;
      }

      const session = sessionRecord[0];
      const now = new Date();

      // Verificar si el token ha expirado
      if (session.expiresAt < now) {
        await this.revokeSession(token);
        return null;
      }

      const sessionData: SessionData = JSON.parse(session.sessionData);

      // Verificar inactividad
      if (now.getTime() - session.lastActivity.getTime() > this.ACTIVITY_TIMEOUT) {
        await this.revokeSession(token);
        return null;
      }

      // Renovar actividad
      await db
        .update(sessionTokens)
        .set({ 
          lastActivity: now,
          sessionData: JSON.stringify({
            ...sessionData,
            lastActivity: now
          })
        })
        .where(eq(sessionTokens.token, token));

      return {
        ...sessionData,
        lastActivity: now
      };
    } catch (error) {
      console.error('Error validating session:', error);
      return null;
    }
  }

  /**
   * Revocar sesión específica
   */
  public async revokeSession(token: string): Promise<void> {
    try {
      await db
        .delete(sessionTokens)
        .where(eq(sessionTokens.token, token));
    } catch (error) {
      console.error('Error revoking session:', error);
    }
  }

  /**
   * Revocar todas las sesiones de un usuario
   */
  public async revokeAllUserSessions(userId: string): Promise<void> {
    try {
      await db
        .delete(sessionTokens)
        .where(eq(sessionTokens.userId, userId));
    } catch (error) {
      console.error('Error revoking user sessions:', error);
    }
  }

  /**
   * Extender sesión (como cuando WhatsApp pregunta si quieres seguir conectado)
   */
  public async extendSession(token: string): Promise<boolean> {
    try {
      const now = new Date();
      const newExpiresAt = new Date(now.getTime() + this.TOKEN_LIFETIME);

      const result = await db
        .update(sessionTokens)
        .set({ 
          expiresAt: newExpiresAt,
          lastActivity: now
        })
        .where(eq(sessionTokens.token, token));

      return true;
    } catch (error) {
      console.error('Error extending session:', error);
      return false;
    }
  }

  /**
   * Obtener sesiones activas de un usuario
   */
  public async getUserActiveSessions(userId: string): Promise<any[]> {
    try {
      const now = new Date();
      const sessions = await db
        .select()
        .from(sessionTokens)
        .where(
          and(
            eq(sessionTokens.userId, userId),
            lt(now, sessionTokens.expiresAt)
          )
        );

      return sessions.map(session => ({
        token: session.token.substring(0, 8) + '...', // Solo mostrar inicio del token
        createdAt: session.createdAt,
        lastActivity: session.lastActivity,
        expiresAt: session.expiresAt
      }));
    } catch (error) {
      console.error('Error getting user sessions:', error);
      return [];
    }
  }

  /**
   * Limpiar tokens expirados
   */
  public async cleanupExpiredTokens(): Promise<number> {
    try {
      const now = new Date();
      const result = await db
        .delete(sessionTokens)
        .where(lt(sessionTokens.expiresAt, now));

      console.log(`[SessionManager] Cleaned up expired tokens`);
      return 0; // Drizzle no retorna count en delete
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error);
      return 0;
    }
  }

  /**
   * Generar token seguro
   */
  private generateSecureToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Obtener estadísticas de sesiones
   */
  public async getSessionStats(): Promise<{
    totalActiveSessions: number;
    sessionsLast24h: number;
    averageSessionDuration: number;
  }> {
    try {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const allSessions = await db
        .select()
        .from(sessionTokens)
        .where(lt(now, sessionTokens.expiresAt));

      const recentSessions = await db
        .select()
        .from(sessionTokens)
        .where(
          and(
            lt(yesterday, sessionTokens.createdAt),
            lt(now, sessionTokens.expiresAt)
          )
        );

      return {
        totalActiveSessions: allSessions.length,
        sessionsLast24h: recentSessions.length,
        averageSessionDuration: this.calculateAverageSessionDuration(allSessions)
      };
    } catch (error) {
      console.error('Error getting session stats:', error);
      return {
        totalActiveSessions: 0,
        sessionsLast24h: 0,
        averageSessionDuration: 0
      };
    }
  }

  private calculateAverageSessionDuration(sessions: any[]): number {
    if (sessions.length === 0) return 0;

    const totalDuration = sessions.reduce((sum, session) => {
      const duration = session.lastActivity.getTime() - session.createdAt.getTime();
      return sum + duration;
    }, 0);

    return Math.round(totalDuration / sessions.length / 1000 / 60); // en minutos
  }
}

export const sessionManager = SessionManager.getInstance();