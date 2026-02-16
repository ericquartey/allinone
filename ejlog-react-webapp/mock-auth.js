// ============================================================================
// Mock Authentication Middleware for Vite Dev Server
// Simulates EjLog backend authentication when server is not running
// ============================================================================

import crypto from 'crypto';

/**
 * Calculate superuser password based on current date
 * Formula: promag[DD] where DD = 31 - day_of_month
 * Example: On December 4th → 31 - 4 = 27 → promag27
 */
function getSuperuserPassword() {
  const now = new Date();
  const day = now.getDate();
  const dd = 31 - day; // No padding, direct number
  return `promag${dd}`;
}

/**
 * Hash password using MD5 (matching Java implementation)
 */
function hashPassword(password) {
  if (!password) password = '';
  const hash = crypto.createHash('md5');
  hash.update(password);
  return hash.digest('utf8');
}

/**
 * Mock users database with hashed passwords
 * Password: promag (MD5 hashed)
 */
const MOCK_USERS = {
  superuser: {
    id: 1,
    username: 'superuser',
    // Superuser uses dynamic password
    passwordHash: null, // will be calculated
    accessLevel: 'ADMIN',
    roles: ['ADMIN', 'SUPERVISOR', 'OPERATOR'],
    fullName: 'Super User',
    email: 'superuser@ejlog.local',
  },
  admin: {
    id: 2,
    username: 'admin',
    passwordHash: hashPassword('promag'),
    accessLevel: 'ADMIN',
    roles: ['ADMIN', 'SUPERVISOR'],
    fullName: 'Administrator',
    email: 'admin@ejlog.local',
  },
  user: {
    id: 3,
    username: 'user',
    passwordHash: hashPassword('promag'),
    accessLevel: 'OPERATOR',
    roles: ['OPERATOR'],
    fullName: 'Standard User',
    email: 'user@ejlog.local',
  },
  basicuser: {
    id: 4,
    username: 'basicuser',
    passwordHash: hashPassword('promag'),
    accessLevel: 'GUEST',
    roles: ['GUEST'],
    fullName: 'Basic User',
    email: 'basicuser@ejlog.local',
  },
};

/**
 * Generate JWT token (mock - just a base64 encoded payload)
 */
function generateMockToken(user) {
  const payload = {
    username: user.username,
    accessLevel: user.accessLevel,
    roles: user.roles,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
  };
  const token = Buffer.from(JSON.stringify(payload)).toString('base64');
  return `mock_${token}`;
}

/**
 * Authenticate user with username and password
 */
function authenticateUser(username, password) {
  const user = MOCK_USERS[username.toLowerCase()];

  if (!user) {
    return { success: false, error: 'User not found' };
  }

  // Special handling for superuser
  if (username.toLowerCase() === 'superuser') {
    const superuserPassword = getSuperuserPassword();
    if (password !== superuserPassword) {
      console.log(`[MOCK AUTH] Superuser password mismatch. Expected: ${superuserPassword}, Got: ${password}`);
      return { success: false, error: 'Invalid credentials' };
    }
  } else {
    // Hash the provided password and compare
    const hashedPassword = hashPassword(password);
    if (hashedPassword !== user.passwordHash) {
      console.log(`[MOCK AUTH] Password hash mismatch for ${username}`);
      return { success: false, error: 'Invalid credentials' };
    }
  }

  // Generate token
  const token = generateMockToken(user);
  const tokenId = crypto.randomUUID();

  return {
    success: true,
    data: {
      token,
      tokenId,
      username: user.username,
      accessLevel: user.accessLevel,
      roles: user.roles,
      fullName: user.fullName,
      email: user.email,
      expiresIn: 3600,
    },
  };
}

/**
 * Vite middleware to handle mock authentication
 */
export function mockAuthMiddleware() {
  return {
    name: 'mock-auth-middleware',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Handle POST /api/User/Login or /auth/login
        const isLoginRequest = req.method === 'POST' &&
          (req.url === '/api/User/Login' || req.url === '/auth/login');

        if (isLoginRequest) {
          let body = '';

          req.on('data', chunk => {
            body += chunk.toString();
          });

          req.on('end', () => {
            // Parse form data (application/x-www-form-urlencoded)
            const params = new URLSearchParams(body);
            const username = params.get('username');
            const password = params.get('password');

            console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
            console.log(`[MOCK AUTH] 🔐 Login Attempt`);
            console.log(`  Username:    ${username}`);
            console.log(`  Password:    ${password}`);
            console.log(`  Endpoint:    ${req.url}`);
            console.log(`  Date:        ${new Date().toISOString()}`);
            if (username === 'superuser') {
              console.log(`  Expected:    ${getSuperuserPassword()}`);
            }
            console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

            const result = authenticateUser(username, password);

            if (result.success) {
              console.log(`[MOCK AUTH] ✅ Login successful for ${username}`);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result.data));
            } else {
              console.log(`[MOCK AUTH] ❌ Login failed for ${username}: ${result.error}`);
              res.statusCode = 403;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                title: 'Authentication Failed',
                detail: result.error,
                status: 403,
              }));
            }
          });

          return; // Don't call next()
        }

        // Handle GET /api/User (get user info)
        if (req.method === 'GET' && req.url.startsWith('/api/User')) {
          const url = new URL(req.url, `http://${req.headers.host}`);
          const username = url.searchParams.get('username');

          if (username && MOCK_USERS[username.toLowerCase()]) {
            const user = MOCK_USERS[username.toLowerCase()];
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify([{
              username: user.username,
              accessLevel: user.accessLevel,
              roles: user.roles,
              fullName: user.fullName,
              email: user.email,
            }]));
          } else {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'User not found' }));
          }
          return;
        }

        next();
      });
    },
  };
}

export default mockAuthMiddleware;
