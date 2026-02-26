# 🚀 St. Joseph's College SIS — Master TODO

> **Project**: Student Information System for St. Joseph's College  
> **Stack**: Node.js + Express (Backend) | Next.js 16 + TypeScript + Tailwind (Frontend) | PostgreSQL  
> **Generated**: February 26, 2026  

---

## 📊 Current State Summary

| Area | Status | Notes |
|------|--------|-------|
| Documentation | ✅ Extensive | 6 detailed .md files covering architecture, DB schema, APIs, docs, etc. |
| Backend `server.js` | ✅ Done | Express app with middleware, routes wired up |
| Backend `package.json` | ✅ Done | All dependencies installed |
| Backend `config/passport.js` | ✅ Done | Google OAuth strategy implemented |
| Backend `middleware/auth.js` | ⚠️ Misplaced | Full auth **routes** code is here instead of `routes/auth.js` |
| Backend `middleware/authorize.js` | ✅ Done | Role-based authorization middleware |
| Backend `services/documentGenerator.js` | ✅ Done | Full PDF/Excel generation service (710 lines) |
| Backend `routes/auth.js` | ❌ Empty | Should contain the auth routes (currently in `middleware/auth.js`) |
| Backend `routes/student.js` | ❌ Empty | No student routes implemented |
| Backend `routes/faculty.js` | ❌ Empty | No faculty routes implemented |
| Backend `routes/documents.js` | ❌ Empty | No document routes implemented |
| Backend `config/database.js` | ❌ Empty | No PostgreSQL connection pool |
| Backend `config/email.js` | ❌ Empty | No email service config |
| Backend `services/emailService.js` | ❌ Empty | No email service |
| Backend `models/` | ❌ Empty | No models exist |
| Backend `.env` | ⚠️ Template only | Placeholder values, not configured |
| Database | ❌ Not created | Migration SQL exists in docs but no `.sql` file in project |
| Frontend | ❌ Default Next.js | Boilerplate only — no custom pages, components, or API integration |
| Docker | ❌ Missing | No `Dockerfile`, no `docker-compose.yml` |
| Testing | ❌ Missing | No test setup at all |

---

## PHASE 0: Project Scaffolding & Fixes 🔧
> Fix structural issues and get the project runnable

- [ ] **0.1** Move auth route code from `middleware/auth.js` to `routes/auth.js`
  - `middleware/auth.js` currently has full auth routes (login, OAuth, OTP, password reset)
  - It should only export the `authenticateToken` middleware function
  - Move the router logic into `routes/auth.js`
- [ ] **0.2** Implement `config/database.js` — PostgreSQL connection pool
  - Use `pg` Pool with `DATABASE_URL` from `.env`
  - Export `query()` helper function
  - Note: `passport.js` and `documentGenerator.js` import from `../db/connection` — fix import paths or create alias
