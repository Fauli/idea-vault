# TODO.md — Pocket Ideas Implementation Checklist

This document tracks all implementation tasks for the Pocket Ideas PWA.
Check off items as completed. Follow the order of milestones for a logical build progression.

---

## Milestone A — Project Skeleton

### A1. Repository & Tooling Setup
- [x] Initialize git repository
- [x] Create `.gitignore` (node_modules, .env*, .next, postgres data, uploads)
- [x] Initialize Next.js project with App Router (`npx create-next-app@latest --typescript --tailwind --eslint --app`)
- [x] Configure TypeScript (`tsconfig.json` - strict mode)
- [x] Set up ESLint + Prettier with consistent config
- [x] Create `.env.example` with required environment variables
- [x] Add `README.md` with local development instructions

### A2. Project Structure
- [x] Create folder structure:
  ```
  /app
    /(auth)/login/page.tsx
    /(app)/layout.tsx
    /(app)/items/page.tsx
    /(app)/items/[id]/page.tsx
    /(app)/items/new/page.tsx
  /lib
    db.ts
    auth.ts (deferred to Milestone B)
    utils.ts
  /components
    /ui (buttons, inputs, cards)
    /items (item-specific components)
  /prisma
    schema.prisma
  ```
- [x] Set up path aliases in `tsconfig.json` (`@/lib`, `@/components`, etc.)

### A3. Database Setup
- [x] Install Prisma (`npm install prisma @prisma/client`)
- [x] Initialize Prisma with PostgreSQL (`npx prisma init`)
- [x] Configure `DATABASE_URL` in `.env`
- [x] Create initial Prisma schema (empty, just datasource + generator)
- [x] Verify Prisma connection to local Postgres (requires running DB)

### A4. Base Layout & Navigation
- [x] Create root layout with Tailwind base styles
- [x] Design mobile-first shell layout (header, main content area, bottom nav)
- [x] Create bottom navigation component (Home, Add, Settings icons)
- [x] Add viewport meta tags for mobile (no zoom, theme-color)
- [x] Test layout on mobile viewport (375px width)

### A5. Docker Development Environment
- [x] Create `Dockerfile` for Next.js app (multi-stage build)
- [x] Create `docker-compose.yml` for local development:
  - `app` service (Next.js)
  - `db` service (PostgreSQL 16+ with volume)
- [x] Create `docker-compose.override.yml` for dev-specific settings (hot reload)
- [x] Add `.dockerignore`
- [x] Test `docker-compose up` runs app + database

---

## Milestone B — Authentication

### B1. User Schema & Database
- [x] Add `User` model to Prisma schema:
  - `id` (UUID, default uuid)
  - `email` (unique, not null)
  - `passwordHash` (not null)
  - `name` (optional)
  - `createdAt` (default now)
- [x] Add `Session` model to Prisma schema:
  - `id` (UUID)
  - `userId` (FK to User)
  - `tokenHash` (unique)
  - `createdAt`
  - `expiresAt`
- [x] Run migration (`npx prisma migrate dev --name add-auth-tables`)
- [x] Generate Prisma client

### B2. Password Hashing
- [x] Install bcrypt or argon2 (`npm install bcrypt` or `npm install argon2`)
- [x] Create `/lib/password.ts`:
  - `hashPassword(plain: string): Promise<string>`
  - `verifyPassword(plain: string, hash: string): Promise<boolean>`
- [x] Write unit tests for password functions

### B3. Session Management
- [x] Create `/lib/session.ts`:
  - `createSession(userId: string): Promise<string>` (returns token)
  - `validateSession(token: string): Promise<User | null>`
  - `deleteSession(token: string): Promise<void>`
  - `deleteExpiredSessions(): Promise<void>` (cleanup utility)
- [x] Session token: generate with `crypto.randomBytes(32)`
- [x] Store hashed token in DB (not plain)
- [x] Set session expiry (e.g., 30 days)

### B4. Auth Cookies
- [x] Create `/lib/cookies.ts`:
  - `setSessionCookie(token: string)`
  - `getSessionCookie(): string | null`
  - `clearSessionCookie()`
- [x] Cookie settings: HttpOnly, Secure (in prod), SameSite=Lax, Path=/

### B5. Login Flow
- [x] Create login page `/app/(auth)/login/page.tsx`
- [x] Build login form component (email, password inputs)
- [x] Create login server action `/app/(auth)/login/actions.ts`:
  - Validate input (Zod schema)
  - Find user by email
  - Verify password
  - Create session
  - Set cookie
  - Redirect to `/items`
