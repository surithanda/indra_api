import { Request, Response } from 'express';
import * as authService from '../services/auth.service';
import { sendSuccess, sendError, sendInternalError } from '../utils/response';
import { LoginRequest } from '../types';

/**
 * Login controller
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const loginData: LoginRequest = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Validate required fields
    if (!loginData.username || !loginData.password) {
      sendError(res, 400, '50000', 'Username and password are required');
      return;
    }

    // Attempt login
    const result = await authService.login(loginData, ipAddress, userAgent);

    sendSuccess(res, result);
  } catch (error: any) {
    console.error('Login error:', error);
    
    // Map error messages to appropriate status codes
    if (error.message.includes('Invalid username or password')) {
      sendError(res, 401, '48002', error.message);
    } else if (error.message.includes('locked')) {
      sendError(res, 403, '48003', error.message);
    } else if (error.message.includes('inactive')) {
      sendError(res, 403, '48004', error.message);
    } else {
      sendInternalError(res, 'Login failed', error.message);
    }
  }
};

/**
 * Logout controller
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.admin || !req.session_id) {
      sendError(res, 401, '48000', 'Not authenticated');
      return;
    }

    await authService.logout(req.session_id, req.admin.admin_id);

    sendSuccess(res, { message: 'Logged out successfully' });
  } catch (error: any) {
    console.error('Logout error:', error);
    sendInternalError(res, 'Logout failed', error.message);
  }
};

/**
 * Refresh token controller
 */
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      sendError(res, 400, '50000', 'Refresh token is required');
      return;
    }

    // Verify refresh token
    const { verifyRefreshToken } = require('../utils/jwt');
    const payload = verifyRefreshToken(refresh_token);

    // Refresh the session
    const result = await authService.refreshToken(payload.session_id, payload.admin_id);

    sendSuccess(res, result);
  } catch (error: any) {
    console.error('Token refresh error:', error);
    
    if (error.message.includes('Invalid or expired')) {
      sendError(res, 401, '48011', 'Invalid or expired refresh token');
    } else {
      sendInternalError(res, 'Token refresh failed', error.message);
    }
  }
};

/**
 * Forgot password controller
 */
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      sendError(res, 400, '50000', 'Email is required');
      return;
    }

    const result = await authService.requestPasswordReset(email);

    // Don't expose whether email exists for security
    sendSuccess(res, {
      message: 'If the email exists, a reset link will be sent',
      // Only include token in development
      ...(process.env.NODE_ENV === 'development' && { reset_token: result.reset_token })
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    sendInternalError(res, 'Password reset request failed', error.message);
  }
};

/**
 * Reset password controller
 */
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, new_password } = req.body;

    if (!token || !new_password) {
      sendError(res, 400, '50000', 'Token and new password are required');
      return;
    }

    // Validate password strength
    if (new_password.length < 8) {
      sendError(res, 400, '50000', 'Password must be at least 8 characters long');
      return;
    }

    await authService.confirmPasswordReset(token, new_password);

    sendSuccess(res, { message: 'Password reset successfully' });
  } catch (error: any) {
    console.error('Reset password error:', error);
    
    if (error.message.includes('Invalid reset token')) {
      sendError(res, 400, '48013', error.message);
    } else if (error.message.includes('already been used')) {
      sendError(res, 400, '48014', error.message);
    } else if (error.message.includes('expired')) {
      sendError(res, 400, '48015', error.message);
    } else {
      sendInternalError(res, 'Password reset failed', error.message);
    }
  }
};

/**
 * Get current user info
 */
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      sendError(res, 401, '48000', 'Not authenticated');
      return;
    }

    // Remove sensitive information
    const { password_hash, ...userInfo } = req.admin;

    sendSuccess(res, userInfo);
  } catch (error: any) {
    console.error('Get current user error:', error);
    sendInternalError(res, 'Failed to get user info', error.message);
  }
};

/**
 * Verify session
 */
export const verifySession = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.admin || !req.session_id) {
      sendError(res, 401, '48000', 'Invalid session');
      return;
    }

    sendSuccess(res, {
      valid: true,
      admin: req.admin,
      session_id: req.session_id
    });
  } catch (error: any) {
    console.error('Verify session error:', error);
    sendInternalError(res, 'Session verification failed', error.message);
  }
};
