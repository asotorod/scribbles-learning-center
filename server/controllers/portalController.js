const db = require('../config/database');

/**
 * Helper: Get parent record for current user
 */
const getParentByUserId = async (userId) => {
  const result = await db.query(
    'SELECT id FROM parents WHERE user_id = $1',
    [userId]
  );
  return result.rows[0];
};

/**
 * Helper: Check if parent has access to child
 */
const parentHasAccessToChild = async (parentId, childId) => {
  const result = await db.query(
    'SELECT id FROM parent_children WHERE parent_id = $1 AND child_id = $2',
    [parentId, childId]
  );
  return result.rows.length > 0;
};

/**
 * Helper: Check if parent owns absence
 */
const parentOwnsAbsence = async (parentId, absenceId) => {
  const result = await db.query(
    'SELECT id FROM absences WHERE id = $1 AND reported_by = $2',
    [absenceId, parentId]
  );
  return result.rows.length > 0;
};

// ============================================
// DASHBOARD & CHILDREN
// ============================================

/**
 * Get parent dashboard
 * GET /api/v1/portal/dashboard
 */
const getDashboard = async (req, res) => {
  try {
    const parent = await getParentByUserId(req.user.id);

    if (!parent) {
      return res.status(404).json({
        success: false,
        error: 'Parent profile not found'
      });
    }

    // Get children with today's status
    const childrenResult = await db.query(`
      SELECT
        c.id, c.first_name, c.last_name, c.date_of_birth, c.photo_url,
        c.program_id, c.is_active,
        p.name as program_name, p.color as program_color,
        pc.relationship,
        cc.check_in_time, cc.check_out_time
      FROM children c
      JOIN parent_children pc ON c.id = pc.child_id
      LEFT JOIN programs p ON c.program_id = p.id
      LEFT JOIN child_checkins cc ON c.id = cc.child_id AND cc.checkin_date = CURRENT_DATE
      WHERE pc.parent_id = $1 AND c.is_active = true
      ORDER BY c.first_name
    `, [parent.id]);

    // Get upcoming absences (next 7 days)
    const upcomingAbsencesResult = await db.query(`
      SELECT
        a.id, a.child_id, a.start_date, a.end_date, a.status,
        c.first_name as child_first_name, c.last_name as child_last_name,
        ar.name as reason_name
      FROM absences a
      JOIN children c ON a.child_id = c.id
      JOIN parent_children pc ON c.id = pc.child_id
      LEFT JOIN absence_reasons ar ON a.reason_id = ar.id
      WHERE pc.parent_id = $1
        AND a.reported_by = $1
        AND a.start_date <= CURRENT_DATE + INTERVAL '7 days'
        AND (a.end_date >= CURRENT_DATE OR a.start_date >= CURRENT_DATE)
        AND a.status != 'cancelled'
      ORDER BY a.start_date
      LIMIT 5
    `, [parent.id]);

    // Determine today's status for each child
    const children = childrenResult.rows.map(child => {
      let todayStatus = 'not_checked_in';
      if (child.check_in_time && child.check_out_time) {
        todayStatus = 'checked_out';
      } else if (child.check_in_time) {
        todayStatus = 'checked_in';
      }

      return {
        id: child.id,
        firstName: child.first_name,
        lastName: child.last_name,
        dateOfBirth: child.date_of_birth,
        photoUrl: child.photo_url,
        programId: child.program_id,
        programName: child.program_name,
        programColor: child.program_color,
        relationship: child.relationship,
        todayStatus,
        checkInTime: child.check_in_time,
        checkOutTime: child.check_out_time
      };
    });

    res.json({
      success: true,
      data: {
        parent: {
          firstName: req.user.firstName,
          lastName: req.user.lastName
        },
        children,
        upcomingAbsences: upcomingAbsencesResult.rows.map(a => ({
          id: a.id,
          childId: a.child_id,
          childName: `${a.child_first_name} ${a.child_last_name}`,
          startDate: a.start_date,
          endDate: a.end_date,
          reasonName: a.reason_name,
          status: a.status
        })),
        stats: {
          totalChildren: children.length,
          checkedIn: children.filter(c => c.todayStatus === 'checked_in').length,
          checkedOut: children.filter(c => c.todayStatus === 'checked_out').length
        }
      }
    });
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load dashboard'
    });
  }
};

/**
 * Get parent's linked children
 * GET /api/v1/portal/my-children
 */
