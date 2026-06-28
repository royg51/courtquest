-- AlterTable
ALTER TABLE "Donation" ADD COLUMN     "tournamentId" TEXT;

-- CreateIndex
CREATE INDEX "TeamMember_userId_idx" ON "TeamMember"("userId");

-- CreateIndex
CREATE INDEX "Tournament_createdAt_idx" ON "Tournament"("createdAt");

-- AddForeignKey
ALTER TABLE "Donation" ADD CONSTRAINT "Donation_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE SET NULL ON UPDATE CASCADE;

