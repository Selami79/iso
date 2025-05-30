import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { config } from '@/config/config';
import { UnauthorizedError, ForbiddenError } from '@/middleware/errorHandler';
import { logger, logSecurityEvent } from '@/shared/logger';

const prisma = new PrismaClient();

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        email: string;
        fullName: string;
        isSystemAdmin: boolean;
        roles: string[];
        permissions: string[];
        departmentId?: number;
      };
    }
  }
}

// JWT payload interface
interface JwtPayload {
  userId: number;
  username: string;
  email: string;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

// Authentication middleware
export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token bulunamadı');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify JWT token
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    
    if (decoded.type !== 'access') {
      throw new UnauthorizedError('Geçersiz token tipi');
    }

    // Get user with roles and permissions
    const user = await prisma.user.findUnique({
      where: { 
        id: decoded.userId,
        isActive: true 
      },
      include: {
        department: true,
        userRoles: {
          where: { isActive: true },
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      logSecurityEvent('INVALID_USER_TOKEN', 'medium', {
        userId: decoded.userId,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      throw new UnauthorizedError('Kullanıcı bulunamadı');
    }

    // Extract roles and permissions
    const roles = user.userRoles.map(ur => ur.role.roleName);
    const permissions = user.userRoles
      .flatMap(ur => ur.role.rolePermissions)
      .map(rp => rp.permission.permissionName);

    // Set user info in request
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      isSystemAdmin: user.isSystemAdmin,
      roles,
      permissions: [...new Set(permissions)], // Remove duplicates
      departmentId: user.departmentId || undefined,
    };

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      logSecurityEvent('INVALID_JWT_TOKEN', 'medium', {
        error: error.message,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      throw new UnauthorizedError('Geçersiz token');
    } else if (error instanceof jwt.TokenExpiredError) {
      logSecurityEvent('EXPIRED_JWT_TOKEN', 'low', {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      throw new UnauthorizedError('Token süresi dolmuş');
    }
    
    next(error);
  }
};

// Permission-based authorization middleware
export const requirePermission = (...permissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Kimlik doğrulama gerekli');
    }

    // System admins have all permissions
    if (req.user.isSystemAdmin) {
      return next();
    }

    // Check if user has any of the required permissions
    const hasPermission = permissions.some(permission => 
      req.user!.permissions.includes(permission)
    );

    if (!hasPermission) {
      logSecurityEvent('PERMISSION_DENIED', 'medium', {
        userId: req.user.id,
        requiredPermissions: permissions,
        userPermissions: req.user.permissions,
        endpoint: req.originalUrl,
        method: req.method
      });
      
      throw new ForbiddenError(`Bu işlem için gerekli yetki: ${permissions.join(' veya ')}`);
    }

    next();
  };
};

// Role-based authorization middleware
export const requireRole = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new UnauthorizedError('Kimlik doğrulama gerekli');
    }

    // System admins have all roles
    if (req.user.isSystemAdmin) {
      return next();
    }

    // Check if user has any of the required roles
    const hasRole = roles.some(role => req.user!.roles.includes(role));

    if (!hasRole) {
      logSecurityEvent('ROLE_ACCESS_DENIED', 'medium', {
        userId: req.user.id,
        requiredRoles: roles,
        userRoles: req.user.roles,
        endpoint: req.originalUrl,
        method: req.method
      });
      
      throw new ForbiddenError(`Bu işlem için gerekli rol: ${roles.join(' veya ')}`);
    }

    next();
  };
};

// System admin only middleware
export const requireSystemAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    throw new UnauthorizedError('Kimlik doğrulama gerekli');
  }

  if (!req.user.isSystemAdmin) {
    logSecurityEvent('ADMIN_ACCESS_DENIED', 'high', {
      userId: req.user.id,
      endpoint: req.originalUrl,
      method: req.method
    });
    
    throw new ForbiddenError('Bu işlem sadece sistem yöneticileri tarafından yapılabilir');
  }

  next();
};

// Department-based authorization middleware
export const requireSameDepartment = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    throw new UnauthorizedError('Kimlik doğrulama gerekli');
  }

  // System admins can access all departments
  if (req.user.isSystemAdmin) {
    return next();
  }

  // If user doesn't have department, deny access
  if (!req.user.departmentId) {
    throw new ForbiddenError('Departman bilgisi gerekli');
  }

  // The actual department check should be implemented in the specific endpoint
  // This middleware just ensures the user has a department
  next();
};

// Optional authentication middleware (for public endpoints that can benefit from user context)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Try to authenticate, but don't throw errors
      await authMiddleware(req, res, next);
    } else {
      next();
    }
  } catch (error) {
    // Ignore authentication errors for optional auth
    next();
  }
};

// Rate limiting for sensitive operations
export const sensitiveOperationLimit = (req: Request, res: Response, next: NextFunction): void => {
  // This would integrate with Redis-based rate limiting
  // For now, just pass through
  next();
};

// Utility functions for token management
export const generateTokens = (user: { id: number; username: string; email: string }) => {
  const accessToken = jwt.sign(
    {
      userId: user.id,
      username: user.username,
      email: user.email,
      type: 'access'
    },
    config.jwt.secret,
    { 
      expiresIn: config.jwt.expiresIn,
      issuer: 'kys-api',
      audience: 'kys-client'
    }
  );

  const refreshToken = jwt.sign(
    {
      userId: user.id,
      username: user.username,
      email: user.email,
      type: 'refresh'
    },
    config.jwt.refreshSecret,
    { 
      expiresIn: config.jwt.refreshExpiresIn,
      issuer: 'kys-api',
      audience: 'kys-client'
    }
  );

  return { accessToken, refreshToken };
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  const decoded = jwt.verify(token, config.jwt.refreshSecret) as JwtPayload;
  
  if (decoded.type !== 'refresh') {
    throw new Error('Invalid token type');
  }
  
  return decoded;
};

// Cleanup function
export const cleanup = async (): Promise<void> => {
  await prisma.$disconnect();
};