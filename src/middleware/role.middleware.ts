import { Request, Response, NextFunction } from 'express';
import { sendForbidden } from '../utils/response';

/**
 * Role-based authorization middleware
 */
export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      sendForbidden(res, 'Authentication required');
      return;
    }

    if (!allowedRoles.includes(req.admin.role)) {
      sendForbidden(res, 'Insufficient permissions');
      return;
    }

    next();
  };
};

/**
 * Require admin role
 */
export const requireAdmin = requireRole('admin');

/**
 * Require approver or admin role
 */
export const requireApprover = requireRole('approver', 'admin');

/**
 * Require any authenticated user (viewer, approver, or admin)
 */
export const requireAnyRole = requireRole('viewer', 'approver', 'admin');
