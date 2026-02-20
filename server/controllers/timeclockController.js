const db = require('../config/database');
const { validationResult } = require('express-validator');

// GET /api/v1/timeclock/today - Today's punches for all employees
const getToday = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

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
        tr.entry_type,
        tr.notes
      FROM employees e
      JOIN users u ON e.user_id = u.id
      LEFT JOIN employee_timeclock tr ON e.id = tr.employee_id
        AND DATE(tr.clock_in) = $1
      WHERE e.is_active = true AND u.is_active = true
      ORDER BY u.last_name, u.first_name, tr.clock_in
    `, [today]);

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
          totalWorkMinutes: 0,
          totalLunchMinutes: 0,
          status: 'not_clocked_in'
        });
      }

      const emp = employeeMap.get(row.employee_id);

      if (row.time_record_id) {
        const record = {
          id: row.time_record_id,
          clockIn: row.clock_in,
          clockOut: row.clock_out,
          totalMinutes: row.total_minutes,
          totalHours: row.total_minutes ? (row.total_minutes / 60).toFixed(2) : null,
          entryType: row.entry_type || 'shift',
          notes: row.notes
        };
        emp.timeRecords.push(record);

        if (row.total_minutes) {
          if (row.entry_type === 'lunch_break') {
            emp.totalLunchMinutes += row.total_minutes;
          } else {
            emp.totalWorkMinutes += row.total_minutes;
          }
        }

        // Determine current status from latest record
        if (!row.clock_out && row.entry_type === 'lunch_break') {
          emp.status = 'on_lunch';
        } else if (!row.clock_out && row.entry_type !== 'lunch_break') {
          emp.status = 'clocked_in';
        } else {
          // Only set clocked_out if no later open record
          if (emp.status === 'not_clocked_in') {
            emp.status = 'clocked_out';
          }
        }
      }
    }

    const employees = Array.from(employeeMap.values());

    const stats = {
      totalEmployees: employees.length,
      clockedIn: employees.filter(e => e.status === 'clocked_in').length,
      onLunch: employees.filter(e => e.status === 'on_lunch').length,
      clockedOut: employees.filter(e => e.status === 'clocked_out').length,
      notClockedIn: employees.filter(e => e.status === 'not_clocked_in').length
    };

    res.json({
      success: true,
      data: { date: today, stats, employees }
    });
  } catch (error) {
    console.error('Get today timeclock error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch today\'s time records' });
  }
};

// GET /api/v1/timeclock/employee/:id - Employee's time records
const getEmployeeRecords = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const empResult = await db.query(`
      SELECT e.id, u.first_name, u.last_name, e.position, e.department
      FROM employees e
      JOIN users u ON e.user_id = u.id
      WHERE e.id = $1
    `, [id]);

    if (empResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    const employee = empResult.rows[0];

    let query = `
      SELECT id, clock_in, clock_out, total_minutes, entry_type, notes,
             adjusted_by, adjusted_at, adjustment_reason, created_at
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

    const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) FROM');
    const countResult = await db.query(countQuery, params);

    query += ` ORDER BY clock_in DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await db.query(query, params);

    // Calculate totals
    let totalQuery = `
      SELECT
        SUM(CASE WHEN entry_type = 'shift' OR entry_type IS NULL THEN total_minutes ELSE 0 END) as work_minutes,
        SUM(CASE WHEN entry_type = 'lunch_break' THEN total_minutes ELSE 0 END) as lunch_minutes,
        COUNT(*) as total_records
      FROM employee_timeclock
      WHERE employee_id = $1 AND total_minutes IS NOT NULL
    `;
    const totalParams = [id];
    let tpi = 2;
    if (startDate) { totalQuery += ` AND DATE(clock_in) >= $${tpi++}`; totalParams.push(startDate); }
    if (endDate) { totalQuery += ` AND DATE(clock_in) <= $${tpi++}`; totalParams.push(endDate); }

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
          entryType: tr.entry_type || 'shift',
          notes: tr.notes,
          adjustedBy: tr.adjusted_by,
          adjustedAt: tr.adjusted_at,
          adjustmentReason: tr.adjustment_reason,
          createdAt: tr.created_at
        })),
        summary: {
          workMinutes: parseInt(totalResult.rows[0].work_minutes) || 0,
          workHours: totalResult.rows[0].work_minutes ? (totalResult.rows[0].work_minutes / 60).toFixed(2) : '0.00',
          lunchMinutes: parseInt(totalResult.rows[0].lunch_minutes) || 0,
          totalRecords: parseInt(totalResult.rows[0].total_records) || 0
        },
        total: parseInt(countResult.rows[0].count),
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get employee records error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch employee time records' });
  }
};

// PUT /api/v1/timeclock/:id - Edit time entry (admin correction/adjustment)
const editTimeEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { clockIn, clockOut, notes, adjustmentReason } = req.body;
    const adminUserId = req.user.id;

    const recordResult = await db.query(`
      SELECT tr.*, e.id as employee_id, u.first_name, u.last_name
      FROM employee_timeclock tr
      JOIN employees e ON tr.employee_id = e.id
      JOIN users u ON e.user_id = u.id
      WHERE tr.id = $1
    `, [id]);

    if (recordResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Time record not found' });
    }

    const record = recordResult.rows[0];
    const updateFields = [];
    const updateValues = [];
    let paramIndex = 1;

    if (clockIn !== undefined) {
      updateFields.push(`clock_in = $${paramIndex++}`);
      updateValues.push(clockIn);
    }
    if (clockOut !== undefined) {
      updateFields.push(`clock_out = $${paramIndex++}`);
      updateValues.push(clockOut || null);
    }
    if (notes !== undefined) {
      updateFields.push(`notes = $${paramIndex++}`);
      updateValues.push(notes);
    }

    // Always mark as adjusted
    updateFields.push(`adjusted_by = $${paramIndex++}`);
    updateValues.push(adminUserId);
    updateFields.push(`adjusted_at = $${paramIndex++}`);
    updateValues.push(new Date());
    updateFields.push(`adjustment_reason = $${paramIndex++}`);
    updateValues.push(adjustmentReason || 'Admin correction');

    if (updateFields.length === 3) { // Only the adjustment fields
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    updateValues.push(id);
    await db.query(
      `UPDATE employee_timeclock SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
      updateValues
    );

    // Recalculate total minutes
    const updatedRecord = await db.query(
      'SELECT clock_in, clock_out FROM employee_timeclock WHERE id = $1', [id]
    );
    const updated = updatedRecord.rows[0];
    if (updated.clock_in && updated.clock_out) {
      const totalMinutes = Math.round((new Date(updated.clock_out) - new Date(updated.clock_in)) / (1000 * 60));
      await db.query('UPDATE employee_timeclock SET total_minutes = $1 WHERE id = $2', [totalMinutes, id]);
    } else if (!updated.clock_out) {
      await db.query('UPDATE employee_timeclock SET total_minutes = NULL WHERE id = $1', [id]);
    }

    const finalResult = await db.query('SELECT * FROM employee_timeclock WHERE id = $1', [id]);
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
          entryType: final.entry_type,
          notes: final.notes,
          adjustedBy: final.adjusted_by,
          adjustedAt: final.adjusted_at,
          adjustmentReason: final.adjustment_reason
        },
        message: 'Time record updated successfully'
      }
    });
  } catch (error) {
    console.error('Edit time entry error:', error);
    res.status(500).json({ success: false, error: 'Failed to edit time record' });
  }
};

