# Matrimony Admin Service

Admin service for managing the matrimony platform with role-based access control, comprehensive audit trails, and secure authentication.

## Features

- ✅ **Secure Authentication** - JWT-based auth with MFA support
- ✅ **Role-Based Access Control** - Viewer, Approver, and Admin roles
- ✅ **Session Management** - Secure session handling with expiration
- ✅ **Comprehensive Audit Trail** - Track all admin actions
- ✅ **Account Management** - Enable/disable user accounts
- ✅ **Profile Verification** - Verify user profile data
- ✅ **Payment Analytics** - Track and analyze payments
- ✅ **Partner Management** - Approve partner registrations and generate API keys
- ✅ **API Client Management** - Manage API clients and their usage
- ✅ **Notification System** - Email notifications for important events
- ✅ **Data Export** - Export data in PDF and CSV formats

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MySQL 8.0+
- **Authentication**: JWT + bcrypt
- **MFA**: Speakeasy (TOTP)
- **Validation**: express-validator
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Winston

## Prerequisites

- Node.js 18+ and npm
- MySQL 8.0+
- Database schema and procedures installed (see `../database/`)

## Installation

### 1. Install Dependencies

```bash
cd admin-service
npm install
```

### 2. Configure Environment

Copy the example environment file and update with your settings:

```bash
cp .env.example .env
```

Edit `.env` and configure:
- Database connection details
- JWT secrets (generate secure random strings)
- SMTP settings for email notifications
- CORS origins
- Rate limiting settings

### 3. Database Setup

Ensure the database schema and procedures are installed:

```bash
# From the project root
mysql -u username -p database_name < database/admin-schema.sql

# Install all procedures
for file in database/procedures/admin/*.sql; do
  mysql -u username -p database_name < "$file"
done
```

### 4. Create Admin User

The default admin user is created automatically with the schema:
- **Username**: admin
- **Email**: admin@matrimony.com
- **Password**: Admin@123 (Change immediately after first login!)

Or create a new admin user via SQL:

```sql
INSERT INTO admin_users (username, email, password_hash, role, is_active, created_by)
VALUES (
  'your_username',
  'your_email@example.com',
  '$2b$10$...',  -- Hash your password using bcrypt
  'admin',
  1,
  'system'
);
```

## Running the Service

### Development Mode

```bash
npm run dev
```

The service will start on `http://localhost:5000` (or your configured PORT).

### Production Mode

```bash
npm run build
npm start
```

### Testing

```bash
npm test
npm run test:watch
```

## API Documentation

### Base URL

```
http://localhost:5000/api/admin
```

### Authentication Endpoints

#### Login
```http
POST /api/admin/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "Admin@123",
  "mfa_code": "123456"  // Optional, if MFA is enabled
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "admin_id": 1,
    "username": "admin",
    "email": "admin@matrimony.com",
    "role": "admin",
    "session_id": "uuid",
    "access_token": "jwt_token",
    "refresh_token": "refresh_token",
    "expires_at": "2024-11-15T00:00:00.000Z",
    "mfa_enabled": false
  }
}
```

#### Logout
```http
POST /api/admin/auth/logout
Authorization: Bearer <access_token>
```

#### Refresh Token
```http
POST /api/admin/auth/refresh
Content-Type: application/json

{
  "refresh_token": "your_refresh_token"
}
```

#### Forgot Password
```http
POST /api/admin/auth/forgot-password
Content-Type: application/json

{
  "email": "admin@matrimony.com"
}
```

#### Reset Password
```http
POST /api/admin/auth/reset-password
Content-Type: application/json

{
  "token": "reset_token",
  "new_password": "NewPassword@123"
}
```

### Admin User Management

#### List Admin Users
```http
GET /api/admin/users?role=admin&is_active=1&limit=50&offset=0
Authorization: Bearer <access_token>
```

#### Create Admin User
```http
POST /api/admin/users
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "username": "newadmin",
  "email": "newadmin@matrimony.com",
  "password": "SecurePassword@123",
  "role": "approver"
}
```

#### Update Admin User
```http
PUT /api/admin/users/:id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "email": "updated@matrimony.com",
  "role": "admin",
  "is_active": true
}
```

### Registration Management

#### Get Registrations
```http
GET /api/admin/registrations?email=user@example.com&is_active=1&limit=50&offset=0
Authorization: Bearer <access_token>
```

### Profile Management

#### Get Profiles
```http
GET /api/admin/profiles?profile_id=1&verification_status=pending&limit=50&offset=0
Authorization: Bearer <access_token>
```

#### Update Verification Status
```http
PUT /api/admin/profiles/verify
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "table_name": "personal",
  "record_id": 123,
  "verification_status": "verified"
}
```

### Account Management

#### Enable Account
```http
PUT /api/admin/accounts/:id/enable
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "reason": "Account verified"
}
```

