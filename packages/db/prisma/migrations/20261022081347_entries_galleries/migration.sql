-- CreateEnum
CREATE TYPE "EntryKind" AS ENUM ('CATEGORY', 'GALLERY', 'DETAIL');

-- CreateTable
CREATE TABLE "Entry" (
    "id" TEXT NOT NULL,
    "kind" "EntryKind" NOT NULL,
    "slug" TEXT NOT NULL,
    "group" TEXT NOT NULL DEFAULT '',
    "title" JSONB NOT NULL,
    "summary" JSONB NOT NULL,
    "body" JSONB NOT NULL,
    "cover" JSONB,
    "items" JSONB NOT NULL,
    "docs" JSONB NOT NULL,
    "links" JSONB NOT NULL,
    "info" JSONB NOT NULL,
    "related" JSONB NOT NULL,
    "seo" JSONB NOT NULL,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "publishAt" TIMESTAMP(3),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Entry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Entry_kind_status_isVisible_sortOrder_idx" ON "Entry"("kind", "status", "isVisible", "sortOrder");

-- CreateIndex
CREATE INDEX "Entry_group_idx" ON "Entry"("group");

-- CreateIndex
CREATE UNIQUE INDEX "Entry_kind_slug_key" ON "Entry"("kind", "slug");
