import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { config } from '@/config/config';
import { generateTokens, verifyRefreshToken } from '@/middleware/auth';
import { 
  AppError, 
  UnauthorizedError, 
  NotFoundError, 
  ConflictError, 
  ValidationError 
} from '@/middleware/errorHandler';
import { logUserAction, logSecurityEvent, logger } from '@/shared/logger';

const prisma = new PrismaClient();

class AuthController {
  // User login
  async login(req: Request, res: Response): Promise<void> {
    const { username, password, rememberMe = false } = req.body;
    const ip = req.ip;
    const userAgent = req.get('User-Agent') || '';

    try {
      // Find user by username or email
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { username: username },
            { email: username }
          ],
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
        logSecurityEvent('LOGIN_FAILED_USER_NOT_FOUND', 'medium', {
          username,
          ip,
          userAgent
        });
        throw new UnauthorizedError('Kullanıcı adı veya şifre hatalı');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        logSecurityEvent('LOGIN_FAILED_INVALID_PASSWORD', 'medium', {
          userId: user.id,
          username: user.username,
          ip,
          userAgent
        });
        throw new UnauthorizedError('Kullanıcı adı veya şifre hatalı');
      }

      // Check if account is locked
      // TODO: Implement account lockout logic

      // Generate tokens
      const tokens = generateTokens({
        id: user.id,
        username: user.username,
        email: user.email
      });

      // Extract roles and permissions
      const roles = user.userRoles.map(ur => ur.role.roleName);
      const permissions = user.userRoles
        .flatMap(ur => ur.role.rolePermissions)
        .map(rp => rp.permission.permissionName);

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      // Log successful login
      logUserAction(user.id, 'LOGIN', 'auth', {
        ip,
        userAgent,
        rememberMe
      });

      // Response data
      const userData = {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        isSystemAdmin: user.isSystemAdmin,
        emailVerified: user.emailVerified,
        department: user.department ? {
          id: user.department.id,
          name: user.department.departmentName
        } : null,
        position: user.position,
        roles,
        permissions: [...new Set(permissions)], // Remove duplicates
        lastLoginAt: user.lastLoginAt,
      };

