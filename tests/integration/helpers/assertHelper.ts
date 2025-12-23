import jwt from 'jsonwebtoken';
import { Response } from 'supertest';

/**
 * Custom Assertion Helper for Integration Tests
 * Provides reusable assertion logic
 */
export class AssertHelper {
  /**
   * Assert valid JWT structure and signature
   */
  assertValidJWT(token: string, secret?: string): void {
    if (!token) {
      throw new Error('Token is null or undefined');
    }

    // Check basic JWT structure (3 parts separated by dots)
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error(
        `Invalid JWT structure. Expected 3 parts, got ${parts.length}`
      );
    }

    // If secret provided, verify signature
    if (secret) {
      try {
        jwt.verify(token, secret);
      } catch (error: any) {
        throw new Error(`JWT verification failed: ${error.message}`);
      }
    }
  }

  /**
   * Assert response has success status
   */
  assertStatusResponse(
    response: any,
    expectedStatus: 'success' | 'fail'
  ): void {
    if (!response || typeof response !== 'object') {
      throw new Error('Response is not an object');
    }

    if (!('status' in response)) {
      throw new Error('Response missing status field');
    }

    if (response.status !== expectedStatus) {
      throw new Error(
        `Expected status '${expectedStatus}', got '${response.status}'`
      );
    }
  }

  /**
   * Assert response is a success response
   */
  assertSuccessResponse(response: any): void {
    this.assertStatusResponse(response, 'success');

    // Success responses should have null error fields
    if (response.error_code !== null && response.error_code !== undefined) {
      throw new Error(
        `Success response should have null error_code, got: ${response.error_code}`
      );
    }

    if (
      response.error_message !== null &&
      response.error_message !== undefined
    ) {
      throw new Error(
        `Success response should have null error_message, got: ${response.error_message}`
      );
    }

    if (response.error_type !== null && response.error_type !== undefined) {
      throw new Error(
        `Success response should have null error_type, got: ${response.error_type}`
      );
    }
  }

  /**
   * Assert response is an error response
   */
  assertErrorResponse(response: any, expectedErrorCode?: string): void {
    this.assertStatusResponse(response, 'fail');

    // Error responses must have error fields
    if (!response.error_type) {
      throw new Error('Error response missing error_type field');
    }

    if (!response.error_code) {
      throw new Error('Error response missing error_code field');
    }

    if (!response.error_message) {
      throw new Error('Error response missing error_message field');
    }

    // Check specific error code if provided
    if (
      expectedErrorCode &&
      response.error_code !== expectedErrorCode
    ) {
      throw new Error(
        `Expected error_code '${expectedErrorCode}', got '${response.error_code}'`
      );
    }
  }

  /**
   * Assert API response structure
   */
  assertApiResponseStructure(
    response: Response,
    expectedStatus: number = 200
  ): void {
    if (response.status !== expectedStatus) {
      throw new Error(
        `Expected HTTP status ${expectedStatus}, got ${response.status}`
      );
    }

    if (!response.body) {
      throw new Error('Response body is empty');
    }

    if (!('success' in response.body)) {
      throw new Error('Response missing success field');
    }

    if (typeof response.body.success !== 'boolean') {
      throw new Error('Response success field must be boolean');
    }
  }

  /**
   * Assert procedure response structure
   */
  assertProcedureResponseStructure(result: any): void {
    if (!result || typeof result !== 'object') {
      throw new Error('Procedure result is not an object');
    }

    // Check required status fields
    const requiredFields = ['status', 'error_type', 'error_code', 'error_message'];

    for (const field of requiredFields) {
      if (!(field in result)) {
        throw new Error(`Procedure result missing ${field} field`);
      }
    }

    // Validate status value
    if (result.status !== 'success' && result.status !== 'fail') {
      throw new Error(
        `Status must be 'success' or 'fail', got: ${result.status}`
      );
    }

    // Validate error fields based on status
    if (result.status === 'success') {
      if (result.error_type !== null) {
        throw new Error('Success response should have null error_type');
      }
      if (result.error_code !== null) {
        throw new Error('Success response should have null error_code');
      }
      if (result.error_message !== null) {
        throw new Error('Success response should have null error_message');
      }
    } else {
      if (!result.error_type) {
        throw new Error('Fail response must have error_type');
      }
      if (!result.error_code) {
        throw new Error('Fail response must have error_code');
      }
      if (!result.error_message) {
        throw new Error('Fail response must have error_message');
      }
    }
  }

  /**
   * Assert login response structure
   */
  assertLoginResponseStructure(response: Response): void {
    this.assertApiResponseStructure(response, 200);

    const { body } = response;

    if (!body.data) {
      throw new Error('Login response missing data field');
    }

    const requiredFields = [
      'accessToken',
      'refreshToken',
      'admin',
      'session_id'
    ];

    for (const field of requiredFields) {
      if (!(field in body.data)) {
        throw new Error(`Login response data missing ${field} field`);
      }
    }

    // Validate admin object
    if (!body.data.admin || typeof body.data.admin !== 'object') {
      throw new Error('Login response admin must be an object');
    }

    const requiredAdminFields = [
      'admin_id',
      'username',
      'email',
      'role'
    ];

    for (const field of requiredAdminFields) {
      if (!(field in body.data.admin)) {
        throw new Error(`Login response admin missing ${field} field`);
      }
    }
  }

  /**
   * Assert HTTP status code
   */
  assertHttpStatus(response: Response, expectedStatus: number): void {
    if (response.status !== expectedStatus) {
      const errorMsg = response.body?.message || 'No error message';
      throw new Error(
        `Expected HTTP status ${expectedStatus}, got ${response.status}. Message: ${errorMsg}`
      );
    }
  }

  /**
   * Assert response contains field
   */
  assertHasField(obj: any, field: string): void {
    if (!(field in obj)) {
      throw new Error(`Object missing required field: ${field}`);
    }
  }

  /**
   * Assert response field equals value
   */
  assertFieldEquals(obj: any, field: string, expectedValue: any): void {
    this.assertHasField(obj, field);

    if (obj[field] !== expectedValue) {
      throw new Error(
        `Expected ${field} to be '${expectedValue}', got '${obj[field]}'`
      );
    }
  }

  /**
   * Assert response field is not null
   */
  assertFieldNotNull(obj: any, field: string): void {
    this.assertHasField(obj, field);

    if (obj[field] === null || obj[field] === undefined) {
      throw new Error(`Expected ${field} to not be null or undefined`);
    }
  }

  /**
   * Assert response field is null
   */
  assertFieldNull(obj: any, field: string): void {
    this.assertHasField(obj, field);

    if (obj[field] !== null) {
      throw new Error(`Expected ${field} to be null, got '${obj[field]}'`);
    }
  }
}

// Singleton instance
let assertHelperInstance: AssertHelper | null = null;

export function getAssertHelper(): AssertHelper {
  if (!assertHelperInstance) {
    assertHelperInstance = new AssertHelper();
  }
  return assertHelperInstance;
}
