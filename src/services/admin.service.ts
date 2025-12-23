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
    role ?? null,
    isActive ?? null,
    search ?? null,
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

  console.log('Raw profiles results:', JSON.stringify(results, null, 2));

  if (!results || results.length === 0) {
    return [];
  }

  // Check if the procedure returned an error
  if (results[0] && results[0][0] && results[0][0].status === 'fail') {
    throw new Error(results[0][0].error_message || 'Failed to get profiles');
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
 * Create partner registration
 */
export const createPartnerRegistration = async (
  businessName: string,
  businessType: string,
  registrationNumber?: string,
  taxId?: string,
  contactPerson: string = '',
  contactEmail: string = '',
  contactPhone: string = '',
  contactPhoneCountry: string = '',
  website?: string,
  createdBy: string = 'system'
) => {
  const results = await executeProcedure('admin_create_partner_registration', [
    businessName,
    businessType,
    registrationNumber || null,
    taxId || null,
    contactPerson,
    contactEmail,
    contactPhone,
    contactPhoneCountry,
    website || null,
    createdBy
  ]);

  if (!results || results.length === 0) {
    throw new Error('Failed to create partner registration');
  }

  const result = results[0][0];

  if (result.status === 'fail') {
    throw new Error(result.error_message);
  }

  return result;
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

/**
 * Update partner registration
 */
export const updatePartnerRegistration = async (
  partnerId: number,
  businessName?: string,
  alias?: string,
  businessEmail?: string,
  primaryPhone?: string,
  primaryPhoneCountryCode?: number,
  secondaryPhone?: string,
  addressLine1?: string,
  city?: string,
  state?: number,
  country?: number,
  zip?: string,
  businessRegistrationNumber?: string,
  businessITIN?: string,
  businessDescription?: string,
  primaryContactFirstName?: string,
  primaryContactLastName?: string,
  primaryContactGender?: number,
  primaryContactDateOfBirth?: string,
  primaryContactEmail?: string,
  businessLinkedin?: string,
  businessWebsite?: string,
  businessFacebook?: string,
  businessWhatsapp?: string,
  isVerified?: number,
  isActive?: boolean,
  domainRootUrl?: string,
  verificationComment?: string,
  verificationStatus?: string,
  modifiedUser: string = 'system'
) => {
  const results = await executeProcedure('admin_registered_partner_update_v1', [
    partnerId,
    businessName ?? null,
    alias ?? null,
    businessEmail ?? null,
    primaryPhone ?? null,
    primaryPhoneCountryCode ?? null,
    secondaryPhone ?? null,
    addressLine1 ?? null,
    city ?? null,
    state ?? null,
    country ?? null,
    zip ?? null,
    businessRegistrationNumber ?? null,
    businessITIN ?? null,
    businessDescription ?? null,
    primaryContactFirstName ?? null,
    primaryContactLastName ?? null,
    primaryContactGender ?? null,
    primaryContactDateOfBirth ?? null,
    primaryContactEmail ?? null,
    businessLinkedin ?? null,
    businessWebsite ?? null,
    businessFacebook ?? null,
    businessWhatsapp ?? null,
    isVerified ?? null,
    isActive !== undefined ? (isActive ? 1 : 0) : null,
    domainRootUrl ?? null,
    verificationComment ?? null,
    verificationStatus ?? null,
    modifiedUser
  ]);

  if (results[0][0]?.status === 'fail') {
    throw new Error(results[0][0].error_message);
  }

  return results[0][0];
};

/**
 * Get countries list
 */
export const getCountries = async () => {
  const results = await executeProcedure('lkp_get_Country_List', []);
  return results[0];
};

/**
 * Get states by country ID
 */
export const getStatesByCountry = async (countryId: number | null) => {
  const results = await executeProcedure('lkp_get_Country_States', [countryId]);
  return results[0];
};

/**
 * Get lookup data by category
 */
export const getLookupData = async (category: string | null) => {
  const results = await executeProcedure('lkp_get_LookupData', [category]);
  return results[0];
};

/**
 * Get account logins
 */
export const getAccountLogins = async (accountId: number) => {
  const results = await executeProcedure('admin_get_account_logins', [accountId]);
  return results[0];
};

/**
 * Create account
 */
export const createAccount = async (
  email: string,
  password: string,
  firstName: string,
  middleName: string | null,
  lastName: string,
  birthDate: string,
  gender: number,
  primaryPhone: string,
  primaryPhoneCountry: string,
  primaryPhoneType: number,
  secondaryPhone: string | null,
  secondaryPhoneCountry: string | null,
  secondaryPhoneType: number | null,
  addressLine1: string | null,
  addressLine2: string | null,
  city: string | null,
  state: string | null,
  zip: string | null,
  country: string | null,
  photo: string | null,
  secretQuestion: string | null,
  secretAnswer: string | null,
  partnerId: number | null
) => {
  const results = await executeProcedure('eb_account_login_create', [
    email,
    password,
    firstName,
    middleName,
    lastName,
    birthDate,
    gender,
    primaryPhone,
    primaryPhoneCountry,
    primaryPhoneType,
    secondaryPhone,
    secondaryPhoneCountry,
    secondaryPhoneType,
    addressLine1,
    addressLine2,
    city,
    state,
    zip,
    country,
    photo,
    secretQuestion,
    secretAnswer,
    partnerId
  ]);

  if (results[0][0]?.status === 'fail') {
    throw new Error(results[0][0].error_message);
  }

  return results[0][0];
};

/**
 * Update account
 */
export const updateAccount = async (
  accountCode: string,
  email: string,
  firstName: string | null,
  middleName: string | null,
  lastName: string | null,
  primaryPhone: string | null,
  primaryPhoneCountry: string | null,
  primaryPhoneType: string | null,
  birthDate: string | null,
  gender: string | null,
  addressLine1: string | null,
  addressLine2: string | null,
  city: string | null,
  state: string | null,
  zip: string | null,
  country: string | null,
  photo: string | null,
  secondaryPhone: string | null,
  secondaryPhoneCountry: string | null,
  secondaryPhoneType: string | null
) => {
  const results = await executeProcedure('eb_account_update', [
    accountCode,
    email,
    firstName,
    middleName,
    lastName,
    primaryPhone,
    primaryPhoneCountry,
    primaryPhoneType,
    birthDate,
    gender,
    addressLine1,
    addressLine2,
    city,
    state,
    zip,
    country,
    photo,
    secondaryPhone,
    secondaryPhoneCountry,
    secondaryPhoneType
  ]);

  if (results[0][0]?.status === 'fail') {
    throw new Error(results[0][0].error_message);
  }

  return results[0][0];
};
