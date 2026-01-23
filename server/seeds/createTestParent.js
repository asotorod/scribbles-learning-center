const bcrypt = require('bcrypt');
const { pool } = require('../config/database');

const SALT_ROUNDS = 10;

const testParent = {
  email: 'parent@example.com',
  password: 'password123',
  firstName: 'Test',
  lastName: 'Parent',
  phone: '(201) 555-0123',
  pin: '1234'
};

const testChild = {
  firstName: 'Emma',
  lastName: 'Johnson',
  dateOfBirth: '2021-03-15',
  programSlug: 'preschool'
};

async function createTestParent() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('Creating test parent user...');

    // Check if parent already exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1',
      [testParent.email]
    );

    if (existingUser.rows.length > 0) {
      console.log(`Test parent already exists: ${testParent.email}`);
      console.log('To reset, delete the user first and run this script again.');
      await client.query('ROLLBACK');
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(testParent.password, SALT_ROUNDS);

    // Create user
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, role, first_name, last_name, phone, email_verified)
       VALUES ($1, $2, 'parent', $3, $4, $5, true)
       RETURNING id, email, first_name, last_name`,
      [testParent.email, passwordHash, testParent.firstName, testParent.lastName, testParent.phone]
    );

    const userId = userResult.rows[0].id;

    // Create parent record with PIN
    const parentResult = await client.query(
      `INSERT INTO parents (user_id, pin_code)
       VALUES ($1, $2)
       RETURNING id`,
      [userId, testParent.pin]
    );

    const parentId = parentResult.rows[0].id;

    // Get preschool program
    const programResult = await client.query(
      'SELECT id FROM programs WHERE slug = $1',
      [testChild.programSlug]
    );

    let programId = null;
    if (programResult.rows.length > 0) {
      programId = programResult.rows[0].id;
    }

    // Create test child
    const childResult = await client.query(
      `INSERT INTO children (first_name, last_name, date_of_birth, program_id, enrollment_date, is_active)
       VALUES ($1, $2, $3, $4, CURRENT_DATE, true)
       RETURNING id, first_name, last_name`,
      [testChild.firstName, testChild.lastName, testChild.dateOfBirth, programId]
    );

    const childId = childResult.rows[0].id;

    // Link parent to child
    await client.query(
      `INSERT INTO parent_children (parent_id, child_id, relationship, is_primary_contact, is_authorized_pickup)
       VALUES ($1, $2, 'parent', true, true)`,
      [parentId, childId]
    );

    await client.query('COMMIT');

    console.log('\n========================================');
    console.log('Test parent created successfully!');
    console.log('========================================');
    console.log(`Email:      ${testParent.email}`);
    console.log(`Password:   ${testParent.password}`);
    console.log(`PIN:        ${testParent.pin}`);
    console.log(`Child:      ${testChild.firstName} ${testChild.lastName}`);
    console.log(`Program:    Preschool`);
    console.log('========================================\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating test parent:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

createTestParent();
