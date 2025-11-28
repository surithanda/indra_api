import { Request, Response } from 'express';
import * as adminService from '../services/admin.service';
import { sendSuccess, sendError, sendInternalError, calculatePagination } from '../utils/response';
import { CreateAdminUserRequest, UpdateAdminUserRequest } from '../types';

/**
 * Create admin user
 */
export const createAdminUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const userData: CreateAdminUserRequest = req.body;
    const createdBy = req.admin?.username || 'system';

    // Validate required fields
    if (!userData.username || !userData.email || !userData.password || !userData.role) {
      sendError(res, 400, '50000', 'Username, email, password, and role are required');
      return;
    }

    const result = await adminService.createAdminUser(userData, createdBy);

    sendSuccess(res, result);
  } catch (error: any) {
    console.error('Create admin user error:', error);
    
    if (error.message.includes('already exists')) {
      sendError(res, 409, '50003', error.message);
    } else if (error.message.includes('Invalid role')) {
      sendError(res, 400, '50002', error.message);
    } else {
      sendInternalError(res, 'Failed to create admin user', error.message);
    }
  }
};

/**
 * Update admin user
 */
export const updateAdminUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = parseInt(req.params.id);
    const updateData: UpdateAdminUserRequest = req.body;
    const updatedBy = req.admin?.username || 'system';

    if (isNaN(adminId)) {
      sendError(res, 400, '50000', 'Invalid admin ID');
      return;
    }

    const result = await adminService.updateAdminUser(adminId, updateData, updatedBy);

    sendSuccess(res, result);
  } catch (error: any) {
    console.error('Update admin user error:', error);
    
    if (error.message.includes('not found')) {
      sendError(res, 404, '50005', error.message);
    } else if (error.message.includes('already exists')) {
      sendError(res, 409, '50004', error.message);
    } else {
      sendInternalError(res, 'Failed to update admin user', error.message);
    }
  }
};

/**
 * List admin users
 */
export const listAdminUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, is_active, search, limit = '50', offset = '0' } = req.query;

    const isActive = is_active === 'true' ? true : is_active === 'false' ? false : undefined;
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);

    const results = await adminService.listAdminUsers(
      role as string,
      isActive,
      search as string,
      limitNum,
      offsetNum
    );

    if (results.length > 0) {
      const totalCount = results[0].total_count || 0;
      const pagination = calculatePagination(totalCount, limitNum, offsetNum);
      sendSuccess(res, results, pagination);
    } else {
      sendSuccess(res, []);
    }
  } catch (error: any) {
    console.error('List admin users error:', error);
    sendInternalError(res, 'Failed to list admin users', error.message);
  }
};

/**
 * Get registrations
 */
export const getRegistrations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, account_id, is_active, limit = '50', offset = '0' } = req.query;

    const accountId = account_id ? parseInt(account_id as string) : undefined;
    const isActive = is_active === 'true' ? true : is_active === 'false' ? false : undefined;
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);

    const results = await adminService.getRegistrations(
      email as string,
      accountId,
      isActive,
      limitNum,
      offsetNum
    );

    if (results.length > 0) {
      const totalCount = results[0].total_count || 0;
      const pagination = calculatePagination(totalCount, limitNum, offsetNum);
      sendSuccess(res, results, pagination);
    } else {
      sendSuccess(res, []);
    }
  } catch (error: any) {
    console.error('Get registrations error:', error);
    sendInternalError(res, 'Failed to get registrations', error.message);
  }
};

/**
 * Get profiles
 */
