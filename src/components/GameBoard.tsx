import React from "react";
import type { BoardState } from "@/lib/game-logic";

interface GameBoardProps {
  board: BoardState;
  currentPlayer: number;
  isMyTurn: boolean;
  onCellClick: (position: number) => void;
}

const GameBoard: React.FC<GameBoardProps> = ({
  board,
  currentPlayer,
  isMyTurn,
  onCellClick,
}) => {
  const renderCell = (position: number) => {
    const value = board[position];

    return (
      <button
        key={position}
        className={`h-20 w-20 border border-gray-300 flex items-center justify-center text-4xl font-bold
          ${
            isMyTurn && value === 0
              ? "hover:bg-gray-100 cursor-pointer"
              : "cursor-not-allowed"
          }
          ${
            value === 0
              ? "bg-white"
              : value === 1
              ? "bg-blue-100"
              : "bg-red-100"
          }`}
        onClick={() => value === 0 && isMyTurn && onCellClick(position)}
        disabled={value !== 0 || !isMyTurn}
      >
        {value === 1 ? "X" : value === 2 ? "O" : ""}
      </button>
    );
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-lg font-semibold">
        {isMyTurn ? "Your turn!" : "Opponent's turn..."}
      </div>
      <div className="grid grid-cols-3 gap-1">
        {Array.from({ length: 9 }, (_, i) => renderCell(i))}
      </div>
    </div>
  );
};

export default GameBoard;