- [x] Handle errors: generic "Invalid credentials" message
- [x] Style login page (centered card, mobile-friendly)

### B6. Logout
- [x] Create logout server action
- [x] Delete session from DB
- [x] Clear session cookie
- [x] Redirect to login page
- [x] Add logout button to app layout/settings

### B7. Route Protection
- [x] Create auth middleware or layout-level check
- [x] Protect all `/(app)` routes - redirect to login if no valid session
- [x] Create `getCurrentUser()` helper for server components
- [x] Test: unauthenticated access redirects to login

### B8. User Seeding (No Public Signup)
- [x] Create seed script (`prisma/seed.ts`):
  - Create 2 users with hashed passwords
  - Passwords provided via environment variables or prompts
- [x] Add seed script to `package.json`
- [x] Document seed process in README
- [ ] Alternative: invite code system (optional, can skip for v1)

### B9. Rate Limiting
- [x] Install rate limiter (`npm install rate-limiter-flexible` or similar)
- [x] Create rate limit middleware for login endpoint
- [x] Limit: e.g., 5 attempts per email per 15 minutes
- [x] Return 429 on exceeded limit
- [x] Log failed attempts (without passwords)

---

## Milestone C — Items CRUD

### C1. Item Schema
- [x] Add `Item` model to Prisma schema:
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
- [x] Add indexes: status, type, priority, updatedAt
- [x] Run migration (`npx prisma migrate dev --name add-items`)

### C2. Validation Schemas
- [x] Install Zod (`npm install zod`)
- [x] Create `/lib/validations/item.ts`:
  - `createItemSchema`
  - `updateItemSchema`
- [x] Validate: title required (1-200 chars), type required, priority 0-3, tags array of strings

### C3. Item Server Actions
- [x] Create `/lib/actions/items.ts`:
  - `createItem(data)` - create and return new item
  - `getItem(id)` - fetch single item with auth check
  - `getItems(filters)` - fetch list with filters
  - `updateItem(id, data)` - update item fields
  - `archiveItem(id)` - set status to ARCHIVED
  - `markDone(id)` - set status to DONE
  - `restoreItem(id)` - set status back to ACTIVE
  - `deleteItem(id)` - hard delete (only for truly unwanted items)
- [x] All actions: validate user session, validate input

### C4. Items List Page
- [x] Create `/app/(app)/items/page.tsx`
- [x] Fetch items for current user (all users see same items per spec)
- [x] Display as card list (title, type badge, priority indicator, tags)
- [x] Show empty state when no items
- [x] Add floating "+" button for quick add (via bottom nav)
- [x] Default filter: status = ACTIVE

### C5. Item Detail Page
- [x] Create `/app/(app)/items/[id]/page.tsx`
- [x] Fetch item by ID
- [x] Display all fields (title, description, type, tags, priority, status, dates)
- [x] Add edit button → switches to edit mode or navigates to edit page
- [x] Add action buttons: Mark Done, Archive, Delete
- [x] Back button to list

### C6. Create Item Page
- [x] Create `/app/(app)/items/new/page.tsx`
- [x] Build form: title (required), type (select), description (textarea)
- [x] Add priority selector (0-3 or Low/Med/High/Urgent)
- [x] Add tags input (comma-separated or chip input)
- [x] Add due date picker (optional)
- [x] Submit → create item → redirect to detail or list
- [x] Cancel button → back to list

### C7. Edit Item
- [x] Create edit functionality (inline on detail page or separate route)
- [x] Pre-populate form with existing values
- [x] Submit → update item → show success feedback
- [ ] Handle optimistic updates (optional, nice UX)

### C8. Item Components
- [x] `ItemCard` - compact card for list view
- [x] `ItemForm` - reusable form for create/edit
- [x] `TypeBadge` - colored badge for item type
- [x] `PriorityIndicator` - visual priority display
- [x] `TagChip` - styled tag display
- [x] `StatusBadge` - shows done/archived state

---

## Milestone D — Attachments

### D1. Links Schema
- [x] Add `ItemLink` model to Prisma schema:
  - `id` (UUID)
  - `itemId` (FK to Item, cascade delete)
  - `title` (String, optional)
  - `url` (String, not null)
  - `createdAt`
- [x] Add index on `itemId`
- [x] Run migration

### D2. Links CRUD
- [x] Create server actions:
  - `addLink(itemId, title, url)`
  - `removeLink(linkId)`
- [x] Validate URL format (basic URL validation)
- [x] Update item's `updatedAt` when links change

