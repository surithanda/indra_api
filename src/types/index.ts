// Admin User Types
export interface AdminUser {
  admin_id: number;
  username: string;
  email: string;
  password_hash?: string;
  role: 'viewer' | 'approver' | 'admin';
  is_active: boolean;
  last_login?: Date;
  failed_login_attempts: number;
  locked_until?: Date;
  mfa_secret?: string;
  mfa_enabled: boolean;
  created_at: Date;
  updated_at: Date;
  created_by?: string;
}

// Session Types
export interface AdminSession {
  session_id: string;
  admin_id: number;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
  expires_at: Date;
  is_active: boolean;
  last_activity?: Date;
}

// JWT Payload
export interface JWTPayload {
  admin_id: number;
  username: string;
  email: string;
  role: string;
  session_id: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    pagination?: PaginationMeta;
    timestamp: string;
    requestId?: string;
  };
}

export interface PaginationMeta {
  total_count: number;
  page_limit: number;
  page_offset: number;
  total_pages: number;
  current_page: number;
}

// Request Types
export interface LoginRequest {
  username: string;
  password: string;
  mfa_code?: string;
}

export interface CreateAdminUserRequest {
  username: string;
  email: string;
  password: string;
  role: 'viewer' | 'approver' | 'admin';
}

export interface UpdateAdminUserRequest {
  email?: string;
  role?: 'viewer' | 'approver' | 'admin';
  is_active?: boolean;
  mfa_enabled?: boolean;
}

export interface EnableDisableAccountRequest {
  is_active: boolean;
  reason?: string;
}

export interface UpdateVerifyStatusRequest {
  table_name: 'personal' | 'address' | 'education' | 'employment' | 'photos';
  record_id: number;
  verification_status: 'pending' | 'verified' | 'rejected';
}

export interface ApprovePartnerRequest {
  action: 'approve' | 'reject';
  rejection_reason?: string;
  api_key_expiry_days?: number;
}

// Account Types
export interface Account {
  account_id: number;
  account_code: string;
  email: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  birth_date: Date;
  gender: number;
  primary_phone: string;
  primary_phone_country: string;
  is_active: boolean;
  activation_date?: Date;
  deactivated_date?: Date;
  deactivation_reason?: string;
  created_date: Date;
  registered_partner_id?: number;
}

// Profile Types
export interface Profile {
  profile_id: number;
  account_id: number;
  height?: number;
  weight?: number;
  marital_status?: string;
  mother_tongue?: string;
  verification_status: string;
  verified_by?: string;
  verified_date?: Date;
  addresses?: ProfileAddress[];
  education?: ProfileEducation[];
  employment?: ProfileEmployment[];
  family_references?: ProfileFamilyReference[];
  photos?: ProfilePhoto[];
}

export interface ProfileAddress {
  address_id: number;
  profile_id: number;
  address_type: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  country: string;
  zip: string;
  verification_status: string;
}

export interface ProfileEducation {
  education_id: number;
  profile_id: number;
  education_level: string;
  institution_name: string;
  field_of_study: string;
  year_of_passing: number;
  verification_status: string;
}

export interface ProfileEmployment {
  employment_id: number;
  profile_id: number;
  employment_status: string;
  occupation: string;
  organization_name: string;
  annual_income?: number;
  currency?: string;
  verification_status: string;
}

export interface ProfileFamilyReference {
  reference_id: number;
  profile_id: number;
  reference_type: string;
  name: string;
  relationship: string;
  occupation?: string;
  phone?: string;
  email?: string;
}

export interface ProfilePhoto {
  photo_id: number;
  profile_id: number;
  photo_url: string;
  photo_type: string;
  is_primary: boolean;
  verification_status: string;
  uploaded_date: Date;
}

// Payment Types
export interface Payment {
  id: number;
  payment_intent_id: string;
  amount: number;
  currency: string;
  status: string;
  client_id?: number;
  account_id?: number;
  description?: string;
  created: Date;
  updated: Date;
}

export interface PaymentSummary {
  total_count: number;
  total_amount: number;
  successful_count: number;
  successful_amount: number;
  pending_count: number;
  pending_amount: number;
  failed_count: number;
  failed_amount: number;
}

// Partner Types
export interface PartnerRegistration {
  id: number;
  business_name: string;
  business_type: string;
  registration_number?: string;
  tax_id?: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  contact_phone_country: string;
  website?: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  approved_date?: Date;
  rejection_reason?: string;
  created_date: Date;
}

// API Client Types
export interface ApiClient {
  id: number;
  business_name: string;
  business_type: string;
  contact_email: string;
  contact_person: string;
  is_active: boolean;
  created_date: Date;
  api_keys?: ApiKey[];
  registered_accounts_count?: number;
  active_accounts_count?: number;
  total_payments?: number;
  total_revenue?: number;
}

export interface ApiKey {
  key_id: number;
  client_id: number;
  api_key: string;
  key_name?: string;
  expires_at?: Date;
  is_active: boolean;
  usage_count: number;
  last_used?: Date;
  created_at: Date;
}

// Audit Log Types
export interface AuditLog {
  audit_id: number;
  admin_id?: number;
  action_type: string;
  resource_type: string;
  resource_id?: string;
  action_details?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

// Activity Log Types
export interface ActivityLog {
  log_id: number;
  log_type: string;
  message: string;
  created_at: Date;
  created_by?: string;
  start_time?: Date;
  end_time?: Date;
  execution_time?: number;
  ip_address?: string;
  activity_type?: string;
  activity_details?: string;
}

// Express Request Extension
declare global {
  namespace Express {
    interface Request {
      admin?: AdminUser;
      session_id?: string;
    }
  }
}
