# Frontend Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy the sample environment file:

```bash
cp .env.sample .env.local
```

The `.env.local` file should contain:

```env
# Backend API URL (not used in mock mode)
NEXT_PUBLIC_API_URL=http://localhost:3001

# Mock Authentication (set to 'true' until backend is ready)
NEXT_PUBLIC_USE_MOCK_AUTH=true

# Environment
NODE_ENV=development
```

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Testing Login (Mock Mode)

### Available Test Credentials

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | Admin123 | Admin |
| manager@example.com | Manager123 | Manager |
| employee@example.com | Employee123 | Employee |
| test@example.com | Test1234 | Employee (view only) |

### Login Flow

1. Navigate to [http://localhost:3000](http://localhost:3000)
2. You'll see the login screen
3. Enter any credentials from the table above
4. Click "Sign in"
5. After 1 second (simulated delay), you'll be redirected to `/dashboard`
6. Click "Logout" to return to login screen

### Verify Mock Mode

Check the browser console after login. You should see:
```
🔧 Using MOCK authentication (backend not available)
```

---

## Switching to Real Backend

Once the backend is ready:

### 1. Update Environment

Edit `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_USE_MOCK_AUTH=false  # Change to false
```

### 2. Restart Dev Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

The app will now use the real backend API at `http://localhost:3001/api/v1/auth/login`.

---

## Directory Structure

```
apps/frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Login page (main screen)
│   └── dashboard/
│       └── page.tsx       # Dashboard (protected)
│
├── components/            # Reusable components
│   ├── ui/               # Basic UI components
│   │   ├── input.tsx     # Input field
│   │   ├── button.tsx    # Button
│   │   ├── card.tsx      # Card container
│   │   ├── alert.tsx     # Alert messages
│   │   └── index.ts      # Exports
│   ├── auth/
│   │   └── login-form.tsx  # Login form
│   └── layout/
│       └── auth-layout.tsx # Auth page layout
│
├── lib/                   # Utilities
│   ├── api-client.ts     # Axios instance
│   ├── auth.ts           # Auth functions (with mock support)
│   ├── mock-auth.ts      # Mock authentication
│   └── types.ts          # TypeScript types
│
├── data/                  # Mock data (temporary)
│   ├── credentials.csv   # Test credentials
│   └── README.md         # Mock data guide
│
├── public/               # Static assets
│
├── .env.local           # Local environment (gitignored)
├── .env.sample          # Environment template
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript config
├── tailwind.config.ts   # Tailwind CSS
└── next.config.ts       # Next.js config
```

---

## Available Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Start production server
npm run start

# Linting
npm run lint

# Type checking
npm run type-check
```

---

## Component Usage Examples

### Using UI Components

```tsx
import { Input, Button, Card, Alert } from '@/components/ui';

<Card padding="md">
  <Input
    label="Email"
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
    error={errors.email}
    required
  />

  <Button
    variant="primary"
    size="lg"
    isLoading={isSubmitting}
    onClick={handleSubmit}
  >
    Submit
  </Button>

  {error && (
    <Alert variant="error" onClose={() => setError('')}>
      {error}
    </Alert>
  )}
</Card>
```

### Using Authentication

```tsx
import { login, logout, isAuthenticated } from '@/lib/auth';

// Login
const handleLogin = async () => {
  try {
    const user = await login({
      email: 'admin@example.com',
      password: 'Admin123'
    });
    console.log('Logged in:', user);
  } catch (error) {
    console.error('Login failed:', error.message);
  }
};

// Logout
const handleLogout = async () => {
  await logout();
};

// Check auth
if (isAuthenticated()) {
  // User is logged in
}
```

---

## Troubleshooting

### Issue: Login not working

**Solution**: Check console for errors. Verify:
- `.env.local` file exists
- `NEXT_PUBLIC_USE_MOCK_AUTH=true` is set
- Using correct credentials from `data/credentials.csv`

### Issue: "Invalid email or password"

**Solution**: Make sure you're using exact credentials:
- Email: `admin@example.com` (lowercase)
- Password: `Admin123` (case-sensitive)

### Issue: Page not loading

**Solution**:
- Check if dev server is running: `npm run dev`
- Check port (default: 3000, may use 3001 if 3000 is busy)
- Clear browser cache and reload

### Issue: TypeScript errors

**Solution**:
```bash
npm run type-check
```

Fix any type errors before running `npm run dev`.

---

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3001` | Yes |
| `NEXT_PUBLIC_USE_MOCK_AUTH` | Use mock auth (true/false) | `true` | Yes |
| `NODE_ENV` | Environment | `development` | No |

---

## Mock vs Real Authentication

| Feature | Mock Mode | Real Backend |
|---------|-----------|--------------|
| Authentication | Local validation | API call to backend |
| Token | Mock string | Real JWT |
| Session | In-memory only | Backend session tracking |
| Validation | Client-side only | Server-side |
| Security | ⚠️ None (dev only) | ✅ Full security |

---

## Next Steps

1. ✅ Login screen is ready
2. ✅ Mock authentication working
3. ⏳ Waiting for backend API
4. ⏳ Dashboard implementation
5. ⏳ Document management features

---

## Documentation

- [Component Library Catalog](./COMPONENTS.md)
- [Component Usage Guide](./components/README.md)
- [Mock Data Guide](./data/README.md)
- [Project README](./README.md)
- [Root Constraints](/CONSTRAINTS.md)
- [Implementation Decisions](/DECISIONS.md)

---

## Support

For issues or questions:
1. Check [COMPONENTS.md](./COMPONENTS.md) for component usage
2. Check [data/README.md](./data/README.md) for mock auth setup
3. Verify environment variables in `.env.local`
4. Check browser console for error messages
