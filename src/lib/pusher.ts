import Pusher from "pusher";
import { env } from "./env";

export const pusher = new Pusher({
  appId: env.PUSHER_APP_ID,
  key: env.NEXT_PUBLIC_PUSHER_KEY,
  secret: env.PUSHER_SECRET,
  cluster: env.NEXT_PUBLIC_PUSHER_CLUSTER,
  useTLS: true,
});

export const triggerGameUpdate = async (gameId: string, data: unknown) => {
  await pusher.trigger(`game-${gameId}`, "game-update", data);
};
