# CardVault Web (Admin)

Next.js 14 app for **managers**, **tenant admins**, and **platform admins** — dashboard, analytics, contacts, sessions, users, audit, exports, and billing.

Field sales (`employee` role) are redirected to use the **MOBILE** app.

## Setup

```powershell
cd WEB
cp .env.local.example .env.local
npm install
npm run dev
```

`NEXT_PUBLIC_API_URL` must match the API port (e.g. `http://localhost:8000/api/v1` when `PORT=8000` in `API/.env`).

## Demo login

Password: `Password123!`

| Email                   | Role                 |
| ----------------------- | -------------------- |
| manager@cardvault.local | manager              |
| admin@cardvault.local   | platform_super_admin |

Open http://localhost:3000 → redirects to `/admin/dashboard`.

## Routes

| Route                  | Purpose                                       |
| ---------------------- | --------------------------------------------- |
| `/login`               | Admin sign-in                                 |
| `/admin/dashboard`     | Stats and overview                            |
| `/admin/analytics`     | Lead funnel, encounter types, session metrics |
| `/admin/contacts`      | Org-wide contact list and detail              |
| `/admin/sessions`      | Event session management                      |
| `/admin/users`         | User management                               |
| `/admin/audit-log`     | Audit events                                  |
| `/admin/export`        | Export jobs and download                      |
| `/admin/billing`       | Subscription and Stripe portal                |
| `/admin/organizations` | Platform super admin — all tenants            |
