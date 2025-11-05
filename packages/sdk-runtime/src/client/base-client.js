/**
 * Base API Client - HTTP client with retries, abort signals, and error handling
 */
import { APIException } from '../types/index.js';
/**
 * Base API Client with automatic retries and error handling
 */
export class BaseAPIClient {
    config;
    constructor(config) {
        this.config = config;
    }
    /**
     * Make HTTP request with retries and error handling
     */
    async request(path, init = {}, config = {}) {
        let attempt = 0;
        const maxRetries = config.retries ?? this.config.retries ?? 3;
        let lastError;
        while (attempt <= maxRetries) {
            try {
                // Apply request interceptor
                let finalInit = { ...init };
                // Merge headers
                finalInit.headers = {
                    ...this.config.headers,
                    ...init.headers,
                    ...config.headers
                };
                if (this.config.onRequest) {
                    finalInit = await this.config.onRequest(finalInit);
                }
                // Add abort signal
                if (config.signal) {
                    finalInit.signal = config.signal;
                }
                // Add timeout (if no signal already set)
                if (!finalInit.signal) {
                    const timeoutMs = config.timeout ?? this.config.timeout ?? 30000;
                    finalInit.signal = AbortSignal.timeout(timeoutMs);
                }
                // Make request
                const res = await fetch(this.config.baseUrl + path, finalInit);
                // Apply response interceptor
                const finalRes = this.config.onResponse
                    ? await this.config.onResponse(res)
                    : res;
                // Handle HTTP errors
                if (!finalRes.ok) {
                    const errorData = await finalRes.json().catch(() => ({
                        error: 'Request Failed',
                        message: finalRes.statusText
                    }));
                    const apiError = {
                        error: errorData.error || 'Request Failed',
                        message: errorData.message || finalRes.statusText,
                        details: errorData.details,
                        status: finalRes.status
                    };
                    // Call error handler
                    if (this.config.onError) {
                        await this.config.onError(apiError);
                    }
                    throw new APIException(apiError);
                }
                // Parse response
                const contentType = finalRes.headers.get('content-type') || '';
                let data;
                if (contentType.includes('application/json')) {
                    data = await finalRes.json();
                }
                else if (finalRes.status === 204) {
                    data = null;
                }
                else {
                    data = (await finalRes.text());
                }
                return {
                    data,
                    status: finalRes.status,
                    headers: finalRes.headers
                };
            }
            catch (error) {
                lastError = error;
                attempt++;
                // Don't retry on abort
                if (error instanceof DOMException && error.name === 'AbortError') {
                    throw error;
                }
                // Don't retry client errors (4xx)
                if (error instanceof APIException) {
                    if (error.status >= 400 && error.status < 500) {
                        throw error;
                    }
                }
                // Retry server errors (5xx) and network errors
                if (attempt > maxRetries) {
                    throw error;
                }
                // Exponential backoff: 100ms, 200ms, 400ms, etc.
                const backoffMs = Math.pow(2, attempt - 1) * 100;
                await new Promise(r => setTimeout(r, backoffMs));
            }
        }
        throw lastError;
    }
    /**
     * GET request
     */
    async get(path, config) {
        return this.request(path, { method: 'GET' }, config);
    }
    /**
     * POST request
     */
    async post(path, body, config) {
        return this.request(path, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : undefined
        }, config);
    }
    /**
     * PUT request
     */
    async put(path, body, config) {
        return this.request(path, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : undefined
        }, config);
    }
    /**
     * PATCH request
     */
    async patch(path, body, config) {
        return this.request(path, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : undefined
        }, config);
    }
    /**
     * DELETE request
     */
    async ['delete'](path, config) {
        return this.request(path, { method: 'DELETE' }, config);
    }
}
