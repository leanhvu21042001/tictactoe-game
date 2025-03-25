import React from "react";

interface GameStatusProps {
  gameId: string;
  status: string;
  winner: string | null;
  isPlayer1: boolean;
}

const GameStatus: React.FC<GameStatusProps> = ({
  gameId,
  status,
  winner,
  isPlayer1,
}) => {
  return (
    <div className="flex flex-col items-center gap-4 p-4 border rounded-lg bg-gray-50">
      <div className="grid grid-cols-2 gap-4 w-full">
        <div className="text-center p-2 rounded-md bg-blue-100">
          <p className="text-sm text-gray-600">Player 1 (X)</p>
          <p className="font-bold">{isPlayer1 ? "You" : "Opponent"}</p>
        </div>
        <div className="text-center p-2 rounded-md bg-red-100">
          <p className="text-sm text-gray-600">Player 2 (O)</p>
          <p className="font-bold">{isPlayer1 ? "Opponent" : "You"}</p>
        </div>
      </div>

      <div className="text-center w-full mt-2">
        <p className="text-sm text-gray-600">Game Status</p>
        <p className="font-semibold">
          {status === "WAITING" && "Waiting for opponent to join..."}
          {status === "IN_PROGRESS" && "Game in progress"}
          {status === "COMPLETED" &&
            winner &&
            (winner === "You" ? "You won!" : "Opponent won!")}
          {status === "DRAW" && "It's a draw!"}
        </p>
      </div>

      <div className="mt-2 p-2 bg-gray-100 rounded-md w-full text-center">
        <p className="text-sm text-gray-600">Game ID (Share with opponent)</p>
        <p className="font-mono text-sm select-all">{gameId}</p>
      </div>
    </div>
  );
};

export default GameStatus;
