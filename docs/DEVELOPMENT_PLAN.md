# Omix SMS — Development Plan

**Goal:** Upgrade omixsystems School Management System into a production-ready platform for Kenyan schools, built on Omix-H2 (Next.js 16 + TypeScript + Prisma + PostgreSQL/Neon).

**Current state:** Feature-rich Next.js app with 30+ models, 7 role portals, multi-tenant architecture. Already has student/teacher/class management, attendance, exams/grades, fees, library, science lab, board management, AI assistant, MFA auth, PWA.

---

## Phase 0: Foundation — Get It Live

**Goal:** Deploy working system on Render with Neon PostgreSQL.

- [ ] Fix render.yaml build command (simplify prisma generation, remove redundancy)
- [ ] Set up Neon database and connection strings
- [ ] Configure Render env vars (DATABASE_URL, DIRECT_URL, NEXTAUTH_SECRET, etc.)
- [ ] Trigger deploy and verify health check
- [ ] Seed demo data and test login flow
- [ ] Set up custom domain (sms.omixsystems.com or similar)

---

## Phase 1: Kenyan Localisation

**Goal:** Make the system feel native to Kenyan schools.

- [ ] **KCSE/KCPE grading system** — grade boundaries, subject clusters, grade calculation
- [ ] **MPesa fee payments** — payment method integration for fee collection
- [ ] **Kenyan phone format** — validation and formatting (+254)
- [ ] **School terms** — Jan-Apr (Term 1), May-Aug (Term 2), Sep-Dec (Term 3) with holiday breaks
- [ ] **Kenyan currency** — KSH formatting throughout fee/ payment modules
- [ ] **Seed data** — Kenyan names, subjects (Math, English, Kiswahili, Sciences, etc.), realistic classes

---

## Phase 2: Parent Portal

**Goal:** Parents can view their children's progress, fees, attendance, and communicate with school.

- [ ] Parent user role (same as in original PHP SMS — 7 roles incl. parent)
- [ ] Parent-child linking (one parent, multiple children)
- [ ] Parent dashboard — view grades, attendance, fee balance, announcements
- [ ] Teacher-to-parent messaging
- [ ] Parent login and registration flow

---

## Phase 3: Communication & Notifications

**Goal:** Keep parents, teachers, and admin connected via their preferred channels.

- [ ] **SMS integration** — Africa's Talking API for bulk SMS (fee reminders, attendance alerts, exam results)
- [ ] **WhatsApp integration** — WhatsApp Business API or alternative for parent communication
- [ ] **Email notifications** — via Nodemailer (already in deps)
- [ ] **In-app notification center** — already partially built, needs completion and targeting
- [ ] **Bulk notification dispatch** — send to specific roles, classes, or all

---

## Phase 4: Student Lifecycle & Admissions

**Goal:** Complete student journey from application to graduation.

- [ ] Online admission application form
- [ ] Application review & approval workflow (admin dashboard)
- [ ] Enrollment → class assignment
- [ ] Transfer between classes/schools
- [ ] Graduation and alumni records
- [ ] Student ID card generation

---

## Phase 5: Timetable & Academic Scheduling

**Goal:** Full timetable management with conflict detection.

- [ ] Timetable builder UI (drag-and-drop or form-based)
- [ ] Subject-teacher-class period assignment
- [ ] Conflict detection (teacher double-booked, room clashes)
- [ ] Student/teacher timetable views
- [ ] Exam timetable scheduling

---

## Phase 6: Reports & Analytics

**Goal:** Comprehensive reporting for school administration and parents.

- [ ] PDF report cards (with KCSE/KCPE grade format)
- [ ] Fee payment receipts
- [ ] Attendance reports (daily, weekly, termly)
- [ ] Subject performance analysis (trends, comparisons)
- [ ] Class rankings and performance summaries
- [ ] Teacher performance metrics
- [ ] Export to Excel/CSV for all modules

---

## Phase 7: Operations & Quality of Life

**Goal:** Make daily school operations smooth.

- [ ] Bulk student import (Excel/CSV)
- [ ] Bulk attendance marking
- [ ] Quick fee payment recording
- [ ] Search across all modules
- [ ] Audit log viewer
- [ ] System settings UI (academic year, term dates, fee structures)
- [ ] Backup and restore

---

## Phase 8: Mobile & Performance

**Goal:** Fast, reliable experience on Kenyan mobile networks.

- [ ] PWA audit and offline capabilities
- [ ] Data usage optimization (smaller payloads, caching)
- [ ] Touch-friendly UI improvements
- [ ] Low-bandwidth mode
- [ ] Service worker caching strategy refinement

---

## Implementation Approach

- **One phase at a time** — complete and verify before moving on
- **Deploy after each phase** — the live site always reflects the latest stable work
- **No regressions** — existing functionality must keep working
- **Zero emoji in UI** — clean, professional interface
