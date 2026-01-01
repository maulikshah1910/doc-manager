# Mock Data Directory

## Overview

This directory contains mock data for testing the frontend before the backend is ready.

**IMPORTANT**: This is temporary test data only. It will be removed once the backend API is implemented.

## Files

### credentials.csv

Contains dummy user credentials for testing the login functionality.

**Format**:
```csv
email,password
```

**Available Test Users**:

| Email | Password | Role | Use Case |
|-------|----------|------|----------|
| admin@example.com | Admin123 | Admin | Full permissions (wildcard *) |
| manager@example.com | Manager123 | Manager | Document management + user view |
| employee@example.com | Employee123 | Employee | Document view + upload |
| john.doe@example.com | John1234 | Employee | Document view + upload |
| jane.smith@example.com | Jane5678 | Employee | Document view + upload |
| test@example.com | Test1234 | Employee | Document view only |

## Usage

### Enable Mock Authentication

1. Copy `.env.sample` to `.env.local`:
   ```bash
   cp .env.sample .env.local
   ```

2. Set the mock auth flag in `.env.local`:
   ```
   NEXT_PUBLIC_USE_MOCK_AUTH=true
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Login with any credentials from the table above

### Disable Mock Authentication (Use Real Backend)

Set the flag to `false` in `.env.local`:
```
NEXT_PUBLIC_USE_MOCK_AUTH=false
```

The app will now attempt to connect to the real backend API at `NEXT_PUBLIC_API_URL`.

## How Mock Auth Works

### 1. Mock Service (`lib/mock-auth.ts`)

The mock service simulates API behavior:
- 1 second delay (simulates network latency)
- Email/password validation
- Mock JWT token generation
- User data with roles and permissions

### 2. Auth Module (`lib/auth.ts`)

The auth module checks the `NEXT_PUBLIC_USE_MOCK_AUTH` environment variable:
- If `true`: Uses `mockLogin()` from `lib/mock-auth.ts`
- If `false`: Uses real API via `apiClient.post('/api/v1/auth/login')`

### 3. Seamless Switching

The same `login()` and `logout()` functions work in both modes. No code changes needed when switching between mock and real backend.

## Mock User Permissions

Each mock user has different permissions for testing role-based UI:

### Admin
- Permissions: `['*']` (wildcard - all permissions)
- Can do: Everything

### Manager
- Permissions: `['document.*', 'user.view', 'log.view']`
- Can do: Full document management, view users, view logs

### Employee
- Permissions: `['document.view', 'document.upload']`
- Can do: View and upload documents

### Test User (Limited)
- Permissions: `['document.view']`
- Can do: View documents only (no upload)

## Testing Scenarios

### Test Successful Login
1. Use: `admin@example.com` / `Admin123`
2. Should redirect to `/dashboard`
3. Check console for: `🔧 Using MOCK authentication`

### Test Failed Login
1. Use: `wrong@example.com` / `wrongpass`
2. Should show error: "Invalid email or password"
3. Should stay on login page

### Test Different Roles
1. Login with different users
2. Check permissions in dashboard (future feature)
3. Verify role-based UI visibility

### Test Logout
1. Login with any user
2. Click logout button on dashboard
3. Should redirect to login page
4. Token should be cleared (check console)

## Adding More Test Users

Edit `credentials.csv`:
```csv
email,password
newemail@example.com,NewPass123
```

Then update `lib/mock-auth.ts` MOCK_USERS array:
```typescript
{
  email: 'newemail@example.com',
  password: 'NewPass123',
  roles: ['employee'],
  permissions: ['document.view']
}
```

## Security Notes

⚠️ **WARNING**: This is NOT secure!

- Passwords are stored in plain text
- No encryption or hashing
- Client-side validation only
- No session management

This is ONLY for development testing before the backend is ready.

## Removal Plan

Once backend is ready:
1. Set `NEXT_PUBLIC_USE_MOCK_AUTH=false`
2. Delete `data/` directory
3. Delete `lib/mock-auth.ts`
4. Remove mock logic from `lib/auth.ts`

## Related Files

- `lib/mock-auth.ts` - Mock authentication service
- `lib/auth.ts` - Auth module with mock/real switching
- `.env.local` - Environment configuration
- `.env.sample` - Environment template