const getMyChildren = async (req, res) => {
  try {
    const parent = await getParentByUserId(req.user.id);

    if (!parent) {
      return res.status(404).json({
        success: false,
        error: 'Parent profile not found'
      });
    }

    const result = await db.query(`
      SELECT
        c.id, c.first_name, c.last_name, c.date_of_birth, c.photo_url,
        c.program_id, c.allergies, c.medical_notes,
        c.emergency_contact_name, c.emergency_contact_phone,
        c.enrollment_date, c.is_active,
        p.name as program_name, p.color as program_color,
        pc.relationship, pc.is_primary_contact
      FROM children c
      JOIN parent_children pc ON c.id = pc.child_id
      LEFT JOIN programs p ON c.program_id = p.id
      WHERE pc.parent_id = $1 AND c.is_active = true
      ORDER BY c.first_name
    `, [parent.id]);

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
          relationship: child.relationship,
          isPrimaryContact: child.is_primary_contact
        }))
      }
    });
  } catch (error) {
    console.error('Get my children error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load children'
    });
  }
};

/**
 * Get single child details with attendance history
 * GET /api/v1/portal/my-children/:id
 */
const getMyChild = async (req, res) => {
  try {
    const { id } = req.params;
    const parent = await getParentByUserId(req.user.id);

    if (!parent) {
      return res.status(404).json({
        success: false,
        error: 'Parent profile not found'
      });
    }

    // Check parent has access to this child
    const hasAccess = await parentHasAccessToChild(parent.id, id);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this child'
      });
    }

    // Get child details
    const childResult = await db.query(`
      SELECT
        c.*, p.name as program_name, p.color as program_color,
        pc.relationship, pc.is_primary_contact
      FROM children c
      JOIN parent_children pc ON c.id = pc.child_id
      LEFT JOIN programs p ON c.program_id = p.id
      WHERE c.id = $1 AND pc.parent_id = $2
    `, [id, parent.id]);

    if (childResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Child not found'
      });
    }

    const child = childResult.rows[0];

    // Get attendance history (last 30 days)
    const attendanceResult = await db.query(`
      SELECT
        id, checkin_date, check_in_time, check_out_time,
        checked_in_by_name, checked_out_by_name
      FROM child_checkins
      WHERE child_id = $1 AND checkin_date >= CURRENT_DATE - INTERVAL '30 days'
      ORDER BY checkin_date DESC
    `, [id]);

    // Get absences (past and upcoming)
    const absencesResult = await db.query(`
      SELECT
        a.id, a.start_date, a.end_date, a.notes, a.status,
        a.acknowledged_at, a.reported_at,
        ar.name as reason_name
      FROM absences a
      LEFT JOIN absence_reasons ar ON a.reason_id = ar.id
      WHERE a.child_id = $1
      ORDER BY a.start_date DESC
      LIMIT 20
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
          relationship: child.relationship,
          isPrimaryContact: child.is_primary_contact
        },
        attendanceHistory: attendanceResult.rows.map(a => ({
          id: a.id,
          date: a.checkin_date,
          checkInTime: a.check_in_time,
          checkOutTime: a.check_out_time,
          checkedInBy: a.checked_in_by_name,
          checkedOutBy: a.checked_out_by_name
        })),
        absences: absencesResult.rows.map(a => ({
          id: a.id,
          startDate: a.start_date,
          endDate: a.end_date,
          reasonName: a.reason_name,
          notes: a.notes,
          status: a.status,
          reportedAt: a.reported_at,
          acknowledgedAt: a.acknowledged_at
        }))
      }
    });
  } catch (error) {
    console.error('Get my child error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load child details'
    });
  }
};

// ============================================
// ABSENCES
// ============================================

/**
 * Get absence reasons for dropdown
 * GET /api/v1/portal/absence-reasons
 */
const getAbsenceReasons = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, name, name_es, category, requires_notes
      FROM absence_reasons
      WHERE is_active = true
      ORDER BY sort_order
    `);

    res.json({
      success: true,
      data: {
        reasons: result.rows.map(r => ({
          id: r.id,
          name: r.name,
          nameEs: r.name_es,
          category: r.category,
          requiresNotes: r.requires_notes
        }))
      }
    });
  } catch (error) {
    console.error('Get absence reasons error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load absence reasons'
    });
  }
};

/**
 * List parent's reported absences
 * GET /api/v1/portal/absences
 * Query: child_id, status (pending/acknowledged/cancelled), upcoming (true/false)
 */
