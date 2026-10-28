-- AlterTable
ALTER TABLE "SeoMeta" ADD COLUMN     "keywords" JSONB;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarUrl" TEXT;

-- CreateTable
CREATE TABLE "PageView" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sid" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "referrer" TEXT,
    "device" TEXT NOT NULL,
    "country" TEXT,
    "durationSec" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PageView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PageView_createdAt_idx" ON "PageView"("createdAt");

-- CreateIndex
CREATE INDEX "PageView_sid_idx" ON "PageView"("sid");

-- CreateIndex
CREATE INDEX "PageView_path_idx" ON "PageView"("path");
