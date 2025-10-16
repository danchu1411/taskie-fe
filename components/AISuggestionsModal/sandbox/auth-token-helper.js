// Token Injection Helper for AI Suggestions Modal
// Usage: Run this in browser console after login

// Method 1: Manual token injection
function injectAuthToken(jwtToken) {
  // Import authServiceManager (assuming it's available globally)
  if (typeof authServiceManager !== 'undefined') {
    authServiceManager.setToken({
      accessToken: jwtToken,
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      tokenType: 'Bearer'
    });
    console.log('✅ Token injected successfully');
  } else {
    console.error('❌ authServiceManager not found. Make sure AI Suggestions Modal is loaded.');
  }
}

// Method 2: Auto-sync from existing auth
async function syncExistingAuth() {
  if (typeof authServiceManager !== 'undefined') {
    const success = await authServiceManager.syncFromExistingAuth();
    if (success) {
      console.log('✅ Successfully synced existing auth token');
    } else {
      console.log('ℹ️ No existing auth token found to sync');
    }
  } else {
    console.error('❌ authServiceManager not found. Make sure AI Suggestions Modal is loaded.');
  }
}

// Method 3: Get token from localStorage/sessionStorage
function getStoredToken() {
  const tokenKeys = ['auth_token', 'access_token', 'token', 'jwt_token'];
  
  for (const key of tokenKeys) {
    const token = localStorage.getItem(key) || sessionStorage.getItem(key);
    if (token) {
      console.log(`Found token in ${key}:`, token.substring(0, 50) + '...');
      return token;
    }
  }
  
  console.log('No token found in storage');
  return null;
}

// Usage examples:
console.log(`
🔧 AI Suggestions Auth Token Helper

Available functions:
1. injectAuthToken('<YOUR_JWT_TOKEN>') - Manually inject token
2. syncExistingAuth() - Auto-sync from existing auth
3. getStoredToken() - Find token in storage

Example usage:
injectAuthToken('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');
`);

// Export functions to global scope
window.injectAuthToken = injectAuthToken;
window.syncExistingAuth = syncExistingAuth;
window.getStoredToken = getStoredToken;



