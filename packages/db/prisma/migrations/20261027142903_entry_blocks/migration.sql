-- AlterTable
ALTER TABLE "Entry" ADD COLUMN     "blocks" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "design" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "path" TEXT NOT NULL DEFAULT 'info';