export const getProfiles = async (req: Request, res: Response): Promise<void> => {
  try {
    const { profile_id, account_id, verification_status, limit = '50', offset = '0' } = req.query;

    const profileId = profile_id ? parseInt(profile_id as string) : undefined;
    const accountId = account_id ? parseInt(account_id as string) : undefined;
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);

    const results = await adminService.getProfiles(
      profileId,
      accountId,
      verification_status as string,
      limitNum,
      offsetNum
    );

    if (results.length > 0) {
      const totalCount = results[0].total_count || 0;
      const pagination = calculatePagination(totalCount, limitNum, offsetNum);
      sendSuccess(res, results, pagination);
    } else {
      sendSuccess(res, []);
    }
  } catch (error: any) {
    console.error('Get profiles error:', error);
    sendInternalError(res, 'Failed to get profiles', error.message);
  }
};

/**
 * Enable account
 */
export const enableAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const accountId = parseInt(req.params.id);
    const { reason = 'Account enabled by admin' } = req.body;
    const adminUser = req.admin?.username || 'system';

    if (isNaN(accountId)) {
      sendError(res, 400, '50000', 'Invalid account ID');
      return;
    }

    const result = await adminService.enableDisableAccount(accountId, true, reason, adminUser);

    sendSuccess(res, result);
  } catch (error: any) {
    console.error('Enable account error:', error);
    
    if (error.message.includes('not found')) {
      sendError(res, 404, '51001', error.message);
    } else if (error.message.includes('already')) {
      sendError(res, 400, '51002', error.message);
    } else {
      sendInternalError(res, 'Failed to enable account', error.message);
    }
  }
};

/**
 * Disable account
 */
export const disableAccount = async (req: Request, res: Response): Promise<void> => {
  try {
    const accountId = parseInt(req.params.id);
    const { reason } = req.body;
    const adminUser = req.admin?.username || 'system';

    if (isNaN(accountId)) {
      sendError(res, 400, '50000', 'Invalid account ID');
      return;
    }

    if (!reason) {
      sendError(res, 400, '50000', 'Reason is required for disabling account');
      return;
    }

    const result = await adminService.enableDisableAccount(accountId, false, reason, adminUser);

    sendSuccess(res, result);
  } catch (error: any) {
    console.error('Disable account error:', error);
    
    if (error.message.includes('not found')) {
      sendError(res, 404, '51001', error.message);
    } else if (error.message.includes('already')) {
      sendError(res, 400, '51002', error.message);
    } else {
      sendInternalError(res, 'Failed to disable account', error.message);
    }
  }
};

/**
 * Update verification status
 */
export const updateVerifyStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { table_name, record_id, verification_status } = req.body;
    const adminUser = req.admin?.username || 'system';

    if (!table_name || !record_id || !verification_status) {
      sendError(res, 400, '50000', 'Table name, record ID, and verification status are required');
      return;
    }

    const result = await adminService.updateVerifyStatus(
      table_name,
      record_id,
      verification_status,
      adminUser
    );

    sendSuccess(res, result);
  } catch (error: any) {
    console.error('Update verify status error:', error);
    
    if (error.message.includes('Invalid table')) {
      sendError(res, 400, '51003', error.message);
    } else if (error.message.includes('Invalid verification')) {
      sendError(res, 400, '51004', error.message);
    } else if (error.message.includes('not found')) {
      sendError(res, 404, '51005', error.message);
    } else {
      sendInternalError(res, 'Failed to update verification status', error.message);
    }
  }
};

/**
 * Get payment summaries
 */
export const getPaymentSummaries = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, client_id, start_date, end_date, limit = '50', offset = '0' } = req.query;

    const clientId = client_id ? parseInt(client_id as string) : undefined;
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);

    const results = await adminService.getPaymentSummaries(
      status as string,
      clientId,
      start_date as string,
      end_date as string,
      limitNum,
      offsetNum
    );

    if (results.length > 0) {
      const totalCount = results[0].total_count || 0;
      const pagination = calculatePagination(totalCount, limitNum, offsetNum);
      sendSuccess(res, results, pagination);
    } else {
      sendSuccess(res, []);
    }
  } catch (error: any) {
    console.error('Get payment summaries error:', error);
    sendInternalError(res, 'Failed to get payment summaries', error.message);
  }
};