const getAbsences = async (req, res) => {
  try {
    const { child_id, status, upcoming } = req.query;
    const parent = await getParentByUserId(req.user.id);

    if (!parent) {
      return res.status(404).json({
        success: false,
        error: 'Parent profile not found'
      });
    }

    let query = `
      SELECT
        a.id, a.child_id, a.start_date, a.end_date, a.notes,
        a.expected_return_date, a.reported_at, a.status,
        a.acknowledged_at,
        c.first_name as child_first_name, c.last_name as child_last_name,
        ar.name as reason_name, ar.name_es as reason_name_es
      FROM absences a
      JOIN children c ON a.child_id = c.id
      JOIN parent_children pc ON c.id = pc.child_id
      LEFT JOIN absence_reasons ar ON a.reason_id = ar.id
      WHERE a.reported_by = $1 AND pc.parent_id = $1
    `;
    const params = [parent.id];
    let paramCount = 1;

    // Filter by child
    if (child_id) {
      paramCount++;
      query += ` AND a.child_id = $${paramCount}`;
      params.push(child_id);
    }

    // Filter by status
    if (status) {
      paramCount++;
      query += ` AND a.status = $${paramCount}`;
      params.push(status);
    }

    // Filter upcoming only
    if (upcoming === 'true') {
      query += ` AND (a.end_date >= CURRENT_DATE OR a.start_date >= CURRENT_DATE)`;
    }

    query += ' ORDER BY a.start_date DESC';

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: {
        absences: result.rows.map(a => ({
          id: a.id,
          childId: a.child_id,
          childName: `${a.child_first_name} ${a.child_last_name}`,
          startDate: a.start_date,
          endDate: a.end_date,
          reasonName: a.reason_name,
          reasonNameEs: a.reason_name_es,
          notes: a.notes,
          expectedReturnDate: a.expected_return_date,
          reportedAt: a.reported_at,
          status: a.status,
          acknowledgedAt: a.acknowledged_at,
          canEdit: new Date(a.start_date) > new Date() && a.status !== 'cancelled'
        })),
        total: result.rows.length
      }
    });
  } catch (error) {
    console.error('Get absences error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load absences'
    });
  }
};

/**
 * Get single absence
 * GET /api/v1/portal/absences/:id
 */
const getAbsence = async (req, res) => {
  try {
    const { id } = req.params;
    const parent = await getParentByUserId(req.user.id);

    if (!parent) {
      return res.status(404).json({
        success: false,
        error: 'Parent profile not found'
      });
    }

    // Check ownership
    const ownsAbsence = await parentOwnsAbsence(parent.id, id);
    if (!ownsAbsence) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this absence'
      });
    }

    const result = await db.query(`
      SELECT
        a.*,
        c.first_name as child_first_name, c.last_name as child_last_name,
        ar.name as reason_name, ar.name_es as reason_name_es
      FROM absences a
      JOIN children c ON a.child_id = c.id
      LEFT JOIN absence_reasons ar ON a.reason_id = ar.id
      WHERE a.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Absence not found'
      });
    }

    const absence = result.rows[0];

    res.json({
      success: true,
      data: {
        absence: {
          id: absence.id,
          childId: absence.child_id,
          childName: `${absence.child_first_name} ${absence.child_last_name}`,
          startDate: absence.start_date,
          endDate: absence.end_date,
          reasonId: absence.reason_id,
          reasonName: absence.reason_name,
          reasonNameEs: absence.reason_name_es,
          notes: absence.notes,
          expectedReturnDate: absence.expected_return_date,
          reportedAt: absence.reported_at,
          status: absence.status,
          acknowledgedAt: absence.acknowledged_at,
          canEdit: new Date(absence.start_date) > new Date() && absence.status !== 'cancelled'
        }
      }
    });
  } catch (error) {
    console.error('Get absence error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load absence'
    });
  }
};

/**
 * Report a new absence
 * POST /api/v1/portal/absences
 */
const createAbsence = async (req, res) => {
  try {
    const { childId, startDate, endDate, reasonId, notes, expectedReturnDate } = req.body;
    const parent = await getParentByUserId(req.user.id);

    if (!parent) {
      return res.status(404).json({
        success: false,
        error: 'Parent profile not found'
      });
    }

    // Check parent has access to this child
    const hasAccess = await parentHasAccessToChild(parent.id, childId);
    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this child'
      });
    }

    // Validate reason exists
    const reasonCheck = await db.query(
      'SELECT id, requires_notes FROM absence_reasons WHERE id = $1 AND is_active = true',
      [reasonId]
    );

    if (reasonCheck.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid absence reason'
      });
    }

    // Check if notes required
    if (reasonCheck.rows[0].requires_notes && !notes) {
      return res.status(400).json({
        success: false,
        error: 'Notes are required for this absence reason'
      });
    }

    // Create absence
    const result = await db.query(`
      INSERT INTO absences (
        child_id, reported_by, start_date, end_date,
        reason_id, notes, expected_return_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [childId, parent.id, startDate, endDate || startDate, reasonId, notes, expectedReturnDate]);

    const absence = result.rows[0];

    // Get child and reason names for response
    const detailsResult = await db.query(`
      SELECT
        c.first_name, c.last_name,
        ar.name as reason_name
      FROM children c, absence_reasons ar
      WHERE c.id = $1 AND ar.id = $2
    `, [childId, reasonId]);

    const details = detailsResult.rows[0];

    res.status(201).json({
      success: true,
      data: {
        absence: {
          id: absence.id,
          childId: absence.child_id,
          childName: `${details.first_name} ${details.last_name}`,
          startDate: absence.start_date,
          endDate: absence.end_date,
          reasonName: details.reason_name,
          notes: absence.notes,
          expectedReturnDate: absence.expected_return_date,
          reportedAt: absence.reported_at,
          status: absence.status
        },
        message: 'Absence reported successfully'
      }
    });
  } catch (error) {
    console.error('Create absence error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to report absence'
    });
  }
};

