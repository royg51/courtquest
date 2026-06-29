-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "entryType" TEXT NOT NULL DEFAULT 'SOLO',
ADD COLUMN     "numberOfCourts" INTEGER NOT NULL DEFAULT 1;