/**
 * Get partner registrations
 */
export const getPartnerRegistrations = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search, limit = '50', offset = '0' } = req.query;

    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);

    const results = await adminService.getPartnerRegistrations(
      status as string,
      search as string,
      limitNum,
      offsetNum
    );

    if (results.length > 0) {
      const totalCount = results[0].total_count || 0;
      const pagination = calculatePagination(totalCount, limitNum, offsetNum);
      sendSuccess(res, results, pagination);
    } else {
      sendSuccess(res, []);
    }
  } catch (error: any) {
    console.error('Get partner registrations error:', error);
    sendInternalError(res, 'Failed to get partner registrations', error.message);
  }
};

/**
 * Approve or reject partner
 */
export const approveRejectPartner = async (req: Request, res: Response): Promise<void> => {
  try {
    const partnerId = parseInt(req.params.id);
    const { action, rejection_reason, api_key_expiry_days = 365 } = req.body;
    const adminUser = req.admin?.username || 'system';

    if (isNaN(partnerId)) {
      sendError(res, 400, '50000', 'Invalid partner ID');
      return;
    }

    if (!action || !['approve', 'reject'].includes(action)) {
      sendError(res, 400, '50000', 'Action must be approve or reject');
      return;
    }

    if (action === 'reject' && !rejection_reason) {
      sendError(res, 400, '51010', 'Rejection reason is required');
      return;
    }

    const result = await adminService.approvePartnerRegistration(
      partnerId,
      action,
      rejection_reason,
      api_key_expiry_days,
      adminUser
    );

    sendSuccess(res, result);
  } catch (error: any) {
    console.error('Approve/reject partner error:', error);
    
    if (error.message.includes('not found')) {
      sendError(res, 404, '51007', error.message);
    } else if (error.message.includes('already')) {
      sendError(res, 400, '51008', error.message);
    } else {
      sendInternalError(res, 'Failed to process partner registration', error.message);
    }
  }
};

/**
 * Get API clients
 */
export const getApiClients = async (req: Request, res: Response): Promise<void> => {
  try {
    const { client_id, is_active, search, limit = '50', offset = '0' } = req.query;

    const clientId = client_id ? parseInt(client_id as string) : undefined;
    const isActive = is_active === 'true' ? true : is_active === 'false' ? false : undefined;
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);

    const results = await adminService.getApiClients(
      clientId,
      isActive,
      search as string,
      limitNum,
      offsetNum
    );

    if (results.length > 0) {
      const totalCount = results[0].total_count || 0;
      const pagination = calculatePagination(totalCount, limitNum, offsetNum);
      sendSuccess(res, results, pagination);
    } else {
      sendSuccess(res, []);
    }
  } catch (error: any) {
    console.error('Get API clients error:', error);
    sendInternalError(res, 'Failed to get API clients', error.message);
  }
};

/**
 * Get API client payments
 */
export const getApiClientPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const clientId = parseInt(req.params.id);
    const { status, start_date, end_date, limit = '50', offset = '0' } = req.query;

    if (isNaN(clientId)) {
      sendError(res, 400, '50000', 'Invalid client ID');
      return;
    }

    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);

    const results = await adminService.getApiClientPayments(
      clientId,
      status as string,
      start_date as string,
      end_date as string,
      limitNum,
      offsetNum
    );

    if (results.length > 0) {
      const totalCount = results[0].total_payments || 0;
      const pagination = calculatePagination(totalCount, limitNum, offsetNum);
      sendSuccess(res, results, pagination);
    } else {
      sendSuccess(res, []);
    }
  } catch (error: any) {
    console.error('Get API client payments error:', error);
    
    if (error.message.includes('not found')) {
      sendError(res, 404, '51011', error.message);
    } else {
      sendInternalError(res, 'Failed to get API client payments', error.message);
    }
  }
};
