// ============================================================================
// EJLOG WMS - User Management API Routes
// Gestione utenti e permessi
// ============================================================================

import express from 'express';
import sql from 'mssql';
import { getPool } from '../db-config.js';
import bcrypt from 'bcrypt';

const router = express.Router();

/**
 * Ensure UserManagement tables exist
 */
async function ensureUserManagementTables() {
  try {
    const pool = await getPool();

    // Users table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='WmsUsers' AND xtype='U')
      BEGIN
        CREATE TABLE WmsUsers (
          id INT IDENTITY(1,1) PRIMARY KEY,
          username NVARCHAR(100) NOT NULL UNIQUE,
          email NVARCHAR(255) NOT NULL UNIQUE,
          fullName NVARCHAR(200) NOT NULL,
          password NVARCHAR(255) NOT NULL,
          role NVARCHAR(50) NOT NULL DEFAULT 'user',
          status NVARCHAR(20) NOT NULL DEFAULT 'active',
          department NVARCHAR(100),
          phoneNumber NVARCHAR(50),
          lastLogin DATETIME,
          createdDate DATETIME DEFAULT GETDATE(),
          modifiedDate DATETIME DEFAULT GETDATE(),
          createdBy NVARCHAR(100),
          modifiedBy NVARCHAR(100)
        )
      END
    `);

    // Roles table
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='WmsRoles' AND xtype='U')
      BEGIN
        CREATE TABLE WmsRoles (
          id INT IDENTITY(1,1) PRIMARY KEY,
          roleName NVARCHAR(50) NOT NULL UNIQUE,
          displayName NVARCHAR(100) NOT NULL,
          description NVARCHAR(MAX),
          permissions NVARCHAR(MAX) NOT NULL,
          createdDate DATETIME DEFAULT GETDATE(),
          modifiedDate DATETIME DEFAULT GETDATE()
        )
      END
    `);

    // User permissions (additional granular permissions)
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='WmsUserPermissions' AND xtype='U')
      BEGIN
        CREATE TABLE WmsUserPermissions (
          id INT IDENTITY(1,1) PRIMARY KEY,
          userId INT NOT NULL,
          permission NVARCHAR(100) NOT NULL,
          createdDate DATETIME DEFAULT GETDATE(),
          FOREIGN KEY (userId) REFERENCES WmsUsers(id) ON DELETE CASCADE,
          UNIQUE (userId, permission)
        )
      END
    `);

    // Insert default roles if not exists
    const rolesCheck = await pool.request()
      .query('SELECT COUNT(*) as count FROM WmsRoles');

    if (rolesCheck.recordset[0].count === 0) {
      const defaultRoles = [
        {
          roleName: 'admin',
          displayName: 'Administrator',
          description: 'Full system access',
          permissions: JSON.stringify(['all']),
        },
        {
          roleName: 'manager',
          displayName: 'Manager',
          description: 'Warehouse management access',
          permissions: JSON.stringify(['users.view', 'operations.manage', 'reports.view', 'inventory.manage']),
        },
        {
          roleName: 'operator',
          displayName: 'Operator',
          description: 'Standard operator access',
          permissions: JSON.stringify(['operations.execute', 'inventory.view', 'reports.view']),
        },
        {
          roleName: 'viewer',
          displayName: 'Viewer',
          description: 'Read-only access',
          permissions: JSON.stringify(['operations.view', 'inventory.view', 'reports.view']),
        },
      ];

      for (const role of defaultRoles) {
        await pool.request()
          .input('roleName', sql.NVarChar, role.roleName)
          .input('displayName', sql.NVarChar, role.displayName)
          .input('description', sql.NVarChar, role.description)
          .input('permissions', sql.NVarChar, role.permissions)
          .query(`
            INSERT INTO WmsRoles (roleName, displayName, description, permissions)
            VALUES (@roleName, @displayName, @description, @permissions)
          `);
      }
    }

    // Insert default admin user if not exists
    const usersCheck = await pool.request()
      .query('SELECT COUNT(*) as count FROM WmsUsers');

    if (usersCheck.recordset[0].count === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);

      await pool.request()
        .input('username', sql.NVarChar, 'admin')
        .input('email', sql.NVarChar, 'admin@ejlog.com')
        .input('fullName', sql.NVarChar, 'System Administrator')
        .input('password', sql.NVarChar, hashedPassword)
        .input('role', sql.NVarChar, 'admin')
        .input('status', sql.NVarChar, 'active')
        .query(`
          INSERT INTO WmsUsers (username, email, fullName, password, role, status)
          VALUES (@username, @email, @fullName, @password, @role, @status)
        `);
    }

    console.log('✅ UserManagement tables ready');
  } catch (error) {
    console.error('Errore creazione tabelle UserManagement:', error);
    throw error;
  }
}

// Initialize tables
ensureUserManagementTables();

/**
 * GET /api/users
 * Recupera lista utenti con filtri e paginazione
 */
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 50,
      search = '',
      role = '',
      status = '',
      sortBy = 'createdDate',
      sortOrder = 'DESC'
    } = req.query;

    const pool = await getPool();

    let whereConditions = [];
    const request = pool.request();

    if (search) {
      whereConditions.push(`(username LIKE @search OR email LIKE @search OR fullName LIKE @search)`);
      request.input('search', sql.NVarChar, `%${search}%`);
    }

    if (role) {
      whereConditions.push(`role = @role`);
      request.input('role', sql.NVarChar, role);
    }

    if (status) {
      whereConditions.push(`status = @status`);
      request.input('status', sql.NVarChar, status);
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Get total count
    const countResult = await request.query(`
      SELECT COUNT(*) as total FROM WmsUsers ${whereClause}
    `);
    const total = countResult.recordset[0].total;

    // Get paginated users
    const offset = (page - 1) * pageSize;
    const validSortBy = ['username', 'email', 'fullName', 'role', 'status', 'createdDate', 'lastLogin'].includes(sortBy)
      ? sortBy
      : 'createdDate';
    const validSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const result = await pool.request()
      .input('search', sql.NVarChar, search ? `%${search}%` : '')
      .input('role', sql.NVarChar, role || '')
      .input('status', sql.NVarChar, status || '')
      .input('offset', sql.Int, offset)
      .input('pageSize', sql.Int, parseInt(pageSize))
      .query(`
        SELECT
          id, username, email, fullName, role, status, department,
          phoneNumber, lastLogin, createdDate, modifiedDate, createdBy, modifiedBy
        FROM WmsUsers
        ${whereClause}
        ORDER BY ${validSortBy} ${validSortOrder}
        OFFSET @offset ROWS
        FETCH NEXT @pageSize ROWS ONLY
      `);

    // Get user permissions for each user
    const users = await Promise.all(result.recordset.map(async (user) => {
      const permsResult = await pool.request()
        .input('userId', sql.Int, user.id)
        .query('SELECT permission FROM WmsUserPermissions WHERE userId = @userId');

      return {
        ...user,
        additionalPermissions: permsResult.recordset.map(p => p.permission),
      };
    }));

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Errore recupero utenti:', error);
    res.status(500).json({
      success: false,
      error: 'Errore recupero utenti',
      details: error.message,
    });
  }
});

/**
 * GET /api/users/:id
 * Recupera singolo utente
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    const result = await pool.request()
      .input('id', sql.Int, id)
      .query(`
        SELECT
          id, username, email, fullName, role, status, department,
          phoneNumber, lastLogin, createdDate, modifiedDate, createdBy, modifiedBy
        FROM WmsUsers
        WHERE id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Get additional permissions
    const permsResult = await pool.request()
      .input('userId', sql.Int, id)
      .query('SELECT permission FROM WmsUserPermissions WHERE userId = @userId');

    const user = {
      ...result.recordset[0],
      additionalPermissions: permsResult.recordset.map(p => p.permission),
    };

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Errore recupero utente:', error);
    res.status(500).json({
      success: false,
      error: 'Errore recupero utente',
      details: error.message,
    });
  }
});

