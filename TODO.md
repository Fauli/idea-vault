# TODO.md — Pocket Ideas Implementation Checklist

This document tracks all implementation tasks for the Pocket Ideas PWA.
Check off items as completed. Follow the order of milestones for a logical build progression.

---

## Milestone A — Project Skeleton

### A1. Repository & Tooling Setup
- [ ] Initialize git repository
- [ ] Create `.gitignore` (node_modules, .env*, .next, postgres data, uploads)
- [ ] Initialize Next.js project with App Router (`npx create-next-app@latest --typescript --tailwind --eslint --app`)
- [ ] Configure TypeScript (`tsconfig.json` - strict mode)
- [ ] Set up ESLint + Prettier with consistent config
- [ ] Create `.env.example` with required environment variables
- [ ] Add `README.md` with local development instructions

### A2. Project Structure
- [ ] Create folder structure:
  ```
  /app
    /(auth)/login/page.tsx
    /(app)/layout.tsx
    /(app)/items/page.tsx
    /(app)/items/[id]/page.tsx
    /(app)/items/new/page.tsx
  /lib
    db.ts
    auth.ts
    utils.ts
  /components
    /ui (buttons, inputs, cards)
    /items (item-specific components)
  /prisma
    schema.prisma
  ```
- [ ] Set up path aliases in `tsconfig.json` (`@/lib`, `@/components`, etc.)

### A3. Database Setup
- [ ] Install Prisma (`npm install prisma @prisma/client`)
- [ ] Initialize Prisma with PostgreSQL (`npx prisma init`)
- [ ] Configure `DATABASE_URL` in `.env`
- [ ] Create initial Prisma schema (empty, just datasource + generator)
- [ ] Verify Prisma connection to local Postgres

### A4. Base Layout & Navigation
- [ ] Create root layout with Tailwind base styles
- [ ] Design mobile-first shell layout (header, main content area, bottom nav)
- [ ] Create bottom navigation component (Home, Add, Settings icons)
- [ ] Add viewport meta tags for mobile (no zoom, theme-color)
- [ ] Test layout on mobile viewport (375px width)

### A5. Docker Development Environment
- [ ] Create `Dockerfile` for Next.js app (multi-stage build)
- [ ] Create `docker-compose.yml` for local development:
  - `app` service (Next.js)
  - `db` service (PostgreSQL 15+ with volume)
- [ ] Create `docker-compose.override.yml` for dev-specific settings (hot reload)
- [ ] Add `.dockerignore`
- [ ] Test `docker-compose up` runs app + database

---

## Milestone B — Authentication

### B1. User Schema & Database
- [ ] Add `User` model to Prisma schema:
  - `id` (UUID, default uuid)
  - `email` (unique, not null)
  - `passwordHash` (not null)
  - `name` (optional)
  - `createdAt` (default now)
- [ ] Add `Session` model to Prisma schema:
  - `id` (UUID)
  - `userId` (FK to User)
  - `tokenHash` (unique)
  - `createdAt`
  - `expiresAt`
- [ ] Run migration (`npx prisma migrate dev --name add-auth-tables`)
- [ ] Generate Prisma client

### B2. Password Hashing
- [ ] Install bcrypt or argon2 (`npm install bcrypt` or `npm install argon2`)
- [ ] Create `/lib/password.ts`:
  - `hashPassword(plain: string): Promise<string>`
  - `verifyPassword(plain: string, hash: string): Promise<boolean>`
- [ ] Write unit tests for password functions

### B3. Session Management
- [ ] Create `/lib/session.ts`:
  - `createSession(userId: string): Promise<string>` (returns token)
  - `validateSession(token: string): Promise<User | null>`
  - `deleteSession(token: string): Promise<void>`
  - `deleteExpiredSessions(): Promise<void>` (cleanup utility)
- [ ] Session token: generate with `crypto.randomBytes(32)`
- [ ] Store hashed token in DB (not plain)
- [ ] Set session expiry (e.g., 30 days)

