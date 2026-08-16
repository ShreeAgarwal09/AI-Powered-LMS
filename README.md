# EduSphere

EduSphere is a full-stack learning management platform with public discovery, role-aware student and instructor workspaces, administration tools, course authoring, lesson progress, assessments, certificates, and Stripe Checkout for paid courses.

## Platform capabilities

| Area | Included capabilities |
|---|---|
| Public learning | Editorial landing page, searchable course catalog, category/level/price filters, and course detail pages. |
| Students | Free enrollment, paid checkout, course progress, lesson player, assessments, certificates, profile controls, and payment history. |
| Instructors | Course drafts, pricing, sections, lessons, assessments, questions, publication, enrollment insights, and revenue overview. |
| Administrators | Role management, course moderation, category management, enrollment totals, and platform statistics. |

## Architecture

The project uses the managed React, Express, tRPC, Drizzle, and MySQL/TiDB scaffold. Authentication is supplied through the managed OAuth flow, while all domain authorization is enforced with student-, instructor-, and administrator-specific server procedures. The relational schema covers users, categories, courses, curriculum, enrollments, lesson progress, quizzes, quiz attempts, certificates, and purchases with database-level foreign keys.

## Local development

Install dependencies and start the development server with the commands below.

```bash
pnpm install
pnpm dev
```

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
