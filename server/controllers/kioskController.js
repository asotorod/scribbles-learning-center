const db = require('../config/database');

// ============================================
// PIN VERIFICATION
// ============================================

/**
 * Verify PIN and return parent or employee info
 * POST /api/v1/kiosk/verify-pin
 */
const verifyPin = async (req, res) => {
  try {
    const { pin } = req.body;

    if (!pin) {
      return res.status(400).json({
        success: false,
        error: 'PIN is required'
      });
    }

    // Check parents table first
    const parentResult = await db.query(`
      SELECT
        p.id, p.pin_code, p.user_id,
        u.first_name, u.last_name, u.email, u.is_active
      FROM parents p
      JOIN users u ON p.user_id = u.id
      WHERE p.pin_code = $1 AND u.is_active = true
    `, [pin]);

    if (parentResult.rows.length > 0) {
      const parent = parentResult.rows[0];

      // Get children count
      const childrenCount = await db.query(
        'SELECT COUNT(*) FROM parent_children WHERE parent_id = $1',
        [parent.id]
      );

      return res.json({
        success: true,
        data: {
          type: 'parent',
          parent: {
            id: parent.id,
            userId: parent.user_id,
            firstName: parent.first_name,
            lastName: parent.last_name,
            email: parent.email,
            childrenCount: parseInt(childrenCount.rows[0].count)
          }
        }
      });
    }

    // Check employees table
    const employeeResult = await db.query(`
      SELECT
        e.id, e.pin_code, e.user_id, e.position, e.department,
        u.first_name, u.last_name, u.email, u.is_active
      FROM employees e
      JOIN users u ON e.user_id = u.id
      WHERE e.pin_code = $1 AND e.is_active = true AND u.is_active = true
    `, [pin]);

    if (employeeResult.rows.length > 0) {
      const employee = employeeResult.rows[0];

      // Check if currently clocked in
      const clockStatus = await db.query(`
        SELECT id, clock_in FROM employee_timeclock
        WHERE employee_id = $1 AND clock_out IS NULL
        ORDER BY clock_in DESC LIMIT 1
      `, [employee.id]);

      return res.json({
        success: true,
        data: {
          type: 'employee',
          employee: {
            id: employee.id,
            userId: employee.user_id,
            firstName: employee.first_name,
            lastName: employee.last_name,
            position: employee.position,
            department: employee.department,
            isClockedIn: clockStatus.rows.length > 0,
            clockInTime: clockStatus.rows[0]?.clock_in || null
          }
        }
      });
    }

    // PIN not found
    return res.status(401).json({
      success: false,
      error: 'Invalid PIN'
    });
  } catch (error) {
    console.error('Verify PIN error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify PIN'
    });
  }
};

// ============================================
// PARENT CHECK-IN/OUT
// ============================================

/**
 * Get parent's children for check-in selection
 * POST /api/v1/kiosk/parent/children
 */
