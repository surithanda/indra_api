# Remaining Tasks - Integration Testing

## Current Status: 52/57 Tests Passing (91%)

### ✅ Completed
1. Fixed collation mismatch in password comparison (BINARY keyword)
2. Improved error handlers in 3 procedures (login, logout, verify_session)
3. Updated test assertions to match actual API response structure
4. Identified correct error handler pattern

## 🔧 To Do

### A. Update Error Handlers in Remaining 19 Procedures

**Correct Pattern:**
```sql
-- 1. Add these variable declarations at PROCEDURE level (after other DECLAREs):
DECLARE v_mysql_errno INT;
DECLARE v_message_text TEXT;

-- 2. Update the EXIT HANDLER:
DECLARE EXIT HANDLER FOR SQLEXCEPTION
BEGIN
    GET DIAGNOSTICS CONDITION 1
        v_message_text = MESSAGE_TEXT,
        v_mysql_errno = MYSQL_ERRNO;
    
    SET v_end_time = NOW();
    SET v_execution_time = TIMESTAMPDIFF(MICROSECOND, v_start_time, v_end_time);
    
    INSERT INTO activity_log (log_type, message, created_by, start_time, end_time, execution_time, ip_address, activity_type)
    VALUES ('ERROR', COALESCE(v_message_text, 'Unknown SQL error'), [username], v_start_time, v_end_time, v_execution_time, [ip], '[PROC_NAME]_ERROR');
    
    SELECT 
        'fail' AS status,
        'SQL Exception' AS error_type,
        CAST(COALESCE(v_mysql_errno, 48001) AS CHAR) AS error_code,
        COALESCE(v_message_text, 'Unknown SQL exception occurred') AS error_message;
END;
```

**Procedures Still Needing Update:**
- [ ] 04_admin_auth_refresh_token.sql
- [ ] 05_admin_auth_reset_password.sql
- [ ] 06_admin_auth_confirm_reset_password.sql
- [ ] 07_admin_users_create.sql
- [ ] 08_admin_users_update.sql
- [ ] 09_admin_users_list.sql
- [ ] 10_admin_get_registrations.sql
- [ ] 11_admin_get_profiles.sql
- [ ] 12_admin_enable_disable_account.sql
- [ ] 13_admin_update_verify_status.sql
- [ ] 14_admin_get_total_payments.sql
- [ ] 15_admin_get_partner_registrations.sql
- [ ] 16_admin_approve_partner_registrations.sql
- [ ] 17_admin_get_api_clients.sql
- [ ] 18_admin_get_api_client_payments.sql
- [ ] admin_api_clients_create_v1.sql
- [ ] admin_registered_partner_delete_v1.sql
- [ ] admin_registered_partner_get.sql
- [ ] admin_registered_partner_update_v1.sql

**After Updates:**
```powershell
cd prod-database\admin
.\deploy-admin-system.ps1 -ProceduresOnly
```

### B. Investigate Activity Log Issue

**Failing Tests:**
1. API Test: "should log activity on failed login"
2. Procedure Test: Similar activity log verification

**What to Check:**
1. Run debug script to see actual activity_log entries:
   ```bash
   npx ts-node tests/integration/debug-activity-log.ts
   ```

2. Check if logs are being created with correct activity_type:
   - Expected: `ADMIN_LOGIN_INVALID_PASSWORD`
   - Location: Line 168 in `01_admin_auth_login.sql`

3. Possible issues:
   - Transaction timing (log not committed when test checks)
   - Activity log table constraints
   - Test cleanup removing logs too early

**Test Code Location:**
- `admin-service/tests/integration/auth/login.api.test.ts:405-410`
- Searches for: `activity_type = 'ADMIN_LOGIN_INVALID_PASSWORD'` with message containing username

### C. Fix Locked Account Test

**Issue:** 
The `test_admin_locked` user successfully logs in when it should be rejected (403).

**What to Check:**
1. Verify `locked_until` value in database:
   ```sql
   SELECT username, locked_until, failed_login_attempts 
   FROM admin_users 
   WHERE username = 'test_admin_locked';
   ```

2. Check if `locked_until` is in the past (already expired)

3. Recreate the user with a future `locked_until`:
   ```sql
   UPDATE admin_users 
   SET locked_until = DATE_ADD(NOW(), INTERVAL 1 HOUR),
       failed_login_attempts = 5
   WHERE username = 'test_admin_locked';
   ```

4. Verify procedure logic at line 104 in `01_admin_auth_login.sql`

## Next Steps

1. **Priority 1**: Update all 19 procedures with correct error handler pattern
2. **Priority 2**: Investigate and fix activity log verification
3. **Priority 3**: Fix locked account test data

After completing these, we should have 57/57 tests passing (100%)!
