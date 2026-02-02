const bcrypt = require('bcrypt');
const db = require('../config/database');

const SALT_ROUNDS = 10;

/**
 * List all parents with optional search
 * GET /api/v1/parents
 * Query params: search, is_active
 */
const getAll = async (req, res) => {
  try {
    const { search, is_active = 'true' } = req.query;

    let query = `
      SELECT
        p.id, p.pin_code, p.address, p.employer, p.work_phone, p.created_at,
        u.id as user_id, u.email, u.first_name, u.last_name, u.phone, u.is_active,
        COUNT(pc.child_id) as children_count
      FROM parents p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN parent_children pc ON p.id = pc.parent_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    // Filter by active status
    if (is_active !== 'all') {
      paramCount++;
      query += ` AND u.is_active = $${paramCount}`;
      params.push(is_active === 'true');
    }

    // Search by name or email
    if (search) {
      paramCount++;
      query += ` AND (u.first_name ILIKE $${paramCount} OR u.last_name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ' GROUP BY p.id, u.id ORDER BY u.last_name, u.first_name';

    const result = await db.query(query, params);

    // Fetch linked children for all parents in one query
    const parentIds = result.rows.map(r => r.id);
    let childrenByParent = {};
    if (parentIds.length > 0) {
      const childrenResult = await db.query(`
        SELECT pc.parent_id, c.id, c.first_name, c.last_name
        FROM parent_children pc
        JOIN children c ON pc.child_id = c.id
        WHERE pc.parent_id = ANY($1)
        ORDER BY c.first_name
      `, [parentIds]);
      childrenResult.rows.forEach(row => {
        if (!childrenByParent[row.parent_id]) childrenByParent[row.parent_id] = [];
        childrenByParent[row.parent_id].push({
          id: row.id,
          firstName: row.first_name,
          lastName: row.last_name,
        });
      });
    }

    res.json({
      success: true,
      data: {
        parents: result.rows.map(parent => ({
          id: parent.id,
          userId: parent.user_id,
          email: parent.email,
          firstName: parent.first_name,
          lastName: parent.last_name,
          phone: parent.phone,
          pinCode: parent.pin_code ? '****' : null, // Mask PIN
          address: parent.address,
          employer: parent.employer,
          workPhone: parent.work_phone,
          isActive: parent.is_active,
          children: childrenByParent[parent.id] || [],
          childrenCount: parseInt(parent.children_count),
          createdAt: parent.created_at
        })),
        total: result.rows.length
      }
    });
  } catch (error) {
    console.error('Get parents error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch parents'
    });
  }
};

/**
 * Get single parent with linked children
 * GET /api/v1/parents/:id
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get parent with user info
    const parentResult = await db.query(`
      SELECT
        p.*, u.email, u.first_name, u.last_name, u.phone, u.is_active, u.created_at as user_created_at
      FROM parents p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = $1
    `, [id]);

    if (parentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Parent not found'
      });
    }

    const parent = parentResult.rows[0];

    // Get linked children
    const childrenResult = await db.query(`
      SELECT
        c.id, c.first_name, c.last_name, c.date_of_birth, c.photo_url,
        c.program_id, c.is_active,
        p.name as program_name, p.color as program_color,
        pc.relationship, pc.is_primary_contact, pc.is_authorized_pickup
      FROM children c
      LEFT JOIN programs p ON c.program_id = p.id
      JOIN parent_children pc ON c.id = pc.child_id
      WHERE pc.parent_id = $1
      ORDER BY c.last_name, c.first_name
    `, [id]);

    res.json({
      success: true,
      data: {
        parent: {
          id: parent.id,
          userId: parent.user_id,
          email: parent.email,
          firstName: parent.first_name,
          lastName: parent.last_name,
          phone: parent.phone,
          hasPin: !!parent.pin_code,
          address: parent.address,
          employer: parent.employer,
          workPhone: parent.work_phone,
          isActive: parent.is_active,
          createdAt: parent.created_at
        },
        children: childrenResult.rows.map(child => ({
          id: child.id,
          firstName: child.first_name,
          lastName: child.last_name,
          dateOfBirth: child.date_of_birth,
          photoUrl: child.photo_url,
          programId: child.program_id,
          programName: child.program_name,
          programColor: child.program_color,
          isActive: child.is_active,
          relationship: child.relationship,
          isPrimaryContact: child.is_primary_contact,
          isAuthorizedPickup: child.is_authorized_pickup
        }))
      }
    });
  } catch (error) {
    console.error('Get parent error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch parent'
    });
  }
};

/**
 * Create new parent (also creates user account)
 * POST /api/v1/parents
 */
