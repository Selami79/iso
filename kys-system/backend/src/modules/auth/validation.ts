import { z } from 'zod';

// Common password validation
const passwordSchema = z
  .string()
  .min(8, 'Şifre en az 8 karakter olmalı')
  .max(128, 'Şifre en fazla 128 karakter olmalı')
  .regex(/[A-Z]/, 'Şifre en az bir büyük harf içermeli')
  .regex(/[a-z]/, 'Şifre en az bir küçük harf içermeli')
  .regex(/[0-9]/, 'Şifre en az bir rakam içermeli')
  .regex(/[^A-Za-z0-9]/, 'Şifre en az bir özel karakter içermeli');

// Username validation
const usernameSchema = z
  .string()
  .min(3, 'Kullanıcı adı en az 3 karakter olmalı')
  .max(50, 'Kullanıcı adı en fazla 50 karakter olmalı')
  .regex(/^[a-zA-Z0-9._-]+$/, 'Kullanıcı adı sadece harf, rakam, nokta, alt çizgi ve tire içerebilir');

// Email validation
const emailSchema = z
  .string()
  .email('Geçerli bir e-posta adresi giriniz')
  .max(255, 'E-posta adresi en fazla 255 karakter olmalı');

// Full name validation
const fullNameSchema = z
  .string()
  .min(2, 'Ad soyad en az 2 karakter olmalı')
  .max(255, 'Ad soyad en fazla 255 karakter olmalı')
  .regex(/^[a-zA-ZÇĞIİÖŞÜçğıiöşü\s]+$/, 'Ad soyad sadece harf ve boşluk içerebilir');

// Phone validation (Turkish format)
const phoneSchema = z
  .string()
  .optional()
  .refine((val) => {
    if (!val) return true;
    // Turkish phone number formats: +90XXXXXXXXXX, 0XXXXXXXXXX, XXXXXXXXXX
    return /^(\+90|0)?[5-9][0-9]{9}$/.test(val.replace(/\s/g, ''));
  }, 'Geçerli bir telefon numarası giriniz');

// Employee number validation
const employeeNumberSchema = z
  .string()
  .optional()
  .refine((val) => {
    if (!val) return true;
    return /^[A-Z0-9-]{3,20}$/.test(val);
  }, 'Personel numarası 3-20 karakter olmalı ve sadece büyük harf, rakam ve tire içerebilir');

// Login schema
export const loginSchema = z.object({
  body: z.object({
    username: z
      .string()
      .min(1, 'Kullanıcı adı veya e-posta gerekli')
      .max(255, 'Kullanıcı adı veya e-posta çok uzun'),
    password: z
      .string()
      .min(1, 'Şifre gerekli')
      .max(128, 'Şifre çok uzun'),
    rememberMe: z.boolean().optional(),
  })
});

// Register schema
export const registerSchema = z.object({
  body: z.object({
    username: usernameSchema,
    email: emailSchema,
    password: passwordSchema,
    fullName: fullNameSchema,
    departmentId: z
      .number()
      .int()
      .positive('Geçerli bir departman seçiniz')
      .optional(),
    position: z
      .string()
      .min(2, 'Pozisyon en az 2 karakter olmalı')
      .max(150, 'Pozisyon en fazla 150 karakter olmalı')
      .optional(),
    phone: phoneSchema,
    employeeNumber: employeeNumberSchema,
    hireDate: z
      .string()
      .optional()
      .refine((val) => {
        if (!val) return true;
        const date = new Date(val);
        return !isNaN(date.getTime()) && date <= new Date();
      }, 'Geçerli bir işe başlama tarihi giriniz'),
    isActive: z.boolean().optional().default(true),
    roles: z
      .array(z.number().int().positive())
      .optional()
      .default([]),
  })
});

// Change password schema
export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z
      .string()
      .min(1, 'Mevcut şifre gerekli'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Yeni şifre ve şifre tekrarı eşleşmiyor',
    path: ['confirmPassword'],
  }).refine((data) => data.currentPassword !== data.newPassword, {
    message: 'Yeni şifre mevcut şifreden farklı olmalı',
    path: ['newPassword'],
  })
});

// Forgot password schema
export const forgotPasswordSchema = z.object({
  body: z.object({
    email: emailSchema,
  })
});

