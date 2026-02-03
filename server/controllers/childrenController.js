const db = require('../config/database');
const { uploadToS3, deleteFromS3, getKeyFromUrl } = require('../services/uploadService');

/**
 * List all children with optional search and filter
 * GET /api/v1/children
 * Query params: search, program_id, is_active
 */
const getAll = async (req, res) => {
  try {
    const { search, program_id, is_active = 'true' } = req.query;

    let query = `
      SELECT
        c.id, c.first_name, c.last_name, c.date_of_birth, c.photo_url,
        c.program_id, c.allergies, c.medical_notes,
        c.emergency_contact_name, c.emergency_contact_phone,
        c.enrollment_date, c.is_active, c.created_at, c.updated_at,
        p.name as program_name, p.color as program_color
      FROM children c
      LEFT JOIN programs p ON c.program_id = p.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    // Filter by active status
    if (is_active !== 'all') {
      paramCount++;
      query += ` AND c.is_active = $${paramCount}`;
      params.push(is_active === 'true');
    }

    // Filter by program
    if (program_id) {
      paramCount++;
      query += ` AND c.program_id = $${paramCount}`;
      params.push(program_id);
    }

    // Search by name
    if (search) {
      paramCount++;
      query += ` AND (c.first_name ILIKE $${paramCount} OR c.last_name ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    query += ' ORDER BY c.last_name, c.first_name';

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: {
        children: result.rows.map(child => ({
          id: child.id,
          firstName: child.first_name,
          lastName: child.last_name,
          dateOfBirth: child.date_of_birth,
          photoUrl: child.photo_url,
          programId: child.program_id,
          programName: child.program_name,
          programColor: child.program_color,
          allergies: child.allergies,
          medicalNotes: child.medical_notes,
          emergencyContactName: child.emergency_contact_name,
          emergencyContactPhone: child.emergency_contact_phone,
          enrollmentDate: child.enrollment_date,
          isActive: child.is_active,
          createdAt: child.created_at,
          updatedAt: child.updated_at
        })),
        total: result.rows.length
      }
    });
  } catch (error) {
    console.error('Get children error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch children'
    });
  }
};

/**
 * Get single child with parents and recent attendance
 * GET /api/v1/children/:id
 */
const getById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get child with program info
    const childResult = await db.query(`
      SELECT
        c.*, p.name as program_name, p.color as program_color
      FROM children c
      LEFT JOIN programs p ON c.program_id = p.id
      WHERE c.id = $1
    `, [id]);

    if (childResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Child not found'
      });
    }

    const child = childResult.rows[0];

    // Get linked parents
    const parentsResult = await db.query(`
      SELECT
        p.id, u.first_name, u.last_name, u.email, u.phone,
        pc.relationship, pc.is_primary_contact, pc.is_authorized_pickup
      FROM parents p
      JOIN users u ON p.user_id = u.id
      JOIN parent_children pc ON p.id = pc.parent_id
      WHERE pc.child_id = $1
    `, [id]);

    // Get authorized pickups (non-parents)
    const pickupsResult = await db.query(`
      SELECT id, name, relationship, phone, photo_url, is_active
      FROM authorized_pickups
      WHERE child_id = $1 AND is_active = true
    `, [id]);

    // Get recent attendance (last 30 days)
    const attendanceResult = await db.query(`
      SELECT
        id, checkin_date, check_in_time, check_out_time,
        checked_in_by_name, checked_out_by_name, notes
      FROM child_checkins
      WHERE child_id = $1 AND checkin_date >= CURRENT_DATE - INTERVAL '30 days'
      ORDER BY checkin_date DESC
    `, [id]);

    res.json({
      success: true,
      data: {
        child: {
          id: child.id,
          firstName: child.first_name,
          lastName: child.last_name,
          dateOfBirth: child.date_of_birth,
          photoUrl: child.photo_url,
          programId: child.program_id,
          programName: child.program_name,
          programColor: child.program_color,
          allergies: child.allergies,
          medicalNotes: child.medical_notes,
          emergencyContactName: child.emergency_contact_name,
          emergencyContactPhone: child.emergency_contact_phone,
          enrollmentDate: child.enrollment_date,
          isActive: child.is_active,
          createdAt: child.created_at,
          updatedAt: child.updated_at
        },
        parents: parentsResult.rows.map(p => ({
          id: p.id,
          firstName: p.first_name,
          lastName: p.last_name,
          email: p.email,
          phone: p.phone,
          relationship: p.relationship,
          isPrimaryContact: p.is_primary_contact,
          isAuthorizedPickup: p.is_authorized_pickup
        })),
        authorizedPickups: pickupsResult.rows.map(ap => ({
          id: ap.id,
          name: ap.name,
          relationship: ap.relationship,
          phone: ap.phone,
          photoUrl: ap.photo_url
        })),
        recentAttendance: attendanceResult.rows.map(a => ({
          id: a.id,
          date: a.checkin_date,
          checkInTime: a.check_in_time,
          checkOutTime: a.check_out_time,
          checkedInBy: a.checked_in_by_name,
          checkedOutBy: a.checked_out_by_name,
          notes: a.notes
        }))
      }
    });
  } catch (error) {
    console.error('Get child error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch child'
    });
  }
};

