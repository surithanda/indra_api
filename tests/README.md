# Admin Service Integration Tests

This directory contains comprehensive integration tests for the Admin Service API, covering both HTTP endpoints and stored procedures.

## 📁 Structure

```
tests/
├── integration/
│   ├── auth/                     # Authentication tests
│   │   ├── login.api.test.ts     # Login endpoint tests
│   │   ├── login.procedure.test.ts # Login procedure tests
│   │   └── [future auth tests]
│   ├── config/                   # Test configurations
│   ├── fixtures/                 # Test data
│   │   └── users.fixture.ts      # Test user definitions
│   ├── helpers/                  # Test utilities
│   │   ├── apiHelper.ts          # HTTP request wrapper
│   │   ├── assertHelper.ts       # Custom assertions
│   │   ├── cleanupHelper.ts      # Data cleanup utilities
│   │   ├── dbHelper.ts           # Database operations
│   │   └── procedureHelper.ts    # Procedure testing
│   └── setup/                    # Test lifecycle
│       ├── globalSetup.ts        # Pre-test setup
│       ├── globalTeardown.ts     # Post-test cleanup
│       ├── setupTests.ts         # Custom matchers
│       └── testServer.ts         # Test app instance
└── README.md                     # This file
```

## 🚀 Getting Started

### Prerequisites

1. **MySQL Database**: Ensure `matrimony_services` database is running
2. **Environment Variables**: Copy and configure `.env.test`
3. **Dependencies**: Install test dependencies

### Installation

```bash
# Install dependencies (if not already installed)
npm install

# This will install:
# - jest, @types/jest, ts-jest (Test framework)
# - supertest, @types/supertest (HTTP testing)
```

### Environment Setup

1. **Copy test environment file**:
   ```bash
   # Already exists: .env.test
   ```

2. **Update database credentials** in `.env.test`:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=matrimony_services
   ```

3. **Verify database connection**:
   ```bash
   # Test users will be created automatically on first run
   ```

## 🧪 Running Tests

### Basic Commands

```bash
# Run all integration tests
npm run test:integration

# Run tests in watch mode (re-runs on file changes)
npm run test:integration:watch

# Run with coverage report
npm run test:integration:coverage

# Run with verbose output
npm run test:integration:verbose
```

### Running Specific Test Files

```bash
# Run only login API tests
npm run test:integration -- login.api.test

# Run only login procedure tests
npm run test:integration -- login.procedure.test

# Run all auth tests
npm run test:integration -- auth/
```

### Running Specific Test Cases

```bash
# Run tests matching pattern
npm run test:integration -- -t "should login successfully"

# Run a specific describe block
npm run test:integration -- -t "Successful Login Scenarios"
```

## 📊 Test Coverage

After running tests with coverage:

```bash
npm run test:integration:coverage
```

View detailed coverage report:
```bash
# Open in browser
start coverage/index.html  # Windows
open coverage/index.html   # Mac
xdg-open coverage/index.html  # Linux
```

Coverage thresholds (configured in `jest.config.js`):
- **Statements**: 70%
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%

## 🧩 Test Architecture

### Two-Layer Testing Approach

#### 1. **API Endpoint Tests** (`*.api.test.ts`)
- Tests complete HTTP request/response flow
- Validates authentication, middleware, and controllers
- Checks HTTP status codes and response structure
- Example: `login.api.test.ts`

#### 2. **Stored Procedure Tests** (`*.procedure.test.ts`)
- Tests database procedures directly
- Validates status-based error handling
- Verifies database state changes
- Example: `login.procedure.test.ts`

### Test Data

**Test Users** (defined in `fixtures/users.fixture.ts`):
- `test_admin_valid` - Active admin user
- `test_manager_valid` - Active manager user
- `test_viewer_valid` - Active viewer user
- `test_approver_valid` - Active approver user
- `test_admin_inactive` - Inactive user
- `test_admin_locked` - Locked user (5 failed attempts)

**Credentials**: Defined in `users.fixture.ts`

### Custom Matchers

The test suite includes custom Jest matchers:

```typescript
// Check if response has status field
expect(result).toHaveStatusField();

// Check if response is success
expect(result).toBeSuccessResponse();

// Check if response is failure
expect(result).toBeFailResponse();
expect(result).toBeFailResponse('48001'); // With error code

// Check if string is valid JWT
expect(token).toBeValidJWT();

