import { executeProcedure } from '../config/database';
import { hashPassword } from './auth.service';
import { CreateAdminUserRequest, UpdateAdminUserRequest } from '../types';

/**
 * Create admin user
 */
export const createAdminUser = async (
  userData: CreateAdminUserRequest,
  createdBy: string
) => {
  const { username, email, password, role } = userData;

  // Hash password
  const passwordHash = await hashPassword(password);

  const results = await executeProcedure('admin_users_create', [
    username,
    email,
    passwordHash,
    role,
    createdBy
  ]);

  if (!results || results.length === 0) {
    throw new Error('Failed to create admin user');
  }

  const result = results[0][0];

  if (result.status === 'fail') {
    throw new Error(result.error_message);
  }

  return result;
};

/**
 * Update admin user
 */
export const updateAdminUser = async (
  adminId: number,
  updateData: UpdateAdminUserRequest,
  updatedBy: string
) => {
  const { email, role, is_active, mfa_enabled } = updateData;

  const results = await executeProcedure('admin_users_update', [
    adminId,
    email || null,
    role || null,
    is_active !== undefined ? is_active : null,
    mfa_enabled !== undefined ? mfa_enabled : null,
    updatedBy
  ]);

  if (!results || results.length === 0) {
    throw new Error('Failed to update admin user');
  }

  const result = results[0][0];

  if (result.status === 'fail') {
    throw new Error(result.error_message);
  }

  return result;
};

/**
 * List admin users
 */
export const listAdminUsers = async (
  role?: string,
  isActive?: boolean,
  search?: string,
  limit: number = 50,
  offset: number = 0
) => {
  const results = await executeProcedure('admin_users_list', [
    role,
    isActive,
    search,
    limit,
    offset
  ]);

  return results[0];
};

/**
 * Get registrations
 */
export const getRegistrations = async (
  email?: string,
  accountId?: number,
  isActive?: boolean,
  limit: number = 50,
  offset: number = 0
) => {
  const results = await executeProcedure('admin_get_registrations', [
    email || null,
    accountId || null,
    isActive !== undefined ? isActive : null,
    limit,
    offset
  ]);

  if (!results || results.length === 0) {
    return [];
  }

  return results[0];
};

/**
 * Get profiles
 */
export const getProfiles = async (
  profileId?: number,
  accountId?: number,
  verificationStatus?: string,
  limit: number = 50,
  offset: number = 0
) => {
  const results = await executeProcedure('admin_get_profiles', [
    profileId || null,
    accountId || null,
    verificationStatus || null,
    limit,
    offset
  ]);

  if (!results || results.length === 0) {
    return [];
  }

  return results[0];
};

/**
 * Enable or disable account
 */
export const enableDisableAccount = async (
  accountId: number,
  isActive: boolean,
  reason: string,
  adminUser: string
) => {
  const results = await executeProcedure('admin_enable_disable_account', [
    accountId,
    isActive ? 1 : 0,
    reason || null,
    adminUser
  ]);

  if (!results || results.length === 0) {
    throw new Error('Failed to update account status');
  }

  const result = results[0][0];

  if (result.status === 'fail') {
    throw new Error(result.error_message);
  }

  return result;
};

/**
 * Update verification status
 */
export const updateVerifyStatus = async (
  tableName: string,
  recordId: number,
  verificationStatus: string,
  adminUser: string
) => {
  const results = await executeProcedure('admin_update_verify_status', [
    tableName,
    recordId,
    verificationStatus,
    adminUser
  ]);

  if (!results || results.length === 0) {
    throw new Error('Failed to update verification status');
  }

  const result = results[0][0];

  if (result.status === 'fail') {
    throw new Error(result.error_message);
  }

  return result;
};

/**
 * Get payment summaries
 */
export const getPaymentSummaries = async (
  status?: string,
  clientId?: number,
  startDate?: string,
  endDate?: string,
  limit: number = 50,
  offset: number = 0
) => {
  const results = await executeProcedure('admin_get_total_payments', [
    status || null,
    clientId || null,
    startDate || null,
    endDate || null,
    limit,
    offset
  ]);

  if (!results || results.length === 0) {
    return [];
  }

  return results[0];
};

/**
 * Get partner registrations
 */
export const getPartnerRegistrations = async (
  status?: string,
  search?: string,
  limit: number = 50,
  offset: number = 0
) => {
  const results = await executeProcedure('admin_get_partner_registrations', [
    status || null,
    search || null,
    limit,
    offset
  ]);

  if (!results || results.length === 0) {
    return [];
  }

  return results[0];
};

/**
 * Approve or reject partner registration
 */
export const approvePartnerRegistration = async (
  partnerId: number,
  action: 'approve' | 'reject',
  rejectionReason?: string,
  apiKeyExpiryDays: number = 365,
  adminUser: string = 'system'
) => {
  const results = await executeProcedure('admin_approve_partner_registrations', [
    partnerId,
    action,
    rejectionReason || null,
    apiKeyExpiryDays,
    adminUser
  ]);

  if (!results || results.length === 0) {
    throw new Error('Failed to process partner registration');
  }

  const result = results[0][0];

  if (result.status === 'fail') {
    throw new Error(result.error_message);
  }

  return result;
};

/**
 * Get API clients
 */
export const getApiClients = async (
  clientId?: number,
  isActive?: boolean,
  search?: string,
  limit: number = 50,
  offset: number = 0
) => {
  const results = await executeProcedure('admin_get_api_clients', [
    clientId || null,
    isActive !== undefined ? isActive : null,
    search || null,
    limit,
    offset
  ]);

  if (!results || results.length === 0) {
    return [];
  }

  return results[0];
};

/**
 * Get API client payments
 */
export const getApiClientPayments = async (
  clientId: number,
  status?: string,
  startDate?: string,
  endDate?: string,
  limit: number = 50,
  offset: number = 0
) => {
  const results = await executeProcedure('admin_get_api_client_payments', [
    clientId,
    status || null,
    startDate || null,
    endDate || null,
    limit,
    offset
  ]);

  if (!results || results.length === 0) {
    return [];
  }

  // Check for errors
  if (results[0][0]?.status === 'fail') {
    throw new Error(results[0][0].error_message);
  }

  return results[0];
};
