import { getDbHelper } from '../helpers/dbHelper';

/**
 * Global Teardown - Runs once after all tests
 * - Clean up test data (optional - can keep for debugging)
 * - Close database connections
 */
export default async function globalTeardown() {
  console.log('\n🧹 Starting Integration Test Teardown...\n');

  try {
    const dbHelper = getDbHelper();

    // Option 1: Keep test data for inspection
    console.log('⏭️  Keeping test data for inspection');
    console.log('   Run cleanup manually if needed: npm run test:cleanup');

    // Option 2: Clean up test data (uncomment if you want auto-cleanup)
    // console.log('Cleaning up test data...');
    // await dbHelper.cleanupTestData('test_');
    // console.log('✅ Test data cleaned up');

    // Close database connection
    await dbHelper.close();
    console.log('✅ Database connections closed');

    console.log('\n✅ Global Teardown Complete!\n');
  } catch (error: any) {
    console.error('\n❌ Global Teardown Failed:', error.message);
    // Don't throw - allow tests to complete even if teardown fails
  }
}