// POST /api/v1/timeclock/add-punch - Admin adds a missing punch
const addPunch = async (req, res) => {
  try {
    const { employeeId, clockIn, clockOut, entryType = 'shift', notes } = req.body;
    const adminUserId = req.user.id;

    if (!employeeId || !clockIn) {
      return res.status(400).json({ success: false, error: 'employeeId and clockIn are required' });
    }

    // Verify employee exists
    const empResult = await db.query(`
      SELECT e.id, u.first_name, u.last_name
      FROM employees e JOIN users u ON e.user_id = u.id
      WHERE e.id = $1
    `, [employeeId]);

    if (empResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }

    let totalMinutes = null;
    if (clockIn && clockOut) {
      totalMinutes = Math.round((new Date(clockOut) - new Date(clockIn)) / (1000 * 60));
    }

    const result = await db.query(`
      INSERT INTO employee_timeclock (employee_id, clock_in, clock_out, total_minutes, entry_type, notes, adjusted_by, adjusted_at, adjustment_reason)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), 'Admin added missing punch')
      RETURNING *
    `, [employeeId, clockIn, clockOut || null, totalMinutes, entryType, notes || null, adminUserId]);

    const record = result.rows[0];
    const emp = empResult.rows[0];

    res.json({
      success: true,
      data: {
        timeRecord: {
          id: record.id,
          employeeId: record.employee_id,
          employeeName: `${emp.first_name} ${emp.last_name}`,
          clockIn: record.clock_in,
          clockOut: record.clock_out,
          totalMinutes: record.total_minutes,
          entryType: record.entry_type,
          notes: record.notes
        },
        message: 'Punch added successfully'
      }
    });
  } catch (error) {
    console.error('Add punch error:', error);
    res.status(500).json({ success: false, error: 'Failed to add punch' });
  }
};

