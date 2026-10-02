-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('PENDING', 'FINISHED');

-- CreateTable
CREATE TABLE "matchday" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "playDate" DATE NOT NULL,
    "finalizedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "matchday_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "match" (
    "id" TEXT NOT NULL,
    "matchdayId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "teamAId" TEXT NOT NULL,
    "teamBId" TEXT NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'PENDING',
    "locked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "goal" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "scorerId" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "point_deduction" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "point_deduction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "league_snapshot" (
    "leagueId" TEXT NOT NULL,
    "standings" JSONB NOT NULL,
    "topScorers" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "league_snapshot_pkey" PRIMARY KEY ("leagueId")
);

-- CreateTable
CREATE TABLE "login_failure" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_failure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "matchday_leagueId_playDate_key" ON "matchday"("leagueId", "playDate");

-- CreateIndex
CREATE INDEX "match_matchdayId_idx" ON "match"("matchdayId");

-- CreateIndex
CREATE INDEX "goal_matchId_idx" ON "goal"("matchId");

-- CreateIndex
CREATE INDEX "goal_scorerId_idx" ON "goal"("scorerId");

-- CreateIndex
CREATE INDEX "point_deduction_teamId_idx" ON "point_deduction"("teamId");

-- CreateIndex
CREATE INDEX "login_failure_email_createdAt_idx" ON "login_failure"("email", "createdAt");

-- AddForeignKey
ALTER TABLE "matchday" ADD CONSTRAINT "matchday_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "league"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match" ADD CONSTRAINT "match_matchdayId_fkey" FOREIGN KEY ("matchdayId") REFERENCES "matchday"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match" ADD CONSTRAINT "match_teamAId_fkey" FOREIGN KEY ("teamAId") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "match" ADD CONSTRAINT "match_teamBId_fkey" FOREIGN KEY ("teamBId") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal" ADD CONSTRAINT "goal_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal" ADD CONSTRAINT "goal_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goal" ADD CONSTRAINT "goal_scorerId_fkey" FOREIGN KEY ("scorerId") REFERENCES "player"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "point_deduction" ADD CONSTRAINT "point_deduction_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "league_snapshot" ADD CONSTRAINT "league_snapshot_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "league"("id") ON DELETE CASCADE ON UPDATE CASCADE;
