/**
 * Base Model Client - Generic CRUD operations for models
 */
import { APIException } from '../types/api-error.js';
/**
 * Base client for model CRUD operations
 * All generated model clients extend this class
 */
export class BaseModelClient {
    client;
    basePath;
    constructor(client, basePath) {
        this.client = client;
        this.basePath = basePath;
    }
    /**
     * List records with pagination and filtering
     */
    async list(query, options) {
        const queryString = query ? this.buildQueryString(query) : '';
        const path = `${this.basePath}${queryString}`;
        const response = await this.client.get(path, {
            signal: options?.signal
        });
        return response.data;
    }
    /**
     * Get single record by ID
     */
    async get(id, options) {
        try {
            const response = await this.client.get(`${this.basePath}/${id}`, { signal: options?.signal });
            return response.data;
        }
        catch (error) {
            if (error instanceof APIException && error.status === 404) {
                return null;
            }
            throw error;
        }
    }
    /**
     * Create new record
     */
    async create(data, options) {
        const response = await this.client.post(this.basePath, data, { signal: options?.signal });
        return response.data;
    }
    /**
     * Update existing record
     */
    async update(id, data, options) {
        try {
            const response = await this.client.put(`${this.basePath}/${id}`, data, { signal: options?.signal });
            return response.data;
        }
        catch (error) {
            if (error instanceof APIException && error.status === 404) {
                return null;
            }
            throw error;
        }
    }
    /**
     * Delete record
     */
    async ['delete'](id, options) {
        try {
            await this.client['delete'](`${this.basePath}/${id}`, { signal: options?.signal });
            return true;
        }
        catch (error) {
            if (error instanceof APIException && error.status === 404) {
                return false;
            }
            throw error;
        }
    }
    /**
     * Count records
     */
    async count(options) {
        const response = await this.client.get(`${this.basePath}/meta/count`, { signal: options?.signal });
        return response.data.total;
    }
    /**
     * Build query string from QueryDTO
     */
    buildQueryString(query) {
        if (!query)
            return '';
        const params = new URLSearchParams();
        // Pagination
        if (query.skip !== undefined && query.skip !== null) {
            params.set('skip', query.skip.toString());
        }
        if (query.take !== undefined && query.take !== null) {
            params.set('take', query.take.toString());
        }
        // Sorting
        if (query.orderBy) {
            params.set('orderBy', query.orderBy);
        }
        // Filtering
        if (query.where) {
            this.addWhereParams(params, query.where);
        }
        const qs = params.toString();
        return qs ? `?${qs}` : '';
    }
    /**
     * Add where clause parameters to URLSearchParams
     */
    addWhereParams(params, where, prefix = 'where') {
        for (const [field, filter] of Object.entries(where)) {
            if (filter === undefined || filter === null)
                continue;
            if (typeof filter === 'object' && !Array.isArray(filter) && !(filter instanceof Date)) {
                // Nested filter object (e.g., { contains: 'hello', mode: 'insensitive' })
                for (const [op, value] of Object.entries(filter)) {
                    if (value !== undefined && value !== null) {
                        const key = `${prefix}[${field}][${op}]`;
                        params.set(key, String(value));
                    }
                }
            }
            else {
                // Direct value (e.g., published: true)
                const key = `${prefix}[${field}]`;
                params.set(key, String(filter));
            }
        }
    }
}
