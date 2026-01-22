const db = require('../config/database');

// ============================================
// TODAY'S OVERVIEW
// ============================================

/**
 * Get today's attendance overview
 * GET /api/v1/attendance/today
 */
const getTodayOverview = async (req, res) => {
  try {
    // Get total enrolled (active children)
    const enrolledResult = await db.query(
      'SELECT COUNT(*) as count FROM children WHERE is_active = true'
    );
    const enrolled = parseInt(enrolledResult.rows[0].count);

    // Get today's absences count
    const absencesResult = await db.query(`
      SELECT COUNT(DISTINCT child_id) as count FROM absences
      WHERE start_date <= CURRENT_DATE
        AND (end_date >= CURRENT_DATE OR end_date IS NULL)
        AND status != 'cancelled'
    `);
    const absentCount = parseInt(absencesResult.rows[0].count);

    // Expected = enrolled - absent
    const expected = enrolled - absentCount;

    // Get today's check-ins
    const checkinsResult = await db.query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN check_in_time IS NOT NULL AND check_out_time IS NULL THEN 1 END) as checked_in,
        COUNT(CASE WHEN check_out_time IS NOT NULL THEN 1 END) as checked_out
      FROM child_checkins
      WHERE checkin_date = CURRENT_DATE
    `);
    const checkedIn = parseInt(checkinsResult.rows[0].checked_in);
    const checkedOut = parseInt(checkinsResult.rows[0].checked_out);

    // Get recent check-ins (last 10)
    const recentCheckinsResult = await db.query(`
      SELECT
        cc.id, cc.child_id, cc.check_in_time, cc.check_out_time,
        cc.checked_in_by_name, cc.checked_out_by_name,
        c.first_name, c.last_name, c.photo_url,
        p.name as program_name, p.color as program_color
      FROM child_checkins cc
      JOIN children c ON cc.child_id = c.id
      LEFT JOIN programs p ON c.program_id = p.id
      WHERE cc.checkin_date = CURRENT_DATE
      ORDER BY COALESCE(cc.check_out_time, cc.check_in_time) DESC
      LIMIT 10
    `);

    // Get pending absences (not acknowledged)
    const pendingAbsencesResult = await db.query(`
      SELECT
        a.id, a.child_id, a.start_date, a.end_date, a.notes, a.reported_at,
        c.first_name as child_first_name, c.last_name as child_last_name,
        ar.name as reason_name,
        pu.first_name as reported_by_first, pu.last_name as reported_by_last
      FROM absences a
      JOIN children c ON a.child_id = c.id
      LEFT JOIN absence_reasons ar ON a.reason_id = ar.id
      LEFT JOIN parents p ON a.reported_by = p.id
      LEFT JOIN users pu ON p.user_id = pu.id
      WHERE a.status = 'pending'
        AND a.start_date <= CURRENT_DATE + INTERVAL '7 days'
      ORDER BY a.start_date, a.reported_at
      LIMIT 20
    `);

    // Get breakdown by program
    const byProgramResult = await db.query(`
      SELECT
        p.id, p.name, p.color,
        COUNT(DISTINCT c.id) as enrolled,
        COUNT(DISTINCT CASE WHEN cc.check_in_time IS NOT NULL AND cc.check_out_time IS NULL THEN c.id END) as checked_in,
        COUNT(DISTINCT CASE WHEN cc.check_out_time IS NOT NULL THEN c.id END) as checked_out
      FROM programs p
      LEFT JOIN children c ON c.program_id = p.id AND c.is_active = true
      LEFT JOIN child_checkins cc ON c.id = cc.child_id AND cc.checkin_date = CURRENT_DATE
      WHERE p.is_active = true
      GROUP BY p.id, p.name, p.color, p.sort_order
      ORDER BY p.sort_order
    `);

    res.json({
      success: true,
      data: {
        stats: {
          enrolled,
          expected,
          checkedIn,
          checkedOut,
          absent: absentCount,
          notYetArrived: expected - checkedIn - checkedOut
        },
        recentCheckins: recentCheckinsResult.rows.map(cc => ({
          id: cc.id,
          childId: cc.child_id,
          childName: `${cc.first_name} ${cc.last_name}`,
          photoUrl: cc.photo_url,
          programName: cc.program_name,
          programColor: cc.program_color,
          checkInTime: cc.check_in_time,
          checkOutTime: cc.check_out_time,
          checkedInBy: cc.checked_in_by_name,
          checkedOutBy: cc.checked_out_by_name
        })),
        pendingAbsences: pendingAbsencesResult.rows.map(a => ({
          id: a.id,
          childId: a.child_id,
          childName: `${a.child_first_name} ${a.child_last_name}`,
          startDate: a.start_date,
          endDate: a.end_date,
          reasonName: a.reason_name,
          notes: a.notes,
          reportedAt: a.reported_at,
          reportedBy: a.reported_by_first ? `${a.reported_by_first} ${a.reported_by_last}` : null
        })),
        byProgram: byProgramResult.rows.map(p => ({
          id: p.id,
          name: p.name,
          color: p.color,
          enrolled: parseInt(p.enrolled),
          checkedIn: parseInt(p.checked_in),
          checkedOut: parseInt(p.checked_out)
        }))
      }
    });
  } catch (error) {
    console.error('Get today overview error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load today\'s overview'
    });
  }
};

// ============================================
// CHECK-IN LOG
// ============================================

/**
 * Get check-in log (filterable by date)
 * GET /api/v1/attendance/checkins
 * Query: date, program_id, status (checked_in, checked_out, all)
 */
const getCheckins = async (req, res) => {
  try {
    const { date, program_id, status } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    let query = `
      SELECT
        cc.id, cc.child_id, cc.checkin_date, cc.check_in_time, cc.check_out_time,
        cc.checked_in_by_name, cc.checked_out_by_name, cc.notes,
        c.first_name, c.last_name, c.photo_url,
        p.id as program_id, p.name as program_name, p.color as program_color
      FROM child_checkins cc
      JOIN children c ON cc.child_id = c.id
      LEFT JOIN programs p ON c.program_id = p.id
      WHERE cc.checkin_date = $1
    `;
    const params = [targetDate];
    let paramCount = 1;

    // Filter by program
    if (program_id) {
      paramCount++;
      query += ` AND c.program_id = $${paramCount}`;
      params.push(program_id);
    }

    // Filter by status
    if (status === 'checked_in') {
      query += ' AND cc.check_in_time IS NOT NULL AND cc.check_out_time IS NULL';
    } else if (status === 'checked_out') {
      query += ' AND cc.check_out_time IS NOT NULL';
    }

    query += ' ORDER BY cc.check_in_time DESC';

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: {
        date: targetDate,
        checkins: result.rows.map(cc => ({
          id: cc.id,
          childId: cc.child_id,
          childName: `${cc.first_name} ${cc.last_name}`,
          photoUrl: cc.photo_url,
          programId: cc.program_id,
          programName: cc.program_name,
          programColor: cc.program_color,
          checkinDate: cc.checkin_date,
          checkInTime: cc.check_in_time,
          checkOutTime: cc.check_out_time,
          checkedInBy: cc.checked_in_by_name,
          checkedOutBy: cc.checked_out_by_name,
          notes: cc.notes,
          status: cc.check_out_time ? 'checked_out' : 'checked_in'
        })),
        total: result.rows.length
      }
    });
  } catch (error) {
    console.error('Get checkins error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load check-ins'
    });
  }
};

// ============================================
// ABSENCES
// ============================================

/**
 * Get all reported absences (filterable)
 * GET /api/v1/attendance/absences
 * Query: status, start_date, end_date, child_id, reason_id
 */
const getAbsences = async (req, res) => {
  try {
    const { status, start_date, end_date, child_id, reason_id } = req.query;

    let query = `
      SELECT
        a.id, a.child_id, a.start_date, a.end_date, a.notes,
        a.expected_return_date, a.reported_at, a.status,
        a.acknowledged_at,
        c.first_name as child_first_name, c.last_name as child_last_name,
        c.photo_url as child_photo,
        ar.id as reason_id, ar.name as reason_name, ar.category as reason_category,
        pu.first_name as reported_by_first, pu.last_name as reported_by_last,
        au.first_name as ack_by_first, au.last_name as ack_by_last
      FROM absences a
      JOIN children c ON a.child_id = c.id
      LEFT JOIN absence_reasons ar ON a.reason_id = ar.id
      LEFT JOIN parents p ON a.reported_by = p.id
      LEFT JOIN users pu ON p.user_id = pu.id
      LEFT JOIN users au ON a.acknowledged_by = au.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 0;

    // Filter by status
    if (status) {
      paramCount++;
      query += ` AND a.status = $${paramCount}`;
      params.push(status);
    }

    // Filter by date range
    if (start_date) {
      paramCount++;
      query += ` AND a.start_date >= $${paramCount}`;
      params.push(start_date);
    }

    if (end_date) {
      paramCount++;
      query += ` AND a.start_date <= $${paramCount}`;
      params.push(end_date);
    }

    // Filter by child
    if (child_id) {
      paramCount++;
      query += ` AND a.child_id = $${paramCount}`;
      params.push(child_id);
    }

    // Filter by reason
    if (reason_id) {
      paramCount++;
      query += ` AND a.reason_id = $${paramCount}`;
      params.push(reason_id);
    }

    query += ' ORDER BY a.start_date DESC, a.reported_at DESC';

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: {
        absences: result.rows.map(a => ({
          id: a.id,
          childId: a.child_id,
          childName: `${a.child_first_name} ${a.child_last_name}`,
          childPhoto: a.child_photo,
          startDate: a.start_date,
          endDate: a.end_date,
          reasonId: a.reason_id,
          reasonName: a.reason_name,
          reasonCategory: a.reason_category,
          notes: a.notes,
          expectedReturnDate: a.expected_return_date,
          reportedAt: a.reported_at,
          reportedBy: a.reported_by_first ? `${a.reported_by_first} ${a.reported_by_last}` : null,
          status: a.status,
          acknowledgedAt: a.acknowledged_at,
          acknowledgedBy: a.ack_by_first ? `${a.ack_by_first} ${a.ack_by_last}` : null
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
 * Get single absence details
 * GET /api/v1/attendance/absences/:id
 */
const getAbsenceById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT
        a.*,
        c.first_name as child_first_name, c.last_name as child_last_name,
        c.photo_url as child_photo, c.program_id,
        pr.name as program_name,
        ar.name as reason_name, ar.name_es as reason_name_es, ar.category as reason_category,
        pu.first_name as reported_by_first, pu.last_name as reported_by_last,
        pu.email as reported_by_email, pu.phone as reported_by_phone,
        au.first_name as ack_by_first, au.last_name as ack_by_last
      FROM absences a
      JOIN children c ON a.child_id = c.id
      LEFT JOIN programs pr ON c.program_id = pr.id
      LEFT JOIN absence_reasons ar ON a.reason_id = ar.id
      LEFT JOIN parents p ON a.reported_by = p.id
      LEFT JOIN users pu ON p.user_id = pu.id
      LEFT JOIN users au ON a.acknowledged_by = au.id
      WHERE a.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Absence not found'
      });
    }

    const a = result.rows[0];

    res.json({
      success: true,
      data: {
        absence: {
          id: a.id,
          childId: a.child_id,
          childName: `${a.child_first_name} ${a.child_last_name}`,
          childPhoto: a.child_photo,
          programId: a.program_id,
          programName: a.program_name,
          startDate: a.start_date,
          endDate: a.end_date,
          reasonId: a.reason_id,
          reasonName: a.reason_name,
          reasonNameEs: a.reason_name_es,
          reasonCategory: a.reason_category,
          notes: a.notes,
          expectedReturnDate: a.expected_return_date,
          reportedAt: a.reported_at,
          reportedBy: a.reported_by_first ? {
            name: `${a.reported_by_first} ${a.reported_by_last}`,
            email: a.reported_by_email,
            phone: a.reported_by_phone
          } : null,
          status: a.status,
          acknowledgedAt: a.acknowledged_at,
          acknowledgedBy: a.ack_by_first ? `${a.ack_by_first} ${a.ack_by_last}` : null
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
 * Acknowledge an absence
 * PUT /api/v1/attendance/absences/:id/acknowledge
 */
const acknowledgeAbsence = async (req, res) => {
  try {
    const { id } = req.params;
    const adminUserId = req.user.id;

    // Check absence exists and is pending
    const absenceCheck = await db.query(
      'SELECT id, status FROM absences WHERE id = $1',
      [id]
    );

    if (absenceCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Absence not found'
      });
    }

    if (absenceCheck.rows[0].status === 'acknowledged') {
      return res.status(400).json({
        success: false,
        error: 'Absence already acknowledged'
      });
    }

    if (absenceCheck.rows[0].status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: 'Cannot acknowledge cancelled absence'
      });
    }

    // Update absence
    const result = await db.query(`
      UPDATE absences SET
        status = 'acknowledged',
        acknowledged_by = $1,
        acknowledged_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [adminUserId, id]);

    // Get child name for response
    const childResult = await db.query(
      'SELECT first_name, last_name FROM children WHERE id = $1',
      [result.rows[0].child_id]
    );

    res.json({
      success: true,
      data: {
        message: `Absence acknowledged for ${childResult.rows[0].first_name} ${childResult.rows[0].last_name}`,
        absence: {
          id: result.rows[0].id,
          status: result.rows[0].status,
          acknowledgedAt: result.rows[0].acknowledged_at,
          acknowledgedBy: `${req.user.firstName} ${req.user.lastName}`
        }
      }
    });
  } catch (error) {
    console.error('Acknowledge absence error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to acknowledge absence'
    });
  }
};

// ============================================
// MANUAL CHECK-IN/OUT
// ============================================

/**
 * Admin manually checks in a child
 * POST /api/v1/attendance/manual-checkin
 */
const manualCheckIn = async (req, res) => {
  try {
    const { childId, notes } = req.body;
    const adminName = `${req.user.firstName} ${req.user.lastName} (Admin)`;

    // Check child exists
    const childResult = await db.query(
      'SELECT id, first_name, last_name, is_active FROM children WHERE id = $1',
      [childId]
    );

    if (childResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Child not found'
      });
    }

    if (!childResult.rows[0].is_active) {
      return res.status(400).json({
        success: false,
        error: 'Child is not active'
      });
    }

    const child = childResult.rows[0];

    // Check if already checked in today
    const existingCheckin = await db.query(`
      SELECT id, check_in_time, check_out_time FROM child_checkins
      WHERE child_id = $1 AND checkin_date = CURRENT_DATE
    `, [childId]);

    if (existingCheckin.rows.length > 0) {
      const existing = existingCheckin.rows[0];
      if (existing.check_in_time && !existing.check_out_time) {
        return res.status(400).json({
          success: false,
          error: 'Child is already checked in',
          data: { checkInTime: existing.check_in_time }
        });
      }

      // If was checked out, create new check-in by updating
      if (existing.check_out_time) {
        const result = await db.query(`
          UPDATE child_checkins SET
            check_in_time = CURRENT_TIMESTAMP,
            check_out_time = NULL,
            checked_in_by_name = $1,
            checked_in_by_parent_id = NULL,
            notes = COALESCE($2::text, notes)
          WHERE id = $3
          RETURNING *
        `, [adminName, notes, existing.id]);

        return res.json({
          success: true,
          data: {
            message: `${child.first_name} ${child.last_name} checked in by admin`,
            checkin: {
              id: result.rows[0].id,
              childId: result.rows[0].child_id,
              checkInTime: result.rows[0].check_in_time,
              checkedInBy: adminName,
              notes: result.rows[0].notes
            }
          }
        });
      }
    }

    // Create new check-in record
    const result = await db.query(`
      INSERT INTO child_checkins (
        child_id, checkin_date, check_in_time,
        checked_in_by_name, notes
      ) VALUES ($1, CURRENT_DATE, CURRENT_TIMESTAMP, $2, $3)
      RETURNING *
    `, [childId, adminName, notes]);

    res.status(201).json({
      success: true,
      data: {
        message: `${child.first_name} ${child.last_name} checked in by admin`,
        checkin: {
          id: result.rows[0].id,
          childId: result.rows[0].child_id,
          checkInTime: result.rows[0].check_in_time,
          checkedInBy: adminName,
          notes: result.rows[0].notes
        }
      }
    });
  } catch (error) {
    console.error('Manual check-in error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check in'
    });
  }
};

/**
 * Admin manually checks out a child
 * POST /api/v1/attendance/manual-checkout
 */
const manualCheckOut = async (req, res) => {
  try {
    const { childId, notes } = req.body;
    const adminName = `${req.user.firstName} ${req.user.lastName} (Admin)`;

    // Check child exists
    const childResult = await db.query(
      'SELECT id, first_name, last_name FROM children WHERE id = $1',
      [childId]
    );

    if (childResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Child not found'
      });
    }

    const child = childResult.rows[0];

    // Find today's check-in record
    const checkinRecord = await db.query(`
      SELECT id, check_in_time, check_out_time FROM child_checkins
      WHERE child_id = $1 AND checkin_date = CURRENT_DATE AND check_in_time IS NOT NULL
    `, [childId]);

    if (checkinRecord.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Child is not checked in today'
      });
    }

    if (checkinRecord.rows[0].check_out_time) {
      return res.status(400).json({
        success: false,
        error: 'Child is already checked out',
        data: { checkOutTime: checkinRecord.rows[0].check_out_time }
      });
    }

    // Update with check-out
    const result = await db.query(`
      UPDATE child_checkins SET
        check_out_time = CURRENT_TIMESTAMP,
        checked_out_by_name = $1,
        checked_out_by_parent_id = NULL,
        notes = CASE WHEN $2::text IS NOT NULL THEN COALESCE(notes || ' | ', '') || $2::text ELSE notes END
      WHERE id = $3
      RETURNING *
    `, [adminName, notes, checkinRecord.rows[0].id]);

    res.json({
      success: true,
      data: {
        message: `${child.first_name} ${child.last_name} checked out by admin`,
        checkin: {
          id: result.rows[0].id,
          childId: result.rows[0].child_id,
          checkInTime: result.rows[0].check_in_time,
          checkOutTime: result.rows[0].check_out_time,
          checkedOutBy: adminName,
          notes: result.rows[0].notes
        }
      }
    });
  } catch (error) {
    console.error('Manual check-out error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check out'
    });
  }
};

module.exports = {
  getTodayOverview,
  getCheckins,
  getAbsences,
  getAbsenceById,
  acknowledgeAbsence,
  manualCheckIn,
  manualCheckOut
};
