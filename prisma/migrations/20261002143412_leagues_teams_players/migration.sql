-- CreateEnum
CREATE TYPE "LeagueStatus" AS ENUM ('IN_PROGRESS', 'FINALIZED');

-- CreateTable
CREATE TABLE "league" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameKey" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "status" "LeagueStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "finalizedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "league_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameKey" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_crest" (
    "teamId" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "hash" TEXT NOT NULL,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "team_crest_pkey" PRIMARY KEY ("teamId")
);

-- CreateTable
CREATE TABLE "player" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameKey" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "player_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "league_ownerId_idx" ON "league"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "league_semester_nameKey_key" ON "league"("semester", "nameKey");

-- CreateIndex
CREATE UNIQUE INDEX "team_leagueId_nameKey_key" ON "team"("leagueId", "nameKey");

-- CreateIndex
CREATE INDEX "player_teamId_idx" ON "player"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "player_leagueId_nameKey_key" ON "player"("leagueId", "nameKey");

-- AddForeignKey
ALTER TABLE "league" ADD CONSTRAINT "league_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team" ADD CONSTRAINT "team_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "league"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_crest" ADD CONSTRAINT "team_crest_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player" ADD CONSTRAINT "player_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "league"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player" ADD CONSTRAINT "player_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