      res.status(200).json({
        message: 'Giriş başarılı',
        user: userData,
        tokens
      });
    } catch (error) {
      throw error;
    }
  }

  // User registration (admin only)
  async register(req: Request, res: Response): Promise<void> {
    const {
      username,
      email,
      password,
      fullName,
      departmentId,
      position,
      phone,
      employeeNumber,
      hireDate,
      isActive = true,
      roles = []
    } = req.body;

    try {
      // Check if username or email already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { username },
            { email }
          ]
        }
      });

      if (existingUser) {
        if (existingUser.username === username) {
          throw new ConflictError('Bu kullanıcı adı zaten kullanılıyor');
        }
        if (existingUser.email === email) {
          throw new ConflictError('Bu e-posta adresi zaten kullanılıyor');
        }
      }

      // Check employee number uniqueness if provided
      if (employeeNumber) {
        const existingEmployee = await prisma.user.findUnique({
          where: { employeeNumber }
        });
        if (existingEmployee) {
          throw new ConflictError('Bu personel numarası zaten kullanılıyor');
        }
      }

      // Verify department exists if provided
      if (departmentId) {
        const department = await prisma.department.findUnique({
          where: { id: departmentId }
        });
        if (!department) {
          throw new NotFoundError('Departman');
        }
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, config.security.bcryptRounds);

      // Create user
      const newUser = await prisma.user.create({
        data: {
          username,
          email,
          passwordHash,
          fullName,
          departmentId,
          position,
          phone,
          employeeNumber,
          hireDate: hireDate ? new Date(hireDate) : null,
          isActive,
          emailVerified: false, // Will be verified via email
        },
        include: {
          department: true
        }
      });

      // Assign roles if provided
      if (roles.length > 0) {
        const roleAssignments = roles.map((roleId: number) => ({
          userId: newUser.id,
          roleId,
          assignedByUserId: req.user!.id
        }));

        await prisma.userRole.createMany({
          data: roleAssignments
        });
      }

      // Log user creation
      logUserAction(req.user!.id, 'CREATE_USER', 'user', {
        newUserId: newUser.id,
        newUsername: newUser.username
      });

      // TODO: Send verification email

      res.status(201).json({
        message: 'Kullanıcı başarıyla oluşturuldu',
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          fullName: newUser.fullName,
          department: newUser.department ? {
            id: newUser.department.id,
            name: newUser.department.departmentName
          } : null,
          position: newUser.position,
          employeeNumber: newUser.employeeNumber,
          isActive: newUser.isActive,
          emailVerified: newUser.emailVerified,
          createdAt: newUser.createdAt
        }
      });
    } catch (error) {
      throw error;
    }
  }

  // Refresh access token
  async refreshToken(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.body;

    try {
      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);

      // Check if user still exists and is active
      const user = await prisma.user.findUnique({
        where: { 
          id: decoded.userId,
          isActive: true 
        }
      });

      if (!user) {
        logSecurityEvent('REFRESH_TOKEN_INVALID_USER', 'medium', {
          userId: decoded.userId,
          ip: req.ip
        });
        throw new UnauthorizedError('Geçersiz refresh token');
      }

      // Generate new tokens
      const tokens = generateTokens({
        id: user.id,
        username: user.username,
        email: user.email
      });

      res.status(200).json({
        message: 'Token başarıyla yenilendi',
        ...tokens
      });
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        logSecurityEvent('REFRESH_TOKEN_INVALID', 'medium', {
          ip: req.ip,
          error: error.message
        });
        throw new UnauthorizedError('Geçersiz refresh token');
      }
      throw error;
    }
  }

  // User logout
  async logout(req: Request, res: Response): Promise<void> {
    try {
      // Log logout action
      logUserAction(req.user!.id, 'LOGOUT', 'auth', {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      // TODO: Add token to blacklist in Redis

      res.status(200).json({
        message: 'Çıkış başarılı'
      });
    } catch (error) {
      throw error;
    }
  }

  // Get current user info
  async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.user!.id },
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
        throw new NotFoundError('Kullanıcı');
      }

      // Extract roles and permissions
      const roles = user.userRoles.map(ur => ur.role.roleName);
      const permissions = user.userRoles
        .flatMap(ur => ur.role.rolePermissions)
        .map(rp => rp.permission.permissionName);

      res.status(200).json({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          isSystemAdmin: user.isSystemAdmin,
          emailVerified: user.emailVerified,
          department: user.department ? {
            id: user.department.id,
            name: user.department.departmentName
          } : null,
          position: user.position,
          phone: user.phone,
          employeeNumber: user.employeeNumber,
          hireDate: user.hireDate,
          timezone: user.timezone,
          language: user.language,
          roles,
          permissions: [...new Set(permissions)],
          lastLoginAt: user.lastLoginAt,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      throw error;
    }
  }

  // Change password
  async changePassword(req: Request, res: Response): Promise<void> {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user!.id;

    try {
      // Get current user
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new NotFoundError('Kullanıcı');
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        logSecurityEvent('PASSWORD_CHANGE_FAILED', 'medium', {
          userId,
          reason: 'Invalid current password',
          ip: req.ip
        });
        throw new ValidationError('Mevcut şifre hatalı');
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, config.security.bcryptRounds);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash: newPasswordHash,
          passwordChangedAt: new Date()
        }
      });

      // Log password change
      logUserAction(userId, 'CHANGE_PASSWORD', 'user', {
        ip: req.ip
      });

      res.status(200).json({
        message: 'Şifre başarıyla değiştirildi'
      });
    } catch (error) {
      throw error;
    }
  }

  // Forgot password
  async forgotPassword(req: Request, res: Response): Promise<void> {
    const { email } = req.body;

    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email, isActive: true }
      });

      // Always return success to prevent email enumeration
      const successMessage = 'Eğer bu e-posta adresi sistemde kayıtlı ise, şifre sıfırlama bağlantısı gönderildi';

      if (!user) {
        // Log attempt for non-existent email
        logSecurityEvent('PASSWORD_RESET_INVALID_EMAIL', 'low', {
          email,
          ip: req.ip
        });
        
        res.status(200).json({ message: successMessage });
        return;
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

      // Save reset token (in a real implementation, save to database)
      // TODO: Save reset token to database with expiry

      // Log password reset request
      logUserAction(user.id, 'REQUEST_PASSWORD_RESET', 'auth', {
        ip: req.ip
      });

      // TODO: Send password reset email

      res.status(200).json({ message: successMessage });
    } catch (error) {
      throw error;
    }
  }

  // Reset password
  async resetPassword(req: Request, res: Response): Promise<void> {
    const { token, newPassword } = req.body;

    try {
      // TODO: Verify reset token from database
      // For now, just return an error
      throw new ValidationError('Geçersiz veya süresi dolmuş token');

      // In a real implementation:
      // 1. Find token in database
      // 2. Check if not expired
      // 3. Get associated user
      // 4. Update password
      // 5. Delete/invalidate token
      // 6. Send confirmation email
    } catch (error) {
      throw error;
    }
  }

  // Verify email
  async verifyEmail(req: Request, res: Response): Promise<void> {
    const { token } = req.body;

    try {
      // TODO: Verify email token from database
      throw new ValidationError('Geçersiz veya süresi dolmuş token');

      // In a real implementation:
      // 1. Find token in database
      // 2. Check if not expired
      // 3. Get associated user
      // 4. Update emailVerified to true
      // 5. Delete/invalidate token
    } catch (error) {
      throw error;
    }
  }

  // Resend verification email
  async resendVerification(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new NotFoundError('Kullanıcı');
      }

      if (user.emailVerified) {
        throw new ValidationError('E-posta adresi zaten doğrulanmış');
      }

      // TODO: Generate and send new verification email

      logUserAction(userId, 'RESEND_EMAIL_VERIFICATION', 'auth', {
        email: user.email
      });

      res.status(200).json({
        message: 'Doğrulama e-postası gönderildi'
      });
    } catch (error) {
      throw error;
    }
  }

  // Get user sessions
  async getSessions(req: Request, res: Response): Promise<void> {
    // TODO: Implement session management with Redis
    // For now, return mock data
    res.status(200).json({
      sessions: [
        {
          id: 'current',
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          lastAccess: new Date().toISOString(),
          current: true
        }
      ]
    });
  }

  // Terminate specific session
  async terminateSession(req: Request, res: Response): Promise<void> {
    const { sessionId } = req.params;

    try {
      // TODO: Implement session termination with Redis
      
      logUserAction(req.user!.id, 'TERMINATE_SESSION', 'auth', {
        terminatedSessionId: sessionId
      });

      res.status(200).json({
        message: 'Oturum sonlandırıldı'
      });
    } catch (error) {
      throw error;
    }
  }
}

export const authController = new AuthController();