### B4. Auth Cookies
- [ ] Create `/lib/cookies.ts`:
  - `setSessionCookie(token: string)`
  - `getSessionCookie(): string | null`
  - `clearSessionCookie()`
- [ ] Cookie settings: HttpOnly, Secure (in prod), SameSite=Lax, Path=/

### B5. Login Flow
- [ ] Create login page `/app/(auth)/login/page.tsx`
- [ ] Build login form component (email, password inputs)
- [ ] Create login server action `/app/(auth)/login/actions.ts`:
  - Validate input (Zod schema)
  - Find user by email
  - Verify password
  - Create session
  - Set cookie
  - Redirect to `/items`
- [ ] Handle errors: generic "Invalid credentials" message
- [ ] Style login page (centered card, mobile-friendly)

### B6. Logout
- [ ] Create logout server action
- [ ] Delete session from DB
- [ ] Clear session cookie
- [ ] Redirect to login page
- [ ] Add logout button to app layout/settings

### B7. Route Protection
- [ ] Create auth middleware or layout-level check
- [ ] Protect all `/(app)` routes - redirect to login if no valid session
- [ ] Create `getCurrentUser()` helper for server components
- [ ] Test: unauthenticated access redirects to login

### B8. User Seeding (No Public Signup)
- [ ] Create seed script (`prisma/seed.ts`):
  - Create 2 users with hashed passwords
  - Passwords provided via environment variables or prompts
- [ ] Add seed script to `package.json`
- [ ] Document seed process in README
- [ ] Alternative: invite code system (optional, can skip for v1)

### B9. Rate Limiting
- [ ] Install rate limiter (`npm install rate-limiter-flexible` or similar)
- [ ] Create rate limit middleware for login endpoint
- [ ] Limit: e.g., 5 attempts per email per 15 minutes
- [ ] Return 429 on exceeded limit
- [ ] Log failed attempts (without passwords)

---

## Milestone C — Items CRUD

### C1. Item Schema
- [ ] Add `Item` model to Prisma schema:
  - `id` (UUID)
  - `title` (String, not null)
  - `type` (Enum: IDEA, RECIPE, ACTIVITY, PROJECT, LOCATION)
  - `description` (String, optional)
  - `priority` (Int, default 1, range 0-3)
  - `status` (Enum: ACTIVE, DONE, ARCHIVED, default ACTIVE)
  - `dueDate` (DateTime, optional)
  - `tags` (String[])
  - `pinned` (Boolean, default false)
  - `createdBy` (FK to User)
  - `createdAt`
  - `updatedAt`
- [ ] Add indexes: status, type, priority, updatedAt
- [ ] Run migration (`npx prisma migrate dev --name add-items`)

### C2. Validation Schemas
- [ ] Install Zod (`npm install zod`)
- [ ] Create `/lib/validations/item.ts`:
  - `createItemSchema`
  - `updateItemSchema`
- [ ] Validate: title required (1-200 chars), type required, priority 0-3, tags array of strings

### C3. Item Server Actions
- [ ] Create `/lib/actions/items.ts`:
  - `createItem(data)` - create and return new item
  - `getItem(id)` - fetch single item with auth check
  - `getItems(filters)` - fetch list with filters
  - `updateItem(id, data)` - update item fields
  - `archiveItem(id)` - set status to ARCHIVED
  - `markDone(id)` - set status to DONE
  - `restoreItem(id)` - set status back to ACTIVE
  - `deleteItem(id)` - hard delete (only for truly unwanted items)
- [ ] All actions: validate user session, validate input

### C4. Items List Page
- [ ] Create `/app/(app)/items/page.tsx`
- [ ] Fetch items for current user (all users see same items per spec)
- [ ] Display as card list (title, type badge, priority indicator, tags)
- [ ] Show empty state when no items
- [ ] Add floating "+" button for quick add
- [ ] Default filter: status = ACTIVE

### C5. Item Detail Page
- [ ] Create `/app/(app)/items/[id]/page.tsx`
- [ ] Fetch item by ID
- [ ] Display all fields (title, description, type, tags, priority, status, dates)
- [ ] Add edit button → switches to edit mode or navigates to edit page
- [ ] Add action buttons: Mark Done, Archive, Delete
- [ ] Back button to list