const getParentChildren = async (req, res) => {
  try {
    const { parentId, pin } = req.body;

    // Verify PIN matches parent
    const pinCheck = await db.query(
      'SELECT id FROM parents WHERE id = $1 AND pin_code = $2',
      [parentId, pin]
    );

    if (pinCheck.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid PIN'
      });
    }

    // Get children with today's check-in status
    const result = await db.query(`
      SELECT
        c.id, c.first_name, c.last_name, c.photo_url,
        c.program_id, p.name as program_name, p.color as program_color,
        cc.id as checkin_id, cc.check_in_time, cc.check_out_time
      FROM children c
      JOIN parent_children pc ON c.id = pc.child_id
      LEFT JOIN programs p ON c.program_id = p.id
      LEFT JOIN child_checkins cc ON c.id = cc.child_id AND cc.checkin_date = CURRENT_DATE
      WHERE pc.parent_id = $1 AND c.is_active = true AND pc.is_authorized_pickup = true
      ORDER BY c.first_name
    `, [parentId]);

    const childIds = result.rows.map(r => r.id);

    // Fetch authorized pickups for all children in one query
    let pickupsByChild = {};
    let contactsByChild = {};
    if (childIds.length > 0) {
      const pickupsResult = await db.query(`
        SELECT id, child_id, name, relationship, phone, photo_url
        FROM authorized_pickups
        WHERE child_id = ANY($1) AND is_active = true
        ORDER BY created_at ASC
      `, [childIds]);

      pickupsResult.rows.forEach(p => {
        if (!pickupsByChild[p.child_id]) pickupsByChild[p.child_id] = [];
        pickupsByChild[p.child_id].push({
          id: p.id,
          name: p.name,
          relationship: p.relationship,
          phone: p.phone,
          photoUrl: p.photo_url,
        });
      });

      const contactsResult = await db.query(`
        SELECT id, child_id, name, relationship, phone, is_primary
        FROM emergency_contacts
        WHERE child_id = ANY($1)
        ORDER BY is_primary DESC, created_at ASC
      `, [childIds]);

      contactsResult.rows.forEach(c => {
        if (!contactsByChild[c.child_id]) contactsByChild[c.child_id] = [];
        contactsByChild[c.child_id].push({
          id: c.id,
          name: c.name,
          relationship: c.relationship,
          phone: c.phone,
          isPrimary: c.is_primary,
        });
      });
    }

    const children = result.rows.map(child => {
      let status = 'not_checked_in';
      if (child.check_in_time && child.check_out_time) {
        status = 'checked_out';
      } else if (child.check_in_time) {
        status = 'checked_in';
      }

      return {
        id: child.id,
        firstName: child.first_name,
        lastName: child.last_name,
        photoUrl: child.photo_url,
        programName: child.program_name,
        programColor: child.program_color,
        status,
        checkinId: child.checkin_id,
        checkInTime: child.check_in_time,
        checkOutTime: child.check_out_time,
        authorizedPickups: pickupsByChild[child.id] || [],
        emergencyContacts: contactsByChild[child.id] || [],
      };
    });

    res.json({
      success: true,
      data: { children }
    });
  } catch (error) {
    console.error('Get parent children error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get children'
    });
  }
};

/**
 * Check in child(ren)
 * POST /api/v1/kiosk/checkin
 */
