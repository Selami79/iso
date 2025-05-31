const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Mock token generator
const createMockToken = (user) => {
  return {
    accessToken: `mock-access-${user.id}-${Date.now()}`,
    refreshToken: `mock-refresh-${user.id}-${Date.now()}`
  };
};

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'KYS Auth API',
    timestamp: new Date().toISOString()
  });
});

// Login
app.post('/api/v1/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
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

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({
        success: false,
        error: 'Geçersiz kullanıcı adı veya şifre'
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    const tokens = createMockToken(user);
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

// Register
app.post('/api/v1/auth/register', async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;
    
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

    const passwordHash = await bcrypt.hash(password, 12);

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

    const tokens = createMockToken(user);

    res.status(201).json({
      success: true,
      message: 'Kullanıcı başarıyla oluşturuldu',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        isActive: user.isActive,
        roles: ['EMPLOYEE']
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

app.listen(PORT, () => {
  console.log(`🔐 KYS Auth Server running on port ${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/health`);
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