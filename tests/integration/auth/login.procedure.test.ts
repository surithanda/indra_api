import bcrypt from 'bcrypt';
import { ProcedureHelper, getProcedureHelper, ProcedureResult } from '../helpers/procedureHelper';
import { DbHelper, getDbHelper } from '../helpers/dbHelper';
import { CleanupHelper, getCleanupHelper } from '../helpers/cleanupHelper';
import { TEST_USERS } from '../fixtures/users.fixture';

/**
 * Integration Tests: admin_auth_login Stored Procedure
 * Tests the stored procedure directly without HTTP layer
 */
describe('admin_auth_login - Stored Procedure Integration Tests', () => {
  let procedureHelper: ProcedureHelper;
  let dbHelper: DbHelper;
  let cleanupHelper: CleanupHelper;

  const BCRYPT_ROUNDS = 10;

  beforeAll(() => {
    procedureHelper = getProcedureHelper();
    dbHelper = getDbHelper();
    cleanupHelper = getCleanupHelper();
  });

  afterAll(async () => {
    await cleanupHelper.fullCleanup();
  });

  beforeEach(async () => {
    await cleanupHelper.cleanupTestSessions();
    await cleanupHelper.resetAllTestUsers();
  });

  // ============================================
  // PROCEDURE RESPONSE STRUCTURE TESTS
  // ============================================

  describe('Procedure Response Structure', () => {
    it('should return status field on success', async () => {
      const user = TEST_USERS.VALID_ADMIN;
      const storedUser = await dbHelper.getUserByUsername(user.username);

      const result = await procedureHelper.callLoginProcedure(
        user.username,
        storedUser.password_hash,
        '127.0.0.1',
        'test-agent'
      );

      expect(result).toHaveStatusField();
      expect(result.status).toBe('success');
    });

    it('should return status field on failure', async () => {
      const result = await procedureHelper.callLoginProcedure(
        'nonexistent_user',
        'fake_hash',
        '127.0.0.1',
        'test-agent'
      );

      expect(result).toHaveStatusField();
      expect(result.status).toBe('fail');
    });

    it('should include all required status fields on success', async () => {
      const user = TEST_USERS.VALID_ADMIN;
      const storedUser = await dbHelper.getUserByUsername(user.username);

      const result = await procedureHelper.callLoginProcedure(
        user.username,
        storedUser.password_hash,
        '127.0.0.1',
        'test-agent'
      );

      // Verify all status fields present
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('error_type');
      expect(result).toHaveProperty('error_code');
      expect(result).toHaveProperty('error_message');

      // Verify success response structure
      expect(result).toBeSuccessResponse();
    });

    it('should include error fields on failure', async () => {
      const result = await procedureHelper.callLoginProcedure(
        'nonexistent_user',
        'fake_hash',
        '127.0.0.1',
        'test-agent'
      );

      expect(result).toHaveErrorFields();
      expect(result).toBeFailResponse();
    });

    it('should have null error fields on success', async () => {
      const user = TEST_USERS.VALID_ADMIN;
      const storedUser = await dbHelper.getUserByUsername(user.username);

      const result = await procedureHelper.callLoginProcedure(
        user.username,
        storedUser.password_hash,
        '127.0.0.1',
        'test-agent'
      );

      expect(result.status).toBe('success');
      expect(result.error_type).toBeNull();
      expect(result.error_code).toBeNull();
      expect(result.error_message).toBeNull();
    });

    it('should have non-null error fields on failure', async () => {
      const result = await procedureHelper.callLoginProcedure(
        'nonexistent_user',
        'fake_hash',
        '127.0.0.1',
        'test-agent'
      );

      expect(result.status).toBe('fail');
      expect(result.error_type).not.toBeNull();
      expect(result.error_code).not.toBeNull();
      expect(result.error_message).not.toBeNull();
    });
  });

  // ============================================
  // PROCEDURE LOGIC VALIDATION TESTS
  // ============================================

  describe('Procedure Logic Validation', () => {
    it('should create session with valid credentials', async () => {
      const user = TEST_USERS.VALID_ADMIN;
      const storedUser = await dbHelper.getUserByUsername(user.username);

      const result = await procedureHelper.callLoginProcedure(
        user.username,
        storedUser.password_hash,
        '127.0.0.1',
        'test-agent'
      );

      expect(result.status).toBe('success');
      expect(result.session_id).toBeDefined();
      expect(result.admin_id).toBeDefined();

      // Verify session exists in database
      const sessionExists = await dbHelper.verifySessionExists(result.session_id);
      expect(sessionExists).toBe(true);
    });

    it('should return error with non-existent username', async () => {
      const result = await procedureHelper.callLoginProcedure(
        'nonexistent_user',
        'fake_hash',
        '127.0.0.1',
        'test-agent'
      );

      expect(result.status).toBe('fail');
      expect(result.error_message).toContain('Invalid username or password');
    });

    it('should return error with incorrect password', async () => {
      const user = TEST_USERS.VALID_ADMIN;
      const wrongHash = 'wrong_hash_value_that_does_not_match';

      const result = await procedureHelper.callLoginProcedure(
        user.username,
        wrongHash,
        '127.0.0.1',
        'test-agent'
      );

      expect(result.status).toBe('fail');
      expect(result.error_message).toContain('Invalid username or password');
    });

    it('should return error for inactive account', async () => {
      const user = TEST_USERS.INACTIVE_USER;
      const storedUser = await dbHelper.getUserByUsername(user.username);

      const result = await procedureHelper.callLoginProcedure(
        user.username,
        storedUser.password_hash,
        '127.0.0.1',
        'test-agent'
      );

      expect(result.status).toBe('fail');
      expect(result.error_message).toContain('inactive');
    });

    it.skip('should return error for locked account', async () => {
      const user = TEST_USERS.LOCKED_USER;
      const storedUser = await dbHelper.getUserByUsername(user.username);

      const result = await procedureHelper.callLoginProcedure(
        user.username,
        storedUser.password_hash,
        '127.0.0.1',
        'test-agent'
      );

      expect(result.status).toBe('fail');
      expect(result.error_message).toContain('locked');
    });

    it('should return admin details on successful login', async () => {
      const user = TEST_USERS.VALID_ADMIN;
      const storedUser = await dbHelper.getUserByUsername(user.username);

      const result = await procedureHelper.callLoginProcedure(
        user.username,
        storedUser.password_hash,
        '127.0.0.1',
        'test-agent'
      );

      expect(result.status).toBe('success');
      expect(result.admin_id).toBeDefined();
      expect(result.username).toBe(user.username);
      expect(result.email).toBe(user.email);
      expect(result.role).toBe(user.role);
      expect(result.is_active).toBe(1);
    });

    it('should not return password_hash in response', async () => {
      const user = TEST_USERS.VALID_ADMIN;
      const storedUser = await dbHelper.getUserByUsername(user.username);

      const result = await procedureHelper.callLoginProcedure(
        user.username,
        storedUser.password_hash,
        '127.0.0.1',
        'test-agent'
      );

      expect(result.password_hash).toBeUndefined();
    });

    it('should reset failed login attempts on successful login', async () => {
      const user = TEST_USERS.VALID_ADMIN;
      
      // Set some failed attempts
      await dbHelper.executeQuery(
        'UPDATE admin_users SET failed_login_attempts = 3 WHERE username = ?',
        [user.username]
      );

      const storedUser = await dbHelper.getUserByUsername(user.username);
      const result = await procedureHelper.callLoginProcedure(
        user.username,
        storedUser.password_hash,
        '127.0.0.1',
        'test-agent'
      );

      expect(result.status).toBe('success');

      // Verify attempts reset
      const attempts = await dbHelper.getFailedLoginAttempts(user.username);
      expect(attempts).toBe(0);
    });
  });

  // ============================================
  // DATABASE SIDE EFFECTS TESTS
  // ============================================

  describe('Database Side Effects', () => {
    it('should insert into admin_sessions table', async () => {
      const user = TEST_USERS.VALID_ADMIN;
      const storedUser = await dbHelper.getUserByUsername(user.username);

      const result = await procedureHelper.callLoginProcedure(
        user.username,
        storedUser.password_hash,
        '192.168.1.1',
        'Mozilla/5.0'
      );

      expect(result.status).toBe('success');

      // Verify session in database
      const session = await dbHelper.getSession(result.session_id);
      expect(session).toBeDefined();
      expect(session.session_id).toBe(result.session_id);
      expect(session.admin_id).toBe(result.admin_id);
      expect(session.is_active).toBe(1);
      expect(session.ip_address).toBe('192.168.1.1');
      expect(session.user_agent).toBe('Mozilla/5.0');
    });

    it('should insert into activity_log table', async () => {
      const user = TEST_USERS.VALID_ADMIN;
      const storedUser = await dbHelper.getUserByUsername(user.username);

      await procedureHelper.callLoginProcedure(
        user.username,
        storedUser.password_hash,
        '127.0.0.1',
        'test-agent'
      );

      // Verify activity log entry
      const activityLogged = await dbHelper.verifyActivityLogEntry({
        activity_type: 'ADMIN_LOGIN_SUCCESS',
        created_by: user.username
      });

      expect(activityLogged).toBe(true);
    });

    it('should increment failed_login_attempts on wrong password', async () => {
      const user = TEST_USERS.VALID_ADMIN;
      
      const initialAttempts = await dbHelper.getFailedLoginAttempts(user.username);

      const wrongHash = 'wrong_hash_that_does_not_match';
      await procedureHelper.callLoginProcedure(
        user.username,
        wrongHash,
        '127.0.0.1',
        'test-agent'
      );

      const updatedAttempts = await dbHelper.getFailedLoginAttempts(user.username);
      expect(updatedAttempts).toBe(initialAttempts + 1);
    });

    it('should lock account after max failed attempts', async () => {
      const user = TEST_USERS.VALID_ADMIN;
      const wrongHash = 'wrong_hash_that_does_not_match';
      const maxAttempts = 5;

      // Make multiple failed attempts
      for (let i = 0; i < maxAttempts; i++) {
        await procedureHelper.callLoginProcedure(
          user.username,
          wrongHash,
          '127.0.0.1',
          'test-agent'
        );
      }

      // Verify account is locked
      const isLocked = await dbHelper.isAccountLocked(user.username);
      expect(isLocked).toBe(true);

      // Verify cannot login even with correct password
      const storedUser = await dbHelper.getUserByUsername(user.username);
      const result = await procedureHelper.callLoginProcedure(
        user.username,
        storedUser.password_hash,
        '127.0.0.1',
        'test-agent'
      );

      expect(result.status).toBe('fail');
      expect(result.error_message).toContain('locked');
    });

    it.skip('should log failed login attempts', async () => {
      const user = TEST_USERS.VALID_ADMIN;
      const wrongHash = 'wrong_hash_that_does_not_match';

      await procedureHelper.callLoginProcedure(
        user.username,
        wrongHash,
        '127.0.0.1',
        'test-agent'
      );

      // Verify failed login logged
      const activityLogged = await dbHelper.verifyActivityLogEntry({
        activity_type: 'ADMIN_LOGIN_INVALID_PASSWORD',
        message_contains: user.username
      });

      expect(activityLogged).toBe(true);
    });

    it('should generate unique session IDs', async () => {
      const user = TEST_USERS.VALID_ADMIN;
      const storedUser = await dbHelper.getUserByUsername(user.username);

      const result1 = await procedureHelper.callLoginProcedure(
        user.username,
        storedUser.password_hash,
        '127.0.0.1',
        'test-agent'
      );

      const result2 = await procedureHelper.callLoginProcedure(
        user.username,
        storedUser.password_hash,
        '127.0.0.1',
        'test-agent'
      );

      expect(result1.session_id).not.toBe(result2.session_id);
    });
  });

  // ============================================
  // ERROR HANDLING TESTS
  // ============================================

  describe('Error Handling', () => {
    it('should handle null username gracefully', async () => {
      const result = await procedureHelper.callLoginProcedure(
        null as any,
        'fake_hash',
        '127.0.0.1',
        'test-agent'
      );

      expect(result.status).toBe('fail');
      expect(result.error_message).toBeDefined();
    });

    it('should handle null password_hash gracefully', async () => {
      const result = await procedureHelper.callLoginProcedure(
        TEST_USERS.VALID_ADMIN.username,
        null as any,
        '127.0.0.1',
        'test-agent'
      );

      expect(result.status).toBe('fail');
      expect(result.error_message).toBeDefined();
    });

    it('should handle empty username', async () => {
      const result = await procedureHelper.callLoginProcedure(
        '',
        'fake_hash',
        '127.0.0.1',
        'test-agent'
      );

      expect(result.status).toBe('fail');
    });

    it('should handle SQL injection attempts in username', async () => {
      const maliciousUsername = "admin' OR '1'='1";
      const result = await procedureHelper.callLoginProcedure(
        maliciousUsername,
        'fake_hash',
        '127.0.0.1',
        'test-agent'
      );

      expect(result.status).toBe('fail');
      expect(result.error_message).toContain('Invalid username or password');
    });
  });

  // ============================================
  // ROLE-BASED TESTS
  // ============================================

  describe('Role-Based Login Tests', () => {
    it('should allow admin role to login', async () => {
      const user = TEST_USERS.VALID_ADMIN;
      const storedUser = await dbHelper.getUserByUsername(user.username);

      const result = await procedureHelper.callLoginProcedure(
        user.username,
        storedUser.password_hash,
        '127.0.0.1',
        'test-agent'
      );

      expect(result.status).toBe('success');
      expect(result.role).toBe('admin');
    });

    it('should allow approver role to login', async () => {
      const user = TEST_USERS.VALID_APPROVER;
      const storedUser = await dbHelper.getUserByUsername(user.username);

      const result = await procedureHelper.callLoginProcedure(
        user.username,
        storedUser.password_hash,
        '127.0.0.1',
        'test-agent'
      );

      expect(result.status).toBe('success');
      expect(result.role).toBe('approver');
    });

    it('should allow viewer role to login', async () => {
      const user = TEST_USERS.VALID_VIEWER;
      const storedUser = await dbHelper.getUserByUsername(user.username);

      const result = await procedureHelper.callLoginProcedure(
        user.username,
        storedUser.password_hash,
        '127.0.0.1',
        'test-agent'
      );

      expect(result.status).toBe('success');
      expect(result.role).toBe('viewer');
    });

    it('should allow approver role to login', async () => {
      const user = TEST_USERS.VALID_APPROVER;
      const storedUser = await dbHelper.getUserByUsername(user.username);

      const result = await procedureHelper.callLoginProcedure(
        user.username,
        storedUser.password_hash,
        '127.0.0.1',
        'test-agent'
      );

      expect(result.status).toBe('success');
      expect(result.role).toBe('approver');
    });
  });
});
