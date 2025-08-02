// Simple test to verify JWT decoding works
// Run this in browser console after logging in

console.log('Testing JWT Admin Role Detection...');

// Mock JWT token with admin role (for testing)
const mockAdminToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwicGxheWVySWQiOiIxIiwiZW1haWwiOiJzeWxldnVzQGdtYWlsLmNvbSIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkFkbWluaXN0cmF0b3IiLCJqdGkiOiJ0ZXN0LWlkIiwiZXhwIjo5OTk5OTk5OTk5LCJpc3MiOiJ0ZXN0LWlzc3VlciIsImF1ZCI6InRlc3QtYXVkaWVuY2UifQ.test';

// Mock regular user token (no admin role)
const mockUserToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyIiwicGxheWVySWQiOiIyIiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIiwianRpIjoidGVzdC1pZCIsImV4cCI6OTk5OTk5OTk5OSwiaXNzIjoidGVzdC1pc3N1ZXIiLCJhdWQiOiJ0ZXN0LWF1ZGllbmNlIn0.test';

console.log('Admin token should return true for hasAdministratorRole:');
console.log('User token should return false for hasAdministratorRole:');

// Instructions for testing:
console.log(`
To test the admin panel:

1. Log in to the application with sylevus@gmail.com
2. Check that an "🛡️ Admin" button appears in the header next to Logout
3. Click the Admin button to access the administrator panel
4. The panel should show your email and admin controls
5. Try the "Test Admin API" button to verify backend communication

If you don't see the Admin button:
- Check browser console for JWT decoding errors
- Verify the JWT token in localStorage contains the Administrator role
- Make sure you're logged in with sylevus@gmail.com exactly
`);

// Helper function to decode JWT in browser
function decodeJWT(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

// Test current token in localStorage
const currentToken = localStorage.getItem('token');
if (currentToken) {
  console.log('Current token payload:', decodeJWT(currentToken));
} else {
  console.log('No token found in localStorage');
}