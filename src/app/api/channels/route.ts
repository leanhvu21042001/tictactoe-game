import { NextRequest, NextResponse } from "next/server";
import { getServerSession, type Session } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = (await getServerSession(authOptions)) as Session & {
    user: { id: string };
  };
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { action, channelId, name, description } = await req.json();

    switch (action) {
      case "CREATE":
        const newChannel = await prisma.channel.create({
          data: {
            name,
            description,
            ownerId: session.user.id,
            members: {
              connect: { id: session.user.id },
            },
          },
          include: {
            owner: true,
            members: true,
          },
        });
        return NextResponse.json(newChannel);

      case "JOIN":
        const joinedChannel = await prisma.channel.update({
          where: { id: channelId },
          data: {
            members: {
              connect: { id: session.user.id },
            },
          },
          include: {
            owner: true,
            members: true,
          },
        });
        return NextResponse.json(joinedChannel);

      case "LEAVE":
        const leftChannel = await prisma.channel.update({
          where: { id: channelId },
          data: {
            members: {
              disconnect: { id: session.user.id },
            },
          },
        });
        return NextResponse.json(leftChannel);

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Channels API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const channelId = searchParams.get("channelId");

    if (channelId) {
      // Get specific channel
      const channel = await prisma.channel.findUnique({
        where: { id: channelId },
        include: {
          owner: true,
          members: true,
          games: {
            include: {
              player1: true,
              player2: true,
              winner: true,
            },
            orderBy: {
              createdAt: "desc",
            },
            take: 10,
          },
        },
      });
      return NextResponse.json(channel);
    }

    // List all channels
    const channels = await prisma.channel.findMany({
      include: {
        owner: true,
        members: true,
        _count: {
          select: { games: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    return NextResponse.json(channels);
  } catch (error) {
    console.error("Channels API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
