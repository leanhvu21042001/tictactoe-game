import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { BoardState, checkWinner, makeMove } from "@/lib/game-logic";
import { triggerGameUpdate } from "@/lib/pusher";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { action, gameId, position, channelId } = await req.json();

    switch (action) {
      case "CREATE":
        const newGame = await prisma.game.create({
          data: {
            player1: {
              connect: { id: session.user.id },
            },
            status: "WAITING",
            ...(channelId && {
              channel: {
                connect: { id: channelId },
              },
            }),
          },
          include: {
            player1: true,
            player2: true,
            channel: true,
          },
        });
        return NextResponse.json(newGame);

      case "JOIN":
        const game = await prisma.game.update({
          where: { id: gameId },
          data: {
            player2: {
              connect: { id: session.user.id },
            },
            status: "IN_PROGRESS",
          },
          include: {
            player1: true,
            player2: true,
            channel: true,
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
          include: {
            player1: true,
            player2: true,
            channel: true,
          },
        });

        if (!currentGame) {
          return NextResponse.json(
            { error: "Game not found" },
            { status: 404 }
          );
        }

        // Determine current player (1 or 2)
        const currentPlayer =
          currentGame.player1Id === session.user.id
            ? 1
            : currentGame.player2Id === session.user.id
            ? 2
            : null;

        if (!currentPlayer) {
          return NextResponse.json(
            { error: "Not a player in this game" },
            { status: 403 }
          );
        }

        // Convert string board to array
        const board = currentGame.board.split("").map(Number) as BoardState;

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
            ...(winner && winner !== 0
              ? {
                  winner: {
                    connect: {
                      id:
                        winner === 1
                          ? currentGame.player1Id
                          : currentGame.player2Id,
                    },
                  },
                }
              : {}),
          },
          include: {
            player1: true,
            player2: true,
            winner: true,
            channel: true,
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