/**
 * POST /api/users
 * Crea nuovo utente
 */
router.post('/', async (req, res) => {
  try {
    const {
      username,
      email,
      fullName,
      password,
      role = 'user',
      status = 'active',
      department,
      phoneNumber,
      additionalPermissions = [],
      createdBy,
    } = req.body;

    if (!username || !email || !fullName || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: username, email, fullName, password',
      });
    }

    const pool = await getPool();

    // Check if username or email already exists
    const existingUser = await pool.request()
      .input('username', sql.NVarChar, username)
      .input('email', sql.NVarChar, email)
      .query('SELECT id FROM WmsUsers WHERE username = @username OR email = @email');

    if (existingUser.recordset.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Username or email already exists',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const result = await pool.request()
      .input('username', sql.NVarChar, username)
      .input('email', sql.NVarChar, email)
      .input('fullName', sql.NVarChar, fullName)
      .input('password', sql.NVarChar, hashedPassword)
      .input('role', sql.NVarChar, role)
      .input('status', sql.NVarChar, status)
      .input('department', sql.NVarChar, department || null)
      .input('phoneNumber', sql.NVarChar, phoneNumber || null)
      .input('createdBy', sql.NVarChar, createdBy || null)
      .query(`
        INSERT INTO WmsUsers (username, email, fullName, password, role, status, department, phoneNumber, createdBy)
        OUTPUT INSERTED.id
        VALUES (@username, @email, @fullName, @password, @role, @status, @department, @phoneNumber, @createdBy)
      `);

    const userId = result.recordset[0].id;

    // Insert additional permissions
    if (additionalPermissions.length > 0) {
      for (const permission of additionalPermissions) {
        await pool.request()
          .input('userId', sql.Int, userId)
          .input('permission', sql.NVarChar, permission)
          .query(`
            INSERT INTO WmsUserPermissions (userId, permission)
            VALUES (@userId, @permission)
          `);
      }
    }

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { id: userId },
    });
  } catch (error) {
    console.error('Errore creazione utente:', error);
    res.status(500).json({
      success: false,
      error: 'Errore creazione utente',
      details: error.message,
    });
  }
});

