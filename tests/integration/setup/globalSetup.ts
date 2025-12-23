import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcrypt';
import { getDbHelper } from '../helpers/dbHelper';
import { ALL_TEST_USERS } from '../fixtures/users.fixture';

/**
 * Global Setup - Runs once before all tests
 * - Load test environment variables
 * - Connect to database
 * - Create test users
 */
export default async function globalSetup() {
  console.log('\n🚀 Starting Integration Test Setup...\n');

  try {
    // Set NODE_ENV to test
    process.env.NODE_ENV = 'test';
    
    // Load test environment variables
    const envPath = path.resolve(__dirname, '../../../.env.test');
    dotenv.config({ path: envPath, override: true });
    console.log('✅ Loaded .env.test configuration');

    // Verify database connection
    const dbHelper = getDbHelper();
    const testQuery = await dbHelper.executeQuery('SELECT 1 as test');
    if (testQuery[0].test !== 1) {
      throw new Error('Database connection test failed');
    }
    console.log('✅ Database connection verified');

    // Create test users
    await createTestUsers(dbHelper);
    console.log('✅ Test users created');

    console.log('\n✅ Global Setup Complete!\n');
  } catch (error: any) {
    console.error('\n❌ Global Setup Failed:', error.message);
    console.error(error.stack);
    throw error;
  }
}

/**
 * Create all test users
 */
async function createTestUsers(dbHelper: any): Promise<void> {
  console.log('Creating test users...');

  const BCRYPT_ROUNDS = 10;

  for (const user of ALL_TEST_USERS) {
    try {
      // Check if user already exists
      const existingUser = await dbHelper.getUserByUsername(user.username);

      if (existingUser) {
        console.log(`  ⏭️  User ${user.username} already exists, skipping...`);
        continue;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(user.password, BCRYPT_ROUNDS);

      // Insert user
      const sql = `
        INSERT INTO admin_users (
          username,
          email,
          password_hash,
          role,
          is_active,
          mfa_enabled,
          failed_login_attempts,
          created_at,
          created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), 'test_setup')
      `;

      await dbHelper.executeQuery(sql, [
        user.username,
        user.email,
        passwordHash,
        user.role,
        user.is_active ? 1 : 0,
        user.mfa_enabled ? 1 : 0,
        user.failed_login_attempts || 0
      ]);

      console.log(`  ✅ Created user: ${user.username} (${user.role})`);
    } catch (error: any) {
      console.error(`  ❌ Failed to create user ${user.username}:`, error.message);
      // Continue with other users
    }
  }
}
