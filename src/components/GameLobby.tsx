import React, { useState } from "react";

interface GameLobbyProps {
  onCreateGame: () => void;
  onJoinGame: (gameId: string) => void;
}

const GameLobby: React.FC<GameLobbyProps> = ({ onCreateGame, onJoinGame }) => {
  const [gameId, setGameId] = useState("");

  const handleJoinGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (gameId.trim()) {
      onJoinGame(gameId.trim());
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 p-8 border rounded-lg shadow-md bg-white">
      <h2 className="text-2xl font-bold text-center">Tic Tac Toe</h2>

      <button
        onClick={onCreateGame}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
      >
        Create New Game
      </button>

      <div className="w-full text-center">
        <p className="text-gray-600">- OR -</p>
      </div>

      <form onSubmit={handleJoinGame} className="w-full">
        <div className="flex flex-col gap-4">
          <input
            type="text"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            placeholder="Enter Game ID"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!gameId.trim()}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Join Game
          </button>
        </div>
      </form>
    </div>
  );
};

export default GameLobby;
