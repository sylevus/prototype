# Authentication & Navigation Test Instructions

## Testing Logout Across the Application

### **Header Navigation Behavior**
- **When NOT logged in**: "RPG Character Creator" logo → Login page (`/`)
- **When logged in**: "RPG Character Creator" logo → Character Selection page (`/home`)
- **Admin users**: Additional "🛡️ Admin" button → Admin panel (`/admin`)

### 1. **Header Logout Button** (Available on ALL pages when logged in)
- **Location**: Top-right corner of every page
- **Visibility**: Should appear whenever you're logged in
- **Function**: Clears JWT token and redirects to login page

### 2. **Main Page Logout** (If you navigate to `/` while logged in)
- **Shows**: "Welcome Back!" message with your email
- **Options**: 
  - "Continue to Home" button
  - "Logout" button (clears token, stays on login page)

### 3. **Admin Panel Access** (sylevus@gmail.com only)
- **Admin Button**: Appears in header next to logout when you have admin role
- **Access**: `/admin` route protected - redirects non-admins
- **Logout**: Standard logout functionality available

## What Logout Does:

1. **Clears JWT Token**: `localStorage.removeItem('token')`
2. **Clears User Data**: Removes any cached user/player data
3. **Updates UI**: Header immediately updates to show Login button
4. **Notifies Components**: Dispatches `tokenChanged` event
5. **Redirects**: Takes you back to login page (`/`)

## Token Management Features:

- **Auto-Expiration**: Header checks token validity every minute
- **Storage Events**: Listens for token changes across browser tabs
- **Real-time Updates**: Login state updates immediately across all components

## Test Scenarios:

### Scenario 1: Standard User Flow
1. Login with any Google account
2. Verify logout button appears in header
3. Navigate between pages - logout should always be visible
4. Click logout - should clear token and redirect to login

### Scenario 2: Admin User Flow  
1. Login with `sylevus@gmail.com`
2. Verify both "🛡️ Admin" and "Logout" buttons appear
3. Access admin panel
4. Logout from admin panel - should work normally

### Scenario 3: Already Logged In
1. With active session, navigate to `/` 
2. Should see "Welcome Back!" instead of login form
3. Can logout directly from this page or continue to home

### Scenario 4: Token Expiration
1. Wait for token to expire (or manually delete from localStorage)
2. Header should automatically update to show login state
3. Attempting to access protected routes should redirect to login

## Browser Storage Verification:

**Before Logout:**
- `localStorage.getItem('token')` should return JWT token

**After Logout:**  
- `localStorage.getItem('token')` should return `null`
- All auth-related localStorage items should be cleared

## Cross-Tab Behavior:
- Logging out in one tab should update all other tabs immediately
- Admin status should sync across tabs for eligible users