import { DbHelper, getDbHelper } from './dbHelper';

/**
 * Cleanup Helper for Integration Tests
 * Provides utilities to clean up test data between tests
 */
export class CleanupHelper {
  private dbHelper: DbHelper;

  constructor() {
    this.dbHelper = getDbHelper();
  }

  /**
   * Clean up sessions for test users
   */
  async cleanupTestSessions(usernamePrefix: string = 'test_'): Promise<void> {
    const sql = `
      DELETE FROM admin_sessions 
      WHERE admin_id IN (
        SELECT admin_id FROM admin_users WHERE username LIKE ?
      )
    `;
    await this.dbHelper.executeQuery(sql, [`${usernamePrefix}%`]);
  }

  /**
   * Clean up activity logs for test users
   */
  async cleanupTestActivityLogs(usernamePrefix: string = 'test_'): Promise<void> {
    const sql = `
      DELETE FROM activity_log 
      WHERE created_by LIKE ?
    `;
    await this.dbHelper.executeQuery(sql, [`${usernamePrefix}%`]);
  }

  /**
   * Reset failed login attempts for a user
   */
  async resetUserFailedAttempts(username: string): Promise<void> {
    await this.dbHelper.resetFailedLoginAttempts(username);
  }

  /**
   * Unlock a user account
   */
  async unlockUser(username: string): Promise<void> {
    const sql = `
      UPDATE admin_users 
      SET locked_until = NULL,
          failed_login_attempts = 0
      WHERE username = ?
    `;
    await this.dbHelper.executeQuery(sql, [username]);
  }

  /**
   * Delete a specific user
   */
  async deleteTestUser(username: string): Promise<void> {
    await this.dbHelper.deleteUser(username);
  }

  /**
   * Clean up all test-related data
   */
  async cleanupAllTestData(usernamePrefix: string = 'test_'): Promise<void> {
    await this.cleanupTestSessions(usernamePrefix);
    await this.cleanupTestActivityLogs(usernamePrefix);
  }

  /**
   * Clean up sessions for a specific user
   */
  async cleanupUserSessions(username: string): Promise<void> {
    await this.dbHelper.deleteUserSessions(username);
  }

  /**
   * Clean up activity logs for a specific user
   */
  async cleanupUserActivityLogs(username: string): Promise<void> {
    await this.dbHelper.deleteUserActivityLogs(username);
  }

  /**
   * Reset all test users to initial state
   * - Unlock accounts
   * - Reset failed attempts
   * - Clean sessions
   * - Keep the users themselves
   */
  async resetAllTestUsers(usernamePrefix: string = 'test_'): Promise<void> {
    // Clean sessions and logs
    await this.cleanupTestSessions(usernamePrefix);
    await this.cleanupTestActivityLogs(usernamePrefix);

    // Reset user states
    const sql = `
      UPDATE admin_users 
      SET locked_until = NULL,
          failed_login_attempts = 0
      WHERE username LIKE ?
    `;
    await this.dbHelper.executeQuery(sql, [`${usernamePrefix}%`]);
  }

  /**
   * Clean up specific session by session ID
   */
  async cleanupSession(sessionId: string): Promise<void> {
    const sql = `DELETE FROM admin_sessions WHERE session_id = ?`;
    await this.dbHelper.executeQuery(sql, [sessionId]);
  }

  /**
   * Clean up password reset tokens for test users
   */
  async cleanupPasswordResetTokens(usernamePrefix: string = 'test_'): Promise<void> {
    const sql = `
      DELETE FROM password_reset_tokens 
      WHERE admin_id IN (
        SELECT admin_id FROM admin_users WHERE username LIKE ?
      )
    `;
    await this.dbHelper.executeQuery(sql, [`${usernamePrefix}%`]);
  }

  /**
   * Comprehensive cleanup - reset everything for a clean test state
   */
  async fullCleanup(usernamePrefix: string = 'test_'): Promise<void> {
    await this.cleanupTestSessions(usernamePrefix);
    await this.cleanupTestActivityLogs(usernamePrefix);
    await this.cleanupPasswordResetTokens(usernamePrefix);
    await this.resetAllTestUsers(usernamePrefix);
  }
}

// Singleton instance
let cleanupHelperInstance: CleanupHelper | null = null;

export function getCleanupHelper(): CleanupHelper {
  if (!cleanupHelperInstance) {
    cleanupHelperInstance = new CleanupHelper();
  }
  return cleanupHelperInstance;
}
