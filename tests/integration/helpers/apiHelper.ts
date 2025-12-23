import request, { Response } from 'supertest';
import { Application } from 'express';

/**
 * API Helper for Integration Tests
 * Provides HTTP request wrappers for testing API endpoints
 */
export class ApiHelper {
  private app: Application;
  private baseUrl: string;

  constructor(app: Application, baseUrl: string = '/api/admin') {
    this.app = app;
    this.baseUrl = baseUrl;
  }

  /**
   * POST request with optional authentication
   */
  async post(
    endpoint: string,
    data: any = {},
    token?: string
  ): Promise<Response> {
    const req = request(this.app).post(`${this.baseUrl}${endpoint}`).send(data);

    if (token) {
      req.set('Authorization', `Bearer ${token}`);
    }

    return req;
  }

  /**
   * GET request with optional authentication
   */
  async get(endpoint: string, token?: string, query?: any): Promise<Response> {
    const req = request(this.app).get(`${this.baseUrl}${endpoint}`);

    if (token) {
      req.set('Authorization', `Bearer ${token}`);
    }

    if (query) {
      req.query(query);
    }

    return req;
  }

  /**
   * PUT request with optional authentication
   */
  async put(
    endpoint: string,
    data: any = {},
    token?: string
  ): Promise<Response> {
    const req = request(this.app).put(`${this.baseUrl}${endpoint}`).send(data);

    if (token) {
      req.set('Authorization', `Bearer ${token}`);
    }

    return req;
  }

  /**
   * DELETE request with optional authentication
   */
  async delete(endpoint: string, token?: string): Promise<Response> {
    const req = request(this.app).delete(`${this.baseUrl}${endpoint}`);

    if (token) {
      req.set('Authorization', `Bearer ${token}`);
    }

    return req;
  }

  /**
   * PATCH request with optional authentication
   */
  async patch(
    endpoint: string,
    data: any = {},
    token?: string
  ): Promise<Response> {
    const req = request(this.app).patch(`${this.baseUrl}${endpoint}`).send(data);

    if (token) {
      req.set('Authorization', `Bearer ${token}`);
    }

    return req;
  }

  // ============================================
  // Auth-specific helper methods
  // ============================================

  /**
   * Login and return response
   */
  async login(username: string, password: string): Promise<Response> {
    return this.post('/auth/login', { username, password });
  }

  /**
   * Logout with token
   */
  async logout(token: string): Promise<Response> {
    return this.post('/auth/logout', {}, token);
  }

  /**
   * Refresh token
   */
  async refreshToken(refreshToken: string): Promise<Response> {
    return this.post('/auth/refresh', { refreshToken });
  }

  /**
   * Verify session
   */
  async verifySession(token: string): Promise<Response> {
    return this.get('/auth/me', token);
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<Response> {
    return this.post('/auth/forgot-password', { email });
  }

  /**
   * Confirm password reset
   */
  async confirmPasswordReset(
    token: string,
    newPassword: string
  ): Promise<Response> {
    return this.post('/auth/reset-password', { token, newPassword });
  }

  /**
   * Login and extract access token
   */
  async loginAndGetToken(
    username: string,
    password: string
  ): Promise<string | null> {
    const response = await this.login(username, password);
    return response.body?.data?.accessToken || null;
  }

  /**
   * Login and extract both tokens
   */
  async loginAndGetTokens(
    username: string,
    password: string
  ): Promise<{ accessToken: string | null; refreshToken: string | null }> {
    const response = await this.login(username, password);
    return {
      accessToken: response.body?.data?.accessToken || null,
      refreshToken: response.body?.data?.refreshToken || null,
    };
  }

  /**
   * Create authenticated request context
   * Useful for chaining multiple authenticated requests
   */
  async createAuthContext(username: string, password: string) {
    const tokens = await this.loginAndGetTokens(username, password);
    
    if (!tokens.accessToken) {
      throw new Error('Failed to authenticate user');
    }

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      get: (endpoint: string, query?: any) => 
        this.get(endpoint, tokens.accessToken!, query),
      post: (endpoint: string, data: any) => 
        this.post(endpoint, data, tokens.accessToken!),
      put: (endpoint: string, data: any) => 
        this.put(endpoint, data, tokens.accessToken!),
      delete: (endpoint: string) => 
        this.delete(endpoint, tokens.accessToken!),
      patch: (endpoint: string, data: any) => 
        this.patch(endpoint, data, tokens.accessToken!)
    };
  }
}

// Singleton-like pattern for test server
let apiHelperInstance: ApiHelper | null = null;

export function createApiHelper(app: Application): ApiHelper {
  if (!apiHelperInstance) {
    apiHelperInstance = new ApiHelper(app);
  }
  return apiHelperInstance;
}

export function getApiHelper(): ApiHelper {
  if (!apiHelperInstance) {
    throw new Error('ApiHelper not initialized. Call createApiHelper first.');
  }
  return apiHelperInstance;
}