#### Disable Account
```http
PUT /api/admin/accounts/:id/disable
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "reason": "Suspicious activity detected"
}
```

### Payment Management

#### Get Payment Summary
```http
GET /api/admin/payments/summary?status=succeeded&start_date=2024-01-01&end_date=2024-12-31
Authorization: Bearer <access_token>
```

### Partner Management

#### Get Partner Registrations
```http
GET /api/admin/partners/registrations?status=pending&limit=50&offset=0
Authorization: Bearer <access_token>
```

#### Approve Partner
```http
POST /api/admin/partners/:id/approve
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "action": "approve",
  "api_key_expiry_days": 365
}
```

#### Reject Partner
```http
POST /api/admin/partners/:id/approve
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "action": "reject",
  "rejection_reason": "Incomplete documentation"
}
```

### API Client Management

#### Get API Clients
```http
GET /api/admin/clients?is_active=1&limit=50&offset=0
Authorization: Bearer <access_token>
```

#### Get Client Payments
```http
GET /api/admin/clients/:id/payments?status=succeeded&limit=50&offset=0
Authorization: Bearer <access_token>
```

## Error Codes

### Authentication Errors (48xxx)
- `48001` - System error during login
- `48002` - Invalid username or password
- `48003` - Account locked
- `48004` - Account inactive
- `48005` - Logout system error
- `48006` - Invalid or expired session
- `48007-48015` - Session and password reset errors

### Validation Errors (50xxx)
- `50000` - Validation failed
- `50001` - System error creating user
- `50002` - Invalid role
- `50003` - Username already exists
- `50004` - Email already exists
- `50005` - Admin user not found

### Business Logic Errors (51xxx)
- `51001` - Account not found
- `51002` - Account status unchanged
- `51003` - Invalid table name
- `51004` - Invalid verification status
- `51005` - Record not found
- `51006-51011` - Partner and client errors

### System Errors (52xxx)
- `52000` - Internal server error

## Security Features

### Authentication
- JWT-based authentication with access and refresh tokens
- Bcrypt password hashing with configurable rounds
- Account locking after 5 failed login attempts
- Session expiration (8 hours by default)
- MFA support using TOTP

### Authorization
- Role-based access control (RBAC)
- Three roles: Viewer, Approver, Admin
- Middleware for role verification
- Resource-level permissions

### Security Headers
- Helmet for security headers
- CORS configuration
- Rate limiting (100 requests per 15 minutes)
- XSS protection
- SQL injection prevention via parameterized queries

### Audit Trail
- All admin actions logged to `admin_audit_log`
- IP address and user agent tracking
- Detailed action information in JSON format

## Project Structure

```
admin-service/
├── src/
│   ├── config/
│   │   └── database.ts          # Database configuration
│   ├── controllers/
│   │   ├── auth.controller.ts   # Authentication logic
│   │   ├── user.controller.ts   # Admin user management
│   │   ├── registration.controller.ts
│   │   ├── profile.controller.ts
│   │   ├── account.controller.ts
│   │   ├── payment.controller.ts
│   │   ├── partner.controller.ts
│   │   └── client.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts   # JWT verification
│   │   ├── role.middleware.ts   # Role-based access
│   │   ├── validate.middleware.ts
│   │   ├── rateLimit.middleware.ts
│   │   └── error.middleware.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── registration.routes.ts
│   │   ├── profile.routes.ts
│   │   ├── account.routes.ts
│   │   ├── payment.routes.ts
│   │   ├── partner.routes.ts
│   │   └── client.routes.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── registration.service.ts
│   │   ├── profile.service.ts
│   │   ├── account.service.ts
│   │   ├── payment.service.ts
│   │   ├── partner.service.ts
│   │   └── client.service.ts
│   ├── types/
│   │   └── index.ts             # TypeScript types
│   ├── utils/
│   │   ├── response.ts          # Response helpers
│   │   ├── jwt.ts               # JWT utilities
│   │   ├── logger.ts            # Winston logger
│   │   └── validation.ts        # Validation schemas
│   ├── app.ts                   # Express app setup
│   └── server.ts                # Server entry point
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Environment Variables

See `.env.example` for all available configuration options.

## Logging

Logs are written to:
- Console (development)
- `logs/admin-service.log` (production)
- `logs/error.log` (errors only)

Log levels: error, warn, info, http, debug

## Monitoring

The service exposes health check endpoints:

```http
GET /health
GET /api/admin/health
```

## Contributing

1. Follow TypeScript best practices
2. Write tests for new features
3. Update documentation
4. Follow existing code style
5. Create meaningful commit messages

## License

Proprietary - All rights reserved

## Support

For issues or questions, contact the development team.

---

**Note**: All TypeScript lint errors about missing modules will be resolved after running `npm install`. These errors are expected before dependencies are installed.
