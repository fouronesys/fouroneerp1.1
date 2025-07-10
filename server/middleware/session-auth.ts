import { Request, Response, NextFunction } from 'express';
import { SessionManager } from '../session-manager';

const sessionManager = SessionManager.getInstance();

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        companyId?: number;
        isAuthenticated: boolean;
      };
      sessionToken?: string;
    }
  }
}

/**
 * Middleware de autenticación basado en tokens de sesión
 * Similar al sistema de WhatsApp - tokens con tiempo de vida y renovación automática
 */
export async function sessionAuth(req: Request, res: Response, next: NextFunction) {
  try {
    // Buscar token en cookies, headers o body
    const token = 
      req.cookies?.sessionToken || 
      req.headers.authorization?.replace('Bearer ', '') ||
      req.body?.sessionToken ||
      req.query?.sessionToken;

    if (!token) {
      return res.status(401).json({ 
        message: 'No authentication token provided',
        code: 'NO_TOKEN'
      });
    }

    // Validar y renovar sesión
    const sessionData = await sessionManager.validateAndRenewSession(token);
    
    if (!sessionData) {
      // Limpiar cookie si existe
      res.clearCookie('sessionToken');
      return res.status(401).json({ 
        message: 'Invalid or expired session',
        code: 'INVALID_SESSION'
      });
    }

    // Adjuntar datos del usuario a la request
    req.user = {
      id: sessionData.userId,
      email: sessionData.email,
      role: sessionData.role,
      companyId: sessionData.companyId,
      isAuthenticated: true
    };

    req.sessionToken = token;

    next();
  } catch (error) {
    console.error('[SessionAuth] Error:', error);
    res.status(500).json({ 
      message: 'Authentication service error',
      code: 'AUTH_ERROR'
    });
  }
}

/**
 * Middleware para verificar roles específicos
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Not authenticated',
        code: 'NOT_AUTHENTICATED'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Insufficient permissions',
        code: 'INSUFFICIENT_PERMISSIONS',
        requiredRoles: roles,
        userRole: req.user.role
      });
    }

    next();
  };
}

/**
 * Middleware para verificar si es super admin
 */
export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Not authenticated',
      code: 'NOT_AUTHENTICATED'
    });
  }

  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ 
      message: 'Super admin access required',
      code: 'SUPER_ADMIN_REQUIRED'
    });
  }

  next();
}

/**
 * Middleware para verificar acceso a empresa
 */
export function requireCompanyAccess(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Not authenticated',
      code: 'NOT_AUTHENTICATED'
    });
  }

  // Super admin tiene acceso a todas las empresas
  if (req.user.role === 'super_admin') {
    return next();
  }

  // Verificar que el usuario tenga acceso a la empresa
  const companyId = req.params.companyId || req.body.companyId || req.query.companyId;
  
  if (companyId && req.user.companyId && parseInt(companyId) !== req.user.companyId) {
    return res.status(403).json({ 
      message: 'Access denied to this company',
      code: 'COMPANY_ACCESS_DENIED'
    });
  }

  next();
}

/**
 * Middleware opcional para rutas públicas que pueden beneficiarse de la autenticación
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = 
      req.cookies?.sessionToken || 
      req.headers.authorization?.replace('Bearer ', '');

    if (token) {
      const sessionData = await sessionManager.validateAndRenewSession(token);
      
      if (sessionData) {
        req.user = {
          id: sessionData.userId,
          email: sessionData.email,
          role: sessionData.role,
          companyId: sessionData.companyId,
          isAuthenticated: true
        };
        req.sessionToken = token;
      }
    }

    next();
  } catch (error) {
    // En rutas opcionales, continuar aunque haya error
    console.error('[OptionalAuth] Error:', error);
    next();
  }
}