### C6. Create Item Page
- [ ] Create `/app/(app)/items/new/page.tsx`
- [ ] Build form: title (required), type (select), description (textarea)
- [ ] Add priority selector (0-3 or Low/Med/High/Urgent)
- [ ] Add tags input (comma-separated or chip input)
- [ ] Add due date picker (optional)
- [ ] Submit → create item → redirect to detail or list
- [ ] Cancel button → back to list

### C7. Edit Item
- [ ] Create edit functionality (inline on detail page or separate route)
- [ ] Pre-populate form with existing values
- [ ] Submit → update item → show success feedback
- [ ] Handle optimistic updates (optional, nice UX)

### C8. Item Components
- [ ] `ItemCard` - compact card for list view
- [ ] `ItemForm` - reusable form for create/edit
- [ ] `TypeBadge` - colored badge for item type
- [ ] `PriorityIndicator` - visual priority display
- [ ] `TagChip` - styled tag display
- [ ] `StatusBadge` - shows done/archived state

---

## Milestone D — Attachments

### D1. Links Schema
- [ ] Add `ItemLink` model to Prisma schema:
  - `id` (UUID)
  - `itemId` (FK to Item, cascade delete)
  - `title` (String, optional)
  - `url` (String, not null)
  - `createdAt`
- [ ] Add index on `itemId`
- [ ] Run migration

### D2. Links CRUD
- [ ] Create server actions:
  - `addLink(itemId, title, url)`
  - `removeLink(linkId)`
- [ ] Validate URL format (basic URL validation)
- [ ] Update item's `updatedAt` when links change

### D3. Links UI
- [ ] Add links section to item detail page
- [ ] Display links as clickable list (opens in new tab)
- [ ] Add "Add Link" button → modal or inline form
- [ ] Add delete button per link (with confirmation)
- [ ] Mobile-friendly tap targets

### D4. Images Schema
- [ ] Add `ItemImage` model to Prisma schema:
  - `id` (UUID)
  - `itemId` (FK to Item, cascade delete)
  - `storageKey` (String, not null) - S3 key or local path
  - `url` (String, not null) - accessible URL
  - `contentType` (String)
  - `byteSize` (Int)
  - `width` (Int, optional)
  - `height` (Int, optional)
  - `createdAt`
- [ ] Add index on `itemId`
- [ ] Run migration

### D5. Image Storage Setup
Choose one approach and implement:

#### Option A: S3-Compatible Storage (Recommended)
- [ ] Set up Hetzner Object Storage bucket (or MinIO for local dev)
- [ ] Install AWS SDK (`npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`)
- [ ] Create `/lib/storage.ts`:
  - `uploadImage(file, key): Promise<string>` - returns URL
  - `deleteImage(key): Promise<void>`
  - `getSignedUrl(key): Promise<string>` (if private bucket)
- [ ] Configure env vars: `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`

#### Option B: Local Filesystem
- [ ] Create uploads directory structure (`/data/uploads/images`)
- [ ] Create `/lib/storage.ts`:
  - `uploadImage(file, key): Promise<string>`
  - `deleteImage(key): Promise<void>`
- [ ] Configure Nginx to serve `/uploads` path
- [ ] Add volume mount in docker-compose

### D6. Image Upload Endpoint
- [ ] Create upload API route `/app/api/upload/route.ts`
- [ ] Accept multipart form data
- [ ] Validate:
  - File size ≤ 10 MB
  - MIME type: image/jpeg, image/png, image/webp only
  - User authenticated
- [ ] Generate unique storage key (UUID + extension)
- [ ] Upload to storage
- [ ] Return image metadata (id, url)

### D7. Image CRUD
- [ ] Create server actions:
  - `addImage(itemId, imageData)` - save metadata after upload
  - `removeImage(imageId)` - delete from storage + DB
- [ ] Update item's `updatedAt` when images change

