-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('IDEA', 'RECIPE', 'ACTIVITY', 'PROJECT', 'LOCATION');

-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('ACTIVE', 'DONE', 'ARCHIVED');

-- CreateTable
CREATE TABLE "items" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "type" "ItemType" NOT NULL,
    "description" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "status" "ItemStatus" NOT NULL DEFAULT 'ACTIVE',
    "dueDate" TIMESTAMP(3),
    "tags" TEXT[],
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "items_status_idx" ON "items"("status");

-- CreateIndex
CREATE INDEX "items_type_idx" ON "items"("type");

-- CreateIndex
CREATE INDEX "items_priority_idx" ON "items"("priority");

-- CreateIndex
CREATE INDEX "items_updatedAt_idx" ON "items"("updatedAt");

-- CreateIndex
CREATE INDEX "items_createdById_idx" ON "items"("createdById");

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
