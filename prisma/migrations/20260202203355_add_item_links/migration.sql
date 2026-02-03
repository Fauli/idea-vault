-- CreateTable
CREATE TABLE "item_links" (
    "id" UUID NOT NULL,
    "itemId" UUID NOT NULL,
    "title" TEXT,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "item_links_itemId_idx" ON "item_links"("itemId");

-- AddForeignKey
ALTER TABLE "item_links" ADD CONSTRAINT "item_links_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
