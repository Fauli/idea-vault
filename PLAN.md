# PLAN.md — Pocket Ideas (PWA)

## 0) Goal
Build a small **mobile-first web app** that can be installed on a phone (PWA) and used privately by **two people** (me + my wife) to store and manage:
- ideas
- recipes
- activities
- projects
- locations

Core capabilities:
- create/edit/archive items
- tags
- sorting + filtering
- prioritization
- add **links** and **images** to items
- runs on a **Hetzner VM**
- **email + password login**

---

## 1) MVP feature set (v1)

### 1.1 Authentication (email + password)
Requirements:
- User registers (or admin-seeded users) with **email + password**
- Passwords stored **hashed** (Argon2 or bcrypt)
- Login creates a session (cookie-based)
- Logout
- Basic protections: rate-limit login, generic error messages

MVP decision:
- Keep it private: only allow signups via an **invite code** or disable public signup and create the two users via CLI/seed.

### 1.2 Item model
Single unified concept: **Item** with a `type`:
`idea | recipe | activity | project | location`

Fields:
- id (uuid)
- title (required)
- type (enum)
- description (markdown or plain text)
- tags: string[]
- priority: `0..3` (or `low/med/high/urgent`)
- status: `active | done | archived`
- due_date (optional)
- created_at / updated_at
- created_by (user id)
- pinned (optional)

### 1.3 Attachments: links and images
Items should support:
- **Links**: multiple per item  
  - title (optional)
  - url (required)
- **Images**: multiple per item  
  Two storage options:
  - **Option A (recommended for Hetzner): Store images on S3-compatible object storage** (e.g., Hetzner Object Storage) and save URLs in DB.
  - **Option B: Store on the VM filesystem** behind Nginx (simpler, but backups and disk management matter more).

MVP approach:
- Implement **links first** (fast).
- Implement **image upload** with:
  - file size limit (e.g., 5–10 MB)
  - basic image types only (jpg/png/webp)
  - generate thumbnails later (nice-to-have)

### 1.4 Views (mobile-first)
Screens:
- **Login**
- **List view**
  - search
  - filter by tag/type/status
  - sort (priority, updated, created, due date)
- **Item detail**
  - view + edit
  - attachments section (links + image gallery)
- **Create item** (fast capture)
- **Tag assist** (auto-suggest from existing tags)

### 1.5 Sorting / filtering
- Search by title/description
- Tag filter (multi-select)
- Type filter (idea/recipe/activity/project/location)
- Status filter (active/done/archived)
- Sort:
  - default: priority desc, updated desc
  - optional: due date asc

### 1.6 PWA (installable)
- Web App Manifest
- Service worker caches the app shell
- Installability verified on Android + iOS Safari
- Optional: offline read-only (last loaded items) later

---

## 2) Tech stack proposal (simple + self-hostable)

### 2.1 Frontend + backend (single app)
- **Next.js** (App Router) as full-stack app
- Tailwind CSS UI
- Server Actions or API routes for CRUD

### 2.2 Database
- **PostgreSQL**
- Prisma (or drizzle-orm)
- Runs in Docker on the VM (persistent volume)

### 2.3 Auth implementation
- Email/password with session cookies.
- Use a battle-tested library if desired:
  - Auth.js with credentials provider (works, but you’ll still define user model + password hashing)
- Otherwise implement minimal custom:
  - `/login` endpoint verifies password hash
  - signed session token stored in HttpOnly cookie
  - session table in Postgres

### 2.4 Image handling
- Upload endpoint accepts multipart form uploads
- Store metadata in DB
- Store binary either:
  - S3-compatible bucket (recommended), or
  - local volume (`/data/uploads`) served by Nginx (simple)

---

## 3) Architecture overview
- PWA frontend served by the app
- App provides authenticated CRUD API
- Postgres storage
- Nginx reverse proxy for TLS and routing

