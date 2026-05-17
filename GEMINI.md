# omix-sms | Technical Context & Guidelines

Futuristic, AI-powered multi-tenant School Management System (SMS) built by omixsystems.

## 🏗️ Project Overview

- **Architecture:** Next.js 16 (App Router) + Turbopack.
- **Multi-tenancy:** Isolated by school subdomains (e.g., `school-slug.omix-sms.com`). 
- **Database:** SQLite (local) / PostgreSQL (production) via Prisma ORM.
- **Authentication:** NextAuth.js v5 (Beta) using Credentials provider. Role-based access control (RBAC).
- **Design:** Dark futuristic theme with Glassmorphism, Tailwind CSS v4, and Framer Motion.
- **AI Integration:** OpenRouter API (GPT-4o-mini) for administrative assistance and reporting.

## 🚀 Key Commands

- `npm run dev` - Start development server.
- `npm run build` - Generate Prisma clients and build for production.
- `npm run setup` - Initialize database, push schema, and seed data.
- `npm run db:push` - Sync Prisma schema with database.
- `npm run db:seed` - Populate database with demo data.
- `npm run db:studio` - Open Prisma Studio to view data.

## 📂 Directory Structure

- `src/app/` - App Router pages and API routes.
    - `(dashboard)/` - Main administrative dashboard routes.
    - `admin/` - Super admin routes.
    - `api/` - REST API endpoints.
    - `[department]/` - Department-specific routes (bursar, library, etc.).
- `src/components/` - Reusable React components.
    - `ui/` - Core UI primitives (Sidebar, Header, DataTable, Modal, etc.).
- `src/lib/` - Shared utilities, database clients (`prisma.ts`), and auth configuration (`auth.ts`).
- `prisma/` - Database schema (`schema.prisma`) and seed scripts.
- `public/` - Static assets and PWA manifests.

## 🛠️ Development Conventions

### Routing & Subdomains
- The system uses subdomains for school identification.
- `src/middleware.ts` extracts the subdomain and sets an `x-school-slug` cookie.
- API routes and server components should use this cookie or session data to scope queries by `schoolId`.

### Authentication & Roles
- Roles include: `super_admin`, `school_admin` (Principal), `bursar`, `librarian`, `lab_technician`, `computer_lab`, `department_head`, `teacher`.
- Authentication is scoped to schools. Super admins can bypass school scoping.
- Role-based redirects are handled in `src/middleware.ts` and individual layouts.

### Styling & UI
- **Tailwind CSS v4:** Uses CSS variables and modern features.
- **Glassmorphism:** Use `bg-surface/80 backdrop-blur-xl border-border` for cards and panels.
- **Gradients:** Use omix-specific indigo gradients (`from-omix-500 to-omix-700`).
- **Icons:** Use `lucide-react`.
- **Animations:** Use `framer-motion` for micro-interactions and page transitions.

### Data Access
- Always use the shared `prisma` client from `@/lib/prisma`.
- Ensure all queries are scoped to the current user's `schoolId` unless they are a `super_admin`.
- Use Zod for input validation in API routes.

## 📝 Design Principles

1.  **Mobile First:** Ensure all tables (`DataTable`) are scrollable and forms are stacked on small screens.
2.  **Error Prevention:** Especially in financial (Bursar) modules, use strict validation and confirmation dialogs.
3.  **Performance:** Optimize imports using `optimizePackageImports` and leverage Next.js caching.
4.  **Offline-Ready:** PWA capabilities are integrated for departmental dashboards (manifests in `public/`).

## ⚠️ Important Notes

- **SQLite for Local:** Local development uses SQLite. Production uses PostgreSQL.
- **Environment Variables:** See `.env.example` for required keys (NextAuth, OpenRouter, Database URLs).
- **Subdomain Local Testing:** Use `lvh.me:3000` or modify `/etc/hosts` to test subdomain logic locally (e.g., `demo.localhost:3000`).
