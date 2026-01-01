# Frontend Components

This directory contains reusable React components organized by category.

## Structure

```
components/
├── ui/              # Basic UI components (atoms)
│   ├── input.tsx    # Text input with label, error states
│   ├── button.tsx   # Button with variants and loading states
│   ├── card.tsx     # Card container with header, content, footer
│   ├── alert.tsx    # Alert messages (info, success, warning, error)
│   └── index.ts     # Barrel export
│
├── forms/           # Form-specific components
│   └── (future)
│
├── layout/          # Layout components
│   └── auth-layout.tsx  # Authentication page layout
│
└── auth/            # Authentication components
    └── login-form.tsx   # Login form with validation
```

## Component Design Principles

### 1. **Reusability**
All components are designed to be reused across multiple pages and features.

### 2. **Composability**
Complex components are built from smaller, simpler components.

Example:
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    <Input label="Email" />
    <Button>Submit</Button>
  </CardContent>
</Card>
```

### 3. **Type Safety**
All components have TypeScript interfaces for props with proper typing.

### 4. **Accessibility**
Components follow WCAG guidelines:
- Proper ARIA attributes
- Keyboard navigation support
- Screen reader friendly
- Semantic HTML

### 5. **Consistent Styling**
All components use Tailwind CSS with consistent spacing, colors, and sizing scales.

## Usage Examples

### Input Component

```tsx
import { Input } from '@/components/ui';

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
- Label with optional required indicator
- Error message display
- Helper text support
- Accessibility attributes
- Disabled state

### Button Component

```tsx
import { Button } from '@/components/ui';

<Button
  variant="primary"    // primary | secondary | outline | ghost | danger
  size="md"            // sm | md | lg
  isLoading={isSubmitting}
  fullWidth
  onClick={handleSubmit}
>
  Submit
</Button>
```

**Features**:
- Multiple variants (primary, secondary, outline, ghost, danger)
- Size options (sm, md, lg)
- Loading state with spinner
- Full width option
- Disabled state

### Card Component

```tsx
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui';

<Card padding="md">
  <CardHeader>
    <CardTitle>Login</CardTitle>
    <CardDescription>Enter your credentials</CardDescription>
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
- Flexible content areas
- Configurable padding
- Shadow and border styling
- Composable sub-components

### Alert Component

```tsx
import { Alert } from '@/components/ui';

<Alert
  variant="error"      // info | success | warning | error
  title="Login Failed"
  onClose={() => setError('')}
>
  Invalid email or password
</Alert>
```

**Features**:
- Variant styling (info, success, warning, error)
- Optional title
- Dismissible with close button
- Icon display
- Accessibility support

### LoginForm Component

```tsx
import { LoginForm } from '@/components/auth/login-form';

<LoginForm
  onSubmit={async (credentials) => {
    await login(credentials);
  }}
/>
```

**Features**:
- Email and password inputs
- Client-side validation
- Error handling and display
- Loading states
- Remember me checkbox
- Forgot password link

### AuthLayout Component

```tsx
import { AuthLayout } from '@/components/layout/auth-layout';

<AuthLayout
  title="Document Manager"
  subtitle="Sign in to your account"
>
  <LoginForm onSubmit={handleLogin} />
</AuthLayout>
```

**Features**:
- Centered layout with gradient background
- Logo/icon display
- Title and subtitle
- Card-based content area
- Footer text

## Component Guidelines

### When to Create a New Component

Create a new component when:
1. A UI pattern is used in 2+ places
2. A section of code becomes complex (>50 lines)
3. Logic needs to be isolated for testing
4. Styling needs to be consistent across pages

### Component File Structure

```tsx
import React from 'react';

// TypeScript interface for props
export interface ComponentProps {
  // Required props
  required: string;
  // Optional props
  optional?: boolean;
  // Event handlers
  onClick?: () => void;
  // Children
  children?: React.ReactNode;
}

// Component implementation
export const Component: React.FC<ComponentProps> = ({
  required,
  optional = false,
  onClick,
  children,
}) => {
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
};
```

### Styling Conventions

1. Use Tailwind utility classes
2. Keep class names organized (layout → spacing → colors → typography)
3. Use template literals for conditional classes
4. Extract complex class logic into variables

Example:
```tsx
const buttonStyles = `
  ${baseStyles}
  ${variantStyles[variant]}
  ${sizeStyles[size]}
  ${className}
`;
```

## Future Components

Planned components for upcoming features:

- **Tables**: Data tables with sorting, filtering, pagination
- **Modals**: Dialog/modal overlays
- **Dropdowns**: Select menus and dropdowns
- **File Upload**: Drag-and-drop file upload
- **Navigation**: Sidebar, breadcrumbs, tabs
- **Badges**: Status badges and labels
- **Tooltips**: Hover tooltips
- **Loading**: Skeleton loaders, spinners
- **Empty States**: Placeholder content

## Testing

All components should be testable:
- Unit tests for logic
- Visual regression tests for UI
- Accessibility tests

Example test structure:
```tsx
describe('Button', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('shows loading spinner when isLoading is true', () => {
    render(<Button isLoading>Submit</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

## Related Documentation

- [Root README](/README.md)
- [Constraints](/CONSTRAINTS.md) - Section 8: Frontend Constraints
- [Decisions](/DECISIONS.md) - Section 7: Frontend Implementation Guidelines