/**
 * Create new child
 * POST /api/v1/children
 */
const create = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      dateOfBirth,
      photoUrl,
      programId,
      allergies,
      medicalNotes,
      emergencyContactName,
      emergencyContactPhone,
      enrollmentDate
    } = req.body;

    const result = await db.query(`
      INSERT INTO children (
        first_name, last_name, date_of_birth, photo_url, program_id,
        allergies, medical_notes, emergency_contact_name, emergency_contact_phone,
        enrollment_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [
      firstName, lastName, dateOfBirth, photoUrl, programId,
      allergies, medicalNotes, emergencyContactName, emergencyContactPhone,
      enrollmentDate || new Date()
    ]);

    const child = result.rows[0];

    res.status(201).json({
      success: true,
      data: {
        child: {
          id: child.id,
          firstName: child.first_name,
          lastName: child.last_name,
          dateOfBirth: child.date_of_birth,
          photoUrl: child.photo_url,
          programId: child.program_id,
          allergies: child.allergies,
          medicalNotes: child.medical_notes,
          emergencyContactName: child.emergency_contact_name,
          emergencyContactPhone: child.emergency_contact_phone,
          enrollmentDate: child.enrollment_date,
          isActive: child.is_active,
          createdAt: child.created_at
        }
      }
    });
  } catch (error) {
    console.error('Create child error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create child'
    });
  }
};

/**
 * Update child
 * PUT /api/v1/children/:id
 */
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      dateOfBirth,
      photoUrl,
      programId,
      allergies,
      medicalNotes,
      emergencyContactName,
      emergencyContactPhone,
      enrollmentDate,
      isActive
    } = req.body;

    // Check if child exists
    const existing = await db.query('SELECT id FROM children WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Child not found'
      });
    }

    const result = await db.query(`
      UPDATE children SET
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        date_of_birth = COALESCE($3, date_of_birth),
        photo_url = COALESCE($4, photo_url),
        program_id = COALESCE($5, program_id),
        allergies = COALESCE($6, allergies),
        medical_notes = COALESCE($7, medical_notes),
        emergency_contact_name = COALESCE($8, emergency_contact_name),
        emergency_contact_phone = COALESCE($9, emergency_contact_phone),
        enrollment_date = COALESCE($10, enrollment_date),
        is_active = COALESCE($11, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
      RETURNING *
    `, [
      firstName, lastName, dateOfBirth, photoUrl, programId,
      allergies, medicalNotes, emergencyContactName, emergencyContactPhone,
      enrollmentDate, isActive, id
    ]);

    const child = result.rows[0];

    res.json({
      success: true,
      data: {
        child: {
          id: child.id,
          firstName: child.first_name,
          lastName: child.last_name,
          dateOfBirth: child.date_of_birth,
          photoUrl: child.photo_url,
          programId: child.program_id,
          allergies: child.allergies,
          medicalNotes: child.medical_notes,
          emergencyContactName: child.emergency_contact_name,
          emergencyContactPhone: child.emergency_contact_phone,
          enrollmentDate: child.enrollment_date,
          isActive: child.is_active,
          updatedAt: child.updated_at
        }
      }
    });
  } catch (error) {
    console.error('Update child error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update child'
    });
  }
};

/**
 * Soft delete child (set is_active = false)
 * DELETE /api/v1/children/:id
 */
const remove = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      UPDATE children SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, first_name, last_name
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Child not found'
      });
    }

    res.json({
      success: true,
      data: {
        message: `Child ${result.rows[0].first_name} ${result.rows[0].last_name} deactivated`
      }
    });
  } catch (error) {
    console.error('Delete child error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete child'
    });
  }
};

/**
 * Upload / replace child profile photo
 * POST /api/v1/children/:id/photo
 * Accepts multipart/form-data with "file" field
 * Accessible by admin AND parent (parent access verified in route)
 */
const uploadPhoto = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file provided',
      });
    }

    // Verify child exists
    const childResult = await db.query(
      'SELECT id, photo_url FROM children WHERE id = $1',
      [id]
    );

    if (childResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Child not found',
      });
    }

    const oldPhotoUrl = childResult.rows[0].photo_url;

    // Upload new photo to S3
    const { url } = await uploadToS3(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      'children-photos'
    );

    // Update database
    await db.query(
      'UPDATE children SET photo_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [url, id]
    );

    // Delete old photo from S3 (best-effort, don't fail if this errors)
    if (oldPhotoUrl) {
      const oldKey = getKeyFromUrl(oldPhotoUrl);
      if (oldKey) {
        deleteFromS3(oldKey).catch(err =>
          console.error('Failed to delete old photo:', err)
        );
      }
    }

    res.json({
      success: true,
      data: {
        photoUrl: url,
        message: 'Photo uploaded successfully',
      },
    });
  } catch (error) {
    console.error('Upload child photo error:', error);

    if (error.message.includes('Invalid file type') || error.message.includes('File too large')) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to upload photo',
    });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  uploadPhoto,
};