const checkIn = async (req, res) => {
  const client = await db.pool.connect();

  try {
    const { parentId, childIds, pin } = req.body;

    if (!childIds || !Array.isArray(childIds) || childIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one child must be selected'
      });
    }

    // Verify PIN matches parent
    const parentResult = await client.query(`
      SELECT p.id, u.first_name, u.last_name
      FROM parents p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = $1 AND p.pin_code = $2
    `, [parentId, pin]);

    if (parentResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid PIN'
      });
    }

    const parent = parentResult.rows[0];
    const parentName = `${parent.first_name} ${parent.last_name}`;

    await client.query('BEGIN');

    const checkedIn = [];

    for (const childId of childIds) {
      // Verify parent has access to child
      const accessCheck = await client.query(
        'SELECT id FROM parent_children WHERE parent_id = $1 AND child_id = $2 AND is_authorized_pickup = true',
        [parentId, childId]
      );

      if (accessCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(403).json({
          success: false,
          error: 'Not authorized to check in this child'
        });
      }

      // Check if already checked in today
      const existingCheckin = await client.query(`
        SELECT id, check_in_time FROM child_checkins
        WHERE child_id = $1 AND checkin_date = CURRENT_DATE
      `, [childId]);

      if (existingCheckin.rows.length > 0 && existingCheckin.rows[0].check_in_time) {
        // Already checked in - skip but don't fail
        const childInfo = await client.query(
          'SELECT first_name, last_name FROM children WHERE id = $1',
          [childId]
        );
        checkedIn.push({
          childId,
          firstName: childInfo.rows[0].first_name,
          lastName: childInfo.rows[0].last_name,
          status: 'already_checked_in',
          checkInTime: existingCheckin.rows[0].check_in_time
        });
        continue;
      }

      // Create or update check-in record
      let checkInResult;
      if (existingCheckin.rows.length > 0) {
        // Update existing record (was checked out earlier)
        checkInResult = await client.query(`
          UPDATE child_checkins SET
            check_in_time = CURRENT_TIMESTAMP,
            check_out_time = NULL,
            checked_in_by_parent_id = $1,
            checked_in_by_name = $2
          WHERE id = $3
          RETURNING *
        `, [parentId, parentName, existingCheckin.rows[0].id]);
      } else {
        // Create new record
        checkInResult = await client.query(`
          INSERT INTO child_checkins (
            child_id, checkin_date, check_in_time,
            checked_in_by_parent_id, checked_in_by_name
          ) VALUES ($1, CURRENT_DATE, CURRENT_TIMESTAMP, $2, $3)
          RETURNING *
        `, [childId, parentId, parentName]);
      }

      // Get child name
      const childInfo = await client.query(
        'SELECT first_name, last_name FROM children WHERE id = $1',
        [childId]
      );

      checkedIn.push({
        childId,
        firstName: childInfo.rows[0].first_name,
        lastName: childInfo.rows[0].last_name,
        status: 'checked_in',
        checkInTime: checkInResult.rows[0].check_in_time
      });
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      data: {
        message: `Successfully checked in ${checkedIn.filter(c => c.status === 'checked_in').length} child(ren)`,
        checkedIn,
        checkedInBy: parentName,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Check in error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check in'
    });
  } finally {
    client.release();
  }
};

/**
 * Check out child(ren)
 * POST /api/v1/kiosk/checkout
 */
const checkOut = async (req, res) => {
  const client = await db.pool.connect();

  try {
    const { parentId, childIds, pin } = req.body;

    if (!childIds || !Array.isArray(childIds) || childIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one child must be selected'
      });
    }

    // Verify PIN matches parent
    const parentResult = await client.query(`
      SELECT p.id, u.first_name, u.last_name
      FROM parents p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = $1 AND p.pin_code = $2
    `, [parentId, pin]);

    if (parentResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid PIN'
      });
    }

    const parent = parentResult.rows[0];
    const parentName = `${parent.first_name} ${parent.last_name}`;

    await client.query('BEGIN');

    const checkedOut = [];

    for (const childId of childIds) {
      // Verify parent has access to child
      const accessCheck = await client.query(
        'SELECT id FROM parent_children WHERE parent_id = $1 AND child_id = $2 AND is_authorized_pickup = true',
        [parentId, childId]
      );

      if (accessCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(403).json({
          success: false,
          error: 'Not authorized to check out this child'
        });
      }

      // Find today's check-in record
      const checkinRecord = await client.query(`
        SELECT id, check_in_time, check_out_time FROM child_checkins
        WHERE child_id = $1 AND checkin_date = CURRENT_DATE AND check_in_time IS NOT NULL
      `, [childId]);

      if (checkinRecord.rows.length === 0) {
        // Not checked in - skip but don't fail
        const childInfo = await client.query(
          'SELECT first_name, last_name FROM children WHERE id = $1',
          [childId]
        );
        checkedOut.push({
          childId,
          firstName: childInfo.rows[0].first_name,
          lastName: childInfo.rows[0].last_name,
          status: 'not_checked_in'
        });
        continue;
      }

      if (checkinRecord.rows[0].check_out_time) {
        // Already checked out
        const childInfo = await client.query(
          'SELECT first_name, last_name FROM children WHERE id = $1',
          [childId]
        );
        checkedOut.push({
          childId,
          firstName: childInfo.rows[0].first_name,
          lastName: childInfo.rows[0].last_name,
          status: 'already_checked_out',
          checkOutTime: checkinRecord.rows[0].check_out_time
        });
        continue;
      }

      // Update with check-out time
      const checkOutResult = await client.query(`
        UPDATE child_checkins SET
          check_out_time = CURRENT_TIMESTAMP,
          checked_out_by_parent_id = $1,
          checked_out_by_name = $2
        WHERE id = $3
        RETURNING *
      `, [parentId, parentName, checkinRecord.rows[0].id]);

      // Get child name
      const childInfo = await client.query(
        'SELECT first_name, last_name FROM children WHERE id = $1',
        [childId]
      );

      checkedOut.push({
        childId,
        firstName: childInfo.rows[0].first_name,
        lastName: childInfo.rows[0].last_name,
        status: 'checked_out',
        checkInTime: checkOutResult.rows[0].check_in_time,
        checkOutTime: checkOutResult.rows[0].check_out_time
      });
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      data: {
        message: `Successfully checked out ${checkedOut.filter(c => c.status === 'checked_out').length} child(ren)`,
        checkedOut,
        checkedOutBy: parentName,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Check out error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check out'
    });
  } finally {
    client.release();
  }
};