### D3. Links UI
- [x] Add links section to item detail page
- [x] Display links as clickable list (opens in new tab)
- [x] Add "Add Link" button → modal or inline form
- [x] Add delete button per link (with confirmation)
- [x] Mobile-friendly tap targets

### D4. Images Schema
- [x] Add `ItemImage` model to Prisma schema:
  - `id` (UUID)
  - `itemId` (FK to Item, cascade delete)
  - `storageKey` (String, not null) - S3 key or local path
  - `url` (String, not null) - accessible URL
  - `contentType` (String)
  - `byteSize` (Int)
  - `width` (Int, optional)
  - `height` (Int, optional)
  - `sortOrder` (Int, default 0) - for reordering
  - `createdAt`
- [x] Add index on `itemId`
- [x] Run migration

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

#### Option B: Local Filesystem (Implemented)
- [x] Create uploads directory structure (`/data/uploads/images`)
- [x] Create `/lib/storage.ts`:
  - `uploadImage(file, key): Promise<string>`
  - `deleteImage(key): Promise<void>`
- [x] Create API route to serve uploads (`/api/uploads/[key]`)
- [x] Add volume mount in docker-compose

### D6. Image Upload Endpoint
- [x] Create upload API route `/app/api/upload/route.ts`
- [x] Accept multipart form data
- [x] Validate:
  - File size ≤ 10 MB
  - MIME type: image/jpeg, image/png, image/webp only
  - User authenticated
- [x] Generate unique storage key (UUID + extension)
- [x] Upload to storage
- [x] Return image metadata (id, url)

### D7. Image CRUD
- [x] Create server actions:
  - `addImage(itemId, imageData)` - save metadata after upload
  - `removeImage(imageId)` - delete from storage + DB
  - `reorderImages(itemId, imageIds)` - reorder images
- [x] Update item's `updatedAt` when images change

### D8. Images UI
- [x] Add image gallery section to item detail page
- [x] Display images in responsive grid
- [x] Tap image → full-screen lightbox view
- [x] Add "Add Image" button → file picker or camera
- [x] Support camera capture on mobile (`accept="image/*" capture="environment"`)
- [x] Show upload progress indicator
- [x] Add delete button per image (with confirmation)
- [x] Handle upload errors gracefully
- [x] Hero image for recipes/locations
- [x] Swipe gestures in lightbox
- [x] Pinch-to-zoom in lightbox
- [x] Image count badge on item cards
- [x] Tap to set as cover (reorder)

### D9. Attachment Cleanup
- [x] When item is deleted, cascade deletes links (automatic via FK)
- [x] When item is deleted, delete associated images from storage (cascade via FK)
- [ ] Create cleanup job for orphaned images (optional, safety net)

---

## Milestone E — Filtering, Sorting & Polish

### E1. Search
- [x] Add search input to items list page
- [x] Search by title (case-insensitive, contains)
- [x] Search by description (optional, may be slower)
- [x] Debounce search input (300ms)
- [x] Show "No results" state

### E2. Tag Filtering
- [x] Collect all unique tags from items
- [x] Display tag filter chips above list (clickable tags)
- [x] Tags clickable to filter by tag
- [x] Clear filters button
- [x] URL state for filters (shareable/bookmarkable)

### E3. Type & Status Filters
- [x] Add type filter dropdown/chips (all 5 types)
- [x] Add status filter (Active, Done, Archived tabs)
- [x] Add "All" status tab to see everything
- [x] Default: Active status only
- [x] Combine filters (type AND status AND search)

### E4. Sorting
- [x] Add sort dropdown to list page
- [x] Sort options:
  - Priority (high to low)
  - Recently updated (default)
  - Recently created
  - Due date (soonest first)
  - Alphabetical
- [x] Persist sort preference in URL params

### E5. Tag Autocomplete
- [x] On create/edit form, suggest existing tags as user types
- [x] Show dropdown with matching tags
- [x] Allow creating new tags
- [x] Fetch tags list on page load (server-side)

### E6. Quick Add Flow
- [x] Optimize "new item" for speed
- [x] Title field auto-focused
- [x] Type selector with large tap targets
- [ ] Optional: "Add & New" button to create and start another
- [ ] Keyboard: Enter submits form

### E7. UI Polish
- [ ] Review all touch targets (minimum 44x44px)
- [x] Add loading states (skeletons or spinners)
- [x] Add success/error toast notifications
- [x] Improve empty states with helpful messages
- [ ] Test dark mode (if supporting)
- [x] Ensure consistent spacing and typography
- [ ] Add pull-to-refresh on list (optional)
- [x] Collapsible "More options" in item form (Priority/Due Date)

