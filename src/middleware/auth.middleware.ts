import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { executeProcedure } from '../config/database';
import { sendUnauthorized, sendInternalError } from '../utils/response';

/**
 * Authentication middleware - Verify JWT token and session
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendUnauthorized(res, 'No token provided');
      return;
    }

    const token = authHeader.substring(7);

    // Verify JWT token
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch (error) {
      sendUnauthorized(res, 'Invalid or expired token');
      return;
    }

    // Verify session in database
    const results = await executeProcedure('admin_auth_verify_session', [
      payload.session_id
    ]);

    if (!results || results.length === 0) {
      sendUnauthorized(res, 'Session not found');
      return;
    }

    const sessionData = results[0];

    // Check for errors from procedure
    if (sessionData[0]?.status === 'fail') {
      sendUnauthorized(res, sessionData[0].error_message);
      return;
    }

    // Attach admin user to request
    req.admin = {
      admin_id: sessionData[0].admin_id,
      username: sessionData[0].username,
      email: sessionData[0].email,
      role: sessionData[0].role,
      mfa_enabled: sessionData[0].mfa_enabled,
      is_active: true,
      failed_login_attempts: 0,
      created_at: new Date(),
      updated_at: new Date(),
    };

    req.session_id = sessionData[0].session_id;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    sendInternalError(res, 'Authentication failed');
  }
};

/**
 * Optional authentication - Attach user if token is valid, but don't fail if not
 */
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);

    try {
      const payload = verifyAccessToken(token);
      
      const results = await executeProcedure('admin_auth_verify_session', [
        payload.session_id
      ]);

      if (results && results.length > 0 && results[0][0] && results[0][0].status !== 'fail') {
        const sessionData = results[0];
        req.admin = {
          admin_id: sessionData[0].admin_id,
          username: sessionData[0].username,
          email: sessionData[0].email,
          role: sessionData[0].role,
          mfa_enabled: sessionData[0].mfa_enabled,
          is_active: true,
          failed_login_attempts: 0,
          created_at: new Date(),
          updated_at: new Date(),
        };
        req.session_id = sessionData[0].session_id;
      }
    } catch (error) {
      // Silently fail for optional auth
    }

    next();
  } catch (error) {
    next();
  }
};
