const express = require('express');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = 3001; // Farklı port kullan

app.use(express.json());

// Test için basit JWT mock
const createMockToken = (user) => {
  return {
    accessToken: `mock-access-${user.id}-${Date.now()}`,
    refreshToken: `mock-refresh-${user.id}-${Date.now()}`
  };
};

// Register endpoint
app.post('/api/v1/auth/register', async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;
    
    // Validation
    if (!username || !email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        error: 'Tüm alanlar zorunludur'
      });
    }

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username },
          { email: email }
        ]
      }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Kullanıcı adı veya e-posta zaten kullanımda'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        fullName,
        isActive: true,
        emailVerified: false
      }
    });

    // Assign default role (EMPLOYEE)
    const employeeRole = await prisma.role.findFirst({
      where: { roleName: 'EMPLOYEE' }
    });

    if (employeeRole) {
      await prisma.userRole.create({
        data: {
          userId: user.id,
          roleId: employeeRole.id,
          isActive: true
        }
      });
    }

    // Generate tokens
    const tokens = createMockToken(user);

    res.status(201).json({
      success: true,
      message: 'Kullanıcı başarıyla oluşturuldu',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        isActive: user.isActive
      },
      tokens
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: 'Kullanıcı oluşturulurken hata oluştu'
    });
  }
});

// Login endpoint
app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Kullanıcı adı ve şifre gerekli'
      });
    }

    // Find user
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: username },
          { email: username }
        ],
        isActive: true
      },
      include: {
        userRoles: {
          where: { isActive: true },
          include: {
            role: true
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Geçersiz kullanıcı adı veya şifre'
      });
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        error: 'Geçersiz kullanıcı adı veya şifre'
      });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Generate tokens
    const tokens = createMockToken(user);

    // Get roles
    const roles = user.userRoles.map(ur => ur.role.roleName);

    res.json({
      success: true,
      message: 'Giriş başarılı',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        isSystemAdmin: user.isSystemAdmin,
        roles: roles
      },
      tokens
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Giriş işlemi sırasında hata oluştu'
    });
  }
});

// Create admin user endpoint
app.post('/api/v1/auth/create-admin', async (req, res) => {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { isSystemAdmin: true }
    });

    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        error: 'Sistem yöneticisi zaten mevcut'
      });
    }

    const adminData = {
      username: 'admin',
      email: 'admin@kys-system.com',
      password: 'Admin123',
      fullName: 'Sistem Yöneticisi'
    };

    // Hash password
    const passwordHash = await bcrypt.hash(adminData.password, 12);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        username: adminData.username,
        email: adminData.email,
        passwordHash,
        fullName: adminData.fullName,
        isActive: true,
        isSystemAdmin: true,
        emailVerified: true
      }
    });

    // Assign SYSTEM_ADMIN role
    const adminRole = await prisma.role.findFirst({
      where: { roleName: 'SYSTEM_ADMIN' }
    });

    if (adminRole) {
      await prisma.userRole.create({
        data: {
          userId: admin.id,
          roleId: adminRole.id,
          isActive: true
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Admin kullanıcısı oluşturuldu',
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        fullName: admin.fullName,
        credentials: {
          username: adminData.username,
          password: adminData.password
        }
      }
    });

  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({
      success: false,
      error: 'Admin oluşturulurken hata oluştu'
    });
  }
});

// List users
app.get('/api/v1/auth/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        isActive: true,
        isSystemAdmin: true,
        lastLoginAt: true,
        createdAt: true,
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'KYS Auth Test',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🔐 KYS Auth Test Server started on port ${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
  console.log(`👤 Create Admin: POST http://localhost:${PORT}/api/v1/auth/create-admin`);
  console.log(`🔑 Login: POST http://localhost:${PORT}/api/v1/auth/login`);
  console.log(`📝 Register: POST http://localhost:${PORT}/api/v1/auth/register`);
  console.log(`👥 Users: GET http://localhost:${PORT}/api/v1/auth/users`);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});