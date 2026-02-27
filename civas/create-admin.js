const bcrypt = require('bcryptjs');

async function createAdminHash() {
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log('\n=== Admin User Credentials ===');
    console.log('Email: admin@civas.com');
    console.log('Password: admin123');
    console.log('\n=== Hashed Password (for SQL) ===');
    console.log(hashedPassword);
    console.log('\n=== Copy and run this SQL in Supabase SQL Editor ===\n');

    const sql = `INSERT INTO "User" (
  "id",
  "email",
  "name",
  "firstName",
  "lastName",
  "password",
  "role",
  "createdAt",
  "updatedAt"
) VALUES (
  'admin-user-' || gen_random_uuid()::text,
  'admin@civas.com',
  'Admin User',
  'Admin',
  'User',
  '${hashedPassword}',
  'SUPERADMIN',
  NOW(),
  NOW()
);`;

    console.log(sql);
    console.log('\n✅ After running this SQL, you can login with:');
    console.log('   Email: admin@civas.com');
    console.log('   Password: admin123\n');
}

createAdminHash();
