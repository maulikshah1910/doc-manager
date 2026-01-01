# Component Library Catalog

## Overview

This document catalogs all reusable components in the frontend application. Components are organized by category and designed for maximum reusability.

## Architecture

The component library follows **Atomic Design** principles:

- **Atoms**: Basic building blocks (Input, Button, Alert)
- **Molecules**: Combinations of atoms (LoginForm)
- **Organisms**: Complex UI sections (AuthLayout)
- **Templates**: Page layouts (future)
- **Pages**: Complete pages (app/page.tsx, app/dashboard/page.tsx)

---

## UI Components (Atoms)

### Input

**File**: `components/ui/input.tsx`

A fully-featured text input component with label, validation, and accessibility support.

**Props**:
```typescript
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;        // Input label
  error?: string;        // Error message to display
  helperText?: string;   // Helper text below input
}
```

**Usage**:
```tsx
<Input
  label="Email Address"
  type="email"
  placeholder="you@example.com"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={errors.email}
  required
/>
```

**Features**:
- ✅ Label with required indicator
- ✅ Error state styling
- ✅ Helper text support
- ✅ Accessibility (ARIA attributes)
- ✅ Disabled state
- ✅ Auto-generated IDs

**Variants**: N/A (single style)

---

### Button

**File**: `components/ui/button.tsx`

A versatile button component with multiple variants, sizes, and loading states.

**Props**:
```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
}
```

**Usage**:
```tsx
<Button
  variant="primary"
  size="lg"
  isLoading={isSubmitting}
  fullWidth
  onClick={handleSubmit}
>
  Sign in
</Button>
```

**Features**:
- ✅ 5 variants (primary, secondary, outline, ghost, danger)
- ✅ 3 sizes (sm, md, lg)
- ✅ Loading spinner
- ✅ Full width option
- ✅ Disabled state
- ✅ Focus ring for accessibility

**Variants**:

| Variant | Use Case | Example |
|---------|----------|---------|
| `primary` | Main actions | Submit, Save, Login |
| `secondary` | Secondary actions | Cancel alternative |
| `outline` | Tertiary actions | Edit, View |
| `ghost` | Minimal emphasis | Close, Dismiss |
| `danger` | Destructive actions | Delete, Remove |

**Sizes**:

| Size | Padding | Text Size | Use Case |
|------|---------|-----------|----------|
| `sm` | px-3 py-1.5 | text-sm | Compact UI, tables |
| `md` | px-4 py-2 | text-base | Default |
| `lg` | px-6 py-3 | text-lg | Hero sections, CTAs |

---

### Card

**File**: `components/ui/card.tsx`

A container component for grouping related content with optional header, content, and footer sections.

**Props**:
```typescript
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}
```

**Sub-components**:
- `CardHeader`: Header section
- `CardTitle`: Title text
- `CardDescription`: Subtitle/description
- `CardContent`: Main content area
- `CardFooter`: Footer section

**Usage**:
```tsx
<Card padding="md">
  <CardHeader>
    <CardTitle>Login</CardTitle>
    <CardDescription>Sign in to your account</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Form fields */}
  </CardContent>
  <CardFooter>
    {/* Actions */}
  </CardFooter>
</Card>
```

**Features**:
- ✅ Flexible composition
- ✅ Configurable padding
- ✅ Shadow and border styling
- ✅ Semantic structure

---

### Alert

**File**: `components/ui/alert.tsx`

An alert component for displaying messages with different severity levels.

**Props**:
```typescript
interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
}
```

**Usage**:
```tsx
<Alert
  variant="error"
  title="Login Failed"
  onClose={() => setError('')}
>
  Invalid email or password. Please try again.
</Alert>
```

**Features**:
- ✅ 4 variants (info, success, warning, error)
- ✅ Optional title
- ✅ Dismissible with close button
- ✅ Contextual icons
- ✅ ARIA role="alert"

**Variants**:

| Variant | Color | Icon | Use Case |
|---------|-------|------|----------|
| `info` | Blue | ℹ️ | General information |
| `success` | Green | ✓ | Success messages |
| `warning` | Yellow | ⚠️ | Warnings |
| `error` | Red | ✕ | Errors, validation |