- [ ] **0.3** Create `backend/.env.example` with all required env vars
  - `DATABASE_URL`, `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, `SESSION_SECRET`
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
  - `SENDGRID_API_KEY`, `FROM_EMAIL`
  - `FRONTEND_URL`, `PORT`, `NODE_ENV`
  - `COLLEGE_ADDRESS`, `COLLEGE_PHONE`, `DOCUMENTS_PATH`
- [ ] **0.4** Update `backend/.env` — generate real secrets for local dev
- [ ] **0.5** Add `"dev": "nodemon server.js"` script to `backend/package.json`
- [ ] **0.6** Create `database-migration.sql` file at project root (from `Database_migration.md`)
- [ ] **0.7** Add root `.gitignore` (node_modules, .env, documents/, uploads/, logs/)
- [ ] **0.8** Create missing project directories: `documents/`, `uploads/`, `logs/`
- [ ] **0.9** Fix import path inconsistency — `passport.js` imports `../db/connection` but DB config is at `config/database.js`

---

## PHASE 1: Database Setup 🗄️
> Get PostgreSQL running with the full schema

- [ ] **1.1** Install PostgreSQL locally (if not installed)
- [ ] **1.2** Create `college_db` database
- [ ] **1.3** Run the migration SQL to create all 13 tables:
  - `users`, `students`, `faculty`, `class_assignments`, `student_classes`
  - `guardian_details`, `previous_education`, `documents`, `semester_marks`
  - `otp_tokens`, `attendance`, `generated_documents`, `audit_log`
- [ ] **1.4** Create triggers (`update_updated_at_column`)
- [ ] **1.5** Create views (`v_student_profiles`, `v_faculty_classes`, `v_student_academic_summary`)
- [ ] **1.6** Insert sample/seed data (admin, faculty, student accounts)
- [ ] **1.7** Verify DB connection from backend with `config/database.js`

---

## PHASE 2: Backend — Core Auth System 🔐
> Authentication is the foundation — nothing else works without it

- [ ] **2.1** Implement `config/database.js` — pg Pool + query helper
- [ ] **2.2** Implement `config/email.js` — Nodemailer transporter config (SendGrid)
- [ ] **2.3** Implement `services/emailService.js` — OTP email, notification wrappers
- [ ] **2.4** Refactor `middleware/auth.js` — export only `authenticateToken` middleware
- [ ] **2.5** Implement `routes/auth.js` with all endpoints:
  - `POST /api/auth/login` — Roll No (student) or email (faculty) + password
  - `GET /api/auth/google` — Initiate Google OAuth
  - `GET /api/auth/google/callback` — OAuth callback handler
  - `POST /api/auth/password/request-otp` — Send OTP to college email
  - `POST /api/auth/password/verify-otp` — Verify OTP
  - `POST /api/auth/password/reset` — Reset password with token
  - `POST /api/auth/logout` — Invalidate session
  - `GET /api/auth/verify-token` — Check token validity
  - `POST /api/auth/refresh-token` — Refresh access token (not implemented in current code)
- [ ] **2.6** Add rate limiting middleware (login attempts, OTP requests)
- [ ] **2.7** Test all auth endpoints with Postman/curl

---

## PHASE 3: Backend — Student Routes 📚
> Student profile management, viewing data

- [ ] **3.1** Implement `routes/student.js`:
  - `GET /api/students/profile` — Get own profile (authenticated student)
  - `PUT /api/students/profile` — Update own profile (limited fields)
  - `GET /api/students/:id` — Get student by ID (faculty/admin)
  - `GET /api/students/search` — Search students by name/roll/batch
  - `GET /api/students/:id/marks/:semester` — Get semester marks
  - `GET /api/students/:id/guardian` — Get guardian details
  - `GET /api/students/:id/education` — Get previous education
  - `GET /api/students/:id/documents` — Get uploaded documents list
- [ ] **3.2** Add input validation with `express-validator` on all endpoints
- [ ] **3.3** Add ownership checks — students can only view/edit their own data
- [ ] **3.4** Test all student endpoints

---

## PHASE 4: Backend — Faculty Routes 👨‍🏫
> Faculty managing students in assigned classes

- [ ] **4.1** Implement `routes/faculty.js`:
  - `GET /api/faculty/profile` — Get own faculty profile
  - `GET /api/faculty/assigned-classes` — List classes assigned to faculty
  - `GET /api/faculty/students/:classId` — List students in a class
  - `GET /api/faculty/students/:studentId/details` — Full student details
  - `PUT /api/faculty/students/:studentId` — Edit student details
  - `POST /api/faculty/marks` — Enter semester marks for students
  - `PUT /api/faculty/marks/:markId` — Edit marks
  - `POST /api/faculty/attendance` — Mark attendance (future)
- [ ] **4.2** Add authorization — faculty can only access their assigned classes
- [ ] **4.3** Add audit logging for student data edits and marks entry
- [ ] **4.4** Test all faculty endpoints

---

## PHASE 5: Backend — Document Routes 📄
> Wire up the document generator service to API endpoints

- [ ] **5.1** Implement `routes/documents.js`:
  - `POST /api/documents/generate-application` — Generate PDF application
    - Types: bonafide, leave, transfer_certificate, id_card, no_objection, generic
  - `POST /api/documents/generate-grade-memo` — Generate Excel grade memo
  - `GET /api/documents/:documentId/download` — Download generated document
  - `GET /api/documents/history` — List previously generated documents
  - `POST /api/documents/upload` — Upload student documents (multer)
  - `GET /api/documents/:id` — Get document metadata
- [ ] **5.2** Add file upload handling with `multer` for student document uploads
- [ ] **5.3** Add file size limits and type validation
- [ ] **5.4** Test document generation and download

---

## PHASE 6: Backend — Admin Routes 🛡️
> System administration (user management, class assignments, reports)

- [ ] **6.1** Create `routes/admin.js` and wire in `server.js`
- [ ] **6.2** Implement admin endpoints:
  - `POST /api/admin/students` — Create new student
  - `POST /api/admin/students/bulk` — Bulk import students (CSV)
  - `DELETE /api/admin/students/:id` — Deactivate student
  - `POST /api/admin/faculty` — Create new faculty
  - `PUT /api/admin/class-assignments` — Assign faculty to classes
  - `GET /api/admin/reports/students` — Student reports
  - `GET /api/admin/reports/attendance` — Attendance reports
  - `GET /api/admin/dashboard` — System stats
- [ ] **6.3** Add admin-only authorization on all admin routes
- [ ] **6.4** Implement bulk CSV import for students

---

## PHASE 7: Frontend — Foundation & Auth Pages 🎨
> Set up the Next.js frontend with auth flows

- [ ] **7.1** Install additional frontend dependencies:
  - `axios`, `zustand` (state), `react-hook-form`, `zod`, `@hookform/resolvers`
  - `date-fns` for date formatting
  - shadcn/ui components (button, input, card, select, dialog, dropdown-menu, table, toast, tabs, badge)
- [ ] **7.2** Set up project structure:
  - `app/(auth)/` — login, forgot-password pages
  - `app/(student)/` — student portal pages
  - `app/(faculty)/` — faculty portal pages
  - `app/(admin)/` — admin portal pages
  - `components/` — shared components
  - `lib/api.ts` — Axios instance with token interceptor
  - `lib/auth.ts` — Auth store (zustand)
  - `lib/types.ts` — TypeScript interfaces for all entities
- [ ] **7.3** Update `layout.tsx` — Add providers, metadata for "SJC Student Portal"
- [ ] **7.4** Create landing page (`page.tsx`) — Login portal selector (Student / Faculty / Admin)
- [ ] **7.5** Create Student Login page (`/login/student`) — Roll number + password
- [ ] **7.6** Create Faculty Login page (`/login/faculty`) — Email + password
- [ ] **7.7** Create Forgot Password page (`/forgot-password`) — OTP flow
- [ ] **7.8** Create OAuth callback handler page (`/auth/callback`)
- [ ] **7.9** Implement auth middleware — Redirect unauthenticated users
- [ ] **7.10** Implement auth store with `zustand` (token management, user state)

---

## PHASE 8: Frontend — Student Portal 🎓
> Student dashboard, profile, documents, marks

- [ ] **8.1** Student Dashboard (`/student/dashboard`)
  - Welcome card, roll no, batch, status
  - Quick stats (subjects, attendance %, SGPA)
  - Quick links to documents, marks, profile
- [ ] **8.2** Student Profile (`/student/profile`)
  - View all personal info, guardian details, previous education
  - Edit limited fields (mobile, personal email, address)
- [ ] **8.3** Document Generation (`/student/documents`)
  - Select application type from dropdown
  - Fill in additional fields (purpose, dates, reason)
  - Generate & download PDF
  - View history of generated documents
- [ ] **8.4** Marks View (`/student/marks`)
  - Semester-wise marks table
  - SGPA calculation display
  - Download grade memo (Excel)
- [ ] **8.5** Student Attendance View (`/student/attendance`) — Future placeholder

---

## PHASE 9: Frontend — Faculty Portal 👩‍🏫
> Faculty managing classes, students, marks

- [ ] **9.1** Faculty Dashboard (`/faculty/dashboard`)
  - Assigned classes summary
  - Student count per class
  - Quick actions
- [ ] **9.2** Student List (`/faculty/students`)
  - Filter by class/batch
  - Search by name/roll
  - Click to view/edit
- [ ] **9.3** Student Detail/Edit (`/faculty/students/[id]`)
  - Full student form with all fields
  - Toggle edit mode
  - Sections: Primary Info, Personal, Contact, Guardian, Education, Address
  - Save with validation
- [ ] **9.4** Marks Entry (`/faculty/marks`)
  - Select class → Select subject → Enter marks for all students
  - Bulk entry form (table)
  - Save all at once
- [ ] **9.5** Attendance Marking (`/faculty/attendance`) — Future placeholder

---

## PHASE 10: Frontend — Admin Portal ⚙️
> Admin dashboard, user management, reports

- [ ] **10.1** Admin Dashboard (`/admin/dashboard`)
  - Total students, faculty, active users
  - Recent activity feed
  - System health
- [ ] **10.2** Student Management (`/admin/students`)
  - CRUD students
  - Bulk import (CSV upload)
  - Filter/search
- [ ] **10.3** Faculty Management (`/admin/faculty`)
  - Create/edit faculty
  - Assign to classes
- [ ] **10.4** Class Assignments (`/admin/classes`)
  - Create class-faculty-subject mappings
  - Assign students to classes
- [ ] **10.5** Reports (`/admin/reports`)
  - Student reports, class-wise reports
  - Export to Excel/PDF

---

## PHASE 11: Security & Hardening 🔒

- [ ] **11.1** Add `helmet` middleware for security headers
- [ ] **11.2** Add `compression` middleware
- [ ] **11.3** Add `morgan` request logging → write to `logs/` directory
- [ ] **11.4** Implement rate limiting (`express-rate-limit`)
  - General: 100 req/15min per IP
  - OTP: 5 req/hour per IP
  - Login: 10 req/15min per IP
- [ ] **11.5** Add CORS configuration for production domain
- [ ] **11.6** Implement refresh token rotation
- [ ] **11.7** Add input sanitization against XSS
- [ ] **11.8** Ensure all SQL uses parameterized queries (already done in reference code)
- [ ] **11.9** Add `.env` to `.gitignore`
- [ ] **11.10** Implement audit logging for all data mutations

---

## PHASE 12: Testing 🧪

- [ ] **12.1** Set up Jest for backend testing
- [ ] **12.2** Write unit tests:
  - Password hashing/verification
  - JWT generation/verification
  - OTP generation
  - College email validation
  - Authorization middleware
- [ ] **12.3** Write integration tests:
  - Auth endpoints (login, OTP flow, OAuth)
  - Student CRUD endpoints
  - Faculty endpoints
  - Document generation
- [ ] **12.4** Set up test database and seed data
- [ ] **12.5** Frontend: Set up testing (React Testing Library / Playwright)

---

## PHASE 13: DevOps & Deployment 🚢

- [ ] **13.1** Create `Dockerfile` for backend
- [ ] **13.2** Create `Dockerfile` for frontend
- [ ] **13.3** Create `docker-compose.yml` (PostgreSQL + Backend + Frontend)
- [ ] **13.4** Set up automated database backups
- [ ] **13.5** Set up environment-specific configs (dev/staging/prod)
- [ ] **13.6** Configure production deployment (Railway/DigitalOcean/AWS)
- [ ] **13.7** Set up CI/CD pipeline (GitHub Actions)
- [ ] **13.8** Set up monitoring and error tracking (Sentry)
- [ ] **13.9** SSL/HTTPS configuration
- [ ] **13.10** CDN for static assets

---

## PHASE 14: Future Enhancements 🔮

- [ ] **14.1** Attendance management system
- [ ] **14.2** Fee payment integration
- [ ] **14.3** Mobile app (React Native)
- [ ] **14.4** Library management
- [ ] **14.5** Hostel management
- [ ] **14.6** Event management
- [ ] **14.7** Alumni portal
- [ ] **14.8** Parent portal
- [ ] **14.9** Placement cell
- [ ] **14.10** Online examination system
- [ ] **14.11** Redis caching layer
- [ ] **14.12** Real-time notifications (WebSocket)

---

## 🎯 Recommended Build Order

```
Week 1:  Phase 0 + Phase 1 + Phase 2  → Project scaffold, DB, Auth
Week 2:  Phase 3 + Phase 4 + Phase 5  → All backend routes
Week 3:  Phase 7 + Phase 8            → Frontend auth + Student portal
Week 4:  Phase 9 + Phase 10           → Frontend faculty + Admin portal
Week 5:  Phase 6 + Phase 11           → Admin backend + Security
Week 6:  Phase 12 + Phase 13          → Testing + Deployment
```

---

## ⚠️ Critical Issues to Fix First

1. **`middleware/auth.js` has route code** — This is the auth routes file misplaced as middleware. The actual `routes/auth.js` is empty.
2. **`config/database.js` is empty** — Nothing can work without a DB connection. This blocks everything.
3. **Import path mismatch** — `passport.js` and `middleware/auth.js` import from `../db/connection` which doesn't exist. Should be `../config/database`.
4. **No `.env.example`** — New developers won't know what env vars are needed.
5. **Frontend is completely default** — Stock Next.js template, zero custom code.

---

*Start with Phase 0 fixes, then Phase 1 DB setup, then Phase 2 auth. Everything else builds on those.*
