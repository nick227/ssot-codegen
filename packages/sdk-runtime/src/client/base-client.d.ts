/**
 * Base API Client - HTTP client with retries, abort signals, and error handling
 */
import { type APIError, type APIResponse } from '../types/index.js';
export interface RequestConfig {
    signal?: AbortSignal;
    retries?: number;
    timeout?: number;
    headers?: Record<string, string>;
}
export interface BaseClientConfig {
    baseUrl: string;
    timeout?: number;
    retries?: number;
    headers?: Record<string, string>;
    onRequest?: (init: RequestInit) => Promise<RequestInit> | RequestInit;
    onResponse?: (response: Response) => Promise<Response> | Response;
    onError?: (error: APIError) => Promise<void> | void;
}
/**
 * Base API Client with automatic retries and error handling
 */
export declare class BaseAPIClient {
    private config;
    constructor(config: BaseClientConfig);
    /**
     * Make HTTP request with retries and error handling
     */
    request<T>(path: string, init?: RequestInit, config?: RequestConfig): Promise<APIResponse<T>>;
    /**
     * GET request
     */
    get<T>(path: string, config?: RequestConfig): Promise<APIResponse<T>>;
    /**
     * POST request
     */
    post<T>(path: string, body?: any, config?: RequestConfig): Promise<APIResponse<T>>;
    /**
     * PUT request
     */
    put<T>(path: string, body?: any, config?: RequestConfig): Promise<APIResponse<T>>;
    /**
     * PATCH request
     */
    patch<T>(path: string, body?: any, config?: RequestConfig): Promise<APIResponse<T>>;
    /**
     * DELETE request
     */
    ['delete']<T>(path: string, config?: RequestConfig): Promise<APIResponse<T>>;
}