// ============================================
// EMPLOYEE TIME CLOCK
// ============================================

/**
 * Employee clock in
 * POST /api/v1/kiosk/employee/clockin
 */
const employeeClockIn = async (req, res) => {
  try {
    const { employeeId, pin } = req.body;

    // Verify PIN matches employee
    const employeeResult = await db.query(`
      SELECT e.id, u.first_name, u.last_name
      FROM employees e
      JOIN users u ON e.user_id = u.id
      WHERE e.id = $1 AND e.pin_code = $2 AND e.is_active = true
    `, [employeeId, pin]);

    if (employeeResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid PIN'
      });
    }

    const employee = employeeResult.rows[0];

    // Check if already clocked in
    const existingClock = await db.query(`
      SELECT id, clock_in FROM employee_timeclock
      WHERE employee_id = $1 AND clock_out IS NULL
    `, [employeeId]);

    if (existingClock.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Already clocked in',
        data: {
          clockInTime: existingClock.rows[0].clock_in
        }
      });
    }

    // Create clock-in record
    const result = await db.query(`
      INSERT INTO employee_timeclock (employee_id, clock_in)
      VALUES ($1, CURRENT_TIMESTAMP)
      RETURNING *
    `, [employeeId]);

    res.json({
      success: true,
      data: {
        message: `${employee.first_name} ${employee.last_name} clocked in successfully`,
        timeclockId: result.rows[0].id,
        clockInTime: result.rows[0].clock_in,
        employeeName: `${employee.first_name} ${employee.last_name}`
      }
    });
  } catch (error) {
    console.error('Employee clock in error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clock in'
    });
  }
};

/**
 * Employee clock out
 * POST /api/v1/kiosk/employee/clockout
 */
const employeeClockOut = async (req, res) => {
  try {
    const { employeeId, pin } = req.body;

    // Verify PIN matches employee
    const employeeResult = await db.query(`
      SELECT e.id, u.first_name, u.last_name
      FROM employees e
      JOIN users u ON e.user_id = u.id
      WHERE e.id = $1 AND e.pin_code = $2 AND e.is_active = true
    `, [employeeId, pin]);

    if (employeeResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid PIN'
      });
    }

    const employee = employeeResult.rows[0];

    // Find active clock-in record
    const existingClock = await db.query(`
      SELECT id, clock_in FROM employee_timeclock
      WHERE employee_id = $1 AND clock_out IS NULL
      ORDER BY clock_in DESC LIMIT 1
    `, [employeeId]);

    if (existingClock.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Not currently clocked in'
      });
    }

    // Calculate total minutes
    const clockInTime = new Date(existingClock.rows[0].clock_in);
    const clockOutTime = new Date();
    const totalMinutes = Math.round((clockOutTime - clockInTime) / (1000 * 60));

    // Update with clock-out time and total minutes
    const result = await db.query(`
      UPDATE employee_timeclock SET
        clock_out = CURRENT_TIMESTAMP,
        total_minutes = $1
      WHERE id = $2
      RETURNING *
    `, [totalMinutes, existingClock.rows[0].id]);

    // Format hours and minutes
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    res.json({
      success: true,
      data: {
        message: `${employee.first_name} ${employee.last_name} clocked out successfully`,
        timeclockId: result.rows[0].id,
        clockInTime: result.rows[0].clock_in,
        clockOutTime: result.rows[0].clock_out,
        totalMinutes,
        totalTime: `${hours}h ${minutes}m`,
        employeeName: `${employee.first_name} ${employee.last_name}`
      }
    });
  } catch (error) {
    console.error('Employee clock out error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clock out'
    });
  }
};

