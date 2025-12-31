# Document Manager - Frontend

Next.js frontend application for the Internal Document Management Platform.

## Technology Stack

- **Framework**: Next.js 15+ with App Router
- **Language**: TypeScript (Strict Mode)
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios
- **State Management**: React Server Components + minimal client state

## Architecture

This frontend follows the constraints defined in `/CONSTRAINTS.md`:

- **UI-only layer**: No business logic, no data transformations
- **Server Components first**: Use RSC for data fetching, Client Components only for interactivity
- **Backend-dependent**: All data and authorization comes from backend API
- **Permission-based UI**: Hide/show elements based on user permissions (non-authoritative)

## Directory Structure

```
apps/frontend/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   ├── globals.css         # Global styles
│   ├── (auth)/             # Auth-related pages (login, etc.)
│   └── (dashboard)/        # Protected dashboard pages
│
├── components/             # Reusable React components
│   ├── ui/                 # Basic UI components
│   └── features/           # Feature-specific components
│
├── lib/                    # Utility functions
│   ├── api-client.ts       # Axios instance with interceptors
│   ├── auth.ts             # Auth utilities
│   └── types.ts            # TypeScript types
│
├── public/                 # Static assets
│
├── next.config.ts          # Next.js configuration
├── tailwind.config.ts      # Tailwind configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies
```

## Getting Started

### Install Dependencies

```bash
npm install
```

### Environment Variables

Copy `.env.sample` to `.env.local`:

```bash
cp .env.sample .env.local
```

Update the variables:

```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

```bash
npm run build
```

### Production

```bash
npm run start
```

## Key Principles

### 1. No Business Logic

❌ **WRONG**:
```typescript
const total = items.reduce((sum, item) => sum + item.price, 0);
```

✅ **CORRECT**:
```typescript
const { total } = await fetch('/api/cart/total').then(r => r.json());
```

### 2. Server Components First

❌ **WRONG**:
```typescript
'use client';
export default function Page() {
  const [data, setData] = useState([]);
  useEffect(() => { fetch('/api/data').then(r => r.json()).then(setData); }, []);
  return <List data={data} />;
}
```

✅ **CORRECT**:
```typescript
// Server Component
export default async function Page() {
  const data = await fetch('http://backend/api/data').then(r => r.json());
  return <List data={data} />;
}
```

### 3. Permission-Based UI (Non-Authoritative)

```typescript
'use client';
import { usePermissions } from '@/lib/auth';

export function DocumentActions({ documentId }: { documentId: string }) {
  const permissions = usePermissions();

  return (
    <div>
      {permissions.includes('document.view') && (
        <button>View</button>
      )}
      {permissions.includes('document.delete') && (
        <button>Delete</button>
      )}
    </div>
  );
}
```

**Note**: Backend always validates permissions. Frontend checks are for UX only.

## API Integration

All API calls go through the centralized `lib/api-client.ts`:

```typescript
import apiClient from '@/lib/api-client';

// GET request
const documents = await apiClient.get('/api/v1/documents');

// POST request
const newDoc = await apiClient.post('/api/v1/documents', formData);

// Authentication is handled automatically via interceptors
```

## Constraints

See `/CONSTRAINTS.md` section 8 for frontend-specific constraints:

- Frontend is UI-only
- No business logic
- No security enforcement (backend handles all auth/authz)
- No direct database or file system access
- Server Components preferred over Client Components

## Development Workflow

1. Create page in `app/` directory
2. Use Server Components for data fetching
3. Create Client Components in `components/` for interactivity
4. Use `lib/api-client.ts` for all backend communication
5. Never implement business logic or validation (backend only)

## Testing

```bash
# Type checking
npm run type-check

# Linting
npm run lint
```

## Phase-1 Scope

### Included
- Authentication UI (login/logout)
- Document listing and upload
- User and role management UI
- Permission-based UI visibility

### Excluded
- AI features
- Real-time updates
- Complex state management (Redux/MobX)

## Related Documentation

- [Root README](/README.md)
- [Constraints](/CONSTRAINTS.md)
- [Decisions](/DECISIONS.md)