// DELETE /api/v1/timeclock/:id - Delete a time entry
const deleteTimeEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('DELETE FROM employee_timeclock WHERE id = $1 RETURNING *', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Time record not found' });
    }
    res.json({ success: true, message: 'Time record deleted' });
  } catch (error) {
    console.error('Delete time entry error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete time record' });
  }
};

// GET /api/v1/timeclock/report - Weekly/pay period report
const getReport = async (req, res) => {
  try {
    const { startDate, endDate, department } = req.query;

    const start = startDate || getWeekStart();
    const end = endDate || getWeekEnd();

    let query = `
      SELECT
        e.id as employee_id,
        u.first_name,
        u.last_name,
        e.position,
        e.department,
        e.hourly_rate,
        COUNT(CASE WHEN tr.entry_type = 'shift' OR tr.entry_type IS NULL THEN tr.id END) as shift_punches,
        SUM(CASE WHEN (tr.entry_type = 'shift' OR tr.entry_type IS NULL) AND tr.total_minutes IS NOT NULL THEN tr.total_minutes ELSE 0 END) as work_minutes,
        SUM(CASE WHEN tr.entry_type = 'lunch_break' AND tr.total_minutes IS NOT NULL THEN tr.total_minutes ELSE 0 END) as lunch_minutes,
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

    query += ` GROUP BY e.id, u.first_name, u.last_name, e.position, e.department, e.hourly_rate
               ORDER BY u.last_name, u.first_name`;

    const result = await db.query(query, params);

    // Daily breakdown
    const dailyQuery = `
      SELECT
        DATE(tr.clock_in) as work_date,
        COUNT(DISTINCT tr.employee_id) as employees_worked,
        SUM(CASE WHEN (tr.entry_type = 'shift' OR tr.entry_type IS NULL) AND tr.total_minutes IS NOT NULL THEN tr.total_minutes ELSE 0 END) as work_minutes,
        SUM(CASE WHEN tr.entry_type = 'lunch_break' AND tr.total_minutes IS NOT NULL THEN tr.total_minutes ELSE 0 END) as lunch_minutes
      FROM employee_timeclock tr
      JOIN employees e ON tr.employee_id = e.id
      WHERE DATE(tr.clock_in) >= $1 AND DATE(tr.clock_in) <= $2
      ${department ? `AND e.department ILIKE $3` : ''}
      GROUP BY DATE(tr.clock_in)
      ORDER BY work_date
    `;
    const dailyResult = await db.query(dailyQuery, department ? [start, end, `%${department}%`] : [start, end]);

    const totalWorkMinutes = result.rows.reduce((sum, r) => sum + (parseInt(r.work_minutes) || 0), 0);
    const totalLunchMinutes = result.rows.reduce((sum, r) => sum + (parseInt(r.lunch_minutes) || 0), 0);

    const summary = {
      periodStart: start,
      periodEnd: end,
      totalEmployees: result.rows.length,
      employeesWithHours: result.rows.filter(r => parseInt(r.work_minutes) > 0).length,
      totalWorkMinutes,
      totalWorkHours: (totalWorkMinutes / 60).toFixed(2),
      totalLunchMinutes,
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
          hourlyRate: row.hourly_rate ? parseFloat(row.hourly_rate) : null,
          shiftPunches: parseInt(row.shift_punches) || 0,
          workMinutes: parseInt(row.work_minutes) || 0,
          workHours: row.work_minutes ? (row.work_minutes / 60).toFixed(2) : '0.00',
          lunchMinutes: parseInt(row.lunch_minutes) || 0,
          firstPunch: row.first_punch,
          lastPunch: row.last_punch,
          openPunches: parseInt(row.open_punches) || 0,
          estimatedPay: row.hourly_rate && row.work_minutes
            ? (parseFloat(row.hourly_rate) * (row.work_minutes / 60)).toFixed(2)
            : null
        })),
        dailyBreakdown: dailyResult.rows.map(row => ({
          date: row.work_date,
          employeesWorked: parseInt(row.employees_worked),
          workMinutes: parseInt(row.work_minutes) || 0,
          workHours: row.work_minutes ? (row.work_minutes / 60).toFixed(2) : '0.00',
          lunchMinutes: parseInt(row.lunch_minutes) || 0
        }))
      }
    });
  } catch (error) {
    console.error('Get timeclock report error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate report' });
  }
};

// GET /api/v1/timeclock/daily-report - Daily employee report for a specific date
const getDailyReport = async (req, res) => {
  try {
    const { date } = req.query;
    const reportDate = date || new Date().toISOString().split('T')[0];

    const result = await db.query(`
      SELECT
        e.id as employee_id,
        u.first_name,
        u.last_name,
        e.position,
        e.department,
        e.hourly_rate,
        tr.id as record_id,
        tr.clock_in,
        tr.clock_out,
        tr.total_minutes,
        tr.entry_type,
        tr.notes,
        tr.adjusted_by,
        tr.adjustment_reason
      FROM employees e
      JOIN users u ON e.user_id = u.id
      LEFT JOIN employee_timeclock tr ON e.id = tr.employee_id
        AND DATE(tr.clock_in) = $1
      WHERE e.is_active = true
      ORDER BY u.last_name, u.first_name, tr.clock_in
    `, [reportDate]);

    const employeeMap = new Map();

    for (const row of result.rows) {
      if (!employeeMap.has(row.employee_id)) {
        employeeMap.set(row.employee_id, {
          employeeId: row.employee_id,
          firstName: row.first_name,
          lastName: row.last_name,
          position: row.position,
          department: row.department,
          hourlyRate: row.hourly_rate ? parseFloat(row.hourly_rate) : null,
          punches: [],
          workMinutes: 0,
          lunchMinutes: 0,
          firstIn: null,
          lastOut: null,
          hasOpenPunch: false
        });
      }

      const emp = employeeMap.get(row.employee_id);

      if (row.record_id) {
        emp.punches.push({
          id: row.record_id,
          clockIn: row.clock_in,
          clockOut: row.clock_out,
          totalMinutes: row.total_minutes,
          entryType: row.entry_type || 'shift',
          notes: row.notes,
          wasAdjusted: !!row.adjusted_by,
          adjustmentReason: row.adjustment_reason
        });

        if (row.total_minutes) {
          if (row.entry_type === 'lunch_break') {
            emp.lunchMinutes += row.total_minutes;
          } else {
            emp.workMinutes += row.total_minutes;
          }
        }

        if (!row.clock_out) emp.hasOpenPunch = true;
        if (!emp.firstIn || new Date(row.clock_in) < new Date(emp.firstIn)) {
          emp.firstIn = row.clock_in;
        }
        if (row.clock_out && (!emp.lastOut || new Date(row.clock_out) > new Date(emp.lastOut))) {
          emp.lastOut = row.clock_out;
        }
      }
    }

    const employees = Array.from(employeeMap.values()).map(emp => ({
      ...emp,
      workHours: (emp.workMinutes / 60).toFixed(2),
      lunchHours: (emp.lunchMinutes / 60).toFixed(2),
      estimatedPay: emp.hourlyRate ? (emp.hourlyRate * (emp.workMinutes / 60)).toFixed(2) : null,
      worked: emp.punches.length > 0
    }));

    const worked = employees.filter(e => e.worked);
    const totalWorkMinutes = worked.reduce((sum, e) => sum + e.workMinutes, 0);

    res.json({
      success: true,
      data: {
        date: reportDate,
        stats: {
          totalEmployees: employees.length,
          employeesWorked: worked.length,
          employeesAbsent: employees.length - worked.length,
          totalWorkHours: (totalWorkMinutes / 60).toFixed(2),
          openPunches: employees.filter(e => e.hasOpenPunch).length
        },
        employees
      }
    });
  } catch (error) {
    console.error('Get daily report error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate daily report' });
  }
};

// Helper functions
function getWeekStart() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  return new Date(now.getFullYear(), now.getMonth(), diff).toISOString().split('T')[0];
}

function getWeekEnd() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? 0 : 7);
  return new Date(now.getFullYear(), now.getMonth(), diff).toISOString().split('T')[0];
}

module.exports = {
  getToday,
  getEmployeeRecords,
  editTimeEntry,
  addPunch,
  deleteTimeEntry,
  getReport,
  getDailyReport
};
