-- CreateTable
CREATE TABLE "item_images" (
    "id" UUID NOT NULL,
    "itemId" UUID NOT NULL,
    "storageKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "byteSize" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "item_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "item_images_itemId_idx" ON "item_images"("itemId");

-- AddForeignKey
ALTER TABLE "item_images" ADD CONSTRAINT "item_images_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
