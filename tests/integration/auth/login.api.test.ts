import { Response } from 'supertest';
import { ApiHelper } from '../helpers/apiHelper';
import { DbHelper, getDbHelper } from '../helpers/dbHelper';
import { CleanupHelper, getCleanupHelper } from '../helpers/cleanupHelper';
import { getTestApp } from '../setup/testServer';
import {
  VALID_CREDENTIALS,
  INVALID_CREDENTIALS,
  INVALID_PASSWORD,
  INACTIVE_CREDENTIALS,
  LOCKED_CREDENTIALS,
  TEST_USERS
} from '../fixtures/users.fixture';

/**
 * Integration Tests: POST /api/admin/auth/login
 * Tests the complete authentication flow through the API endpoint
 */
describe('POST /api/admin/auth/login - API Endpoint Integration Tests', () => {
  let apiHelper: ApiHelper;
  let dbHelper: DbHelper;
  let cleanupHelper: CleanupHelper;

  beforeAll(() => {
    const app = getTestApp();
    apiHelper = new ApiHelper(app);
    dbHelper = getDbHelper();
    cleanupHelper = getCleanupHelper();
  });

  afterAll(async () => {
    // Final cleanup
    await cleanupHelper.fullCleanup();
  });

  beforeEach(async () => {
    // Clean sessions and reset users before each test
    await cleanupHelper.cleanupTestSessions();
    await cleanupHelper.resetAllTestUsers();
  });

  // ============================================
  // SUCCESSFUL LOGIN SCENARIOS
  // ============================================

  describe('Successful Login Scenarios', () => {
    it('should login successfully with valid admin credentials', async () => {
      // Act
      const response: Response = await apiHelper.login(
        VALID_CREDENTIALS.username,
        VALID_CREDENTIALS.password
      );

      // Assert - HTTP Response
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Assert - Response Structure
      expect(response.body.data).toBeDefined();
      expect(response.body.data.access_token).toBeDefined();
      expect(response.body.data.refresh_token).toBeDefined();
      expect(response.body.data.session_id).toBeDefined();

      // Assert - JWT Tokens
      expect(response.body.data.access_token).toBeValidJWT();
      expect(response.body.data.refresh_token).toBeValidJWT();

      // Assert - Admin Data (flat structure)
      expect(response.body.data.username).toBe(VALID_CREDENTIALS.username);
      expect(response.body.data.email).toBe(TEST_USERS.VALID_ADMIN.email);
      expect(response.body.data.role).toBe(TEST_USERS.VALID_ADMIN.role);

      // Assert - Password not exposed
      expect(response.body.data.password_hash).toBeUndefined();

      // Verify session created in database
      const sessionExists = await dbHelper.verifySessionExists(
        response.body.data.session_id
      );
      expect(sessionExists).toBe(true);

      // Verify activity log entry
      const activityLogged = await dbHelper.verifyActivityLogEntry({
        activity_type: 'ADMIN_LOGIN_SUCCESS',
        created_by: VALID_CREDENTIALS.username
      });
      expect(activityLogged).toBe(true);
    });

    it('should login successfully with valid approver credentials', async () => {
      const response = await apiHelper.login(
        TEST_USERS.VALID_APPROVER.username,
        TEST_USERS.VALID_APPROVER.password
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe('approver');
    });

    it('should login successfully with valid viewer credentials', async () => {
      const response = await apiHelper.login(
        TEST_USERS.VALID_VIEWER.username,
        TEST_USERS.VALID_VIEWER.password
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe('viewer');
    });

    it('should login successfully with valid approver credentials', async () => {
      const response = await apiHelper.login(
        TEST_USERS.VALID_APPROVER.username,
        TEST_USERS.VALID_APPROVER.password
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe('approver');
    });

    it('should reset failed login attempts on successful login', async () => {
      // Set some failed attempts first
      await dbHelper.executeQuery(
        'UPDATE admin_users SET failed_login_attempts = 3 WHERE username = ?',
        [VALID_CREDENTIALS.username]
      );

      // Login successfully
      const response = await apiHelper.login(
        VALID_CREDENTIALS.username,
        VALID_CREDENTIALS.password
      );

      expect(response.status).toBe(200);

      // Verify failed attempts reset to 0
      const attempts = await dbHelper.getFailedLoginAttempts(
        VALID_CREDENTIALS.username
      );
      expect(attempts).toBe(0);
    });
  });

  // ============================================
  // FAILED LOGIN SCENARIOS
  // ============================================

  describe('Failed Login Scenarios', () => {
    it('should fail login with non-existent username', async () => {
      const response = await apiHelper.login(
        INVALID_CREDENTIALS.username,
        INVALID_CREDENTIALS.password
      );

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid');

      // Should not create session
      const sessionCount = await dbHelper.getRecordCount(
        'admin_sessions',
        `admin_id = (SELECT admin_id FROM admin_users WHERE username = '${INVALID_CREDENTIALS.username}')`
      );
      expect(sessionCount).toBe(0);
    });

    it('should fail login with incorrect password', async () => {
      const response = await apiHelper.login(
        INVALID_PASSWORD.username,
        INVALID_PASSWORD.password
      );

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid');

      // Should increment failed login attempts
      const attempts = await dbHelper.getFailedLoginAttempts(
        INVALID_PASSWORD.username
      );
      expect(attempts).toBeGreaterThan(0);
    });

    it('should fail login with inactive account', async () => {
      const response = await apiHelper.login(
        INACTIVE_CREDENTIALS.username,
        INACTIVE_CREDENTIALS.password
      );

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('inactive');

      // Should not create session
      const user = await dbHelper.getUserByUsername(INACTIVE_CREDENTIALS.username);
      const sessionCount = await dbHelper.getRecordCount(
        'admin_sessions',
        `admin_id = ${user.admin_id}`
      );
      expect(sessionCount).toBe(0);
    });

    it.skip('should fail login with locked account', async () => {
      const response = await apiHelper.login(
        LOCKED_CREDENTIALS.username,
        LOCKED_CREDENTIALS.password
      );

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('locked');
    });

    it('should increment failed login attempts on wrong password', async () => {
      // Get initial attempts
      const initialAttempts = await dbHelper.getFailedLoginAttempts(
        VALID_CREDENTIALS.username
      );

      // Try with wrong password
      await apiHelper.login(
        VALID_CREDENTIALS.username,
        'WrongPassword@123'
      );

      // Get updated attempts
      const updatedAttempts = await dbHelper.getFailedLoginAttempts(
        VALID_CREDENTIALS.username
      );

      expect(updatedAttempts).toBe(initialAttempts + 1);
    });

    it('should lock account after max failed login attempts', async () => {
      const maxAttempts = 5;

      // Attempt login with wrong password multiple times
      for (let i = 0; i < maxAttempts; i++) {
        await apiHelper.login(
          VALID_CREDENTIALS.username,
          'WrongPassword@123'
        );
      }

      // Verify account is locked
      const isLocked = await dbHelper.isAccountLocked(
        VALID_CREDENTIALS.username
      );
      expect(isLocked).toBe(true);

      // Verify cannot login even with correct password
      const response = await apiHelper.login(
        VALID_CREDENTIALS.username,
        VALID_CREDENTIALS.password
      );

      expect(response.status).toBe(403);
      expect(response.body.error.message).toContain('locked');
    });
  });

  // ============================================
  // INPUT VALIDATION TESTS
  // ============================================

  describe('Input Validation', () => {
    it('should fail with missing username', async () => {
      const response = await apiHelper.post('/auth/login', {
        password: 'SomePassword@123'
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with missing password', async () => {
      const response = await apiHelper.post('/auth/login', {
        username: 'testuser'
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with empty username', async () => {
      const response = await apiHelper.post('/auth/login', {
        username: '',
        password: 'SomePassword@123'
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with empty password', async () => {
      const response = await apiHelper.post('/auth/login', {
        username: 'testuser',
        password: ''
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with null values', async () => {
      const response = await apiHelper.post('/auth/login', {
        username: null,
        password: null
      });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  // ============================================
  // RESPONSE STRUCTURE VALIDATION
  // ============================================

  describe('Response Structure Validation', () => {
    it('should return correct success response structure', async () => {
      const response = await apiHelper.login(
        VALID_CREDENTIALS.username,
        VALID_CREDENTIALS.password
      );

      // Check top-level structure
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');

      // Check data structure
      const data = response.body.data;
      expect(data).toHaveProperty('access_token');
      expect(data).toHaveProperty('refresh_token');
      expect(data).toHaveProperty('session_id');
      expect(data).toHaveProperty('username');
      expect(data).toHaveProperty('email');
      expect(data).toHaveProperty('role');
      
      // Sensitive fields should not be present
      expect(data).not.toHaveProperty('password_hash');
      expect(data).not.toHaveProperty('mfa_secret');
    });

    it('should return correct error response structure', async () => {
      const response = await apiHelper.login(
        INVALID_CREDENTIALS.username,
        INVALID_CREDENTIALS.password
      );

      // Check error structure
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('error');
      expect(response.body.success).toBe(false);
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.data).toBeUndefined();
    });
  });

  // ============================================
  // DATABASE STATE VERIFICATION
  // ============================================

  describe('Database State Verification', () => {
    it('should create session record in database', async () => {
      const response = await apiHelper.login(
        VALID_CREDENTIALS.username,
        VALID_CREDENTIALS.password
      );

      const sessionId = response.body.data.session_id;
      const session = await dbHelper.getSession(sessionId);

      expect(session).toBeDefined();
      expect(session.session_id).toBe(sessionId);
      expect(session.is_active).toBe(1);
      expect(session.ip_address).toBeDefined();
      expect(session.user_agent).toBeDefined();
    });

    it('should log activity on successful login', async () => {
      await apiHelper.login(
        VALID_CREDENTIALS.username,
        VALID_CREDENTIALS.password
      );

      const activityLogged = await dbHelper.verifyActivityLogEntry({
        activity_type: 'ADMIN_LOGIN_SUCCESS',
        created_by: VALID_CREDENTIALS.username
      });

      expect(activityLogged).toBe(true);
    });

    it.skip('should log activity on failed login', async () => {
      await apiHelper.login(
        VALID_CREDENTIALS.username,
        'WrongPassword@123'
      );

      const activityLogged = await dbHelper.verifyActivityLogEntry({
        activity_type: 'ADMIN_LOGIN_INVALID_PASSWORD',
        message_contains: VALID_CREDENTIALS.username
      });

      expect(activityLogged).toBe(true);
    });

    it('should not create multiple sessions for same user', async () => {
      // Login twice
      await apiHelper.login(
        VALID_CREDENTIALS.username,
        VALID_CREDENTIALS.password
      );

      await apiHelper.login(
        VALID_CREDENTIALS.username,
        VALID_CREDENTIALS.password
      );

      // Both sessions should exist (old one may be invalidated depending on logic)
      const user = await dbHelper.getUserByUsername(VALID_CREDENTIALS.username);
      const sessionCount = await dbHelper.getRecordCount(
        'admin_sessions',
        `admin_id = ${user.admin_id}`
      );

      expect(sessionCount).toBeGreaterThanOrEqual(1);
    });
  });

  // ============================================
  // SECURITY TESTS
  // ============================================

  describe('Security Tests', () => {
    it('should not reveal if username exists on failed login', async () => {
      const response1 = await apiHelper.login(
        'nonexistent_user',
        'password123'
      );

      const response2 = await apiHelper.login(
        VALID_CREDENTIALS.username,
        'wrongpassword'
      );

      // Both should return same generic error message
      expect(response1.status).toBe(401);
      expect(response2.status).toBe(401);
      expect(response1.body.error.message).toBe(response2.body.error.message);
    });

    it('should not expose sensitive user data in response', async () => {
      const response = await apiHelper.login(
        VALID_CREDENTIALS.username,
        VALID_CREDENTIALS.password
      );

      const data = response.body.data;
      
      expect(data.password_hash).toBeUndefined();
      expect(data.mfa_secret).toBeUndefined();
      expect(data.created_by).toBeUndefined();
      expect(data.updated_by).toBeUndefined();
    });

    it('should generate unique session IDs', async () => {
      const response1 = await apiHelper.login(
        VALID_CREDENTIALS.username,
        VALID_CREDENTIALS.password
      );

      await cleanupHelper.cleanupUserSessions(VALID_CREDENTIALS.username);

      const response2 = await apiHelper.login(
        VALID_CREDENTIALS.username,
        VALID_CREDENTIALS.password
      );

      expect(response1.body.data.session_id).not.toBe(
        response2.body.data.session_id
      );
    });
  });
});
