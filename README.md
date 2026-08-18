# EduSphere

EduSphere is a full-stack learning management platform with public discovery, role-aware student and instructor workspaces, administration tools, course authoring, lesson progress, assessments, certificates, and Stripe Checkout for paid courses.

## Screenshots / Preview

The following images are captured from the running EduSphere application.

| Landing page | Course discovery |
|---|---|
| ![EduSphere landing page](https://edusphere-ue2k9nsu.manus.space/manus-storage/landing_a9bf9804.png) | ![EduSphere course catalog](https://edusphere-ue2k9nsu.manus.space/manus-storage/catalog_dd8f0145.png) |
| **Landing page:** Editorial learning-platform introduction, responsive navigation, and discovery calls to action. | **Course catalog:** Searchable course exploration with category, level, and price filters. |

| Course detail | Administrator dashboard |
|---|---|
| ![EduSphere course detail](https://edusphere-ue2k9nsu.manus.space/manus-storage/course-detail_db7c0861.png) | ![EduSphere administrator dashboard](https://edusphere-ue2k9nsu.manus.space/manus-storage/admin-dashboard_32733fa7.png) |
| **Course detail:** Course outcomes, curriculum metadata, enrollment state, and free-enrollment call to action. | **Administrator dashboard:** Platform-management navigation and operational overview. |

> Student and instructor dashboards require authenticated accounts assigned to those specific roles. They are intentionally not represented by a fabricated preview.

## Why This Project Stands Out

- **Role-aware learning platform:** Server-side authorization separates student, instructor, and administrator capabilities across the application.
- **Complete course lifecycle:** The platform supports course discovery, enrollment, curriculum delivery, lesson progress, quizzes, and course completion paths.
- **Relational domain design:** Drizzle ORM models users, courses, curriculum, enrollments, progress, assessments, certificates, and purchases on a MySQL/TiDB-compatible database.
- **Measured learner workflow:** Lesson progress and assessment attempts are persisted and surfaced through learner-facing course and dashboard views.
- **Verifiable achievement:** Completion eligibility is connected to certificate records and a dedicated certificate presentation route.
- **Payment-ready enrollment:** Stripe Checkout and verified webhook fulfillment support paid course enrollment while retaining free enrollment paths.
- **Typed full-stack architecture:** React, TypeScript, Express, and tRPC provide end-to-end typed contracts, with managed OAuth for authenticated sessions.

## Platform capabilities

| Area | Included capabilities |
|---|---|
| Public learning | Editorial landing page, searchable course catalog, category/level/price filters, and course detail pages. |
| Students | Free enrollment, paid checkout, course progress, lesson player, assessments, certificates, profile controls, and payment history. |
| Instructors | Course drafts, pricing, sections, lessons, assessments, questions, publication, enrollment insights, and revenue overview. |
| Administrators | Role management, course moderation, category management, enrollment totals, and platform statistics. |

## Tech stack

EduSphere is built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS 4**, **Express 4**, **tRPC 11**, **Drizzle ORM**, and a **MySQL/TiDB-compatible database**. The interface uses shadcn/ui primitives, Lucide icons, and a managed OAuth integration. Stripe Checkout is used for optional paid-course enrollment.

## Architecture

The application separates the React client from the Express/tRPC server. Authentication is supplied through the managed OAuth flow, while domain authorization is enforced with student-, instructor-, and administrator-specific server procedures. The relational schema covers users, categories, courses, curriculum, enrollments, lesson progress, quizzes, quiz attempts, certificates, and purchases with database-level foreign keys.

## Local development

Install dependencies and start the development server with the commands below.

```bash
pnpm install
pnpm dev
```

### Prerequisites and configuration

Use Node.js 22+ and pnpm 10+. Copy the example environment file, then provide values through your deployment platform or a local `.env` file. Never commit a populated `.env` file.

```bash
cp .env.example .env
```

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | MySQL/TiDB-compatible connection string. |
| `JWT_SECRET` | Server-side session signing secret. |
| `VITE_APP_ID`, `OAUTH_SERVER_URL`, `VITE_OAUTH_PORTAL_URL` | OAuth application configuration. |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `VITE_STRIPE_PUBLISHABLE_KEY` | Optional Stripe Checkout and webhook configuration. |

The managed runtime also provides additional integration values. See `server/_core/env.ts` for the supported server-side environment contract.

## Showcase catalog seed

EduSphere uses the configured relational database for its application data; it does not introduce a separate MongoDB instance. Populate the public showcase catalog with the idempotent seed command below. It creates twelve published courses, twelve categories, two instructor profiles, sixty lessons, and twelve functional quizzes in the real application database.

```bash
pnpm seed:showcase
```

The process is safe to re-run: it refreshes only the showcase courses identified by their slugs. Course enrollment totals are calculated from the real enrollment table and start at zero; the platform deliberately does not manufacture learner ratings, reviews, or enrollment activity.

Run type checks, tests, and a production build before release.

```bash
pnpm check
pnpm test
pnpm build
```

## Database workflow

Schema definitions live in `drizzle/schema.ts`. After a deliberate schema change, generate the migration, review the SQL, and apply it through the project database workflow.

```bash
pnpm drizzle-kit generate
```

Do not insert demo users, courses, or payments directly into the production database. Use the administrator workspace to create categories, then use instructor accounts to create course content through the supported application workflows.

## Payments

Paid course enrollment uses Stripe Checkout. A Stripe test sandbox must be claimed in the project payment settings before transactions can be tested. The webhook endpoint is `/api/stripe/webhook`; configure the corresponding Stripe webhook secret through Settings → Payment. Test checkout with Stripe’s documented sandbox card `4242 4242 4242 4242` once the sandbox is active.

## Quality checks

Run the following before opening a pull request or publishing changes:

```bash
pnpm check
pnpm test
pnpm build
```

## Structure

| Path | Purpose |
|---|---|
| `client/src/pages` | Public pages, role-aware workspaces, learning player, assessment UI, and course authoring. |
| `client/src/components` | Shared navigation, dashboard shell, cards, and UI primitives. |
| `server/routers.ts` | Validated tRPC contracts with role-based access control. |
| `server/db.ts` | Reusable data access and reporting helpers. |
| `server/stripe.ts` | Stripe Checkout creation and verified webhook fulfillment. |
| `drizzle/schema.ts` | Relational domain schema and foreign-key constraints. |

## Deployment

The project is configured for the managed project runtime. Create a checkpoint and use the project interface to publish. Add or update payment credentials through Settings → Payment; do not commit secret values to source control.
