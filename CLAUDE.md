# CLAUDE.md — Pocket Ideas (PWA)

## Purpose
This file defines **how AI assistants should help with this project**.
It acts as a shared contract for architecture decisions, coding style, and scope control.

The goal is to:
- stay pragmatic
- avoid overengineering
- keep the app small, fast, and maintainable
- ensure changes remain consistent with the PLAN.md

---

## Project summary (short)
Pocket Ideas is a **private, mobile-first PWA** for two users (a couple) to store and manage:
- ideas
- recipes
- activities
- projects
- locations

It runs on a **Hetzner VM**, uses **email + password authentication**, and supports:
- tags
- priorities
- sorting/filtering
- links and images per item

This is **not** a public SaaS and does **not** need enterprise features.

---

## Tech stack (authoritative)
Unless explicitly changed:

- Frontend + backend: **Next.js (App Router)**
- Styling: **Tailwind CSS**
- Database: **PostgreSQL**
- ORM: **Prisma** (or drizzle, but stay consistent)
- Auth: **Email + password**, hashed (bcrypt or Argon2), cookie-based sessions
- Deployment: **Docker Compose on Hetzner VM**
- Reverse proxy + TLS: **Nginx + Let’s Encrypt**
- Storage:
  - Links stored in DB
  - Images stored either:
    - S3-compatible object storage (preferred), or
    - local filesystem volume mounted into the app container

---

## Core principles (VERY IMPORTANT)
When generating code or suggestions, always follow these:

1. **Mobile-first**
   - Assume phone screens first
   - Large tap targets
   - Minimal UI density

2. **Keep it boring**
   - Prefer simple, proven solutions
   - Avoid unnecessary abstractions
   - No premature microservices

3. **Single shared space**
   - All users see the same items
   - No per-user isolation logic unless explicitly requested

4. **Explicit over clever**
   - Clear naming
   - Readable schemas
   - Predictable APIs

5. **Security basics, not paranoia**
   - Hash passwords
   - HTTPS everywhere
   - Rate limit login & uploads
   - No need for OAuth, SSO, MFA, etc.

---

## Domain model (mental model)
There is **one main concept**: `Item`.

Items have:
- a type: `idea | recipe | activity | project | location`
- metadata (priority, tags, status)
- optional attachments:
  - links
  - images

Do **not** split items into multiple tables per type.
Type-specific behavior belongs in the UI, not the schema (for now).

---

## What AI SHOULD do
- Propose **incremental** changes
- Prefer **code that can be pasted directly**
- When unsure, **ask one focused question**
- Generate:
  - Prisma schemas
  - API routes / server actions
  - React components
  - SQL migrations
  - Docker / Nginx configs
- Keep defaults sane and documented

---

## What AI should NOT do
- Introduce:
  - GraphQL
  - Microservices
  - CQRS / event sourcing
  - Complex state machines
  - Heavy auth providers (Keycloak, Auth0, etc.)
- Redesign the architecture without explicit request
- Add features outside PLAN.md unless marked as “nice-to-have”
- Assume public multi-tenant usage

---

## Coding conventions
### Backend
- Validate inputs (Zod preferred)
- Return clear errors (no leaking internals)
- Use transactions where needed
- Prefer server actions for mutations (if using Next.js)

### Frontend
- Functional React components
- Co-locate UI with logic
- Avoid global state unless truly shared
- Favor simple forms over fancy UX

### Database
- UUID primary keys
- Timestamps in UTC
- Soft-delete via `status = archived`, not actual deletes
- Cascading deletes only for attachments

---

## Auth rules
- Email + password login only
- Passwords:
  - hashed with bcrypt or Argon2
  - never logged
- Sessions:
  - HttpOnly cookies
  - server-side validation
- Signup:
  - disabled by default OR requires invite code

---

## File & folder expectations (suggested)
```

/app
/(auth)
/login
/(app)
/items
/items/[id]
/new
/lib
auth.ts
db.ts
upload.ts
/prisma
schema.prisma
/docker
nginx.conf
/docker-compose.yml

```

AI-generated code should respect this structure unless told otherwise.

---

## Images & uploads rules
- Limit file size (5–10 MB)
- Only image MIME types
- Store metadata in DB
- Deleting an item deletes its attachments
- No image processing in v1 (thumbnails later)

---

## Performance expectations
- App should feel instant for <10k items
- Queries should be indexed sensibly
- No client-side full-table scans

---

## Backup & safety
Any suggestion involving data changes must consider:
- migrations
- backward compatibility
- backup/restore safety

If suggesting a destructive change, **warn explicitly**.

---

## How to respond when helping
When asked to implement something:
1. State assumptions
2. Show the minimal viable solution
3. Mention one possible extension (optional)
4. Stop — do not overbuild

---

## Definition of “done”
A task is done when:
- It works on mobile
- It survives a page reload
- It survives a container restart
- It does not surprise future-you in 6 months
