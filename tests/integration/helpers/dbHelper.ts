import mysql, { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';

/**
 * Database Helper for Integration Tests
 * Provides direct database operations for test verification
 */
export class DbHelper {
  private pool: Pool;

  constructor() {
    // Create a dedicated test pool with environment variables
    this.pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'matrimony_services',
      waitForConnections: true,
      connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
    });
  }

  /**
   * Execute raw SQL query
   */
  async executeQuery<T extends RowDataPacket>(
    sql: string,
    params: any[] = []
  ): Promise<T[]> {
    const [rows] = await this.pool.execute<T[]>(sql, params);
    return rows;
  }

  /**
   * Execute stored procedure directly
   */
  async executeProcedure(
    procedureName: string,
    params: any[] = []
  ): Promise<any> {
    const connection = await this.pool.getConnection();
    try {
      const placeholders = params.map(() => '?').join(', ');
      const query = `CALL ${procedureName}(${placeholders})`;
      const [results] = await connection.execute(query, params);
      return results;
    } finally {
      connection.release();
    }
  }

  /**
   * Get record count from table
   */
  async getRecordCount(table: string, where?: string): Promise<number> {
    const whereClause = where ? `WHERE ${where}` : '';
    const sql = `SELECT COUNT(*) as count FROM ${table} ${whereClause}`;
    const [rows] = await this.pool.execute<RowDataPacket[]>(sql);
    return rows[0].count;
  }

  /**
   * Verify session exists in database
   */
  async verifySessionExists(sessionId: string): Promise<boolean> {
    const sql = `
      SELECT COUNT(*) as count 
      FROM admin_sessions 
      WHERE session_id = ? AND is_active = 1
    `;
    const [rows] = await this.pool.execute<RowDataPacket[]>(sql, [sessionId]);
    return rows[0].count > 0;
  }

  /**
   * Get session data
   */
  async getSession(sessionId: string): Promise<any> {
    const sql = `
      SELECT * FROM admin_sessions 
      WHERE session_id = ?
    `;
    const [rows] = await this.pool.execute<RowDataPacket[]>(sql, [sessionId]);
    return rows[0] || null;
  }

  /**
   * Verify activity log entry exists
   */
  async verifyActivityLogEntry(criteria: {
    activity_type?: string;
    created_by?: string;
    message_contains?: string;
  }): Promise<boolean> {
    let sql = 'SELECT COUNT(*) as count FROM activity_log WHERE 1=1';
    const params: any[] = [];

    if (criteria.activity_type) {
      sql += ' AND activity_type = ?';
      params.push(criteria.activity_type);
    }

    if (criteria.created_by) {
      sql += ' AND created_by = ?';
      params.push(criteria.created_by);
    }

    if (criteria.message_contains) {
      sql += ' AND message LIKE ?';
      params.push(`%${criteria.message_contains}%`);
    }

    const [rows] = await this.pool.execute<RowDataPacket[]>(sql, params);
    return rows[0].count > 0;
  }

  /**
   * Get failed login attempts for user
   */
  async getFailedLoginAttempts(username: string): Promise<number> {
    const sql = `
      SELECT failed_login_attempts 
      FROM admin_users 
      WHERE username = ?
    `;
    const [rows] = await this.pool.execute<RowDataPacket[]>(sql, [username]);
    return rows[0]?.failed_login_attempts || 0;
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username: string): Promise<any> {
    const sql = `
      SELECT * FROM admin_users 
      WHERE username = ?
    `;
    const [rows] = await this.pool.execute<RowDataPacket[]>(sql, [username]);
    return rows[0] || null;
  }

  /**
   * Check if user account is locked
   */
  async isAccountLocked(username: string): Promise<boolean> {
    const sql = `
      SELECT locked_until 
      FROM admin_users 
      WHERE username = ?
    `;
    const [rows] = await this.pool.execute<RowDataPacket[]>(sql, [username]);
    
    if (!rows[0]) return false;
    
    const now = new Date();
    const lockedUntil = rows[0].locked_until;
    
    // Account is locked if locked_until is set and in the future
    return lockedUntil && new Date(lockedUntil) > now;
  }

  /**
   * Delete sessions for user
   */
  async deleteUserSessions(username: string): Promise<void> {
    const sql = `
      DELETE FROM admin_sessions 
      WHERE admin_id = (
        SELECT admin_id FROM admin_users WHERE username = ?
      )
    `;
    await this.pool.execute(sql, [username]);
  }

  /**
   * Delete activity logs for user
   */
  async deleteUserActivityLogs(username: string): Promise<void> {
    const sql = `
      DELETE FROM activity_log 
      WHERE created_by = ?
    `;
    await this.pool.execute(sql, [username]);
  }

  /**
   * Reset user failed login attempts
   */
  async resetFailedLoginAttempts(username: string): Promise<void> {
    const sql = `
      UPDATE admin_users 
      SET failed_login_attempts = 0, 
          locked_until = NULL 
      WHERE username = ?
    `;
    await this.pool.execute(sql, [username]);
  }

  /**
   * Delete user by username
   */
  async deleteUser(username: string): Promise<void> {
    // Delete related data first
    await this.deleteUserSessions(username);
    await this.deleteUserActivityLogs(username);
    
    // Delete user
    const sql = `DELETE FROM admin_users WHERE username = ?`;
    await this.pool.execute(sql, [username]);
  }

  /**
   * Clean up all test data
   */
  async cleanupTestData(testUsernamePrefix: string = 'test_'): Promise<void> {
    // Delete sessions for test users
    await this.pool.execute(`
      DELETE FROM admin_sessions 
      WHERE admin_id IN (
        SELECT admin_id FROM admin_users WHERE username LIKE ?
      )
    `, [`${testUsernamePrefix}%`]);

    // Delete activity logs for test users
    await this.pool.execute(`
      DELETE FROM activity_log 
      WHERE created_by LIKE ?
    `, [`${testUsernamePrefix}%`]);

    // Delete test users
    await this.pool.execute(`
      DELETE FROM admin_users 
      WHERE username LIKE ?
    `, [`${testUsernamePrefix}%`]);
  }

  /**
   * Truncate table (use with caution!)
   */
  async truncateTable(table: string): Promise<void> {
    await this.pool.execute(`TRUNCATE TABLE ${table}`);
  }

  /**
   * Begin transaction
   */
  async beginTransaction(): Promise<PoolConnection> {
    const connection = await this.pool.getConnection();
    await connection.beginTransaction();
    return connection;
  }

  /**
   * Close connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

// Singleton instance
let dbHelperInstance: DbHelper | null = null;

export function getDbHelper(): DbHelper {
  if (!dbHelperInstance) {
    dbHelperInstance = new DbHelper();
  }
  return dbHelperInstance;
}
