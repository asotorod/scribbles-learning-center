const db = require('../config/database');
const { validationResult } = require('express-validator');

// GET /api/v1/timeclock/today - Today's punches for all employees
const getToday = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get all employees with their today's time records
    const result = await db.query(`
      SELECT
        e.id as employee_id,
        u.first_name,
        u.last_name,
        e.position,
        e.department,
        tr.id as time_record_id,
        tr.clock_in,
        tr.clock_out,
        tr.total_minutes,
        tr.notes
      FROM employees e
      JOIN users u ON e.user_id = u.id
      LEFT JOIN employee_timeclock tr ON e.id = tr.employee_id
        AND DATE(tr.clock_in) = $1
      WHERE e.is_active = true AND u.is_active = true
      ORDER BY u.last_name, u.first_name, tr.clock_in
    `, [today]);

    // Group by employee
    const employeeMap = new Map();

    for (const row of result.rows) {
      if (!employeeMap.has(row.employee_id)) {
        employeeMap.set(row.employee_id, {
          employeeId: row.employee_id,
          firstName: row.first_name,
          lastName: row.last_name,
          position: row.position,
          department: row.department,
          timeRecords: [],
          totalHoursToday: 0,
          status: 'not_clocked_in'
        });
      }

      const emp = employeeMap.get(row.employee_id);

      if (row.time_record_id) {
        const totalHours = row.total_minutes ? (row.total_minutes / 60).toFixed(2) : null;
        const record = {
          id: row.time_record_id,
          clockIn: row.clock_in,
          clockOut: row.clock_out,
          totalMinutes: row.total_minutes,
          totalHours: totalHours,
          notes: row.notes
        };
        emp.timeRecords.push(record);

        if (row.total_minutes) {
          emp.totalHoursToday += row.total_minutes / 60;
        }

        // Update status based on latest record
        if (!row.clock_out) {
          emp.status = 'clocked_in';
        } else {
          emp.status = 'clocked_out';
        }
      }
    }

    const employees = Array.from(employeeMap.values());

    // Calculate summary stats
    const stats = {
      totalEmployees: employees.length,
      clockedIn: employees.filter(e => e.status === 'clocked_in').length,
      clockedOut: employees.filter(e => e.status === 'clocked_out').length,
      notClockedIn: employees.filter(e => e.status === 'not_clocked_in').length
    };

    res.json({
      success: true,
      data: {
        date: today,
        stats,
        employees
      }
    });
  } catch (error) {
    console.error('Get today timeclock error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch today\'s time records'
    });
  }
};