Security baseline:
- HTTPS only (Let’s Encrypt)
- DB not exposed publicly
- Rate limit login and upload
- Validate URLs, validate uploads
- Backups + restore test

---

## 4) Deployment plan (Hetzner VM)

### 4.1 VM setup
- Ubuntu LTS
- Docker + Docker Compose
- Firewall: only 80/443 open
- SSH keys only

### 4.2 Services (docker-compose)
- `app` (Next.js)
- `db` (Postgres)
- `nginx` (reverse proxy)
- TLS via certbot or an ACME-enabled nginx setup

### 4.3 Backups
- nightly `pg_dump` with rotation (e.g., keep 14 days)
- also backup image storage:
  - if S3/object storage: rely on bucket + lifecycle rules (still keep DB backups)
  - if local filesystem: include `/data/uploads` in backup job

---

## 5) Milestones & tasks

### Milestone A — Skeleton
- [ ] Repo setup + lint/format
- [ ] Next.js app running locally
- [ ] Base mobile layout + navigation
- [ ] Dockerfile + dev docker-compose

### Milestone B — Auth (email + password)
- [ ] User table
- [ ] Password hashing (Argon2/bcrypt)
- [ ] Login page + API
- [ ] Session cookies + logout
- [ ] Disable public signup or require invite code
- [ ] Rate limiting + basic brute-force protection

### Milestone C — Items CRUD
- [ ] Items schema + migrations
- [ ] Create item (type + tags + priority)
- [ ] List items (pagination optional)
- [ ] Edit item
- [ ] Done/Archive actions

### Milestone D — Attachments
- [ ] Link model + add/remove UI
- [ ] Image upload:
  - [ ] upload endpoint
  - [ ] storage (S3 or local)
  - [ ] gallery on item detail
  - [ ] deletion support

### Milestone E — Filtering, sorting, polish
- [ ] Search
- [ ] Tag chips + multi-filter
- [ ] Sort dropdown
- [ ] Better “quick add” flow
- [ ] Touch-friendly UI improvements

### Milestone F — PWA + Deploy
- [ ] PWA manifest + icons
- [ ] Service worker caching
- [ ] Deploy to Hetzner with HTTPS
- [ ] Backups + restore test
- [ ] Optional: GitHub Actions deploy via SSH

---

## 6) Database schema draft

### users
- id uuid pk
- email text unique not null
- password_hash text not null
- name text
- created_at timestamp

### sessions
- id uuid pk
- user_id uuid fk users
- token_hash text unique not null
- created_at timestamp
- expires_at timestamp

### items
- id uuid pk
- title text not null
- type text not null  -- enum: idea/recipe/activity/project/location
- description text
- priority int not null default 1
- status text not null default 'active'
- due_date date null
- tags text[] default '{}'
- pinned bool default false
- created_by uuid fk users
- created_at timestamp
- updated_at timestamp

Indexes:
- items(status)
- items(type)
- items(priority)
- items(updated_at)
- GIN index on tags (optional but nice)

### item_links
- id uuid pk
- item_id uuid fk items on delete cascade
- title text null
- url text not null
- created_at timestamp

Index:
- item_links(item_id)

### item_images
- id uuid pk
- item_id uuid fk items on delete cascade
- storage_key text not null       -- e.g. s3 key or local file path
- url text not null               -- public or signed url approach
- content_type text
- byte_size int
- width int null
- height int null
- created_at timestamp

Index:
- item_images(item_id)

---

## 7) UX principles
- Default list shows **active** items
- Big “+ Add” button (one-handed use)
- Create flow: title → type → priority → tags → optional details
- Item detail: attachments are easy to add quickly (link paste / camera upload)

---

## 8) Definition of Done (v1)
- PWA install works on phone
- Email + password login works (hashed passwords, sessions)
- CRUD items works with the 5 types
- Tags + priority + sorting/filtering work
- Links attachable to items
- Images attachable to items (upload + display)
- Runs on Hetzner VM behind HTTPS with backups that can be restored
