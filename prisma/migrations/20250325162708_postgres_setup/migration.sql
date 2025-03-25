-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "board" TEXT NOT NULL DEFAULT '000000000',
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "player1Id" TEXT,
    "player2Id" TEXT,
    "winnerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);
