import bcrypt from 'bcrypt';
import { executeProcedure, executeQuery } from '../config/database';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { LoginRequest } from '../types';

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10');

/**
 * Login admin user
 */
export const login = async (loginData: LoginRequest, ipAddress?: string, userAgent?: string) => {
  const { username, password } = loginData;

  // First, get the user's stored password hash
  const users = await executeQuery(
    'SELECT admin_id, password_hash, is_active, failed_login_attempts, locked_until FROM admin_users WHERE username = ? OR email = ?',
    [username, username]
  );

  if (!users || users.length === 0) {
    throw new Error('Invalid username or password');
  }

  const user = users[0];

  // Check if account is locked
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    throw new Error(`Account is locked until ${user.locked_until}`);
  }

  // Check if account is active
  if (!user.is_active) {
    throw new Error('Account is inactive');
  }

  // Verify password with bcrypt
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    // Increment failed login attempts
    await executeQuery(
      `UPDATE admin_users 
       SET failed_login_attempts = failed_login_attempts + 1,
           locked_until = CASE 
             WHEN failed_login_attempts + 1 >= 5 THEN DATE_ADD(NOW(), INTERVAL 30 MINUTE)
             ELSE NULL
           END
       WHERE admin_id = ?`,
      [user.admin_id]
    );
    throw new Error('Invalid username or password');
  }

  // Password is valid, now call the login procedure to create session
  // Pass the stored hash so the procedure can verify it matches
  const results = await executeProcedure('admin_auth_login', [
    username,
    user.password_hash, // Pass the stored hash
    ipAddress || null,
    userAgent || null
  ]);

  if (!results || results.length === 0) {
    throw new Error('Login failed');
  }

  const loginResult = results[0][0];

  // Check for errors
  if (loginResult.status === 'fail') {
    throw new Error(loginResult.error_message);
  }

  // Generate JWT tokens
  const payload = {
    admin_id: loginResult.admin_id,
    username: loginResult.username,
    email: loginResult.email,
    role: loginResult.role,
    session_id: loginResult.session_id,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return {
    ...loginResult,
    access_token: accessToken,
    refresh_token: refreshToken,
  };
};

/**
 * Logout admin user
 */
export const logout = async (sessionId: string, adminId: number) => {
  const results = await executeProcedure('admin_auth_logout', [
    sessionId,
    adminId
  ]);

  if (!results || results.length === 0) {
    throw new Error('Logout failed');
  }

  const logoutResult = results[0][0];

  if (logoutResult.status === 'fail') {
    throw new Error(logoutResult.error_message);
  }

  return logoutResult;
};

/**
 * Refresh access token
 */
export const refreshToken = async (sessionId: string, adminId: number) => {
  const results = await executeProcedure('admin_auth_refresh_token', [
    sessionId,
    adminId
  ]);

  if (!results || results.length === 0) {
    throw new Error('Token refresh failed');
  }

  const refreshResult = results[0][0];

  if (refreshResult.status === 'fail') {
    throw new Error(refreshResult.error_message);
  }

  // Generate new tokens
  const payload = {
    admin_id: refreshResult.admin_id,
    username: refreshResult.username,
    email: refreshResult.email,
    role: refreshResult.role,
    session_id: refreshResult.session_id,
  };

  const accessToken = generateAccessToken(payload);
  const newRefreshToken = generateRefreshToken(payload);

  return {
    ...refreshResult,
    access_token: accessToken,
    refresh_token: newRefreshToken,
  };
};

/**
 * Request password reset
 */
export const requestPasswordReset = async (email: string) => {
  const results = await executeProcedure('admin_auth_reset_password', [
    email
  ]);

  if (!results || results.length === 0) {
    throw new Error('Password reset request failed');
  }

  const resetResult = results[0][0];

  if (resetResult.status === 'fail') {
    throw new Error(resetResult.error_message);
  }

  return resetResult;
};

/**
 * Confirm password reset
 */
export const confirmPasswordReset = async (token: string, newPassword: string) => {
  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  const results = await executeProcedure('admin_auth_confirm_reset_password', [
    token,
    passwordHash
  ]);

  if (!results || results.length === 0) {
    throw new Error('Password reset failed');
  }

  const resetResult = results[0][0];

  if (resetResult.status === 'fail') {
    throw new Error(resetResult.error_message);
  }

  return resetResult;
};

/**
 * Verify password
 */
export const verifyPassword = async (plainPassword: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

/**
 * Hash password
 */
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, BCRYPT_ROUNDS);
};
