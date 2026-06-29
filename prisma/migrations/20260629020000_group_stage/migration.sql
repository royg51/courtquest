-- AlterTable
ALTER TABLE "Round" ADD COLUMN     "groupNumber" INTEGER;

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "groupNumber" INTEGER;

-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "groupSize" INTEGER,
ADD COLUMN     "playoffFormat" TEXT,
ADD COLUMN     "qualifiersPerGroup" INTEGER;