const create = async (req, res) => {
  const client = await db.pool.connect();

  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      address,
      employer,
      workPhone,
      pinCode
    } = req.body;

    await client.query('BEGIN');

    // Check if email already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        error: 'Email already registered'
      });
    }

    // Check PIN uniqueness across parents and employees
    if (pinCode) {
      const pinExists = await client.query(`
        SELECT 'parent' AS source, id FROM parents WHERE pin_code = $1
        UNION ALL
        SELECT 'employee' AS source, id FROM employees WHERE pin_code = $1
      `, [pinCode]);
      if (pinExists.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          error: 'This PIN is already in use. Please choose a different PIN.'
        });
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user account
    const userResult = await client.query(`
      INSERT INTO users (email, password_hash, role, first_name, last_name, phone)
      VALUES ($1, $2, 'parent', $3, $4, $5)
      RETURNING id, email, first_name, last_name, phone, created_at
    `, [email.toLowerCase(), passwordHash, firstName, lastName, phone]);

    const user = userResult.rows[0];

    // Create parent record
    const parentResult = await client.query(`
      INSERT INTO parents (user_id, pin_code, address, employer, work_phone)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, pin_code, address, employer, work_phone, created_at
    `, [user.id, pinCode, address, employer, workPhone]);

    const parent = parentResult.rows[0];

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      data: {
        parent: {
          id: parent.id,
          userId: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          phone: user.phone,
          hasPin: !!parent.pin_code,
          address: parent.address,
          employer: parent.employer,
          workPhone: parent.work_phone,
          createdAt: parent.created_at
        }
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create parent error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create parent'
    });
  } finally {
    client.release();
  }
};

/**
 * Update parent
 * PUT /api/v1/parents/:id
 */
const update = async (req, res) => {
  const client = await db.pool.connect();

  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      phone,
      address,
      employer,
      workPhone,
      isActive
    } = req.body;

    await client.query('BEGIN');

    // Get parent to find user_id
    const parentCheck = await client.query(
      'SELECT user_id FROM parents WHERE id = $1',
      [id]
    );

    if (parentCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        error: 'Parent not found'
      });
    }

    const userId = parentCheck.rows[0].user_id;

    // Update user info
    if (firstName || lastName || phone || isActive !== undefined) {
      await client.query(`
        UPDATE users SET
          first_name = COALESCE($1, first_name),
          last_name = COALESCE($2, last_name),
          phone = COALESCE($3, phone),
          is_active = COALESCE($4, is_active),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
      `, [firstName, lastName, phone, isActive, userId]);
    }

    // Update parent info
    await client.query(`
      UPDATE parents SET
        address = COALESCE($1, address),
        employer = COALESCE($2, employer),
        work_phone = COALESCE($3, work_phone)
      WHERE id = $4
    `, [address, employer, workPhone, id]);

    await client.query('COMMIT');

    // Fetch updated parent
    const result = await db.query(`
      SELECT
        p.*, u.email, u.first_name, u.last_name, u.phone, u.is_active
      FROM parents p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = $1
    `, [id]);

    const parent = result.rows[0];

    res.json({
      success: true,
      data: {
        parent: {
          id: parent.id,
          userId: parent.user_id,
          email: parent.email,
          firstName: parent.first_name,
          lastName: parent.last_name,
          phone: parent.phone,
          hasPin: !!parent.pin_code,
          address: parent.address,
          employer: parent.employer,
          workPhone: parent.work_phone,
          isActive: parent.is_active
        }
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update parent error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update parent'
    });
  } finally {
    client.release();
  }
};

