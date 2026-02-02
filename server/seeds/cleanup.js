const { pool } = require('../config/database');

/**
 * Cleanup script to remove demo/test data from the database.
 *
 * KEEPS: admin user (admin@scribbleslearning.com), programs, absence_reasons
 * REMOVES: test users, orphaned records, standalone content tables
 */
async function cleanup() {
  const client = await pool.connect();

  try {
    console.log('Starting database cleanup...\n');

    // 1. Delete test users (CASCADE handles children, parents, employees, attendance, etc.)
    const testEmails = ['teacher@scribbles-learning.com', 'parent@example.com'];
    for (const email of testEmails) {
      const result = await client.query('DELETE FROM users WHERE email = $1 RETURNING id, email', [email]);
      if (result.rowCount > 0) {
        console.log(`✅ Deleted test user: ${email}`);
      } else {
        console.log(`⏭️  Test user not found (already clean): ${email}`);
      }
    }

    // 2. Clean standalone content tables
    const contentTables = [
      'contact_inquiries',
      'gallery_images',
      'testimonials',
      'site_content',
      'job_postings',
      'job_applications',
    ];

    for (const table of contentTables) {
      try {
        const result = await client.query(`DELETE FROM ${table}`);
        console.log(`✅ Cleaned ${table}: ${result.rowCount} rows removed`);
      } catch (err) {
        if (err.code === '42P01') {
          // Table doesn't exist — skip silently
          console.log(`⏭️  Table ${table} does not exist, skipping`);
        } else {
          console.warn(`⚠️  Error cleaning ${table}: ${err.message}`);
        }
      }
    }

    // 3. Clean orphaned children (not linked to any parent)
    try {
      const result = await client.query(`
        DELETE FROM children
        WHERE id NOT IN (SELECT child_id FROM parent_children)
      `);
      console.log(`✅ Cleaned orphaned children: ${result.rowCount} rows removed`);
    } catch (err) {
      console.warn(`⚠️  Error cleaning orphaned children: ${err.message}`);
    }

    // 4. Show what's left
    console.log('\n--- Remaining data ---');

    const users = await client.query('SELECT id, email, role FROM users');
    console.log(`Users: ${users.rowCount}`);
    users.rows.forEach(u => console.log(`  - ${u.email} (${u.role})`));

    try {
      const programs = await client.query('SELECT id, name FROM programs');
      console.log(`Programs: ${programs.rowCount}`);
      programs.rows.forEach(p => console.log(`  - ${p.name}`));
    } catch (err) {
      console.log('Programs table: not found or empty');
    }

    try {
      const reasons = await client.query('SELECT id, name FROM absence_reasons');
      console.log(`Absence reasons: ${reasons.rowCount}`);
    } catch (err) {
      console.log('Absence reasons table: not found or empty');
    }

    console.log('\n✅ Database cleanup complete!');
  } catch (error) {
    console.error('❌ Cleanup error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

cleanup();