---

## Authentication Components (Molecules)

### LoginForm

**File**: `components/auth/login-form.tsx`

A complete login form with email, password, validation, and error handling.

**Props**:
```typescript
interface LoginFormProps {
  onSubmit: (credentials: { email: string; password: string }) => Promise<void>;
}
```

**Usage**:
```tsx
<LoginForm
  onSubmit={async ({ email, password }) => {
    await login({ email, password });
  }}
/>
```

**Features**:
- ✅ Email validation (format check)
- ✅ Password validation (min 8 characters)
- ✅ Field-level error display
- ✅ Form-level error display (Alert)
- ✅ Loading state during submission
- ✅ Remember me checkbox
- ✅ Forgot password link
- ✅ Keyboard navigation (Tab, Enter)

**Validation Rules**:
- Email: Required, valid email format
- Password: Required, minimum 8 characters

**States**:
1. **Idle**: Initial state, ready for input
2. **Validating**: Client-side validation in progress
3. **Submitting**: API request in progress (loading spinner)
4. **Error**: Validation or API error (red border, error message)
5. **Success**: Redirect to dashboard

---

## Layout Components (Organisms)

### AuthLayout

**File**: `components/layout/auth-layout.tsx`

A centered layout for authentication pages (login, register, etc.) with logo, title, and gradient background.

**Props**:
```typescript
interface AuthLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}
```

**Usage**:
```tsx
<AuthLayout
  title="Document Manager"
  subtitle="Sign in to access your documents"
>
  <LoginForm onSubmit={handleLogin} />
</AuthLayout>
```

**Features**:
- ✅ Centered card layout
- ✅ Gradient background (blue to gray)
- ✅ Logo/icon display
- ✅ Configurable title and subtitle
- ✅ Responsive design (mobile-friendly)
- ✅ Footer text

**Layout Structure**:
```
┌─────────────────────────────────┐
│     Gradient Background         │
│  ┌───────────────────────────┐  │
│  │         Logo              │  │
│  │         Title             │  │
│  │        Subtitle           │  │
│  │  ┌─────────────────────┐  │  │
│  │  │                     │  │  │
│  │  │      Content        │  │  │
│  │  │     (children)      │  │  │
│  │  │                     │  │  │
│  │  └─────────────────────┘  │  │
│  │        Footer             │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

---

## Utility Modules

### API Client

**File**: `lib/api-client.ts`

Axios instance with automatic token management and refresh logic.

**Exports**:
- `apiClient`: Configured Axios instance
- `setAccessToken(token)`: Store access token in memory
- `getAccessToken()`: Retrieve access token

**Features**:
- ✅ Automatic Authorization header injection
- ✅ Token refresh on 401 errors
- ✅ Request retry after refresh
- ✅ httpOnly cookie support for refresh token
- ✅ Automatic redirect to login on auth failure

**Usage**:
```typescript
import apiClient from '@/lib/api-client';

// GET request
const response = await apiClient.get('/api/v1/documents');

// POST request
const response = await apiClient.post('/api/v1/auth/login', {
  email: 'user@example.com',
  password: 'password123'
});

// Authentication is handled automatically
```

**Interceptor Flow**:
```
Request → Add Authorization header → API
Response ← Success → Return data
Response ← 401 → Refresh token → Retry request
Refresh Success → Return data
Refresh Failure → Redirect to login
```

---

### Auth Module

**File**: `lib/auth.ts`

Authentication utilities for login, logout, and session management.

**Exports**:
- `login(credentials)`: Login user and store token
- `logout()`: Logout user and clear token
- `isAuthenticated()`: Check if user has valid token
- `getCurrentUser()`: Get current user data (future)

**Usage**:
```typescript
import { login, logout, isAuthenticated } from '@/lib/auth';

// Login
try {
  const user = await login({
    email: 'user@example.com',
    password: 'password123'
  });
  console.log('Logged in:', user);
} catch (error) {
  console.error('Login failed:', error.message);
}

// Logout
await logout();