### D8. Images UI
- [ ] Add image gallery section to item detail page
- [ ] Display images in responsive grid
- [ ] Tap image → full-screen lightbox view
- [ ] Add "Add Image" button → file picker or camera
- [ ] Support camera capture on mobile (`accept="image/*" capture="environment"`)
- [ ] Show upload progress indicator
- [ ] Add delete button per image (with confirmation)
- [ ] Handle upload errors gracefully

### D9. Attachment Cleanup
- [ ] When item is deleted, cascade deletes links (automatic via FK)
- [ ] When item is deleted, delete associated images from storage
- [ ] Create cleanup job for orphaned images (optional, safety net)

---

## Milestone E — Filtering, Sorting & Polish

### E1. Search
- [ ] Add search input to items list page
- [ ] Search by title (case-insensitive, contains)
- [ ] Search by description (optional, may be slower)
- [ ] Debounce search input (300ms)
- [ ] Show "No results" state

### E2. Tag Filtering
- [ ] Collect all unique tags from items
- [ ] Display tag filter chips above list
- [ ] Allow multi-select tags (AND or OR logic - pick one)
- [ ] Clear filters button
- [ ] URL state for filters (shareable/bookmarkable)

### E3. Type & Status Filters
- [ ] Add type filter dropdown/chips (all 5 types)
- [ ] Add status filter (Active, Done, Archived, All)
- [ ] Default: Active status only
- [ ] Combine filters (type AND status AND tags)

### E4. Sorting
- [ ] Add sort dropdown to list page
- [ ] Sort options:
  - Priority (high to low) - default
  - Recently updated
  - Recently created
  - Due date (soonest first)
  - Alphabetical
- [ ] Persist sort preference (localStorage or cookie)

### E5. Tag Autocomplete
- [ ] On create/edit form, suggest existing tags as user types
- [ ] Show dropdown with matching tags
- [ ] Allow creating new tags
- [ ] Fetch tags list once and cache

### E6. Quick Add Flow
- [ ] Optimize "new item" for speed
- [ ] Title field auto-focused
- [ ] Type selector with large tap targets
- [ ] Optional: "Add & New" button to create and start another
- [ ] Keyboard: Enter submits form

### E7. UI Polish
- [ ] Review all touch targets (minimum 44x44px)
- [ ] Add loading states (skeletons or spinners)
- [ ] Add success/error toast notifications
- [ ] Improve empty states with helpful messages
- [ ] Test dark mode (if supporting)
- [ ] Ensure consistent spacing and typography
- [ ] Add pull-to-refresh on list (optional)

### E8. Pinned Items
- [ ] Add pin/unpin action to items
- [ ] Pinned items appear at top of list (regardless of sort)
- [ ] Visual indicator for pinned items (pin icon)

---

## Milestone F — PWA & Deployment

### F1. PWA Manifest
- [ ] Create `/public/manifest.json`:
  - `name`, `short_name`
  - `start_url`: `/items`
  - `display`: `standalone`
  - `theme_color`, `background_color`
  - `icons`: multiple sizes (192, 512, maskable)
- [ ] Create app icons (design or generate)
- [ ] Add manifest link to `<head>`
- [ ] Add `apple-touch-icon` for iOS
- [ ] Add `theme-color` meta tag

### F2. Service Worker
- [ ] Install next-pwa or configure manually
- [ ] Cache app shell (HTML, CSS, JS)
- [ ] Cache strategy: Network-first for API, Cache-first for assets
- [ ] Handle offline: show cached content or offline page
- [ ] Test: app loads after going offline (app shell at minimum)

### F3. Install Prompts
- [ ] Test "Add to Home Screen" on Android Chrome
- [ ] Test "Add to Home Screen" on iOS Safari
- [ ] Optional: custom install prompt banner

### F4. Production Docker Setup
- [ ] Update Dockerfile for production build
- [ ] Create `docker-compose.prod.yml`:
  - `app` with production settings
  - `db` with proper resource limits
  - `nginx` for reverse proxy
- [ ] Configure environment variables for production
- [ ] Build and test production image locally

