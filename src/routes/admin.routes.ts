import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireAdmin, requireApprover, requireAnyRole } from '../middleware/role.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * Admin User Management Routes
 */

// Create admin user (admin only)
router.post('/users', requireAdmin, adminController.createAdminUser);

// List admin users (any role)
router.get('/users', requireAnyRole, adminController.listAdminUsers);

// Update admin user (admin only)
router.put('/users/:id', requireAdmin, adminController.updateAdminUser);

/**
 * Registration Management Routes
 */

// Get registrations (any role)
router.get('/registrations', requireAnyRole, adminController.getRegistrations);

/**
 * Profile Management Routes
 */

// Get profiles (any role)
router.get('/profiles', requireAnyRole, adminController.getProfiles);

// Update verification status (approver or admin)
router.put('/profiles/verify', requireApprover, adminController.updateVerifyStatus);

/**
 * Account Management Routes
 */

// Create account (approver or admin)
router.post('/accounts', requireApprover, adminController.createAccount);

// Update account (approver or admin)
router.put('/accounts/:account_code', requireApprover, adminController.updateAccount);

// Enable account (approver or admin)
router.put('/accounts/:id/enable', requireApprover, adminController.enableAccount);

// Disable account (approver or admin)
router.put('/accounts/:id/disable', requireApprover, adminController.disableAccount);

// Get account logins (any role)
router.get('/accounts/:account_id/logins', requireAnyRole, adminController.getAccountLogins);

/**
 * Payment Management Routes
 */

// Get payment summaries (any role)
router.get('/payments/summary', requireAnyRole, adminController.getPaymentSummaries);

/**
 * Partner Management Routes
 */

// Get partner registrations (any role)
router.get('/partners/registrations', requireAnyRole, adminController.getPartnerRegistrations);

// Create partner registration (approver or admin)
router.post('/partners/registrations', requireApprover, adminController.createPartnerRegistration);

// Approve or reject partner (approver or admin)
router.post('/partners/:id/approve', requireApprover, adminController.approveRejectPartner);

// Update partner registration (approver or admin)
router.put('/partners/:id', requireApprover, adminController.updatePartnerRegistration);

/**
 * Lookup/Metadata Routes
 */

/**
 * Get countries list
 */
router.get('/countries', requireAnyRole, adminController.getCountries);

/**
 * Get states by country
 */
router.get('/states', requireAnyRole, adminController.getStatesByCountry);

/**
 * Get lookup data by category
 */
router.get('/lookup', requireAnyRole, adminController.getLookupData);

/**
 * API Client Management Routes
 */

// Get API clients (any role)
router.get('/clients', requireAnyRole, adminController.getApiClients);

// Get API client payments (any role)
router.get('/clients/:id/payments', requireAnyRole, adminController.getApiClientPayments);

export default router;
