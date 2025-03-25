import React from "react";

interface GameHistoryProps {
  moves: { player: number; position: number }[];
  isPlayer1: boolean;
}

const GameHistory: React.FC<GameHistoryProps> = ({ moves, isPlayer1 }) => {
  // Convert position to row and column
  const getCoordinates = (position: number) => {
    const row = Math.floor(position / 3) + 1;
    const col = (position % 3) + 1;
    return `(${row},${col})`;
  };

  const getSymbol = (playerNumber: number) => {
    return playerNumber === 1 ? "X" : "O";
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 h-full">
      <h2 className="text-xl font-bold mb-4 text-gray-700">Game History</h2>

      {moves.length === 0 ? (
        <p className="text-gray-500 italic">No moves yet</p>
      ) : (
        <ul className="space-y-2">
          {moves.map((move, index) => {
            const isYou =
              (move.player === 1 && isPlayer1) ||
              (move.player === 2 && !isPlayer1);
            return (
              <li
                key={index}
                className={`p-2 rounded ${
                  isYou ? "bg-blue-100" : "bg-gray-100"
                }`}
              >
                <span
                  className={`font-medium ${
                    move.player === 1 ? "text-blue-600" : "text-red-600"
                  }`}
                >
                  {isYou ? "You" : "Opponent"} ({getSymbol(move.player)})
                </span>
                <span className="text-gray-600"> moved to </span>
                <span className="font-medium">
                  {getCoordinates(move.position)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default GameHistory;
