const bcrypt = require('bcrypt');
const db = require('../config/database');
const { validationResult } = require('express-validator');

const SALT_ROUNDS = 10;

const getAll = async (req, res) => {
  try {
    const { search, department, status = 'active', page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    let query = `
      SELECT e.id, e.user_id, u.email, u.first_name, u.last_name, u.phone, u.role,
        e.position, e.department, e.hire_date, e.pin_code, e.emergency_contact_name,
        e.emergency_contact_phone, e.is_active, e.created_at,
        (SELECT COUNT(*) FROM employee_certifications ec WHERE ec.employee_id = e.id) as certification_count
      FROM employees e JOIN users u ON e.user_id = u.id WHERE 1=1
    `;
    const params = []; let paramIndex = 1;
    if (status === 'active') query += ` AND e.is_active = true AND u.is_active = true`;
    else if (status === 'inactive') query += ` AND (e.is_active = false OR u.is_active = false)`;
    if (search) {
      query += ` AND (u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR CONCAT(u.first_name, ' ', u.last_name) ILIKE $${paramIndex})`;
      params.push(`%${search}%`); paramIndex++;
    }
    if (department) { query += ` AND e.department ILIKE $${paramIndex}`; params.push(`%${department}%`); paramIndex++; }
    const countResult = await db.query(
      `SELECT COUNT(*) FROM employees e JOIN users u ON e.user_id = u.id WHERE 1=1` + query.split('WHERE 1=1')[1].split('ORDER BY')[0], params
    );
    query += ` ORDER BY u.last_name, u.first_name LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));
    const result = await db.query(query, params);
    res.json({ success: true, data: {
      employees: result.rows.map(emp => ({
        id: emp.id, userId: emp.user_id, email: emp.email, firstName: emp.first_name,
        lastName: emp.last_name, phone: emp.phone, role: emp.role, position: emp.position,
        department: emp.department, hireDate: emp.hire_date,
        pinCode: emp.pin_code ? '****' : null, hasPinCode: !!emp.pin_code,
        emergencyContact: { name: emp.emergency_contact_name, phone: emp.emergency_contact_phone },
        isActive: emp.is_active, certificationCount: parseInt(emp.certification_count), createdAt: emp.created_at
      })),
      total: parseInt(countResult.rows[0].count), page: parseInt(page), limit: parseInt(limit)
    }});
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch employees' });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const employeeResult = await db.query(`
      SELECT e.id, e.user_id, u.email, u.first_name, u.last_name, u.phone, u.role,
        e.position, e.department, e.hire_date, e.pin_code, e.hourly_rate, e.photo_url,
        e.emergency_contact_name, e.emergency_contact_phone, e.is_active, e.created_at
      FROM employees e JOIN users u ON e.user_id = u.id WHERE e.id = $1
    `, [id]);
    if (employeeResult.rows.length === 0) return res.status(404).json({ success: false, error: 'Employee not found' });
    const emp = employeeResult.rows[0];
    const certResult = await db.query(`SELECT id, certification_name, issued_date, expiry_date, document_url, created_at FROM employee_certifications WHERE employee_id = $1 ORDER BY expiry_date ASC NULLS LAST`, [id]);
    const timeResult = await db.query(`SELECT id, clock_in, clock_out, total_minutes, notes, created_at FROM employee_timeclock WHERE employee_id = $1 ORDER BY clock_in DESC LIMIT 10`, [id]);
    res.json({ success: true, data: {
      employee: {
        id: emp.id, userId: emp.user_id, email: emp.email, firstName: emp.first_name,
        lastName: emp.last_name, phone: emp.phone, role: emp.role, position: emp.position,
        department: emp.department, hireDate: emp.hire_date, hourlyRate: emp.hourly_rate,
        photoUrl: emp.photo_url, hasPinCode: !!emp.pin_code,
        emergencyContact: { name: emp.emergency_contact_name, phone: emp.emergency_contact_phone },
        isActive: emp.is_active, createdAt: emp.created_at
      },
      certifications: certResult.rows.map(cert => ({
        id: cert.id, name: cert.certification_name, issuedDate: cert.issued_date,
        expiryDate: cert.expiry_date, documentUrl: cert.document_url,
        isExpired: cert.expiry_date ? new Date(cert.expiry_date) < new Date() : false,
        isExpiringSoon: cert.expiry_date ? (new Date(cert.expiry_date) - new Date()) / (1000 * 60 * 60 * 24) <= 30 : false,
        createdAt: cert.created_at
      })),
      recentTimeRecords: timeResult.rows.map(tr => ({
        id: tr.id, clockIn: tr.clock_in, clockOut: tr.clock_out,
        totalMinutes: tr.total_minutes, totalHours: tr.total_minutes ? (tr.total_minutes / 60).toFixed(2) : null,
        notes: tr.notes
      }))
    }});
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch employee' });
  }
};

const create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  const client = await db.pool.connect();
  try {
    const { email, password, firstName, lastName, phone, role = 'staff', position, department, hireDate, pinCode, hourlyRate, emergencyContactName, emergencyContactPhone } = req.body;
    await client.query('BEGIN');
    const existingUser = await client.query('SELECT id FROM users WHERE email = $1 AND is_active = true', [email.toLowerCase()]);
    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Email already in use' });
    }
    await client.query('DELETE FROM users WHERE email = $1 AND is_active = false', [email.toLowerCase()]);
    if (pinCode) {
      const pinExists = await client.query(`
        SELECT 'employee' AS source, id FROM employees WHERE pin_code = $1
        UNION ALL SELECT 'parent' AS source, id FROM parents WHERE pin_code = $1
      `, [pinCode]);
      if (pinExists.rows.length > 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ success: false, error: 'This PIN is already in use. Please choose a different PIN.' });
      }
    }
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const userResult = await client.query(`
      INSERT INTO users (email, password_hash, role, first_name, last_name, phone)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, role, first_name, last_name, phone
    `, [email.toLowerCase(), passwordHash, role, firstName, lastName, phone || null]);
    const user = userResult.rows[0];
    const employeeResult = await client.query(`
      INSERT INTO employees (user_id, position, department, hire_date, pin_code, hourly_rate, emergency_contact_name, emergency_contact_phone)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
    `, [user.id, position || null, department || null, hireDate || null, pinCode || null, hourlyRate || null, emergencyContactName || null, emergencyContactPhone || null]);
    const employee = employeeResult.rows[0];
    await client.query('COMMIT');
    res.status(201).json({ success: true, data: {
      employee: {
        id: employee.id, userId: user.id, email: user.email, firstName: user.first_name,
        lastName: user.last_name, phone: user.phone, role: user.role, position: employee.position,
        department: employee.department, hireDate: employee.hire_date, hasPinCode: !!employee.pin_code,
        emergencyContact: { name: employee.emergency_contact_name, phone: employee.emergency_contact_phone },
        isActive: employee.is_active, createdAt: employee.created_at
      },
      message: 'Employee created successfully'
    }});
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create employee error:', error);
    res.status(500).json({ success: false, error: 'Failed to create employee' });
  } finally { client.release(); }
};

const update = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  const client = await db.pool.connect();
  try {
    const { id } = req.params;
    const { email, firstName, lastName, phone, role, position, department, hireDate, hourlyRate, emergencyContactName, emergencyContactPhone, isActive } = req.body;
    await client.query('BEGIN');
    const empResult = await client.query('SELECT user_id FROM employees WHERE id = $1', [id]);
    if (empResult.rows.length === 0) { await client.query('ROLLBACK'); return res.status(404).json({ success: false, error: 'Employee not found' }); }
    const userId = empResult.rows[0].user_id;
    if (email) {
      const existingUser = await client.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email.toLowerCase(), userId]);
      if (existingUser.rows.length > 0) { await client.query('ROLLBACK'); return res.status(400).json({ success: false, error: 'Email already in use' }); }
    }
    const userFields = []; const userVals = []; let ui = 1;
    if (email) { userFields.push(`email = $${ui++}`); userVals.push(email.toLowerCase()); }
    if (firstName) { userFields.push(`first_name = $${ui++}`); userVals.push(firstName); }
    if (lastName) { userFields.push(`last_name = $${ui++}`); userVals.push(lastName); }
    if (phone !== undefined) { userFields.push(`phone = $${ui++}`); userVals.push(phone); }
    if (role) { userFields.push(`role = $${ui++}`); userVals.push(role); }
    if (isActive !== undefined) { userFields.push(`is_active = $${ui++}`); userVals.push(isActive); }
    if (userFields.length > 0) { userFields.push(`updated_at = CURRENT_TIMESTAMP`); userVals.push(userId); await client.query(`UPDATE users SET ${userFields.join(', ')} WHERE id = $${ui}`, userVals); }
    const empFields = []; const empVals = []; let ei = 1;
    if (position !== undefined) { empFields.push(`position = $${ei++}`); empVals.push(position); }
    if (department !== undefined) { empFields.push(`department = $${ei++}`); empVals.push(department); }
    if (hireDate) { empFields.push(`hire_date = $${ei++}`); empVals.push(hireDate); }
    if (emergencyContactName !== undefined) { empFields.push(`emergency_contact_name = $${ei++}`); empVals.push(emergencyContactName); }
    if (emergencyContactPhone !== undefined) { empFields.push(`emergency_contact_phone = $${ei++}`); empVals.push(emergencyContactPhone); }
    if (hourlyRate !== undefined) { empFields.push(`hourly_rate = $${ei++}`); empVals.push(hourlyRate); }
    if (isActive !== undefined) { empFields.push(`is_active = $${ei++}`); empVals.push(isActive); }
    if (empFields.length > 0) { empVals.push(id); await client.query(`UPDATE employees SET ${empFields.join(', ')} WHERE id = $${ei}`, empVals); }
    await client.query('COMMIT');
    const updatedResult = await db.query(`
      SELECT e.id, e.user_id, u.email, u.first_name, u.last_name, u.phone, u.role,
        e.position, e.department, e.hire_date, e.pin_code, e.hourly_rate,
        e.emergency_contact_name, e.emergency_contact_phone, e.is_active, e.created_at
      FROM employees e JOIN users u ON e.user_id = u.id WHERE e.id = $1
    `, [id]);
    const emp = updatedResult.rows[0];
    res.json({ success: true, data: {
      employee: {
        id: emp.id, userId: emp.user_id, email: emp.email, firstName: emp.first_name,
        lastName: emp.last_name, phone: emp.phone, role: emp.role, position: emp.position,
        department: emp.department, hireDate: emp.hire_date, hourlyRate: emp.hourly_rate,
        hasPinCode: !!emp.pin_code,
        emergencyContact: { name: emp.emergency_contact_name, phone: emp.emergency_contact_phone },
        isActive: emp.is_active, createdAt: emp.created_at
      },
      message: 'Employee updated successfully'
    }});
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update employee error:', error);
    res.status(500).json({ success: false, error: 'Failed to update employee' });
  } finally { client.release(); }
};

const remove = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { id } = req.params;
    await client.query('BEGIN');
    const empResult = await client.query('SELECT user_id FROM employees WHERE id = $1', [id]);
    if (empResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }
    const userId = empResult.rows[0].user_id;
    await client.query('DELETE FROM employee_certifications WHERE employee_id = $1', [id]);
    await client.query('DELETE FROM employee_timeclock WHERE employee_id = $1', [id]);
    await client.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM employees WHERE id = $1', [id]);
    await client.query('DELETE FROM users WHERE id = $1', [userId]);
    await client.query('COMMIT');
    res.json({ success: true, data: { message: 'Employee deleted successfully' } });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete employee error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete employee' });
  } finally { client.release(); }
};

const updatePin = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  try {
    const { id } = req.params;
    const { pinCode } = req.body;
    const empResult = await db.query('SELECT id FROM employees WHERE id = $1', [id]);
    if (empResult.rows.length === 0) return res.status(404).json({ success: false, error: 'Employee not found' });
    if (pinCode) {
      const pinExists = await db.query(`
        SELECT 'employee' AS source, id FROM employees WHERE pin_code = $1 AND id != $2
        UNION ALL SELECT 'parent' AS source, id FROM parents WHERE pin_code = $1
      `, [pinCode, id]);
      if (pinExists.rows.length > 0) return res.status(400).json({ success: false, error: 'This PIN is already in use. Please choose a different PIN.' });
    }
    await db.query('UPDATE employees SET pin_code = $1 WHERE id = $2', [pinCode, id]);
    res.json({ success: true, data: { message: pinCode ? 'PIN code updated successfully' : 'PIN code removed' } });
  } catch (error) {
    console.error('Update PIN error:', error);
    res.status(500).json({ success: false, error: 'Failed to update PIN' });
  }
};

const getCertifications = async (req, res) => {
  try {
    const { id } = req.params;
    const empResult = await db.query('SELECT id FROM employees WHERE id = $1', [id]);
    if (empResult.rows.length === 0) return res.status(404).json({ success: false, error: 'Employee not found' });
    const result = await db.query(`SELECT id, certification_name, issued_date, expiry_date, document_url, created_at FROM employee_certifications WHERE employee_id = $1 ORDER BY expiry_date ASC NULLS LAST`, [id]);
    res.json({ success: true, data: { certifications: result.rows.map(cert => ({ id: cert.id, name: cert.certification_name, issuedDate: cert.issued_date, expiryDate: cert.expiry_date, documentUrl: cert.document_url, isExpired: cert.expiry_date ? new Date(cert.expiry_date) < new Date() : false, isExpiringSoon: cert.expiry_date ? (new Date(cert.expiry_date) - new Date()) / (1000 * 60 * 60 * 24) <= 30 : false, createdAt: cert.created_at })) } });
  } catch (error) {
    console.error('Get certifications error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch certifications' });
  }
};

const addCertification = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  try {
    const { id } = req.params;
    const { name, issuedDate, expiryDate, documentUrl } = req.body;
    const empResult = await db.query('SELECT id FROM employees WHERE id = $1', [id]);
    if (empResult.rows.length === 0) return res.status(404).json({ success: false, error: 'Employee not found' });
    const result = await db.query(`INSERT INTO employee_certifications (employee_id, certification_name, issued_date, expiry_date, document_url) VALUES ($1, $2, $3, $4, $5) RETURNING *`, [id, name, issuedDate, expiryDate, documentUrl]);
    const cert = result.rows[0];
    res.status(201).json({ success: true, data: { certification: { id: cert.id, name: cert.certification_name, issuedDate: cert.issued_date, expiryDate: cert.expiry_date, documentUrl: cert.document_url, createdAt: cert.created_at }, message: 'Certification added successfully' } });
  } catch (error) {
    console.error('Add certification error:', error);
    res.status(500).json({ success: false, error: 'Failed to add certification' });
  }
};

const updateCertification = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });
  try {
    const { id, certId } = req.params;
    const { name, issuedDate, expiryDate, documentUrl } = req.body;
    const certResult = await db.query('SELECT id FROM employee_certifications WHERE id = $1 AND employee_id = $2', [certId, id]);
    if (certResult.rows.length === 0) return res.status(404).json({ success: false, error: 'Certification not found' });
    const updateFields = []; const updateValues = []; let paramIndex = 1;
    if (name !== undefined) { updateFields.push(`certification_name = $${paramIndex++}`); updateValues.push(name); }
    if (issuedDate !== undefined) { updateFields.push(`issued_date = $${paramIndex++}`); updateValues.push(issuedDate); }
    if (expiryDate !== undefined) { updateFields.push(`expiry_date = $${paramIndex++}`); updateValues.push(expiryDate); }
    if (documentUrl !== undefined) { updateFields.push(`document_url = $${paramIndex++}`); updateValues.push(documentUrl); }
    if (updateFields.length === 0) return res.status(400).json({ success: false, error: 'No fields to update' });
    updateValues.push(certId);
    const result = await db.query(`UPDATE employee_certifications SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`, updateValues);
    const cert = result.rows[0];
    res.json({ success: true, data: { certification: { id: cert.id, name: cert.certification_name, issuedDate: cert.issued_date, expiryDate: cert.expiry_date, documentUrl: cert.document_url, createdAt: cert.created_at }, message: 'Certification updated successfully' } });
  } catch (error) {
    console.error('Update certification error:', error);
    res.status(500).json({ success: false, error: 'Failed to update certification' });
  }
};

const deleteCertification = async (req, res) => {
  try {
    const { id, certId } = req.params;
    const certResult = await db.query('SELECT id FROM employee_certifications WHERE id = $1 AND employee_id = $2', [certId, id]);
    if (certResult.rows.length === 0) return res.status(404).json({ success: false, error: 'Certification not found' });
    await db.query('DELETE FROM employee_certifications WHERE id = $1', [certId]);
    res.json({ success: true, data: { message: 'Certification deleted successfully' } });
  } catch (error) {
    console.error('Delete certification error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete certification' });
  }
};

module.exports = { getAll, getById, create, update, remove, updatePin, getCertifications, addCertification, updateCertification, deleteCertification };
