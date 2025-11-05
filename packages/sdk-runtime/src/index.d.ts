/**
 * SDK Runtime - Type-safe client SDK for generated APIs
 *
 * Provides base classes and utilities for generated SDK clients.
 */
export * from './client/index.js';
export * from './models/index.js';
export * from './types/index.js';
export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
export interface ClientConfig {
    baseUrl?: string;
    headers?: Record<string, string>;
}