### E8. Pinned Items
- [x] Add pin/unpin action to items
- [x] Pinned items appear at top of list (regardless of sort)
- [x] Visual indicator for pinned items (pin icon)

---

## Milestone F — PWA & Deployment

### F1. PWA Manifest
- [x] Create `/public/manifest.json`:
  - `name`, `short_name`
  - `start_url`: `/items`
  - `display`: `standalone`
  - `theme_color`, `background_color`
  - `icons`: multiple sizes (192, 512, maskable)
- [x] Create app icons (design or generate)
- [x] Add manifest link to `<head>`
- [x] Add `apple-touch-icon` for iOS
- [x] Add `theme-color` meta tag

### F2. Service Worker
- [x] Install serwist for Next.js PWA support
- [x] Cache app shell (HTML, CSS, JS)
- [x] Cache strategy: Network-first for API, Cache-first for assets
- [ ] Handle offline: show cached content or offline page
- [ ] Test: app loads after going offline (app shell at minimum)

### F3. Install Prompts
- [ ] Test "Add to Home Screen" on Android Chrome
- [ ] Test "Add to Home Screen" on iOS Safari
- [ ] Optional: custom install prompt banner

### F4. Production Docker Setup
- [x] Update Dockerfile for production build (npm, Node 22, uploads volume)
- [x] Create `docker-compose.prod.yml`:
  - `app` with production settings
  - `db` with proper resource limits
  - `nginx` for reverse proxy
- [x] Create `docker-compose.local.yml` for local testing
- [x] Configure environment variables for production (`.env.prod.example`)
- [x] Build and test production image locally

### F5. Nginx Configuration
- [x] Create `nginx.conf`:
  - Reverse proxy to Next.js app
  - SSL termination
  - Gzip compression
  - Security headers (HSTS, X-Frame-Options, etc.)
  - Rate limiting for login endpoint
  - Serve static uploads (if local storage)
- [x] Create `nginx.local.conf` for testing without SSL
- [x] Test nginx config locally

### F6. SSL/TLS Setup
- [x] Choose approach: Certbot with nginx
- [x] Configure certificate auto-renewal (cron job documented)
- [x] Redirect HTTP → HTTPS (nginx.conf)
- [ ] Test SSL Labs rating (aim for A+) - do after deployment

### F7. Hetzner VM Setup
- [x] Provision VM (Ubuntu LTS, 2+ GB RAM) - documented
- [x] Configure firewall (UFW):
  - Allow 22 (SSH)
  - Allow 80, 443 (HTTP/HTTPS)
  - Block all else
- [x] Disable password SSH (key-only)
- [x] Install Docker + Docker Compose
- [x] Create non-root deploy user
- [x] Created automated setup script: `scripts/server-setup.sh`

### F8. Deployment Process
- [x] Clone repo to server - documented
- [x] Configure `.env` on server - documented
- [x] Run `docker-compose -f docker-compose.prod.yml up -d` - documented
- [x] Verify app is accessible via HTTPS - documented
- [x] Run database migrations - documented (SSH tunnel method)
- [x] Seed initial users - documented
- [x] Document deployment steps: `docs/DEPLOYMENT.md`

### F9. Backups
- [x] Create backup script:
  - `pg_dump` database
  - Compress with timestamp
  - Rotate old backups (keep 14 days)
- [x] If local images: include `/data/uploads` in backup
- [x] Set up cron job for nightly backups - documented
- [ ] Store backups off-server (optional: S3, rsync to another location)
- [x] **Test restore process** - documented
- [x] Document backup/restore procedure

### F10. Monitoring & Logging (Basic)
- [x] Ensure Docker logs are accessible (`docker logs`) - documented
- [ ] Set up log rotation
- [ ] Optional: health check endpoint `/api/health`
- [x] Optional: uptime monitoring (UptimeRobot, etc.) - documented

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
| A - Skeleton | Complete | All tasks done |
| B - Auth | Complete | All tasks done |
| C - Items CRUD | Complete | All tasks done |
| D - Attachments | Complete | Links + Images with full UX (lightbox, reorder, hero) |
| E - Polish | In Progress | Search, filters, sorting, tag autocomplete done. Toasts remaining |
| F - Deploy | In Progress | Docker, nginx, Hetzner guide complete. Ready to deploy! |

Last updated: 2026-02-03