/**
 * Get employee's current clock status
 * GET /api/v1/kiosk/employee/status
 */
const getEmployeeStatus = async (req, res) => {
  try {
    const { employeeId, pin } = req.body;

    // Verify PIN matches employee
    const employeeResult = await db.query(`
      SELECT e.id, u.first_name, u.last_name, e.position
      FROM employees e
      JOIN users u ON e.user_id = u.id
      WHERE e.id = $1 AND e.pin_code = $2 AND e.is_active = true
    `, [employeeId, pin]);

    if (employeeResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid PIN'
      });
    }

    const employee = employeeResult.rows[0];

    // Check current clock status
    const currentClock = await db.query(`
      SELECT id, clock_in FROM employee_timeclock
      WHERE employee_id = $1 AND clock_out IS NULL
      ORDER BY clock_in DESC LIMIT 1
    `, [employeeId]);

    // Get today's total hours
    const todayHours = await db.query(`
      SELECT
        SUM(total_minutes) as total_minutes,
        COUNT(*) as clock_count
      FROM employee_timeclock
      WHERE employee_id = $1
        AND DATE(clock_in) = CURRENT_DATE
        AND clock_out IS NOT NULL
    `, [employeeId]);

    const totalMinutesToday = parseInt(todayHours.rows[0].total_minutes) || 0;
    const hours = Math.floor(totalMinutesToday / 60);
    const minutes = totalMinutesToday % 60;

    // If currently clocked in, add current session
    let currentSessionMinutes = 0;
    if (currentClock.rows.length > 0) {
      const clockInTime = new Date(currentClock.rows[0].clock_in);
      currentSessionMinutes = Math.round((new Date() - clockInTime) / (1000 * 60));
    }

    const totalWithCurrent = totalMinutesToday + currentSessionMinutes;
    const totalHours = Math.floor(totalWithCurrent / 60);
    const totalMins = totalWithCurrent % 60;

    res.json({
      success: true,
      data: {
        employee: {
          id: employee.id,
          firstName: employee.first_name,
          lastName: employee.last_name,
          position: employee.position
        },
        isClockedIn: currentClock.rows.length > 0,
        currentSession: currentClock.rows.length > 0 ? {
          clockInTime: currentClock.rows[0].clock_in,
          currentMinutes: currentSessionMinutes,
          currentTime: `${Math.floor(currentSessionMinutes / 60)}h ${currentSessionMinutes % 60}m`
        } : null,
        todayTotal: {
          completedMinutes: totalMinutesToday,
          completedTime: `${hours}h ${minutes}m`,
          includingCurrentMinutes: totalWithCurrent,
          includingCurrentTime: `${totalHours}h ${totalMins}m`,
          clockCount: parseInt(todayHours.rows[0].clock_count) || 0
        }
      }
    });
  } catch (error) {
    console.error('Get employee status error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get status'
    });
  }
};

module.exports = {
  verifyPin,
  getParentChildren,
  checkIn,
  checkOut,
  employeeClockIn,
  employeeClockOut,
  getEmployeeStatus
};
