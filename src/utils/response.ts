import { Response } from 'express';
import { ApiResponse, PaginationMeta } from '../types';

/**
 * Send success response
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  meta?: Partial<PaginationMeta>
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...(meta && { pagination: meta as PaginationMeta }),
    },
  };
  return res.json(response);
};

/**
 * Send error response
 */
export const sendError = (
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: any
): Response => {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
    meta: {
      timestamp: new Date().toISOString(),
    },
  };
  return res.status(statusCode).json(response);
};

/**
 * Send validation error
 */
export const sendValidationError = (
  res: Response,
  errors: any[]
): Response => {
  return sendError(res, 400, '50000', 'Validation failed', errors);
};

/**
 * Send unauthorized error
 */
export const sendUnauthorized = (
  res: Response,
  message: string = 'Unauthorized'
): Response => {
  return sendError(res, 401, '48000', message);
};

/**
 * Send forbidden error
 */
export const sendForbidden = (
  res: Response,
  message: string = 'Forbidden'
): Response => {
  return sendError(res, 403, '49000', message);
};

/**
 * Send not found error
 */
export const sendNotFound = (
  res: Response,
  message: string = 'Resource not found'
): Response => {
  return sendError(res, 404, '50100', message);
};

/**
 * Send internal server error
 */
export const sendInternalError = (
  res: Response,
  message: string = 'Internal server error',
  details?: any
): Response => {
  return sendError(res, 500, '52000', message, details);
};

/**
 * Calculate pagination metadata
 */
export const calculatePagination = (
  total: number,
  limit: number,
  offset: number
): PaginationMeta => {
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return {
    total_count: total,
    page_limit: limit,
    page_offset: offset,
    total_pages: totalPages,
    current_page: currentPage,
  };
};