/**
 * Edit upcoming absence
 * PUT /api/v1/portal/absences/:id
 */
const updateAbsence = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, reasonId, notes, expectedReturnDate } = req.body;
    const parent = await getParentByUserId(req.user.id);

    if (!parent) {
      return res.status(404).json({
        success: false,
        error: 'Parent profile not found'
      });
    }

    // Check ownership
    const ownsAbsence = await parentOwnsAbsence(parent.id, id);
    if (!ownsAbsence) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this absence'
      });
    }

    // Check if absence can be edited (must be upcoming and not cancelled)
    const absenceCheck = await db.query(
      'SELECT start_date, status FROM absences WHERE id = $1',
      [id]
    );

    if (absenceCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Absence not found'
      });
    }

    const existingAbsence = absenceCheck.rows[0];
    if (new Date(existingAbsence.start_date) <= new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Cannot edit past absences'
      });
    }

    if (existingAbsence.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Cannot edit cancelled absences'
      });
    }

    // Validate reason if provided
    if (reasonId) {
      const reasonCheck = await db.query(
        'SELECT id FROM absence_reasons WHERE id = $1 AND is_active = true',
        [reasonId]
      );

      if (reasonCheck.rows.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid absence reason'
        });
      }
    }

    // Update absence
    const result = await db.query(`
      UPDATE absences SET
        start_date = COALESCE($1, start_date),
        end_date = COALESCE($2, end_date),
        reason_id = COALESCE($3, reason_id),
        notes = COALESCE($4, notes),
        expected_return_date = COALESCE($5, expected_return_date)
      WHERE id = $6
      RETURNING *
    `, [startDate, endDate, reasonId, notes, expectedReturnDate, id]);

    const absence = result.rows[0];

    res.json({
      success: true,
      data: {
        absence: {
          id: absence.id,
          childId: absence.child_id,
          startDate: absence.start_date,
          endDate: absence.end_date,
          reasonId: absence.reason_id,
          notes: absence.notes,
          expectedReturnDate: absence.expected_return_date,
          status: absence.status
        },
        message: 'Absence updated successfully'
      }
    });
  } catch (error) {
    console.error('Update absence error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update absence'
    });
  }
};

/**
 * Cancel upcoming absence
 * DELETE /api/v1/portal/absences/:id
 */
const cancelAbsence = async (req, res) => {
  try {
    const { id } = req.params;
    const parent = await getParentByUserId(req.user.id);

    if (!parent) {
      return res.status(404).json({
        success: false,
        error: 'Parent profile not found'
      });
    }

    // Check ownership
    const ownsAbsence = await parentOwnsAbsence(parent.id, id);
    if (!ownsAbsence) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this absence'
      });
    }

    // Check if absence can be cancelled (must be upcoming)
    const absenceCheck = await db.query(
      'SELECT start_date, status FROM absences WHERE id = $1',
      [id]
    );

    if (absenceCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Absence not found'
      });
    }

    const existingAbsence = absenceCheck.rows[0];
    if (new Date(existingAbsence.start_date) <= new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Cannot cancel past absences'
      });
    }

    if (existingAbsence.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Absence is already cancelled'
      });
    }

    // Cancel absence (soft delete - set status to cancelled)
    await db.query(
      "UPDATE absences SET status = 'cancelled' WHERE id = $1",
      [id]
    );

    res.json({
      success: true,
      data: {
        message: 'Absence cancelled successfully'
      }
    });
  } catch (error) {
    console.error('Cancel absence error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel absence'
    });
  }
};

module.exports = {
  getDashboard,
  getMyChildren,
  getMyChild,
  getAbsenceReasons,
  getAbsences,
  getAbsence,
  createAbsence,
  updateAbsence,
  cancelAbsence
};
