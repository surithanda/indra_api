/**
 * Test user fixtures for integration testing
 * These users will be created before tests run
 */

export interface TestUser {
  username: string;
  email: string;
  password: string; // Plain text password for testing
  passwordHash?: string; // Will be generated
  role: 'admin' | 'viewer' | 'approver';
  is_active: boolean;
  mfa_enabled?: boolean;
  failed_login_attempts?: number;
}

export const TEST_USERS = {
  VALID_ADMIN: {
    username: 'test_admin_valid',
    email: 'test_admin@example.com',
    password: 'TestAdmin@123',
    role: 'admin',
    is_active: true,
    mfa_enabled: false,
    failed_login_attempts: 0
  } as TestUser,

  VALID_APPROVER: {
    username: 'test_approver_valid',
    email: 'test_approver@example.com',
    password: 'TestApprover@123',
    role: 'approver',
    is_active: true,
    mfa_enabled: false,
    failed_login_attempts: 0
  } as TestUser,

  VALID_VIEWER: {
    username: 'test_viewer_valid',
    email: 'test_viewer@example.com',
    password: 'TestViewer@123',
    role: 'viewer',
    is_active: true,
    mfa_enabled: false,
    failed_login_attempts: 0
  } as TestUser,

  INACTIVE_USER: {
    username: 'test_admin_inactive',
    email: 'test_inactive@example.com',
    password: 'TestInactive@123',
    role: 'admin',
    is_active: false,
    mfa_enabled: false,
    failed_login_attempts: 0
  } as TestUser,

  LOCKED_USER: {
    username: 'test_admin_locked',
    email: 'test_locked@example.com',
    password: 'TestLocked@123',
    role: 'admin',
    is_active: true,
    mfa_enabled: false,
    failed_login_attempts: 5 // Locked due to failed attempts
  } as TestUser,

  MFA_ENABLED_USER: {
    username: 'test_admin_mfa',
    email: 'test_mfa@example.com',
    password: 'TestMFA@123',
    role: 'admin',
    is_active: true,
    mfa_enabled: true,
    failed_login_attempts: 0
  } as TestUser
};

// Export as array for iteration
export const ALL_TEST_USERS = Object.values(TEST_USERS);

// Test credentials for quick access
export const VALID_CREDENTIALS = {
  username: TEST_USERS.VALID_ADMIN.username,
  password: TEST_USERS.VALID_ADMIN.password
};

export const INVALID_CREDENTIALS = {
  username: 'nonexistent_user',
  password: 'WrongPassword@123'
};

export const INVALID_PASSWORD = {
  username: TEST_USERS.VALID_ADMIN.username,
  password: 'WrongPassword@123'
};

export const INACTIVE_CREDENTIALS = {
  username: TEST_USERS.INACTIVE_USER.username,
  password: TEST_USERS.INACTIVE_USER.password
};

export const LOCKED_CREDENTIALS = {
  username: TEST_USERS.LOCKED_USER.username,
  password: TEST_USERS.LOCKED_USER.password
};
