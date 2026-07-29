# UI Registry

### Auth Form

File: apps/web/components/auth/sign-in-form.tsx
Last updated: 2026-07-28

| Property | Class |
| --- | --- |
| Background | `auth-form`, `--color-surface` |
| Border | `1px solid --color-border` |
| Border radius | `--radius-lg` |
| Text - primary | `--color-text` |
| Text - secondary | `--color-text-muted` |
| Spacing | `gap: --space-4`, `padding: --space-6` |
| Hover state | Buttons delegate to button variants |
| Shadow | `--shadow-sm` |
| Accent usage | `--color-primary` eyebrow/actions |

**Pattern notes:**
Auth forms use a focused centered layout, max width `--size-form-max`, visible labels, form-level alerts, and stable full-width action buttons.

### Button

File: apps/web/components/ui/button.tsx
Last updated: 2026-07-28

| Property | Class |
| --- | --- |
| Background | `button-primary`, `button-secondary`, `button-danger` |
| Border | transparent primary/danger, `--color-border-strong` secondary |
| Border radius | `--radius-md` |
| Text - primary | `--color-text-inverse` or `--color-text` |
| Text - secondary | none |
| Spacing | `gap: --space-2`, `padding: 0 --space-4` |
| Hover state | primary uses `--color-primary-hover` |
| Shadow | none |
| Accent usage | primary blue, danger red |

**Pattern notes:**
Buttons have a stable 40px minimum height, inline icon support, and no layout shift during pending states.

### Panel

File: apps/web/app/globals.css
Last updated: 2026-07-28

| Property | Class |
| --- | --- |
| Background | `--color-surface` |
| Border | `1px solid --color-border` |
| Border radius | `--radius-lg` |
| Text - primary | `--color-text` |
| Text - secondary | `--color-text-muted` |
| Spacing | `padding: --space-5` |
| Hover state | none |
| Shadow | `--shadow-sm` |
| Accent usage | badges/actions inside panels |

**Pattern notes:**
Panels frame individual repeated metrics, profile details, and compact tools. Do not nest panels inside panels.

### Badge

File: apps/web/components/ui/badge.tsx
Last updated: 2026-07-28

| Property | Class |
| --- | --- |
| Background | `--color-primary-soft` |
| Border | none |
| Border radius | `--radius-pill` |
| Text - primary | `--color-primary-hover` |
| Text - secondary | none |
| Spacing | `padding: 0 --space-2` |
| Hover state | none |
| Shadow | none |
| Accent usage | app-scoped roles and permissions |

**Pattern notes:**
Badges are compact, wrap inside `.badge-list`, and should be used for roles, permissions, and statuses.

### App Shell

File: apps/web/components/layout/app-shell.tsx
Last updated: 2026-07-28

| Property | Class |
| --- | --- |
| Background | `--color-bg`, nav `--color-surface` |
| Border | `--color-border` top/sidebar dividers |
| Border radius | nav items use `--radius-md` |
| Text - primary | `--color-text` |
| Text - secondary | `--color-text-muted` |
| Spacing | top nav `--space-6`, sidebar `--space-4` |
| Hover state | sidebar hover uses `--color-surface-muted` |
| Shadow | none |
| Accent usage | brand icon/text only |

**Pattern notes:**
Authenticated pages use a fixed top nav, desktop sidebar, and mobile horizontal nav. Admin navigation is hidden unless the session has app-scoped admin access.
