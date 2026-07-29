# UI System: VAuth Demo Client

This document defines UI rules, design tokens, and component registry conventions for the VAuth demo client.

The demo client exists to show how a frontend app consumes VAuth. It should feel like a clean developer/admin tool, not a marketing landing page.

## 1. UI Goal

The UI should communicate:

- Trust.
- Security.
- Clarity.
- Developer usability.
- Operational control.

The design should be quiet, structured, and easy to scan.

Do not build a flashy SaaS landing page as the main experience. The first screen should help the user authenticate or reach the protected app area.

## 2. Product Feel

VAuth demo client should feel like:

- A secure developer console.
- A compact admin dashboard.
- A reference implementation.
- A usable auth client.

It should not feel like:

- A generic portfolio site.
- A decorative landing page.
- A one-off tutorial UI.
- A bright marketing template.
- A clone of another auth provider's branding.

## 3. Layout Rules

Global layout:

- Use a stable app shell for authenticated pages.
- Use a focused centered layout for signin/signup.
- Use constrained content width for readable forms and admin tables.
- Keep page sections unframed unless they represent repeated items, forms, or tools.
- Do not nest cards inside cards.
- Do not use large hero sections for auth pages.

Recommended authenticated layout:

```txt
┌─────────────────────────────────────────┐
│ Top bar: product, app switch/context    │
├──────────────┬──────────────────────────┤
│ Sidebar nav  │ Page content             │
│              │                          │
└──────────────┴──────────────────────────┘
```

Recommended unauthenticated layout:

```txt
┌─────────────────────────────────────────┐
│ Minimal brand/header                    │
│                                         │
│             Auth form                   │
│                                         │
│ Secondary link: signup/signin           │
└─────────────────────────────────────────┘
```

## 4. Design Tokens

Use tokens in CSS variables. Do not scatter raw values throughout components.

### Color Tokens

Use a neutral base with restrained blue/green accents.

Avoid a one-note palette. Do not make the UI mostly purple, beige, brown/orange, or dark slate.

```css
:root {
  --color-bg: #f8fafc;
  --color-surface: #ffffff;
  --color-surface-muted: #f1f5f9;
  --color-border: #d8e0ea;
  --color-border-strong: #b6c2d1;

  --color-text: #142033;
  --color-text-muted: #5c6b7c;
  --color-text-subtle: #7b8794;
  --color-text-inverse: #ffffff;

  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --color-primary-soft: #dbeafe;

  --color-success: #15803d;
  --color-success-soft: #dcfce7;
  --color-warning: #b45309;
  --color-warning-soft: #fef3c7;
  --color-danger: #dc2626;
  --color-danger-soft: #fee2e2;

  --color-focus: #0ea5e9;
}
```

Usage:

- Primary actions use `--color-primary`.
- Destructive actions use `--color-danger`.
- Success state uses `--color-success`.
- Warning state uses `--color-warning`.
- Background uses `--color-bg`.
- Cards/forms use `--color-surface`.

### Spacing Tokens

