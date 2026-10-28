-- AlterTable
ALTER TABLE "User" ADD COLUMN     "recoveryCodes" JSONB,
ADD COLUMN     "totpLastStep" INTEGER;
