-- AlterTable
ALTER TABLE "Match" ADD COLUMN     "deadSlotA" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "deadSlotB" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "loserGoesToSlotA" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "loserNextMatchId" TEXT;

-- AlterTable
ALTER TABLE "Round" ADD COLUMN     "bracketSide" TEXT NOT NULL DEFAULT 'MAIN',
ADD COLUMN     "isBracketReset" BOOLEAN NOT NULL DEFAULT false;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_loserNextMatchId_fkey" FOREIGN KEY ("loserNextMatchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;

