-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "allowGuestRegistration" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "inviteCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Tournament_inviteCode_key" ON "Tournament"("inviteCode");

