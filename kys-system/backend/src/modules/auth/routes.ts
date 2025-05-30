import { Router } from 'express';
import { authController } from './controller';
import { validateRequest } from '@/middleware/validation';
import { loginSchema, registerSchema, changePasswordSchema, forgotPasswordSchema, resetPasswordSchema } from './validation';
import { authMiddleware, optionalAuth } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/errorHandler';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           description: Kullanıcı adı veya e-posta
 *         password:
 *           type: string
 *           format: password
 *           description: Şifre
 *     
 *     LoginResponse:
 *       type: object
 *       properties:
 *         user:
 *           $ref: '#/components/schemas/User'
 *         tokens:
 *           type: object
 *           properties:
 *             accessToken:
 *               type: string
 *             refreshToken:
 *               type: string
 *         
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: number
 *         username:
 *           type: string
 *         email:
 *           type: string
 *         fullName:
 *           type: string
 *         isSystemAdmin:
 *           type: boolean
 *         roles:
 *           type: array
 *           items:
 *             type: string
 *         permissions:
 *           type: array
 *           items:
 *             type: string
 */

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Kullanıcı girişi
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Başarılı giriş
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Geçersiz giriş bilgileri
 *       401:
 *         description: Yanlış kullanıcı adı veya şifre
 *       429:
 *         description: Çok fazla giriş denemesi
 */
router.post('/login', validateRequest(loginSchema), asyncHandler(authController.login));

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Yeni kullanıcı kaydı (sadece admin)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - fullName
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               fullName:
 *                 type: string
 *               departmentId:
 *                 type: number
 *               position:
 *                 type: string
 *               phone:
 *                 type: string
 *               employeeNumber:
 *                 type: string
 *     responses:
 *       201:
 *         description: Kullanıcı başarıyla oluşturuldu
 *       400:
 *         description: Geçersiz veri
 *       409:
 *         description: Kullanıcı adı veya e-posta zaten kullanımda
 */
router.post('/register', authMiddleware, validateRequest(registerSchema), asyncHandler(authController.register));

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Token yenileme
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token başarıyla yenilendi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       401:
 *         description: Geçersiz refresh token
 */
router.post('/refresh', asyncHandler(authController.refreshToken));

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Kullanıcı çıkışı
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Başarıyla çıkış yapıldı
 *       401:
 *         description: Kimlik doğrulama gerekli
 */
router.post('/logout', authMiddleware, asyncHandler(authController.logout));

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Mevcut kullanıcı bilgileri
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Kullanıcı bilgileri
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Kimlik doğrulama gerekli
 */
router.get('/me', authMiddleware, asyncHandler(authController.getCurrentUser));

/**
 * @swagger
 * /api/v1/auth/change-password:
 *   post:
 *     summary: Şifre değiştirme
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Şifre başarıyla değiştirildi
 *       400:
 *         description: Geçersiz mevcut şifre
 *       401:
 *         description: Kimlik doğrulama gerekli
 */
router.post('/change-password', authMiddleware, validateRequest(changePasswordSchema), asyncHandler(authController.changePassword));

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Şifre sıfırlama talebi
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Şifre sıfırlama e-postası gönderildi
 *       404:
 *         description: E-posta adresi bulunamadı
 */
router.post('/forgot-password', validateRequest(forgotPasswordSchema), asyncHandler(authController.forgotPassword));

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     summary: Şifre sıfırlama
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Şifre başarıyla sıfırlandı
 *       400:
 *         description: Geçersiz veya süresi dolmuş token
 */
router.post('/reset-password', validateRequest(resetPasswordSchema), asyncHandler(authController.resetPassword));

/**
 * @swagger
 * /api/v1/auth/verify-email:
 *   post:
 *     summary: E-posta doğrulama
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: E-posta başarıyla doğrulandı
 *       400:
 *         description: Geçersiz veya süresi dolmuş token
 */
router.post('/verify-email', asyncHandler(authController.verifyEmail));

/**
 * @swagger
 * /api/v1/auth/resend-verification:
 *   post:
 *     summary: E-posta doğrulama e-postası tekrar gönderme
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Doğrulama e-postası gönderildi
 *       400:
 *         description: E-posta zaten doğrulanmış
 *       401:
 *         description: Kimlik doğrulama gerekli
 */
router.post('/resend-verification', authMiddleware, asyncHandler(authController.resendVerification));

/**
 * @swagger
 * /api/v1/auth/sessions:
 *   get:
 *     summary: Aktif oturumları listele
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Aktif oturumlar
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   ip:
 *                     type: string
 *                   userAgent:
 *                     type: string
 *                   lastAccess:
 *                     type: string
 *                     format: date-time
 *                   current:
 *                     type: boolean
 */
router.get('/sessions', authMiddleware, asyncHandler(authController.getSessions));

/**
 * @swagger
 * /api/v1/auth/sessions/{sessionId}:
 *   delete:
 *     summary: Belirli bir oturumu sonlandır
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: sessionId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Oturum sonlandırıldı
 *       404:
 *         description: Oturum bulunamadı
 */
router.delete('/sessions/:sessionId', authMiddleware, asyncHandler(authController.terminateSession));

export default router;