/**
 * Soft delete parent (deactivate user)
 * DELETE /api/v1/parents/:id
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    // Get user_id
    const parentCheck = await db.query(
      'SELECT user_id FROM parents WHERE id = $1',
      [id]
    );

    if (parentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Parent not found'
      });
    }

    // Deactivate user account
    const result = await db.query(`
      UPDATE users SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING first_name, last_name
    `, [parentCheck.rows[0].user_id]);

    res.json({
      success: true,
      data: {
        message: `Parent ${result.rows[0].first_name} ${result.rows[0].last_name} deactivated`
      }
    });
  } catch (error) {
    console.error('Delete parent error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete parent'
    });
  }
};

/**
 * Link parent to child
 * POST /api/v1/parents/:id/link-child
 */
const linkChild = async (req, res) => {
  try {
    const { id } = req.params;
    const { childId, relationship, isPrimaryContact, isAuthorizedPickup } = req.body;

    // Check parent exists
    const parentCheck = await db.query('SELECT id FROM parents WHERE id = $1', [id]);
    if (parentCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Parent not found'
      });
    }

    // Check child exists
    const childCheck = await db.query('SELECT id, first_name, last_name FROM children WHERE id = $1', [childId]);
    if (childCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Child not found'
      });
    }

    // Check if link already exists
    const existingLink = await db.query(
      'SELECT id FROM parent_children WHERE parent_id = $1 AND child_id = $2',
      [id, childId]
    );

    if (existingLink.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Parent is already linked to this child'
      });
    }

    // Create link
    const result = await db.query(`
      INSERT INTO parent_children (parent_id, child_id, relationship, is_primary_contact, is_authorized_pickup)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [id, childId, relationship, isPrimaryContact || false, isAuthorizedPickup !== false]);

    const child = childCheck.rows[0];

    res.status(201).json({
      success: true,
      data: {
        message: `Linked to ${child.first_name} ${child.last_name}`,
        link: {
          parentId: id,
          childId: childId,
          relationship: result.rows[0].relationship,
          isPrimaryContact: result.rows[0].is_primary_contact,
          isAuthorizedPickup: result.rows[0].is_authorized_pickup
        }
      }
    });
  } catch (error) {
    console.error('Link child error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to link child'
    });
  }
};

/**
 * Unlink parent from child
 * DELETE /api/v1/parents/:id/unlink-child
 */
const unlinkChild = async (req, res) => {
  try {
    const { id } = req.params;
    const { childId } = req.body;

    const result = await db.query(`
      DELETE FROM parent_children
      WHERE parent_id = $1 AND child_id = $2
      RETURNING *
    `, [id, childId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Link not found'
      });
    }

    res.json({
      success: true,
      data: {
        message: 'Child unlinked successfully'
      }
    });
  } catch (error) {
    console.error('Unlink child error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unlink child'
    });
  }
};

/**
 * Set/update PIN code
 * PUT /api/v1/parents/:id/pin
 */
const updatePin = async (req, res) => {
  try {
    const { id } = req.params;
    const { pinCode } = req.body;

    // Check PIN uniqueness across parents and employees (exclude this parent)
    if (pinCode) {
      const pinExists = await db.query(`
        SELECT 'parent' AS source, id FROM parents WHERE pin_code = $1 AND id != $2
        UNION ALL
        SELECT 'employee' AS source, id FROM employees WHERE pin_code = $1
      `, [pinCode, id]);
      if (pinExists.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'This PIN is already in use. Please choose a different PIN.'
        });
      }
    }

    const result = await db.query(`
      UPDATE parents SET pin_code = $1
      WHERE id = $2
      RETURNING id
    `, [pinCode, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Parent not found'
      });
    }

    res.json({
      success: true,
      data: {
        message: pinCode ? 'PIN code updated' : 'PIN code removed'
      }
    });
  } catch (error) {
    console.error('Update PIN error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update PIN'
    });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  linkChild,
  unlinkChild,
  updatePin
};
