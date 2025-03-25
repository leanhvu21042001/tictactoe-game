import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { BoardState, checkWinner, makeMove } from "@/lib/game-logic";
import { triggerGameUpdate } from "@/lib/pusher";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { action, gameId, playerId, position } = await req.json();

    console.log({
      action,
      gameId,
      playerId,
      position,
    });

    switch (action) {
      case "CREATE":
        const newGame = await prisma.game.create({
          data: {
            player1Id: playerId,
            status: "WAITING",
          },
        });
        return NextResponse.json(newGame);

      case "JOIN":
        const game = await prisma.game.update({
          where: { id: gameId },
          data: {
            player2Id: playerId,
            status: "IN_PROGRESS",
          },
        });
        await triggerGameUpdate(gameId, {
          type: "GAME_STARTED",
          game,
        });
        return NextResponse.json(game);

      case "MOVE":
        const currentGame = await prisma.game.findUnique({
          where: { id: gameId },
        });

        if (!currentGame) {
          return NextResponse.json(
            { error: "Game not found" },
            { status: 404 }
          );
        }

        // Convert string board to array
        const board = currentGame.board.split("").map(Number) as BoardState;

        // Determine current player (1 or 2)
        const currentPlayer =
          currentGame.player1Id === playerId
            ? 1
            : currentGame.player2Id === playerId
            ? 2
            : null;

        if (!currentPlayer) {
          return NextResponse.json(
            { error: "Invalid player" },
            { status: 403 }
          );
        }

        // Make move
        const newBoard = makeMove(board, position, currentPlayer);

        // Check for winner
        const winner = checkWinner(newBoard);

        // Update game state
        const updatedGame = await prisma.game.update({
          where: { id: gameId },
          data: {
            board: newBoard.join(""),
            status:
              winner !== null
                ? winner === 0
                  ? "DRAW"
                  : "COMPLETED"
                : "IN_PROGRESS",
            winnerId:
              winner && winner !== 0
                ? winner === 1
                  ? currentGame.player1Id
                  : currentGame.player2Id
                : null,
          },
        });

        // Trigger real-time update
        await triggerGameUpdate(gameId, {
          type: "MOVE",
          board: newBoard,
          winner: winner,
        });

        return NextResponse.json(updatedGame);

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Game API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
