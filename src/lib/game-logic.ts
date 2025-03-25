export type BoardState = [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number
];

export const checkWinner = (board: BoardState): number | null => {
  const winPatterns = [
    // Rows
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    // Columns
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    // Diagonals
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (const pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (board[a] !== 0 && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }

  return board.includes(0) ? null : 0; // Draw if no 0s left
};

export const makeMove = (
  board: BoardState,
  position: number,
  player: number
): BoardState => {
  if (board[position] !== 0) {
    throw new Error("Invalid move");
  }

  const newBoard = [...board] as BoardState;
  newBoard[position] = player;
  return newBoard;
};
