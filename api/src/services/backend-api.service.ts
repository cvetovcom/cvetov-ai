/**
 * Backend API Service
 * Base HTTP client for interacting with Cvetov.ru Backend API
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios'
import type { APIErrorResponse, HTTPStatus } from '../types/index.js'

export class BackendAPIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errorResponse?: APIErrorResponse
  ) {
    super(message)
    this.name = 'BackendAPIError'
  }
}

export class BackendAPIService {
  private client: AxiosInstance

  constructor(
    private baseURL: string = process.env.BACKEND_API_URL || 'https://site.demo.cvetov24.ru/api'
  ) {
    console.log('[BackendAPIService] Using API URL:', this.baseURL)
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    })

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<APIErrorResponse>) => {
        if (error.response) {
          // Server responded with error
          const errorData = error.response.data
          throw new BackendAPIError(
            errorData?.message || error.message,
            error.response.status,
            errorData
          )
        } else if (error.request) {
          // Request made but no response
          throw new BackendAPIError(
            'No response from backend server',
            0
          )
        } else {
          // Request setup error
          throw new BackendAPIError(
            error.message,
            0
          )
        }
      }
    )
  }

  /**
   * Make authenticated GET request
   */
  async get<T>(
    endpoint: string,
    jwt: string,
    params?: Record<string, unknown>
  ): Promise<T> {
    const config: AxiosRequestConfig = {
      params,
      headers: {
        'Authorization': `Bearer ${jwt}`,
      },
    }

    const response = await this.client.get<T>(endpoint, config)
    return response.data
  }

  /**
   * Make authenticated POST request
   */
  async post<T, D = unknown>(
    endpoint: string,
    jwt: string,
    data?: D,
    params?: Record<string, unknown>
  ): Promise<T> {
    const config: AxiosRequestConfig = {
      params,
      headers: {
        'Authorization': `Bearer ${jwt}`,
      },
    }

    const response = await this.client.post<T>(endpoint, data, config)
    return response.data
  }

  /**
   * Make authenticated PATCH request
   */
  async patch<T, D = unknown>(
    endpoint: string,
    jwt: string,
    data: D,
    params?: Record<string, unknown>
  ): Promise<T> {
    const config: AxiosRequestConfig = {
      params,
      headers: {
        'Authorization': `Bearer ${jwt}`,
      },
    }

    const response = await this.client.patch<T>(endpoint, data, config)
    return response.data
  }

  /**
   * Make authenticated DELETE request
   */
  async delete<T>(
    endpoint: string,
    jwt: string,
    params?: Record<string, unknown>
  ): Promise<T> {
    const config: AxiosRequestConfig = {
      params,
      headers: {
        'Authorization': `Bearer ${jwt}`,
      },
    }

    const response = await this.client.delete<T>(endpoint, config)
    return response.data
  }

  /**
   * Make public GET request (no authentication)
   */
  async getPublic<T>(
    endpoint: string,
    params?: Record<string, unknown>
  ): Promise<T> {
    const response = await this.client.get<T>(endpoint, { params })
    return response.data
  }

  /**
   * Check if error is 401 Unauthorized
   */
  static isUnauthorizedError(error: unknown): boolean {
    return error instanceof BackendAPIError && error.statusCode === 401
  }

  /**
   * Check if error is 403 Forbidden
   */
  static isForbiddenError(error: unknown): boolean {
    return error instanceof BackendAPIError && error.statusCode === 403
  }

  /**
   * Check if error is 404 Not Found
   */
  static isNotFoundError(error: unknown): boolean {
    return error instanceof BackendAPIError && error.statusCode === 404
  }

  /**
   * Check if error is 409 Conflict
   */
  static isConflictError(error: unknown): boolean {
    return error instanceof BackendAPIError && error.statusCode === 409
  }

  /**
   * Check if error is 429 Rate Limit Exceeded
   */
  static isRateLimitError(error: unknown): boolean {
    return error instanceof BackendAPIError && error.statusCode === 429
  }
}

// Singleton instance
export const backendAPI = new BackendAPIService()
