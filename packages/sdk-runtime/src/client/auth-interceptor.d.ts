/**
 * Authentication Interceptor - Adds tokens to requests
 */
export interface AuthConfig {
    token?: string | (() => string | Promise<string>);
    refreshToken?: string | (() => string | Promise<string>);
    onRefresh?: (newToken: string) => void | Promise<void>;
    header?: string;
    scheme?: string;
}
/**
 * Create authentication request interceptor
 */
export declare function createAuthInterceptor(authConfig: AuthConfig): (init: RequestInit) => Promise<RequestInit>;
/**
 * Create refresh token handler
 */
export declare function createRefreshHandler(authConfig: AuthConfig): (error: any) => Promise<boolean>;
