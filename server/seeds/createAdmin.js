const bcrypt = require('bcrypt');
const { pool } = require('../config/database');

const SALT_ROUNDS = 10;

const adminUser = {
  email: 'admin@scribbles-learning.com',
  password: 'Scribbles2026!',
  firstName: 'Admin',
  lastName: 'User',
  role: 'super_admin'
};

async function createAdmin() {
  const client = await pool.connect();

  try {
    console.log('Creating admin user...');

    // Check if admin already exists
    const existing = await client.query(
      'SELECT id, email FROM users WHERE email = $1',
      [adminUser.email]
    );

    if (existing.rows.length > 0) {
      console.log(`Admin user already exists: ${adminUser.email}`);
      console.log('To reset the password, delete the user first and run this script again.');
      return;
    }

    // Hash password
    const passwordHash = await bcrypt.hash(adminUser.password, SALT_ROUNDS);

    // Insert admin user
    const result = await client.query(
      `INSERT INTO users (email, password_hash, role, first_name, last_name, email_verified)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, email, role, first_name, last_name, created_at`,
      [adminUser.email, passwordHash, adminUser.role, adminUser.firstName, adminUser.lastName]
    );

    const user = result.rows[0];

    console.log('\n========================================');
    console.log('Admin user created successfully!');
    console.log('========================================');
    console.log(`ID:         ${user.id}`);
    console.log(`Email:      ${user.email}`);
    console.log(`Password:   ${adminUser.password}`);
    console.log(`Role:       ${user.role}`);
    console.log(`Name:       ${user.first_name} ${user.last_name}`);
    console.log('========================================\n');

  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

createAdmin();
