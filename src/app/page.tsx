"use client";

import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import PusherClient from "pusher-js";
import GameLobby from "@/components/GameLobby";
import GameBoard from "@/components/GameBoard";
import GameStatus from "@/components/GameStatus";
import { BoardState } from "@/lib/game-logic";

interface GameState {
  id: string;
  board: string;
  status: string;
  player1Id: string | null;
  player2Id: string | null;
  winnerId: string | null;
}

export default function Home() {
  const [playerId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      // Generate a unique ID for the player
      const storedId = localStorage.getItem("ticTacToePlayerId");
      if (storedId) return storedId;
      const newId = uuidv4();
      localStorage.setItem("ticTacToePlayerId", newId);
      return newId;
    }

    // Return a temporary ID for server-side rendering
    return "temp-id";
  });

  const [game, setGame] = useState<GameState | null>(null);
  const [board, setBoard] = useState<BoardState>([0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [winner, setWinner] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Determine if it's the current player's turn
  const isPlayer1 = game?.player1Id === playerId;
  const currentPlayer =
    board.filter((cell) => cell !== 0).length % 2 === 0 ? 1 : 2;
  const isMyTurn =
    (isPlayer1 && currentPlayer === 1) || (!isPlayer1 && currentPlayer === 2);

  useEffect(() => {
    // Initialize Pusher if we have a game
    if (!game?.id) return;

    const pusher = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY || "", {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "",
    });

    const channel = pusher.subscribe(`game-${game.id}`);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    channel.bind("game-update", (data: any) => {
      if (data.type === "MOVE") {
        setBoard(data.board);

        if (data.winner !== null) {
          if (data.winner === 0) {
            setWinner("Draw");
          } else {
            const winnerIsPlayer1 = data.winner === 1;
            const isCurrentPlayerWinner =
              (winnerIsPlayer1 && isPlayer1) ||
              (!winnerIsPlayer1 && !isPlayer1);
            setWinner(isCurrentPlayerWinner ? "You" : "Opponent");
          }
        }
      } else if (data.type === "GAME_STARTED") {
        setGame(data.game);
        setBoard(data.game.board.split("").map(Number) as BoardState);
      }
    });

    return () => {
      pusher.unsubscribe(`game-${game.id}`);
    };
  }, [game?.id, isPlayer1]);

  // Update board when game changes
  useEffect(() => {
    if (game?.board) {
      setBoard(game.board.split("").map(Number) as BoardState);
    }
  }, [game?.board]);

  const createGame = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/game", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "CREATE",
          playerId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create game");
      }

      const newGame = await response.json();
      setGame(newGame);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error creating game");
    } finally {
      setLoading(false);
    }
  };

  const joinGame = async (gameId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/game", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "JOIN",
          gameId,
          playerId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to join game");
      }

      const joinedGame = await response.json();
      setGame(joinedGame);
      setBoard(joinedGame.board.split("").map(Number) as BoardState);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error joining game");
    } finally {
      setLoading(false);
    }
  };

  const makeMove = async (position: number) => {
    try {
      if (!game || !isMyTurn) return;

      setLoading(true);
      setError(null);
      const response = await fetch("/api/game", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "MOVE",
          gameId: game.id,
          playerId,
          position,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to make move");
      }

      const updatedGame = await response.json();
      setGame(updatedGame);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error making move");
    } finally {
      setLoading(false);
    }
  };

  const resetGame = () => {
    setGame(null);
    setBoard([0, 0, 0, 0, 0, 0, 0, 0, 0]);
    setWinner(null);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 space-y-6">
          <h1 className="text-3xl font-bold text-center text-gray-800">
            Tic Tac Toe
          </h1>

          {error && (
            <div className="bg-red-100 text-red-700 p-3 rounded-md text-center">
              {error}
            </div>
          )}

          {loading && (
            <div className="text-center p-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-600">Loading...</p>
            </div>
          )}

          {!game ? (
            <GameLobby onCreateGame={createGame} onJoinGame={joinGame} />
          ) : (
            <div className="space-y-6">
              <GameStatus
                gameId={game.id}
                status={game.status}
                winner={winner}
                isPlayer1={isPlayer1}
              />

              {game.status === "IN_PROGRESS" && (
                <GameBoard
                  board={board}
                  currentPlayer={currentPlayer}
                  isMyTurn={isMyTurn}
                  onCellClick={makeMove}
                />
              )}

              {(game.status === "COMPLETED" || game.status === "DRAW") && (
                <button
                  onClick={resetGame}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  Play Again
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