Use a 4px-based scale.

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
}
```

Rules:

- Form field gaps: `--space-4`.
- Page content padding: `--space-6` on desktop, `--space-4` on mobile.
- Stack gaps inside panels: `--space-4` or `--space-5`.
- Dense tables/toolbars may use `--space-2` or `--space-3`.

### Typography Tokens

Do not scale font size with viewport width.

```css
:root {
  --font-sans: var(--font-geist-sans), system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), ui-monospace, monospace;

  --text-xs: 12px;
  --text-sm: 14px;
  --text-md: 16px;
  --text-lg: 18px;
  --text-xl: 20px;
  --text-2xl: 24px;
  --text-3xl: 30px;

  --leading-tight: 1.2;
  --leading-normal: 1.5;
  --leading-relaxed: 1.7;
}
```

Rules:

- Form labels: `--text-sm`.
- Body text: `--text-md`.
- Dashboard page titles: `--text-2xl`.
- Compact panel titles: `--text-lg`.
- Avoid oversized type inside cards/panels.
- Letter spacing should be `0`.

### Radius Tokens

Cards must stay at 8px radius or less.

```css
:root {
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-pill: 999px;
}
```

Rules:

- Buttons: `--radius-md`.
- Inputs: `--radius-md`.
- Cards/panels: `--radius-lg`.
- Badges: `--radius-pill`.

### Shadow Tokens

Use shadows sparingly.

```css
:root {
  --shadow-sm: 0 1px 2px rgb(15 23 42 / 8%);
  --shadow-md: 0 8px 24px rgb(15 23 42 / 10%);
}
```

Rules:

- Forms may use `--shadow-sm`.
- Modals may use `--shadow-md`.
- Avoid decorative floating sections.

### Sizing Tokens

```css
:root {
  --size-header: 56px;
  --size-sidebar: 240px;
  --size-control-sm: 32px;
  --size-control-md: 40px;
  --size-control-lg: 48px;
  --size-content-max: 1120px;
  --size-form-max: 420px;
}
```

Rules:

- Auth forms max width: `--size-form-max`.
- Main dashboard content max width: `--size-content-max`.
- Icon buttons: fixed square dimensions.
- Inputs/buttons: stable height so loading states do not shift layout.

## 5. Component Registry

This registry defines the expected reusable components for the demo client.

Do not create duplicate components with different names for the same purpose.

### Foundation Components

| Component | Purpose | Location |
|---|---|---|
| `Button` | All button variants and loading states | `packages/ui` or `apps/web/components/ui` |
| `Input` | Text, email, password inputs | `apps/web/components/ui` |
| `Label` | Accessible field labels | `apps/web/components/ui` |
| `FieldError` | Field-level validation message | `apps/web/components/ui` |
| `Alert` | Error/success/warning notices | `apps/web/components/ui` |
| `Badge` | Role, permission, status display | `apps/web/components/ui` |
| `Spinner` | Loading indicator | `apps/web/components/ui` |
| `EmptyState` | Empty admin tables/lists | `apps/web/components/ui` |

### Layout Components

| Component | Purpose | Location |
|---|---|---|
| `AppShell` | Authenticated layout wrapper | `apps/web/components/layout` |
| `TopNav` | Product/app/user actions | `apps/web/components/layout` |
| `SidebarNav` | Protected page navigation | `apps/web/components/layout` |
| `PageHeader` | Page title, description, actions | `apps/web/components/layout` |
| `SectionHeader` | Compact section heading | `apps/web/components/layout` |

### Auth Components

| Component | Purpose | Location |
|---|---|---|
| `SignInForm` | Email/password signin | `apps/web/components/auth` |
| `SignUpForm` | Account creation | `apps/web/components/auth` |
| `GoogleSignInButton` | Starts Google OAuth | `apps/web/components/auth` |
| `SessionStatus` | Demo-only session/debug status | `apps/web/components/auth` |

### Admin Components

| Component | Purpose | Location |
|---|---|---|
| `ClientAppTable` | List registered apps | `apps/web/components/admin` |
| `RoleTable` | List app roles | `apps/web/components/admin` |
| `PermissionTable` | List app permissions | `apps/web/components/admin` |
| `MembershipTable` | List app memberships | `apps/web/components/admin` |
| `RoleBadgeList` | Display assigned roles | `apps/web/components/admin` |
| `PermissionBadgeList` | Display permissions | `apps/web/components/admin` |

## 6. Component Rules

Rules:

- Prefer Server Components.
- Use Client Components only for form interactivity, pending states, menus, dialogs, and browser APIs.
- Do not pass tokens into Client Components.
- Keep auth/session logic in `lib/auth`, not UI components.
- Use shared components before creating route-specific UI.
- Do not put UI components in `lib`.
- Do not put API calls in presentational components.

Button rules:

- Primary action: filled primary button.
- Secondary action: neutral outline or subtle button.
- Destructive action: danger variant.
- Icon-only buttons need `aria-label`.
- Loading buttons keep the same width and height.

Form rules:

- Every input has a visible label.
- Every field can show validation error text.
- Form-level API errors appear above submit button.
- Password fields must not show raw validation internals.
- Submit buttons show pending state.

Table/list rules:

- Use badges for roles, permissions, and statuses.
- Empty lists use `EmptyState`.
- Destructive row actions require confirmation.

## 7. Page Registry

Public pages:

| Route | Purpose | Access |
|---|---|---|
| `/` | Redirect or compact welcome/auth entry | Public |
| `/signin` | Sign in with email/password or Google | Public |
| `/signup` | Create account for demo client | Public |
| `/auth/callback` | OAuth callback handler | Public route handler |

Protected pages:

| Route | Purpose | Access |
|---|---|---|
| `/dashboard` | Default signed-in page | Authenticated |
| `/profile` | User profile/session demo | Authenticated |
| `/admin` | Admin-only demo page | Permission or role restricted |

Future admin pages:

| Route | Purpose | Access |
|---|---|---|
| `/admin/apps` | Manage client apps | `admin:read` or platform admin |
| `/admin/apps/new` | Create client app | `apps:manage` |
| `/admin/apps/[id]` | View app details | `apps:read` |
| `/admin/apps/[id]/roles` | Manage app roles | `roles:manage` |
| `/admin/apps/[id]/permissions` | Manage permissions | `permissions:manage` |
| `/admin/apps/[id]/members` | Manage memberships | `members:manage` |

## 8. Navigation Rules

Unauthenticated navigation:

- Product name.
- Sign in link.
- Sign up link.

Authenticated navigation:

- Dashboard.
- Profile.
- Admin, only if user has required permission/role.
- Sign out.

Rules:

- Do not show inaccessible admin links to users without access.
- Backend still enforces access even if UI hides a link.
- The active route should be visually clear.
- Navigation labels should be short and stable.

## 9. Auth UI States

Signin states:

- Empty form.
- Client validation errors.
- Pending submission.
- Invalid credentials.
- Successful redirect.

Signup states:

- Empty form.
- Client validation errors.
- Pending submission.
- Duplicate email or membership conflict.
- Successful redirect.

Session states:

- No session.
- Valid session.
- Expired access token with valid refresh token.
- Refresh failed.
- Signed out.

Permission states:

- Allowed.
- Forbidden.
- Hidden navigation item.
- 403 page or redirect.

## 10. Accessibility Rules

Rules:

- Every form control has a label.
- Use semantic buttons for actions.
- Use links for navigation.
- Icon-only controls need `aria-label`.
- Error messages should be associated with fields when possible.
- Focus states must be visible.
- Color cannot be the only signal for status.
- Dialogs must trap focus if introduced.

## 11. Responsive Rules

Mobile:

- Auth forms remain centered and readable.
- Sidebar becomes collapsed or top navigation.
- Tables may become stacked lists.
- Buttons must not overflow text.

Desktop:

- Use sidebar app shell for protected pages.
- Keep content width constrained.
- Avoid overly wide forms.

Rules:

- Text must not overlap.
- Buttons must not resize during loading.
- Dynamic role/permission badge lists must wrap cleanly.

## 12. Copy Rules

Tone:

- Clear.
- Direct.
- Calm.
- Security-conscious.

Preferred labels:

```txt
Sign in
Sign up
Continue with Google
Sign out
Dashboard
Profile
Admin
Roles
Permissions
Members
Client apps
```

Auth error examples:

```txt
Invalid email or password.
Your session expired. Please sign in again.
You do not have access to this page.
```

Avoid:

- Technical stack traces.
- Raw backend error names.
- Overly playful security copy.
- Long explanations inside the UI.

## 13. Styling Location

Allowed:

- Global tokens in `apps/web/app/globals.css`.
- Route-specific layout CSS in route CSS modules.
- Reusable component styles next to components.

Rules:

- Define tokens once.
- Do not duplicate token values in many files.
- Do not introduce multiple styling systems without updating this document.
- Do not use inline styles for normal UI.

## 14. Future UI Registry

Add later only when needed:

- `Dialog`
- `DropdownMenu`
- `Tabs`
- `Switch`
- `Checkbox`
- `Select`
- `DataTable`
- `ConfirmDialog`
- `Toast`

Rules:

- Add components when the workflow requires them.
- Update this registry when adding a reusable component.
- Prefer accessible primitives if introducing a component library later.

