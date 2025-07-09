import bcrypt from 'bcrypt';
import { db } from './db';
import { users, companies, companyUsers, loginAttempts } from '../shared/schema';
import { eq, and, desc, gte } from 'drizzle-orm';
import { sessionManager, SessionData } from './session-manager';

export interface LoginResult {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
    companyId?: number;
    companyName?: string;
  };
  message?: string;
  expiresAt?: Date;
}

export interface LoginAttemptResult {
  canProceed: boolean;
  attemptsRemaining?: number;
  lockoutEndsAt?: Date;
  message?: string;
}

export class AuthService {
  private static readonly MAX_LOGIN_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutos
  private static readonly SALT_ROUNDS = 12;

  /**
   * Verificar si el usuario puede intentar hacer login
   */
  public static async checkLoginAttempts(email: string, ipAddress: string): Promise<LoginAttemptResult> {
    try {
      const cutoffTime = new Date(Date.now() - this.LOCKOUT_DURATION);
      
      const recentAttempts = await db
        .select()
        .from(loginAttempts)
        .where(
          and(
            eq(loginAttempts.email, email),
            gte(loginAttempts.attemptedAt, cutoffTime)
          )
        )
        .orderBy(desc(loginAttempts.attemptedAt));

      const failedAttempts = recentAttempts.filter(attempt => !attempt.success);
      
      if (failedAttempts.length >= this.MAX_LOGIN_ATTEMPTS) {
        const lastFailedAttempt = failedAttempts[0];
        const lockoutEndsAt = new Date(lastFailedAttempt.attemptedAt.getTime() + this.LOCKOUT_DURATION);
        
        if (new Date() < lockoutEndsAt) {
          return {
            canProceed: false,
            lockoutEndsAt,
            message: `Cuenta bloqueada temporalmente. Intente nuevamente después de ${Math.ceil((lockoutEndsAt.getTime() - Date.now()) / 60000)} minutos.`
          };
        }
      }

      const attemptsRemaining = Math.max(0, this.MAX_LOGIN_ATTEMPTS - failedAttempts.length);
      
      return {
        canProceed: true,
        attemptsRemaining
      };
    } catch (error) {
      console.error('Error checking login attempts:', error);
      return { canProceed: true };
    }
  }

  /**
   * Registrar intento de login
   */
  public static async recordLoginAttempt(
    email: string, 
    ipAddress: string, 
    userAgent: string, 
    success: boolean, 
    failureReason?: string
  ): Promise<void> {
    try {
      await db.insert(loginAttempts).values({
        email,
        ipAddress,
        userAgent,
        success,
        failureReason,
        attemptedAt: new Date()
      });
    } catch (error) {
      console.error('Error recording login attempt:', error);
    }
  }

  /**
   * Hacer login con email y contraseña
   */
  public static async login(
    email: string, 
    password: string, 
    ipAddress: string, 
    userAgent: string
  ): Promise<LoginResult> {
    try {
      // Verificar intentos de login
      const attemptCheck = await this.checkLoginAttempts(email, ipAddress);
      if (!attemptCheck.canProceed) {
        await this.recordLoginAttempt(email, ipAddress, userAgent, false, 'Account locked');
        return {
          success: false,
          message: attemptCheck.message
        };
      }

      // Buscar usuario
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!userResult || userResult.length === 0) {
        await this.recordLoginAttempt(email, ipAddress, userAgent, false, 'User not found');
        return {
          success: false,
          message: `Email no encontrado. ${attemptCheck.attemptsRemaining ? `${attemptCheck.attemptsRemaining} intentos restantes.` : ''}`
        };
      }

      const user = userResult[0];

      // Verificar contraseña
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        await this.recordLoginAttempt(email, ipAddress, userAgent, false, 'Invalid password');
        return {
          success: false,
          message: `Contraseña incorrecta. ${attemptCheck.attemptsRemaining ? `${attemptCheck.attemptsRemaining - 1} intentos restantes.` : ''}`
        };
      }

      // Verificar si el usuario está activo
      if (!user.isActive) {
        await this.recordLoginAttempt(email, ipAddress, userAgent, false, 'Account inactive');
        return {
          success: false,
          message: 'Cuenta desactivada. Contacte al administrador.'
        };
      }

      // Obtener información de la empresa (si aplica)
      let companyId: number | undefined;
      let companyName: string | undefined;

      if (user.role !== 'super_admin') {
        const companyUserResult = await db
          .select({
            companyId: companyUsers.companyId,
            companyName: companies.name
          })
          .from(companyUsers)
          .innerJoin(companies, eq(companies.id, companyUsers.companyId))
          .where(
            and(
              eq(companyUsers.userId, user.id),
              eq(companyUsers.isActive, true)
            )
          )
          .limit(1);

        if (companyUserResult && companyUserResult.length > 0) {
          companyId = companyUserResult[0].companyId;
          companyName = companyUserResult[0].companyName;
        }
      }

      // Crear sesión
      const sessionInfo = await sessionManager.createSession({
        userId: user.id,
        companyId,
        role: user.role,
        email: user.email
      });

      // Actualizar última actividad del usuario
      await db
        .update(users)
        .set({
          lastLoginAt: new Date(),
          isOnline: true,
          lastSeen: new Date()
        })
        .where(eq(users.id, user.id));

      // Registrar login exitoso
      await this.recordLoginAttempt(email, ipAddress, userAgent, true);

      return {
        success: true,
        token: sessionInfo.token,
        expiresAt: sessionInfo.expiresAt,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName || undefined,
          lastName: user.lastName || undefined,
          role: user.role,
          companyId,
          companyName
        }
      };

    } catch (error) {
      console.error('Login error:', error);
      await this.recordLoginAttempt(email, ipAddress, userAgent, false, 'System error');
      return {
        success: false,
        message: 'Error del sistema. Intente nuevamente.'
      };
    }
  }

  /**
   * Cerrar sesión
   */
  public static async logout(token: string): Promise<boolean> {
    try {
      await sessionManager.revokeSession(token);
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }

  /**
   * Cerrar todas las sesiones de un usuario
   */
  public static async logoutAllSessions(userId: string): Promise<boolean> {
    try {
      await sessionManager.revokeAllUserSessions(userId);
      
      // Marcar usuario como offline
      await db
        .update(users)
        .set({
          isOnline: false,
          lastSeen: new Date()
        })
        .where(eq(users.id, userId));

      return true;
    } catch (error) {
      console.error('Logout all sessions error:', error);
      return false;
    }
  }

  /**
   * Cambiar contraseña
   */
  public static async changePassword(
    userId: string, 
    currentPassword: string, 
    newPassword: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Buscar usuario
      const userResult = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!userResult || userResult.length === 0) {
        return {
          success: false,
          message: 'Usuario no encontrado'
        };
      }

      const user = userResult[0];

      // Verificar contraseña actual
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return {
          success: false,
          message: 'Contraseña actual incorrecta'
        };
      }

      // Hash nueva contraseña
      const hashedNewPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

      // Actualizar contraseña
      await db
        .update(users)
        .set({
          password: hashedNewPassword,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      // Cerrar todas las demás sesiones por seguridad
      await this.logoutAllSessions(userId);

      return {
        success: true,
        message: 'Contraseña cambiada exitosamente'
      };

    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        message: 'Error al cambiar contraseña'
      };
    }
  }

  /**
   * Hash de contraseña
   */
  public static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Verificar contraseña
   */
  public static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }
}