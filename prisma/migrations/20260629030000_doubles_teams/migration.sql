-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "permanentTeamId" TEXT;

-- AlterTable
ALTER TABLE "TeamMember" ADD COLUMN     "inviteStatus" TEXT NOT NULL DEFAULT 'ACCEPTED',
ADD COLUMN     "inviteToken" TEXT;

-- CreateTable
CREATE TABLE "PermanentTeam" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sport" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PermanentTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PermanentTeamMember" (
    "id" TEXT NOT NULL,
    "permanentTeamId" TEXT NOT NULL,
    "userId" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "guestEmail" TEXT,
    "inviteStatus" TEXT NOT NULL DEFAULT 'ACCEPTED',
    "inviteToken" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PermanentTeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PermanentTeamMember_inviteToken_key" ON "PermanentTeamMember"("inviteToken");

-- CreateIndex
CREATE INDEX "PermanentTeamMember_userId_idx" ON "PermanentTeamMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_inviteToken_key" ON "TeamMember"("inviteToken");

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_permanentTeamId_fkey" FOREIGN KEY ("permanentTeamId") REFERENCES "PermanentTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermanentTeamMember" ADD CONSTRAINT "PermanentTeamMember_permanentTeamId_fkey" FOREIGN KEY ("permanentTeamId") REFERENCES "PermanentTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermanentTeamMember" ADD CONSTRAINT "PermanentTeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
