# Tic Tac Toe Real-Time Game

## Prerequisites

- Node.js (v18+)
- npm

## Setup Instructions

1. Clone the repository

```bash
git clone https://your-repo-url.git
cd tic-tac-toe
```

2. Install dependencies

```bash
npm install
```

3. Set up Pusher

- Create a free Pusher account at https://pusher.com
- Create a new Pusher Channels app
- Copy your App ID, Key, Secret, and Cluster

4. Configure environment variables

- Copy `.env.example` to `.env`
- Fill in your Pusher credentials

5. Initialize Prisma

```bash
npx prisma migrate dev --name init
```

6. Run the development server

```bash
npm run dev
```

7. Open the app in your browser

- Navigate to `http://localhost:3000`

## Game Rules

- Two players take turns
- Player 1 is X, Player 2 is O
- First to get 3 in a row (horizontally, vertically, or diagonally) wins
- Game ends in a draw if all squares are filled with no winner

## Technologies Used

- Next.js 14
- Prisma (SQLite)
- Pusher (Real-time updates)
- Tailwind CSS
- TypeScript

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
