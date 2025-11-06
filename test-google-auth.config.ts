/**
 * Test configuration for Google Auth plugin
 */

export default {
  features: {
    googleAuth: {
      enabled: true,
      clientId: process.env.GOOGLE_CLIENT_ID || 'test-client-id.apps.googleusercontent.com',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'test-client-secret',
      strategy: 'jwt',
      userModel: 'User'
    }
  }
}

