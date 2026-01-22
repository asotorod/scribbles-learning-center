const bcrypt = require('bcrypt');
const { pool } = require('../config/database');

const SALT_ROUNDS = 10;

const employee = {
  email: 'teacher@scribbles-learning.com',
  password: 'Teacher2026!',
  firstName: 'Maria',
  lastName: 'Garcia',
  role: 'staff',
  position: 'Lead Teacher',
  department: 'Toddler Program',
  pinCode: '4321'
};

async function createEmployee() {
  const client = await pool.connect();

  try {
    console.log('Creating employee user...');

    await client.query('BEGIN');

    // Check if employee already exists
    const existing = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [employee.email]
    );

    if (existing.rows.length > 0) {
      console.log(`Employee user already exists: ${employee.email}`);
      await client.query('ROLLBACK');
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(employee.password, SALT_ROUNDS);

    // Create user
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, role, first_name, last_name, email_verified)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, email, role, first_name, last_name`,
      [employee.email, passwordHash, employee.role, employee.firstName, employee.lastName]
    );

    const user = userResult.rows[0];

    // Create employee record
    const employeeResult = await client.query(
      `INSERT INTO employees (user_id, position, department, pin_code, hire_date)
       VALUES ($1, $2, $3, $4, CURRENT_DATE)
       RETURNING id, position, department, pin_code`,
      [user.id, employee.position, employee.department, employee.pinCode]
    );

    const emp = employeeResult.rows[0];

    await client.query('COMMIT');

    console.log('\n========================================');
    console.log('Employee created successfully!');
    console.log('========================================');
    console.log(`User ID:      ${user.id}`);
    console.log(`Employee ID:  ${emp.id}`);
    console.log(`Email:        ${user.email}`);
    console.log(`Password:     ${employee.password}`);
    console.log(`Name:         ${user.first_name} ${user.last_name}`);
    console.log(`Position:     ${emp.position}`);
    console.log(`Department:   ${emp.department}`);
    console.log(`PIN:          ${emp.pin_code}`);
    console.log('========================================\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating employee:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

createEmployee();