### F5. Nginx Configuration
- [ ] Create `nginx.conf`:
  - Reverse proxy to Next.js app
  - SSL termination
  - Gzip compression
  - Security headers (HSTS, X-Frame-Options, etc.)
  - Rate limiting for login endpoint
  - Serve static uploads (if local storage)
- [ ] Test nginx config locally

### F6. SSL/TLS Setup
- [ ] Choose approach:
  - Certbot with nginx
  - Caddy (auto-HTTPS alternative)
  - Traefik
- [ ] Configure certificate auto-renewal
- [ ] Redirect HTTP → HTTPS
- [ ] Test SSL Labs rating (aim for A+)

### F7. Hetzner VM Setup
- [ ] Provision VM (Ubuntu LTS, 2+ GB RAM)
- [ ] Configure firewall (UFW):
  - Allow 22 (SSH)
  - Allow 80, 443 (HTTP/HTTPS)
  - Block all else
- [ ] Disable password SSH (key-only)
- [ ] Install Docker + Docker Compose
- [ ] Create non-root deploy user

### F8. Deployment Process
- [ ] Clone repo to server
- [ ] Configure `.env` on server
- [ ] Run `docker-compose -f docker-compose.prod.yml up -d`
- [ ] Verify app is accessible via HTTPS
- [ ] Run database migrations
- [ ] Seed initial users
- [ ] Document deployment steps in README

### F9. Backups
- [ ] Create backup script:
  - `pg_dump` database
  - Compress with timestamp
  - Rotate old backups (keep 14 days)
- [ ] If local images: include `/data/uploads` in backup
- [ ] Set up cron job for nightly backups
- [ ] Store backups off-server (optional: S3, rsync to another location)
- [ ] **Test restore process** - verify backup actually works
- [ ] Document backup/restore procedure

### F10. Monitoring & Logging (Basic)
- [ ] Ensure Docker logs are accessible (`docker logs`)
- [ ] Set up log rotation
- [ ] Optional: health check endpoint `/api/health`
- [ ] Optional: uptime monitoring (UptimeRobot, etc.)

### F11. CI/CD (Optional)
- [ ] Create GitHub Actions workflow:
  - Run tests on PR
  - Build Docker image
  - Deploy to server via SSH on main branch merge
- [ ] Store secrets in GitHub Actions secrets

---

## Post-MVP Enhancements (Nice-to-Have)

These are not required for v1 but can be added later:

- [ ] Image thumbnails (generate on upload)
- [ ] Offline mode (full read-only cache of items)
- [ ] Push notifications
- [ ] Recurring items / reminders
- [ ] Import/export data (JSON/CSV)
- [ ] Bulk actions (archive multiple, tag multiple)
- [ ] Item templates
- [ ] Activity log / history
- [ ] Markdown rendering in descriptions
- [ ] Drag-and-drop reordering
- [ ] Dark mode toggle
- [ ] Multiple users with granular permissions

---

## Definition of Done Checklist

Before declaring v1 complete, verify:

- [ ] PWA installs on Android phone
- [ ] PWA installs on iOS (Add to Home Screen)
- [ ] Login works with email + password
- [ ] Passwords are hashed in database
- [ ] Sessions persist across browser restarts
- [ ] Can create items of all 5 types
- [ ] Can edit items
- [ ] Can mark items as Done
- [ ] Can archive items
- [ ] Tags work (add, filter by)
- [ ] Priority works (set, sort by)
- [ ] Search works
- [ ] Can add links to items
- [ ] Can upload images to items
- [ ] Images display correctly
- [ ] App runs on Hetzner VM
- [ ] HTTPS works with valid certificate
- [ ] Backups run nightly
- [ ] Backup restore has been tested
- [ ] App feels fast on mobile
- [ ] No obvious security issues (OWASP basics)

---

## Progress Tracking

| Milestone | Status | Notes |
|-----------|--------|-------|
| A - Skeleton | Not Started | |
| B - Auth | Not Started | |
| C - Items CRUD | Not Started | |
| D - Attachments | Not Started | |
| E - Polish | Not Started | |
| F - Deploy | Not Started | |

Last updated: 2026-02-02
