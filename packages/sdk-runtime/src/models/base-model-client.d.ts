/**
 * Base Model Client - Generic CRUD operations for models
 */
import type { BaseAPIClient } from '../client/base-client.js';
import type { ListResponse } from '../types/api-response.js';
export interface QueryOptions {
    signal?: AbortSignal;
}
/**
 * Base client for model CRUD operations
 * All generated model clients extend this class
 */
export declare abstract class BaseModelClient<ReadDTO, CreateDTO, UpdateDTO, QueryDTO> {
    protected client: BaseAPIClient;
    protected basePath: string;
    constructor(client: BaseAPIClient, basePath: string);
    /**
     * List records with pagination and filtering
     */
    list(query?: QueryDTO, options?: QueryOptions): Promise<ListResponse<ReadDTO>>;
    /**
     * Get single record by ID
     */
    get(id: number | string, options?: QueryOptions): Promise<ReadDTO | null>;
    /**
     * Create new record
     */
    create(data: CreateDTO, options?: QueryOptions): Promise<ReadDTO>;
    /**
     * Update existing record
     */
    update(id: number | string, data: UpdateDTO, options?: QueryOptions): Promise<ReadDTO | null>;
    /**
     * Delete record
     */
    ['delete'](id: number | string, options?: QueryOptions): Promise<boolean>;
    /**
     * Count records
     */
    count(options?: QueryOptions): Promise<number>;
    /**
     * Build query string from QueryDTO
     */
    protected buildQueryString(query: any): string;
    /**
     * Add where clause parameters to URLSearchParams
     */
    private addWhereParams;
}