// GET /api/v1/timeclock/employee/:id - Employee's time records (date range filter)
const getEmployeeRecords = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Check employee exists
    const empResult = await db.query(`
      SELECT e.id, u.first_name, u.last_name, e.position, e.department
      FROM employees e
      JOIN users u ON e.user_id = u.id
      WHERE e.id = $1
    `, [id]);

    if (empResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Employee not found'
      });
    }

    const employee = empResult.rows[0];

    // Build query with optional date range
    let query = `
      SELECT
        id,
        clock_in,
        clock_out,
        total_minutes,
        notes,
        created_at
      FROM employee_timeclock
      WHERE employee_id = $1
    `;
    const params = [id];
    let paramIndex = 2;

    if (startDate) {
      query += ` AND DATE(clock_in) >= $${paramIndex++}`;
      params.push(startDate);
    }

    if (endDate) {
      query += ` AND DATE(clock_in) <= $${paramIndex++}`;
      params.push(endDate);
    }

    // Get count
    const countResult = await db.query(
      query.replace('SELECT\n        id,\n        clock_in,\n        clock_out,\n        total_minutes,\n        notes,\n        created_at', 'SELECT COUNT(*)'),
      params
    );

    // Add ordering and pagination
    query += ` ORDER BY clock_in DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);

    // Calculate totals for the period
    let totalQuery = `
      SELECT
        SUM(total_minutes) as total_minutes,
        COUNT(*) as total_records
      FROM employee_timeclock
      WHERE employee_id = $1 AND total_minutes IS NOT NULL
    `;
    const totalParams = [id];
    let totalParamIndex = 2;

    if (startDate) {
      totalQuery += ` AND DATE(clock_in) >= $${totalParamIndex++}`;
      totalParams.push(startDate);
    }

    if (endDate) {
      totalQuery += ` AND DATE(clock_in) <= $${totalParamIndex++}`;
      totalParams.push(endDate);
    }

    const totalResult = await db.query(totalQuery, totalParams);

    res.json({
      success: true,
      data: {
        employee: {
          id: employee.id,
          firstName: employee.first_name,
          lastName: employee.last_name,
          position: employee.position,
          department: employee.department
        },
        timeRecords: result.rows.map(tr => ({
          id: tr.id,
          clockIn: tr.clock_in,
          clockOut: tr.clock_out,
          totalMinutes: tr.total_minutes,
          totalHours: tr.total_minutes ? (tr.total_minutes / 60).toFixed(2) : null,
          notes: tr.notes,
          createdAt: tr.created_at
        })),
        summary: {
          totalMinutes: parseInt(totalResult.rows[0].total_minutes) || 0,
          totalHours: totalResult.rows[0].total_minutes ? (totalResult.rows[0].total_minutes / 60).toFixed(2) : 0,
          totalRecords: parseInt(totalResult.rows[0].total_records) || 0
        },
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get employee records error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch employee time records'
    });
  }
};

// PUT /api/v1/timeclock/:id - Edit time entry (admin correction)
const editTimeEntry = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { id } = req.params;
    const { clockIn, clockOut, notes } = req.body;

    // Check time record exists
    const recordResult = await db.query(`
      SELECT tr.*, e.id as employee_id, u.first_name, u.last_name
      FROM employee_timeclock tr
      JOIN employees e ON tr.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      WHERE tr.id = $1
    `, [id]);

    if (recordResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Time record not found'
      });
    }

    const record = recordResult.rows[0];

    // Build update
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (clockIn !== undefined) {
      updateFields.push(`clock_in = $${paramIndex++}`);
      updateValues.push(clockIn);
    }

    if (clockOut !== undefined) {
      updateFields.push(`clock_out = $${paramIndex++}`);
      updateValues.push(clockOut);
    }

    if (notes !== undefined) {
      updateFields.push(`notes = $${paramIndex++}`);
      updateValues.push(notes);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    updateValues.push(id);

    // Update the record
    await db.query(
      `UPDATE employee_timeclock SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
      updateValues
    );

    // Recalculate total minutes if both clock_in and clock_out are set
    const updatedRecord = await db.query(
      'SELECT clock_in, clock_out FROM employee_timeclock WHERE id = $1',
      [id]
    );

    const updated = updatedRecord.rows[0];
    if (updated.clock_in && updated.clock_out) {
      const clockInTime = new Date(updated.clock_in);
      const clockOutTime = new Date(updated.clock_out);
      const totalMinutes = Math.round((clockOutTime - clockInTime) / (1000 * 60));

      await db.query(
        'UPDATE employee_timeclock SET total_minutes = $1 WHERE id = $2',
        [totalMinutes, id]
      );
    }

    // Fetch final record
    const finalResult = await db.query(
      'SELECT * FROM employee_timeclock WHERE id = $1',
      [id]
    );

    const final = finalResult.rows[0];

    res.json({
      success: true,
      data: {
        timeRecord: {
          id: final.id,
          employeeId: final.employee_id,
          employeeName: `${record.first_name} ${record.last_name}`,
          clockIn: final.clock_in,
          clockOut: final.clock_out,
          totalMinutes: final.total_minutes,
          totalHours: final.total_minutes ? (final.total_minutes / 60).toFixed(2) : null,
          notes: final.notes,
          createdAt: final.created_at
        },
        message: 'Time record updated successfully'
      }
    });
  } catch (error) {
    console.error('Edit time entry error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to edit time record'
    });
  }
};