/**
 * PUT /api/users/:id
 * Aggiorna utente esistente
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      email,
      fullName,
      password,
      role,
      status,
      department,
      phoneNumber,
      additionalPermissions,
      modifiedBy,
    } = req.body;

    const pool = await getPool();

    // Check if user exists
    const existing = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT id FROM WmsUsers WHERE id = @id');

    if (existing.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Build update query dynamically
    let updates = [];
    const request = pool.request().input('id', sql.Int, id);

    if (email !== undefined) {
      updates.push('email = @email');
      request.input('email', sql.NVarChar, email);
    }
    if (fullName !== undefined) {
      updates.push('fullName = @fullName');
      request.input('fullName', sql.NVarChar, fullName);
    }
    if (password !== undefined && password !== '') {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push('password = @password');
      request.input('password', sql.NVarChar, hashedPassword);
    }
    if (role !== undefined) {
      updates.push('role = @role');
      request.input('role', sql.NVarChar, role);
    }
    if (status !== undefined) {
      updates.push('status = @status');
      request.input('status', sql.NVarChar, status);
    }
    if (department !== undefined) {
      updates.push('department = @department');
      request.input('department', sql.NVarChar, department);
    }
    if (phoneNumber !== undefined) {
      updates.push('phoneNumber = @phoneNumber');
      request.input('phoneNumber', sql.NVarChar, phoneNumber);
    }
    if (modifiedBy !== undefined) {
      updates.push('modifiedBy = @modifiedBy');
      request.input('modifiedBy', sql.NVarChar, modifiedBy);
    }

    updates.push('modifiedDate = GETDATE()');

    if (updates.length > 1) { // At least modifiedDate
      await request.query(`
        UPDATE WmsUsers
        SET ${updates.join(', ')}
        WHERE id = @id
      `);
    }

    // Update additional permissions if provided
    if (additionalPermissions !== undefined) {
      // Delete existing permissions
      await pool.request()
        .input('userId', sql.Int, id)
        .query('DELETE FROM WmsUserPermissions WHERE userId = @userId');

      // Insert new permissions
      for (const permission of additionalPermissions) {
        await pool.request()
          .input('userId', sql.Int, id)
          .input('permission', sql.NVarChar, permission)
          .query(`
            INSERT INTO WmsUserPermissions (userId, permission)
            VALUES (@userId, @permission)
          `);
      }
    }

    res.json({
      success: true,
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('Errore aggiornamento utente:', error);
    res.status(500).json({
      success: false,
      error: 'Errore aggiornamento utente',
      details: error.message,
    });
  }
});

/**
 * DELETE /api/users/:id
 * Elimina utente
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();

    // Check if user exists
    const existing = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT id FROM WmsUsers WHERE id = @id');

    if (existing.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    // Delete user (cascade will delete permissions)
    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM WmsUsers WHERE id = @id');

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Errore eliminazione utente:', error);
    res.status(500).json({
      success: false,
      error: 'Errore eliminazione utente',
      details: error.message,
    });
  }
});

/**
 * GET /api/users/roles
 * Recupera lista ruoli disponibili
 */
router.get('/roles/list', async (req, res) => {
  try {
    const pool = await getPool();

    const result = await pool.request()
      .query('SELECT * FROM WmsRoles ORDER BY roleName');

    const roles = result.recordset.map(role => ({
      ...role,
      permissions: JSON.parse(role.permissions),
    }));

    res.json({
      success: true,
      data: roles,
    });
  } catch (error) {
    console.error('Errore recupero ruoli:', error);
    res.status(500).json({
      success: false,
      error: 'Errore recupero ruoli',
      details: error.message,
    });
  }
});

/**
 * POST /api/users/:id/reset-password
 * Reset password utente
 */
router.post('/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: newPassword',
      });
    }

    const pool = await getPool();

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await pool.request()
      .input('id', sql.Int, id)
      .input('password', sql.NVarChar, hashedPassword)
      .query(`
        UPDATE WmsUsers
        SET password = @password, modifiedDate = GETDATE()
        WHERE id = @id
      `);

    res.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Errore reset password:', error);
    res.status(500).json({
      success: false,
      error: 'Errore reset password',
      details: error.message,
    });
  }
});

export default router;
