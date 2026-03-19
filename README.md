# Reef Ntwrks — Media Buying Platform

A full-stack agency client portal for Reef Ntwrks (reefntwrks.com), built with Next.js, Prisma, and NextAuth.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth.js v5 |
| Styling | Tailwind CSS v4 |
| Charts | Recharts |
| Email | Nodemailer |
| Background Jobs | node-cron |
| CSV Parsing | PapaParse |

## Getting Started

### 1. Clone & Install

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:
- `DATABASE_URL` — PostgreSQL connection string
- `AUTH_SECRET` — Generate with `openssl rand -base64 32`
- `SMTP_*` — Email server credentials
- `ADMIN_NOTIFY_EMAIL` — Where to send admin alerts
- `AUTH_GOOGLE_ID/SECRET` — Optional Google OAuth

### 3. Set Up Database

```bash
# Apply schema
npm run db:push

# Or use migrations
npm run db:migrate

# Seed demo data
npm run db:seed
```

### 4. Run Dev Server

```bash
npm run dev
```

Visit:
- **Landing page**: http://localhost:3000
- **Intake form**: http://localhost:3000/intake
- **Login**: http://localhost:3000/login
- **Admin dashboard**: http://localhost:3000/admin/dashboard
- **Client portal**: http://localhost:3000/portal/dashboard

### Demo Credentials (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | david@reefntwrks.com | Admin123! |
| Client | demo@example.com | Client123! |

## Features Implemented

### Module 1 — Auth & Access Control
- Email/password login with rate limiting (5 attempts = 15min lockout)
- Google OAuth (configure `AUTH_GOOGLE_ID/SECRET`)
- Role-based access control (admin / client)
- Password reset via email (1hr token, single-use)
- 7-day session persistence

### Module 2 — Lead Generation
- Public landing page with hero, social proof, CTA
- Multi-step intake form (7 steps + calendar)
- Lead management admin table with inline status updates
- Lead to Client conversion workflow
- Admin email notification on new lead

### Module 3 — Client Onboarding
- Admin client provisioning with welcome email + set-password link
- Multi-section onboarding questionnaire with save progress
- Onboarding checklist on portal home

### Module 4 — Client Portal
- Dashboard with spend, ROAS, revenue, active campaigns
- ROAS color coding (green/yellow/red vs target)
- Campaign list with status badges
- Campaign detail with Recharts line chart + creatives grid
- High-frequency creative warning (>4)
- Reports library with file download
- Campaign brief approval workflow
- Portal messaging (30s polling, unread badges)

### Module 5 — Admin Panel
- Admin dashboard with client health table
- Client management (full CRUD + all related records)
- Manual metrics entry + CSV bulk import
- Brief builder with JSON content
- Invoice management with status tracking

### Module 6 — Performance Alerts
- ROAS drop alert (nightly job, >15% WoW drop)
- High frequency creative alert (per-creative, auto-close)
- Budget pacing alert (daily job, >20% variance)
- Email notifications for all alert types
- Alert management in admin panel

### Module 7 — Settings
- Admin profile (name, email, password)
- Client notification preferences
- Platform config (stored in DB, immediate effect)

## API Routes

All routes prefixed with `/api/v1`. See spec for full route table.

## Deployment

- **Frontend**: Vercel (`vercel deploy`)
- **Database**: Railway (`railway up`)
- Set all `.env` variables in Vercel dashboard

## Project Structure

```
app/
  (auth)/          # Login, forgot/reset password
  admin/           # Admin panel pages
  portal/          # Client portal pages
  api/
    v1/            # REST API routes
    auth/          # NextAuth handler
  page.tsx         # Landing page
  intake/          # Lead intake form

lib/
  prisma.ts        # Prisma client singleton
  email.ts         # Email templates + transporter
  auth-helpers.ts  # Session/access helpers
  jobs/
    alert-engine.ts  # Alert logic
    scheduler.ts     # node-cron jobs

prisma/
  schema.prisma    # Full data model
  seed.ts          # Demo data seed
```
