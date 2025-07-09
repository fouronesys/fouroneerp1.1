import { Router, Request, Response } from 'express';
import { AuthService } from '../auth-service';
import { sessionManager } from '../session-manager';
import { sessionAuth, optionalAuth } from '../middleware/session-auth';
import { z } from 'zod';

const router = Router();

// Esquemas de validación
const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres')
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Contraseña actual requerida'),
  newPassword: z.string().min(6, 'Nueva contraseña debe tener al menos 6 caracteres')
});

/**
 * POST /api/auth/login
 * Login con email y contraseña - Sistema tipo WhatsApp
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: 'Datos inválidos',
        errors: validation.error.issues
      });
    }

    const { email, password } = validation.data;
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const result = await AuthService.login(email, password, ipAddress, userAgent);

    if (!result.success) {
      return res.status(401).json({
        message: result.message,
        code: 'LOGIN_FAILED'
      });
    }

    // Establecer cookie con el token
    res.cookie('sessionToken', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
      path: '/'
    });

    res.json({
      success: true,
      user: result.user,
      expiresAt: result.expiresAt,
      message: 'Login exitoso'
    });

  } catch (error) {
    console.error('[Auth] Login error:', error);
    res.status(500).json({
      message: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /api/auth/logout
 * Cerrar sesión actual
 */
router.post('/logout', sessionAuth, async (req: Request, res: Response) => {
  try {
    if (req.sessionToken) {
      await AuthService.logout(req.sessionToken);
    }

    res.clearCookie('sessionToken');
    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });

  } catch (error) {
    console.error('[Auth] Logout error:', error);
    res.status(500).json({
      message: 'Error cerrando sesión',
      code: 'LOGOUT_ERROR'
    });
  }
});

/**
 * POST /api/auth/logout-all
 * Cerrar todas las sesiones del usuario
 */
router.post('/logout-all', sessionAuth, async (req: Request, res: Response) => {
  try {
    if (req.user) {
      await AuthService.logoutAllSessions(req.user.id);
    }

    res.clearCookie('sessionToken');
    res.json({
      success: true,
      message: 'Todas las sesiones cerradas exitosamente'
    });

  } catch (error) {
    console.error('[Auth] Logout all error:', error);
    res.status(500).json({
      message: 'Error cerrando sesiones',
      code: 'LOGOUT_ALL_ERROR'
    });
  }
});

/**
 * POST /api/auth/extend-session
 * Extender sesión actual (como WhatsApp pregunta si quieres seguir conectado)
 */
router.post('/extend-session', sessionAuth, async (req: Request, res: Response) => {
  try {
    if (!req.sessionToken) {
      return res.status(401).json({
        message: 'Token de sesión no encontrado',
        code: 'NO_TOKEN'
      });
    }

    const extended = await sessionManager.extendSession(req.sessionToken);

    if (!extended) {
      return res.status(400).json({
        message: 'No se pudo extender la sesión',
        code: 'EXTEND_FAILED'
      });
    }

    res.json({
      success: true,
      message: 'Sesión extendida por 7 días más'
    });

  } catch (error) {
    console.error('[Auth] Extend session error:', error);
    res.status(500).json({
      message: 'Error extendiendo sesión',
      code: 'EXTEND_ERROR'
    });
  }
});

/**
 * POST /api/auth/change-password
 * Cambiar contraseña del usuario
 */
router.post('/change-password', sessionAuth, async (req: Request, res: Response) => {
  try {
    const validation = changePasswordSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: 'Datos inválidos',
        errors: validation.error.issues
      });
    }

    if (!req.user) {
      return res.status(401).json({
        message: 'Usuario no autenticado',
        code: 'NOT_AUTHENTICATED'
      });
    }

    const { currentPassword, newPassword } = validation.data;
    const result = await AuthService.changePassword(req.user.id, currentPassword, newPassword);

    if (!result.success) {
      return res.status(400).json({
        message: result.message,
        code: 'CHANGE_PASSWORD_FAILED'
      });
    }

    // Limpiar cookie actual ya que se cerraron todas las sesiones
    res.clearCookie('sessionToken');

    res.json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('[Auth] Change password error:', error);
    res.status(500).json({
      message: 'Error cambiando contraseña',
      code: 'CHANGE_PASSWORD_ERROR'
    });
  }
});

/**
 * GET /api/auth/me
 * Obtener información del usuario autenticado
 */
router.get('/me', sessionAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: 'Usuario no autenticado',
        code: 'NOT_AUTHENTICATED'
      });
    }

    res.json({
      user: req.user,
      success: true
    });

  } catch (error) {
    console.error('[Auth] Get user error:', error);
    res.status(500).json({
      message: 'Error obteniendo información del usuario',
      code: 'GET_USER_ERROR'
    });
  }
});

/**
 * GET /api/auth/sessions
 * Obtener sesiones activas del usuario
 */
router.get('/sessions', sessionAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: 'Usuario no autenticado',
        code: 'NOT_AUTHENTICATED'
      });
    }

    const sessions = await sessionManager.getUserActiveSessions(req.user.id);
    
    res.json({
      sessions,
      success: true
    });

  } catch (error) {
    console.error('[Auth] Get sessions error:', error);
    res.status(500).json({
      message: 'Error obteniendo sesiones',
      code: 'GET_SESSIONS_ERROR'
    });
  }
});

/**
 * GET /api/auth/status
 * Verificar estado de autenticación (ruta opcional)
 */
router.get('/status', optionalAuth, async (req: Request, res: Response) => {
  try {
    res.json({
      authenticated: !!req.user,
      user: req.user || null
    });

  } catch (error) {
    console.error('[Auth] Status error:', error);
    res.status(500).json({
      message: 'Error verificando estado',
      code: 'STATUS_ERROR'
    });
  }
});

/**
 * GET /api/auth/stats (solo para super admin)
 */
router.get('/stats', sessionAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'super_admin') {
      return res.status(403).json({
        message: 'Acceso denegado - Solo super admin',
        code: 'ACCESS_DENIED'
      });
    }

    const stats = await sessionManager.getSessionStats();
    
    res.json({
      stats,
      success: true
    });

  } catch (error) {
    console.error('[Auth] Stats error:', error);
    res.status(500).json({
      message: 'Error obteniendo estadísticas',
      code: 'STATS_ERROR'
    });
  }
});

export default router;