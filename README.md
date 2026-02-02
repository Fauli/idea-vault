# Pocket Ideas

A private, mobile-first PWA for storing and managing ideas, recipes, activities, projects, and locations.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Auth**: Email + password (coming in Milestone B)
- **Deployment**: Docker Compose

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- Docker + Docker Compose (for database)

### Local Development (without Docker)

1. **Clone and install dependencies**:

   ```bash
   git clone <repo-url>
   cd pocket-ideas
   pnpm install
   ```

2. **Start PostgreSQL** (using Docker):

   ```bash
   docker compose up db -d
   ```

3. **Set up environment**:

   ```bash
   cp .env.example .env
   # Edit .env if needed
   ```

4. **Run migrations**:

   ```bash
   pnpm prisma db push
   ```

5. **Start development server**:

   ```bash
   pnpm dev
   ```

6. Open [http://localhost:3000](http://localhost:3000)

### Local Development (with Docker)

1. **Build and start all services**:

   ```bash
   docker compose up --build
   ```

2. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | See .env.example |
| `SESSION_SECRET` | Secret for session encryption | Generate a random 32-char string |

## Project Structure

```
/app
  /(auth)           # Auth pages (login)
  /(app)            # Main app pages (items list, detail, new)
  layout.tsx        # Root layout
  globals.css       # Global styles
/components
  /ui               # Reusable UI components
  bottom-nav.tsx    # Mobile bottom navigation
/lib
  db.ts             # Prisma client
  utils.ts          # Utility functions
/prisma
  schema.prisma     # Database schema
```

## Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm prisma studio` - Open Prisma Studio

## License

Private project - not for public distribution.
