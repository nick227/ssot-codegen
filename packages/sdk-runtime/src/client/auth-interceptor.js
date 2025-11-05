/**
 * Authentication Interceptor - Adds tokens to requests
 */
/**
 * Create authentication request interceptor
 */
export function createAuthInterceptor(authConfig) {
    return async (init) => {
        let token;
        // Get token (call function if needed)
        if (typeof authConfig.token === 'function') {
            token = await authConfig.token();
        }
        else {
            token = authConfig.token;
        }
        // No token, return as-is
        if (!token)
            return init;
        // Add authorization header
        const header = authConfig.header || 'Authorization';
        const scheme = authConfig.scheme || 'Bearer';
        return {
            ...init,
            headers: {
                ...init.headers,
                [header]: `${scheme} ${token}`
            }
        };
    };
}
/**
 * Create refresh token handler
 */
export function createRefreshHandler(authConfig) {
    return async (error) => {
        // Only handle 401 errors
        if (!error || error.status !== 401)
            return false;
        // No refresh token configured
        if (!authConfig.refreshToken || !authConfig.onRefresh)
            return false;
        try {
            // Get refresh token
            let refreshToken;
            if (typeof authConfig.refreshToken === 'function') {
                refreshToken = await authConfig.refreshToken();
            }
            else {
                refreshToken = authConfig.refreshToken;
            }
            if (!refreshToken)
                return false;
            // Note: Refresh endpoint configuration is app-specific
            // Apps should implement their own refresh logic and call onRefresh
            // This is a placeholder for future enhancement
            return false;
        }
        catch {
            return false;
        }
    };
}
