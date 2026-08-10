# omixsystems — School Management System

**A futuristic, AI-powered school management platform built by [omixsystems](https://omixsystems.com).**

---

## ✨ Features

- **Dashboard** — Real-time stats: student count, teacher count, attendance rate, fee collection analytics with interactive charts
- **Student Management** — Full CRUD with profiles, enrollment history, grades, fee payments
- **Teacher Management** — Profiles, assigned classes, subjects, qualifications
- **Class Management** — Class rosters, capacity tracking, timetables
- **Attendance** — Daily attendance tracking with status (present/absent/late/excused), per-class stats
- **Grades & Exams** — Grade entry by class/exam/subject, grade distribution charts, report cards
- **Fee Management** — Fee structures, payment recording (cash/MPesa/bank/card), collection analytics
- **AI Assistant** — ChatGPT-powered assistant for school admin tasks, report generation, Q&A
- **Announcements** — Multi-priority broadcast system (all/students/teachers)
- **Operations** — Bulk student import (CSV), one-click CSV exports for every module, global search across students/teachers/classes, audit-log viewer, system settings (academic year, term dates)
- **Authentication** — Role-based (admin/teacher) via NextAuth + MFA (TOTP)

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router + Turbopack) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + Glassmorphism |
| Database | PostgreSQL (primary) + SQLite (local cache/audit) via Prisma ORM |
| Auth | NextAuth v5 (Credentials) |
| AI | OpenRouter API (GPT-4o-mini) |
| Charts | Recharts |
| Animations | Framer Motion |
| Icons | Lucide React |
| Deployment | Render.com (render.yaml) |

## 🏗️ Project Structure

```
├── prisma/
│   ├── schema.prisma      # Database schema (31+ models)
│   ├── local-schema.prisma # Local SQLite cache/audit/rate-limit schema
│   └── seed.ts            # Seed data (20 students, 3 teachers, etc.)
├── src/
│   ├── app/
│   │   ├── (dashboard)/   # Protected pages (dashboard, students, teachers, etc.)
│   │   ├── api/           # REST API routes (13 endpoints)
│   │   ├── login/         # Login page
│   │   └── layout.tsx     # Root layout
│   ├── components/ui/     # Reusable UI (Sidebar, Header, DataTable, Modal, etc.)
│   └── lib/               # Utilities (auth, prisma, helpers)
├── .env.example           # Environment template
└── render.yaml            # Render.com deployment config
```

## 🧪 Local Development

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env with your actual values

# 3. Initialize database + seed
npx prisma generate
npx prisma db push
npx prisma db push --schema=prisma/local-schema.prisma   # local cache/audit/rate-limit DB
npx tsx prisma/seed.ts

# 4. Start dev server
npm run dev
```

**Login Credentials** (after seeding):
- **Admin:** `admin@omixsystems.com` / `admin123`
- **Teacher:** `teacher@omixsystems.com` / `teacher123`

## ☁️ Deployment (Render.com)

1. Push to GitHub
2. In Render dashboard → **New Web Service** → Connect your repo
3. Render will auto-detect `render.yaml` — or manually set:
   - **Build Command:** `npm install && npx prisma generate && npx prisma db push && npm run build`
   - **Start Command:** `npx prisma db push && npm start`
4. Set environment variables:
   - `NEXTAUTH_SECRET` — generate a random string
   - `NEXTAUTH_URL` — your Render URL
   - `OPENROUTER_API_KEY` — your OpenRouter API key (for AI Chat)
5. Add a **Disk** mount at `/var/data` for persistent SQLite storage
6. `SQLITE_URL` (default `file:/var/data/local.db`) powers the local cache, audit log and rate limiting — it is pushed automatically at startup (`npm start` runs both `prisma db push` commands)

## 📦 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/[...nextauth]` | Authentication |
| GET/POST | `/api/students` | List/Create students |
| GET/PATCH/DELETE | `/api/students/[id]` | Student CRUD |
| GET/POST | `/api/teachers` | List/Create teachers |
| GET/PATCH/DELETE | `/api/teachers/[id]` | Teacher CRUD |
| GET/POST | `/api/classes` | List/Create classes |
| GET/PATCH/DELETE | `/api/classes/[id]` | Class CRUD |
| GET/POST | `/api/attendance` | Attendance records |
| GET/POST | `/api/exams` | Exam management |
| GET/POST | `/api/grades` | Grade entry |
| GET/POST | `/api/fees` | Fee payments |
| GET/POST | `/api/fees/structures` | Fee structures |
| GET | `/api/dashboard/stats` | Dashboard statistics |
| GET/POST | `/api/announcements` | Announcements |
| POST | `/api/ai/chat` | AI Assistant |
| POST | `/api/students/import` | Bulk student import (CSV) |
| GET | `/api/students/import/template` | Student import CSV template |
| GET | `/api/export?entity=...` | CSV export (students, teachers, classes, attendance, grades, fees, books, apparatus, announcements, exams, checkouts) |
| GET | `/api/search?q=...` | Global search (students/teachers/classes) |
| GET | `/api/audit-logs` | Audit log viewer |
| GET/PUT | `/api/settings` | School settings (profile, academic year, term dates) |

## 🎨 Design

Dark futuristic theme with:
- **Glassmorphism** — frosted glass cards and panels
- **Gradient accents** — omixsystems brand indigo (#6366f1 → #818cf8)
- **Animated micro-interactions** — entrance animations, hover effects
- **Responsive** — mobile sidebar, adaptive layouts

---

Built with ❤️ by **omixsystems**
