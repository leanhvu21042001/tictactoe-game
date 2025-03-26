"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import PusherClient from "pusher-js";
import GameLobby from "@/components/GameLobby";
import GameBoard from "@/components/GameBoard";
import GameStatus from "@/components/GameStatus";
import GameHistory from "@/components/GameHistory";
import ChannelList from "@/components/ChannelList";
import FriendsList from "@/components/FriendsList";
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
  const { data: session, status } = useSession();
  const [game, setGame] = useState<GameState | null>(null);
  const [board, setBoard] = useState<BoardState>([0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const [winner, setWinner] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [moves, setMoves] = useState<{ player: number; position: number }[]>(
    []
  );

  // Determine if it's the current player's turn
  const isPlayer1 = game?.player1Id === session?.user?.id;
  const currentPlayer =
    board.filter((cell) => cell !== 0).length % 2 === 0 ? 1 : 2;
  const isMyTurn =
    (isPlayer1 && currentPlayer === 1) || (!isPlayer1 && currentPlayer === 2);

  useEffect(() => {
    if (!game?.id) return;

    const pusher = new PusherClient(process.env.NEXT_PUBLIC_PUSHER_KEY || "", {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER || "",
    });

    const channel = pusher.subscribe(`game-${game.id}`);
    channel.bind("game-update", (data: any) => {
      if (data.type === "MOVE") {
        const oldBoard = [...board];
        const newBoard = data.board;

        for (let i = 0; i < oldBoard.length; i++) {
          if (oldBoard[i] === 0 && newBoard[i] !== 0) {
            setMoves((prevMoves) => [
              ...prevMoves,
              { player: newBoard[i], position: i },
            ]);
            break;
          }
        }

        setBoard(newBoard);

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
  }, [game?.id, isPlayer1, board]);

  useEffect(() => {
    if (game?.board) {
      setBoard(game.board.split("").map(Number) as BoardState);
    }
  }, [game?.board]);

  const createGame = async () => {
    try {
      setLoading(true);
      setError(null);
      setMoves([]);
      const response = await fetch("/api/game", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "CREATE",
          playerId: session?.user?.id,
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
      setMoves([]);
      const response = await fetch("/api/game", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "JOIN",
          gameId,
          playerId: session?.user?.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to join game");
      }

      const joinedGame = await response.json();
      setGame(joinedGame);

      const newBoard = joinedGame.board.split("").map(Number) as BoardState;
      setBoard(newBoard);

      const moveHistory: { player: number; position: number }[] = [];
      newBoard.forEach((cell, index) => {
        if (cell !== 0) {
          moveHistory.push({ player: cell, position: index });
        }
      });
      setMoves(moveHistory);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error joining game");
    } finally {
      setLoading(false);
    }
  };

  const makeMove = async (position: number) => {
    try {
      if (!game || !isMyTurn || !session?.user?.id) return;

      setMoves((prevMoves) => [
        ...prevMoves,
        { player: currentPlayer, position },
      ]);

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
          playerId: session.user.id,
          position,
        }),
      });

      if (!response.ok) {
        setMoves((prevMoves) => prevMoves.slice(0, -1));
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
    setMoves([]);
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Welcome to Tic Tac Toe!</h1>
          <p className="text-gray-600 mb-8">Please sign in to play</p>
          <a
            href="/auth/signin"
            className="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 transition-colors"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Tic Tac Toe</h1>
          <div className="flex items-center gap-4">
            {session.user?.image && (
              <img
                src={session.user.image}
                alt={session.user.name || "User"}
                className="w-8 h-8 rounded-full"
              />
            )}
            <span>{session.user?.name}</span>
            <a
              href="/api/auth/signout"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Sign Out
            </a>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
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
                  <div className="relative">
                    <GameBoard
                      board={board}
                      currentPlayer={currentPlayer}
                      isMyTurn={isMyTurn && !loading}
                      onCellClick={!loading ? makeMove : () => {}}
                    />
                    {loading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-70">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                      </div>
                    )}
                  </div>
                )}

                {error && (
                  <div className="bg-red-100 text-red-700 p-3 rounded-md text-center">
                    {error}
                  </div>
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

          <div className="space-y-8">
            <ChannelList />
            <FriendsList />
            {game && <GameHistory moves={moves} isPlayer1={isPlayer1} />}
          </div>
        </div>
      </main>
    </div>
  );
}
