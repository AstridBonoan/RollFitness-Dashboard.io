# RollnFitness Admin Dashboard

Production-ready admin dashboard for the RollnFitness platform. Monitors user growth, engagement, subscriptions, revenue, expenses, and basic platform health.

**Separate from the member app** ([RollnFitness](https://github.com/AstridBonoan/RollnFitness)) — this repo deploys independently via GitHub Pages.

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS (RollnFitness design tokens)
- React Router (`BrowserRouter`)
- Recharts
- Supabase Auth + RLS (`is_admin()` gate)

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

### Environment variables

```env
VITE_SUPABASE_URL=https://hokjllnnbfstvjyvurgd.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon publishable key>
```

Defaults are in `src/config/supabase.ts` for local dev. Override with `.env.local`. **Never** put the service role key in this frontend.

### Supabase SQL (run in order)

In the [RollnFitness](https://github.com/AstridBonoan/RollnFitness) repo SQL Editor:

1. `supabase/schema.sql`
2. `supabase/membership_plan.sql`
3. `supabase/subscriptions.sql`
4. `supabase/sports_plan.sql`
5. `supabase/admin_analytics.sql`
6. **`supabase/admin_rpc.sql`** (in this repo — dashboard aggregates)

### Seed first admin

```sql
insert into public.admin_users (user_id) values ('<your-auth-user-uuid>');
```

Use the same email/password as the member app. Non-admins are signed out with **Access denied**.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Local dev server |
| `npm run build` | Production build (+ `404.html` for GitHub Pages SPA) |
| `npm run preview` | Preview production build |

## Deploy (GitHub Pages)

Pushes to `main` run [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml):

1. `npm ci` → `npm run build`
2. Deploy `dist/` to the `gh-pages` branch via `peaceiris/actions-gh-pages`

### GitHub repository secrets

Add in **Settings → Secrets and variables → Actions**:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

### Enable Pages

**Settings → Pages → Build and deployment → Deploy from a branch → `gh-pages` / root**

Live URL: https://astridbonoan.github.io/RollFitness-Dashboard.io/

## Security

- Anon key + RLS only in the browser
- All admin reads require `is_admin()` policies in Supabase
- No service role in the frontend
- Admin UI is not bundled into the public member GitHub Pages site

## Pages

| Route | Purpose |
|-------|---------|
| `/login` | Email/password auth + admin gate |
| `/` | Dashboard KPIs + activity feed |
| `/users` | User table, search, filters, detail panel |
| `/subscriptions` | Status counts, trend chart, table |
| `/revenue` | Revenue KPIs, charts, transactions, expenses CRUD |
| `/analytics` | DAU/WAU/MAU, retention, workouts |
| `/system-health` | DB + auth connectivity (v1) |
| `/settings` | Account, theme, password |

Revenue and subscriptions show friendly empty states until Stripe webhooks populate billing tables.

## MRR definition

**MRR (estimate)** = sum of each active paid subscription's most recent `subscription_payments.amount_cents` for that user/plan. See `admin_dashboard_kpis()` in `supabase/admin_rpc.sql`.