// GET /api/v1/timeclock/report - Weekly/pay period report
const getReport = async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;

    // Default to current week if no dates provided
    const start = startDate || getWeekStart();
    const end = endDate || getWeekEnd();

    let query = `
      SELECT
        e.id as employee_id,
        u.first_name,
        u.last_name,
        e.position,
        e.department,
        COUNT(tr.id) as total_punches,
        SUM(tr.total_minutes) as total_minutes,
        MIN(tr.clock_in) as first_punch,
        MAX(tr.clock_out) as last_punch,
        COUNT(CASE WHEN tr.clock_out IS NULL THEN 1 END) as open_punches
      FROM employees e
      JOIN users u ON e.user_id = u.id
      LEFT JOIN employee_timeclock tr ON e.id = tr.employee_id
        AND DATE(tr.clock_in) >= $1
        AND DATE(tr.clock_in) <= $2
      WHERE e.is_active = true
    `;
    const params = [start, end];
    let paramIndex = 3;

    if (department) {
      query += ` AND e.department ILIKE $${paramIndex++}`;
      params.push(`%${department}%`);
    }

    query += `
      GROUP BY e.id, u.first_name, u.last_name, e.position, e.department
      ORDER BY u.last_name, u.first_name
    `;

    const result = await db.query(query, params);

    // Get daily breakdown
    const dailyQuery = `
      SELECT
        DATE(tr.clock_in) as work_date,
        COUNT(DISTINCT tr.employee_id) as employees_worked,
        SUM(tr.total_minutes) as total_minutes
      FROM employee_timeclock tr
      JOIN employees e ON tr.employee_id = e.id
      WHERE DATE(tr.clock_in) >= $1 AND DATE(tr.clock_in) <= $2
      ${department ? `AND e.department ILIKE $3` : ''}
      GROUP BY DATE(tr.clock_in)
      ORDER BY work_date
    `;

    const dailyResult = await db.query(dailyQuery, department ? [start, end, `%${department}%`] : [start, end]);

    // Calculate summary
    const totalMinutes = result.rows.reduce((sum, r) => sum + (parseInt(r.total_minutes) || 0), 0);
    const summary = {
      periodStart: start,
      periodEnd: end,
      totalEmployees: result.rows.length,
      employeesWithHours: result.rows.filter(r => r.total_minutes > 0).length,
      totalMinutes: totalMinutes,
      totalHours: (totalMinutes / 60).toFixed(2),
      openPunches: result.rows.reduce((sum, r) => sum + (parseInt(r.open_punches) || 0), 0)
    };

    res.json({
      success: true,
      data: {
        summary,
        employees: result.rows.map(row => ({
          employeeId: row.employee_id,
          firstName: row.first_name,
          lastName: row.last_name,
          position: row.position,
          department: row.department,
          totalPunches: parseInt(row.total_punches) || 0,
          totalMinutes: parseInt(row.total_minutes) || 0,
          totalHours: row.total_minutes ? (row.total_minutes / 60).toFixed(2) : 0,
          firstPunch: row.first_punch,
          lastPunch: row.last_punch,
          openPunches: parseInt(row.open_punches) || 0
        })),
        dailyBreakdown: dailyResult.rows.map(row => ({
          date: row.work_date,
          employeesWorked: parseInt(row.employees_worked),
          totalMinutes: parseInt(row.total_minutes) || 0,
          totalHours: row.total_minutes ? (row.total_minutes / 60).toFixed(2) : 0
        }))
      }
    });
  } catch (error) {
    console.error('Get timeclock report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate report'
    });
  }
};

// Helper functions
function getWeekStart() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split('T')[0];
}

function getWeekEnd() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? 0 : 7);
  const sunday = new Date(now.setDate(diff));
  return sunday.toISOString().split('T')[0];
}

module.exports = {
  getToday,
  getEmployeeRecords,
  editTimeEntry,
  getReport
};
