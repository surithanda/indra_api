import { DbHelper, getDbHelper } from './dbHelper';

/**
 * Stored Procedure Helper for Integration Tests
 * Provides direct stored procedure testing capabilities
 */

export interface ProcedureResult {
  status: 'success' | 'fail';
  error_type?: string | null;
  error_code?: string | null;
  error_message?: string | null;
  [key: string]: any;
}

export class ProcedureHelper {
  private dbHelper: DbHelper;

  constructor() {
    this.dbHelper = getDbHelper();
  }

  /**
   * Generic procedure caller
   */
  async callProcedure(
    procedureName: string,
    params: any[]
  ): Promise<ProcedureResult> {
    const results = await this.dbHelper.executeProcedure(procedureName, params);
    
    if (!results || !results[0] || !results[0][0]) {
      throw new Error(`Procedure ${procedureName} returned no results`);
    }

    return results[0][0] as ProcedureResult;
  }

  // ============================================
  // Auth Procedures
  // ============================================

  /**
   * Call admin_auth_login procedure
   */
  async callLoginProcedure(
    username: string,
    passwordHash: string,
    ipAddress: string | null = null,
    userAgent: string | null = null
  ): Promise<ProcedureResult> {
    return this.callProcedure('admin_auth_login', [
      username,
      passwordHash,
      ipAddress,
      userAgent
    ]);
  }

  /**
   * Call admin_auth_logout procedure
   */
  async callLogoutProcedure(
    sessionId: string,
    adminId: number
  ): Promise<ProcedureResult> {
    return this.callProcedure('admin_auth_logout', [sessionId, adminId]);
  }

  /**
   * Call admin_auth_verify_session procedure
   */
  async callVerifySessionProcedure(
    sessionId: string
  ): Promise<ProcedureResult> {
    return this.callProcedure('admin_auth_verify_session', [sessionId]);
  }

  /**
   * Call admin_auth_refresh_token procedure
   */
  async callRefreshTokenProcedure(
    sessionId: string,
    adminId: number
  ): Promise<ProcedureResult> {
    return this.callProcedure('admin_auth_refresh_token', [sessionId, adminId]);
  }

  /**
   * Call admin_auth_reset_password procedure
   */
  async callResetPasswordProcedure(email: string): Promise<ProcedureResult> {
    return this.callProcedure('admin_auth_reset_password', [email]);
  }

  /**
   * Call admin_auth_confirm_reset_password procedure
   */
  async callConfirmResetPasswordProcedure(
    token: string,
    newPasswordHash: string
  ): Promise<ProcedureResult> {
    return this.callProcedure('admin_auth_confirm_reset_password', [
      token,
      newPasswordHash
    ]);
  }

  // ============================================
  // Validation Helper Methods
  // ============================================

  /**
   * Assert procedure returned success
   */
  assertSuccessResponse(result: ProcedureResult): void {
    if (result.status !== 'success') {
      throw new Error(
        `Expected success response but got: ${result.status} - ${result.error_message}`
      );
    }

    if (result.error_code !== null && result.error_code !== undefined) {
      throw new Error('Success response should have null error_code');
    }

    if (result.error_message !== null && result.error_message !== undefined) {
      throw new Error('Success response should have null error_message');
    }

    if (result.error_type !== null && result.error_type !== undefined) {
      throw new Error('Success response should have null error_type');
    }
  }

  /**
   * Assert procedure returned failure
   */
  assertFailureResponse(
    result: ProcedureResult,
    expectedErrorCode?: string
  ): void {
    if (result.status !== 'fail') {
      throw new Error(`Expected fail response but got: ${result.status}`);
    }

    if (!result.error_type) {
      throw new Error('Fail response should have error_type');
    }

    if (!result.error_code) {
      throw new Error('Fail response should have error_code');
    }

    if (!result.error_message) {
      throw new Error('Fail response should have error_message');
    }

    if (expectedErrorCode && result.error_code !== expectedErrorCode) {
      throw new Error(
        `Expected error_code ${expectedErrorCode} but got ${result.error_code}`
      );
    }
  }

  /**
   * Verify status fields are present and valid
   */
  assertStatusFields(result: ProcedureResult): void {
    if (!('status' in result)) {
      throw new Error('Result missing status field');
    }

    if (result.status !== 'success' && result.status !== 'fail') {
      throw new Error(
        `Status must be 'success' or 'fail', got: ${result.status}`
      );
    }

    if (!('error_type' in result)) {
      throw new Error('Result missing error_type field');
    }

    if (!('error_code' in result)) {
      throw new Error('Result missing error_code field');
    }

    if (!('error_message' in result)) {
      throw new Error('Result missing error_message field');
    }
  }

  /**
   * Verify procedure response structure
   */
  verifyResponseStructure(result: any): result is ProcedureResult {
    return (
      typeof result === 'object' &&
      'status' in result &&
      (result.status === 'success' || result.status === 'fail') &&
      'error_type' in result &&
      'error_code' in result &&
      'error_message' in result
    );
  }
}

// Singleton instance
let procedureHelperInstance: ProcedureHelper | null = null;

export function getProcedureHelper(): ProcedureHelper {
  if (!procedureHelperInstance) {
    procedureHelperInstance = new ProcedureHelper();
  }
  return procedureHelperInstance;
}