// Reset password schema
export const resetPasswordSchema = z.object({
  body: z.object({
    token: z
      .string()
      .min(1, 'Sıfırlama token\'ı gerekli'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Şifre ve şifre tekrarı eşleşmiyor',
    path: ['confirmPassword'],
  })
});

// Refresh token schema
export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z
      .string()
      .min(1, 'Refresh token gerekli'),
  })
});

// Verify email schema
export const verifyEmailSchema = z.object({
  body: z.object({
    token: z
      .string()
      .min(1, 'Doğrulama token\'ı gerekli'),
  })
});

// Update profile schema
export const updateProfileSchema = z.object({
  body: z.object({
    fullName: fullNameSchema.optional(),
    phone: phoneSchema,
    position: z
      .string()
      .min(2, 'Pozisyon en az 2 karakter olmalı')
      .max(150, 'Pozisyon en fazla 150 karakter olmalı')
      .optional(),
    timezone: z
      .string()
      .max(50, 'Saat dilimi en fazla 50 karakter olmalı')
      .optional(),
    language: z
      .enum(['tr', 'en'], {
        errorMap: () => ({ message: 'Dil tr veya en olmalı' })
      })
      .optional(),
  })
});

// Session termination schema
export const terminateSessionSchema = z.object({
  params: z.object({
    sessionId: z
      .string()
      .min(1, 'Oturum ID\'si gerekli'),
  })
});

// Two-factor authentication schemas
export const enable2FASchema = z.object({
  body: z.object({
    password: z
      .string()
      .min(1, 'Şifre gerekli'),
  })
});

export const verify2FASchema = z.object({
  body: z.object({
    token: z
      .string()
      .length(6, '2FA kodu 6 haneli olmalı')
      .regex(/^\d{6}$/, '2FA kodu sadece rakam içermeli'),
    password: z
      .string()
      .min(1, 'Şifre gerekli'),
  })
});

export const disable2FASchema = z.object({
  body: z.object({
    password: z
      .string()
      .min(1, 'Şifre gerekli'),
    token: z
      .string()
      .length(6, '2FA kodu 6 haneli olmalı')
      .regex(/^\d{6}$/, '2FA kodu sadece rakam içermeli'),
  })
});

// Backup codes schema
export const generateBackupCodesSchema = z.object({
  body: z.object({
    password: z
      .string()
      .min(1, 'Şifre gerekli'),
  })
});

// Use backup code schema
export const useBackupCodeSchema = z.object({
  body: z.object({
    username: z
      .string()
      .min(1, 'Kullanıcı adı gerekli'),
    backupCode: z
      .string()
      .length(8, 'Yedek kod 8 haneli olmalı')
      .regex(/^[A-Z0-9]{8}$/, 'Yedek kod sadece büyük harf ve rakam içermeli'),
  })
});

// Account lockout schemas
export const unlockAccountSchema = z.object({
  body: z.object({
    userId: z
      .number()
      .int()
      .positive('Geçerli bir kullanıcı ID\'si giriniz'),
    reason: z
      .string()
      .min(10, 'Kilidi açma nedeni en az 10 karakter olmalı')
      .max(500, 'Kilidi açma nedeni en fazla 500 karakter olmalı'),
  })
});

// Audit log schema
export const auditLogQuerySchema = z.object({
  query: z.object({
    page: z
      .string()
      .optional()
      .transform((val) => val ? parseInt(val, 10) : 1)
      .refine((val) => val > 0, 'Sayfa numarası 1\'den büyük olmalı'),
    limit: z
      .string()
      .optional()
      .transform((val) => val ? parseInt(val, 10) : 20)
      .refine((val) => val > 0 && val <= 100, 'Limit 1-100 arasında olmalı'),
    startDate: z
      .string()
      .optional()
      .refine((val) => {
        if (!val) return true;
        return !isNaN(new Date(val).getTime());
      }, 'Geçerli bir başlangıç tarihi giriniz'),
    endDate: z
      .string()
      .optional()
      .refine((val) => {
        if (!val) return true;
        return !isNaN(new Date(val).getTime());
      }, 'Geçerli bir bitiş tarihi giriniz'),
    userId: z
      .string()
      .optional()
      .transform((val) => val ? parseInt(val, 10) : undefined)
      .refine((val) => !val || val > 0, 'Geçerli bir kullanıcı ID\'si giriniz'),
    action: z
      .string()
      .max(100, 'Eylem en fazla 100 karakter olmalı')
      .optional(),
  })
});