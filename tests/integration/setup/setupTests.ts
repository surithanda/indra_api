/**
 * Setup file that runs before each test file
 * - Extend Jest matchers
 * - Set up custom matchers
 */

declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveStatusField(): R;
      toBeSuccessResponse(): R;
      toBeFailResponse(errorCode?: string): R;
      toBeValidJWT(): R;
      toHaveErrorFields(): R;
    }
  }
}

// Extend Jest matchers
expect.extend({
  /**
   * Check if response has status field with valid value
   */
  toHaveStatusField(received: any) {
    const pass =
      typeof received === 'object' &&
      'status' in received &&
      (received.status === 'success' || received.status === 'fail');

    return {
      pass,
      message: () =>
        pass
          ? `Expected response not to have valid status field`
          : `Expected response to have status field with value 'success' or 'fail', got: ${received?.status}`,
    };
  },

  /**
   * Check if response is a success response
   */
  toBeSuccessResponse(received: any) {
    const hasStatus = received.status === 'success';
    const hasNullErrors =
      received.error_type === null &&
      received.error_code === null &&
      received.error_message === null;

    const pass = hasStatus && hasNullErrors;

    return {
      pass,
      message: () =>
        pass
          ? `Expected response not to be a success response`
          : `Expected success response with status='success' and null error fields. Got: ${JSON.stringify(
              {
                status: received.status,
                error_type: received.error_type,
                error_code: received.error_code,
                error_message: received.error_message,
              }
            )}`,
    };
  },

  /**
   * Check if response is a fail response
   */
  toBeFailResponse(received: any, errorCode?: string) {
    const hasStatus = received.status === 'fail';
    const hasErrorFields =
      received.error_type !== null &&
      received.error_code !== null &&
      received.error_message !== null;
    const matchesErrorCode = errorCode
      ? received.error_code === errorCode
      : true;

    const pass = hasStatus && hasErrorFields && matchesErrorCode;

    return {
      pass,
      message: () => {
        if (!hasStatus) {
          return `Expected status='fail', got: ${received.status}`;
        }
        if (!hasErrorFields) {
          return `Expected non-null error fields, got: ${JSON.stringify({
            error_type: received.error_type,
            error_code: received.error_code,
            error_message: received.error_message,
          })}`;
        }
        if (!matchesErrorCode) {
          return `Expected error_code='${errorCode}', got: ${received.error_code}`;
        }
        return `Expected response not to be a fail response`;
      },
    };
  },

  /**
   * Check if string is a valid JWT
   */
  toBeValidJWT(received: any) {
    const isString = typeof received === 'string';
    const parts = isString ? received.split('.') : [];
    const pass = isString && parts.length === 3;

    return {
      pass,
      message: () =>
        pass
          ? `Expected ${received} not to be a valid JWT`
          : `Expected a valid JWT (3 parts separated by dots), got: ${received}`,
    };
  },

  /**
   * Check if response has error fields
   */
  toHaveErrorFields(received: any) {
    const pass =
      typeof received === 'object' &&
      'error_type' in received &&
      'error_code' in received &&
      'error_message' in received;

    return {
      pass,
      message: () =>
        pass
          ? `Expected response not to have error fields`
          : `Expected response to have error_type, error_code, and error_message fields`,
    };
  },
});

export {};