// Check authentication
if (isAuthenticated()) {
  // User is logged in
}
```

---

### Types Module

**File**: `lib/types.ts`

Shared TypeScript types for the frontend application.

**Key Types**:

```typescript
// User
interface User {
  id: string;
  email: string;
  roles: string[];
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

// Document
interface Document {
  id: string;
  title: string;
  currentVersion: number;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

// API Response
interface ApiResponse<T> {
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// API Error
interface ApiError {
  statusCode: number;
  message: string;
  errors?: string[];
}
```

---

## Pages

### Login Page

**File**: `app/page.tsx`

Main entry point - displays login screen.

**Features**:
- Uses `AuthLayout` for consistent styling
- Uses `LoginForm` for authentication
- Redirects to `/dashboard` on success
- Client component (uses React hooks)

---

### Dashboard Page

**File**: `app/dashboard/page.tsx`

Protected dashboard page - requires authentication.

**Features**:
- Authentication check on mount
- Redirect to login if not authenticated
- Header with logout button
- Placeholder content area

---

## Component Design Patterns

### 1. Composition Pattern

Build complex UIs from simple components:

```tsx
<AuthLayout title="Login">
  <Card padding="lg">
    <CardHeader>
      <CardTitle>Welcome Back</CardTitle>
    </CardHeader>
    <CardContent>
      <LoginForm onSubmit={handleLogin} />
    </CardContent>
  </Card>
</AuthLayout>
```

### 2. Controlled Components

All form inputs are controlled:

```tsx
const [email, setEmail] = useState('');

<Input
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>
```

### 3. Render Props / Callbacks

Pass functions to handle events:

```tsx
<LoginForm
  onSubmit={async (credentials) => {
    await login(credentials);
  }}
/>
```

### 4. TypeScript Generics

Type-safe API responses:

```tsx
const response = await apiClient.get<ApiResponse<Document[]>>('/documents');
const documents = response.data.data; // Fully typed
```

---

## Component Checklist

When creating a new component, ensure:

- [ ] TypeScript interface for props
- [ ] Proper TypeScript types (no `any`)
- [ ] Accessibility (ARIA labels, keyboard navigation)
- [ ] Responsive design (mobile-friendly)
- [ ] Error states
- [ ] Loading states (if applicable)
- [ ] Disabled states
- [ ] Proper semantic HTML
- [ ] Tailwind CSS for styling
- [ ] Exported from `index.ts` (if in `ui/`)
- [ ] Usage example in this document

---

## Future Components

Planned components for upcoming features:

### Data Display
- **Table**: Sortable, filterable data table with pagination
- **List**: Ordered and unordered lists
- **Badge**: Status badges and labels
- **Avatar**: User avatar with fallback

### Forms
- **Select**: Dropdown select menu
- **Checkbox**: Checkbox with label
- **Radio**: Radio button group
- **Textarea**: Multi-line text input
- **FileUpload**: Drag-and-drop file upload

### Overlays
- **Modal**: Dialog/modal overlay
- **Tooltip**: Hover tooltips
- **Dropdown**: Dropdown menu
- **Popover**: Popover content

### Feedback
- **Toast**: Toast notifications
- **Progress**: Progress bar/spinner
- **Skeleton**: Loading skeleton

### Navigation
- **Sidebar**: Navigation sidebar
- **Navbar**: Top navigation bar
- **Breadcrumbs**: Breadcrumb navigation
- **Tabs**: Tab navigation
- **Pagination**: Page navigation

### Layout
- **Container**: Responsive container
- **Grid**: CSS Grid layout
- **Stack**: Flexbox stack (vertical/horizontal)
- **Divider**: Section divider

---

## Testing Components

Example test for Button component:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '@/components/ui';

describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading spinner when isLoading is true', () => {
    render(<Button isLoading>Submit</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByRole('button').querySelector('svg')).toBeInTheDocument();
  });

  it('applies correct variant styles', () => {
    render(<Button variant="danger">Delete</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-red-600');
  });
});
```

---

## Related Documentation

- [Frontend README](./README.md)
- [Root Constraints](/CONSTRAINTS.md)
- [Implementation Decisions](/DECISIONS.md)
- [Component Source](./components/)