// Check if response has error fields
expect(result).toHaveErrorFields();
```

## 📝 Writing New Tests

### Adding Auth Tests (Other Endpoints)

1. **Create API test file**:
   ```typescript
   // tests/integration/auth/logout.api.test.ts
   import { ApiHelper } from '../helpers/apiHelper';
   // ... imports

   describe('POST /api/admin/auth/logout', () => {
     // ... tests
   });
   ```

2. **Create procedure test file**:
   ```typescript
   // tests/integration/auth/logout.procedure.test.ts
   import { ProcedureHelper } from '../helpers/procedureHelper';
   // ... imports

   describe('admin_auth_logout - Stored Procedure', () => {
     // ... tests
   });
   ```

### Test Structure Template

```typescript
describe('Feature Name', () => {
  let apiHelper: ApiHelper;
  let dbHelper: DbHelper;
  let cleanupHelper: CleanupHelper;

  beforeAll(() => {
    // Initialize helpers
  });

  afterAll(async () => {
    // Cleanup
  });

  beforeEach(async () => {
    // Reset state before each test
  });

  describe('Success Scenarios', () => {
    it('should handle valid case', async () => {
      // Arrange
      // Act
      // Assert
    });
  });

  describe('Error Scenarios', () => {
    it('should handle error case', async () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

## 🛠️ Helper Utilities

### DbHelper
Direct database operations:
```typescript
const dbHelper = getDbHelper();

// Execute queries
await dbHelper.executeQuery('SELECT * FROM admin_users WHERE username = ?', ['test_admin']);

// Call procedures
await dbHelper.executeProcedure('admin_auth_login', [username, hash, ip, agent]);

// Verify data
await dbHelper.verifySessionExists(sessionId);
await dbHelper.getFailedLoginAttempts(username);
```

### ApiHelper
HTTP request wrapper:
```typescript
const apiHelper = new ApiHelper(app);

// Auth endpoints
await apiHelper.login(username, password);
await apiHelper.logout(token);
await apiHelper.refreshToken(refreshToken);

// Generic requests
await apiHelper.post('/auth/login', data);
await apiHelper.get('/auth/me', token);
```

### ProcedureHelper
Direct procedure testing:
```typescript
const procedureHelper = getProcedureHelper();

// Call procedures
const result = await procedureHelper.callLoginProcedure(
  username, passwordHash, ip, agent
);

// Validate responses
procedureHelper.assertSuccessResponse(result);
procedureHelper.assertFailureResponse(result, 'error_code');
```

### CleanupHelper
Data cleanup:
```typescript
const cleanupHelper = getCleanupHelper();

// Clean test data
await cleanupHelper.cleanupTestSessions();
await cleanupHelper.resetAllTestUsers();
await cleanupHelper.fullCleanup();
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```
   Solution: Check .env.test database credentials
   Verify MySQL is running and accessible
   ```

2. **Test Users Already Exist**
   ```
   Solution: Tests will skip creation if users exist
   To recreate: Manually delete test users from database
   ```

3. **Tests Timeout**
   ```
   Solution: Increase timeout in jest.config.js
   testTimeout: 30000 (default is 30 seconds)
   ```

4. **Port Already in Use**
   ```
   Solution: Tests don't start a server
   They use the Express app directly via supertest
   ```

5. **Lint Errors About 'supertest'**
   ```
   Solution: Run npm install to install dependencies
   npm install
   ```

### Debugging Tests

```bash
# Run with verbose output
npm run test:integration:verbose

# Run single test file
npm run test:integration -- login.api.test

# Run with Node debugger
node --inspect-brk node_modules/.bin/jest --runInBand
```

## 📚 Test Guidelines

### Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up test data in `beforeEach`/`afterAll`
3. **Assertions**: Use descriptive assertion messages
4. **Coverage**: Aim for >80% coverage on critical paths
5. **Speed**: Keep tests fast (<30s total)

### Naming Conventions

- Test files: `*.test.ts`
- Test users: `test_*` prefix
- Describe blocks: Feature or scenario names
- Test cases: "should [expected behavior]"

### Test Data

- Use fixtures for consistent test data
- Don't hardcode values - use constants
- Clean up after tests
- Don't depend on test execution order

## 🔄 CI/CD Integration

### GitHub Actions (Future)

```yaml
# .github/workflows/test.yml
name: Integration Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run test:integration:coverage
```

## 📈 Future Enhancements

- [ ] Add logout endpoint tests
- [ ] Add refresh token tests
- [ ] Add password reset tests
- [ ] Add admin user management tests
- [ ] Add account management tests
- [ ] Add API client tests
- [ ] Add performance benchmarks
- [ ] Add load testing
- [ ] Add security testing

## 📞 Support

For issues or questions:
1. Check this README
2. Review test examples in `auth/` directory
3. Check Jest documentation: https://jestjs.io/
4. Check Supertest documentation: https://github.com/visionmedia/supertest

---

**Happy Testing! 🎉**
