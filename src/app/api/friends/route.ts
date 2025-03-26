import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { pusher } from "@/lib/pusher";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { action, friendId } = await req.json();

    switch (action) {
      case "SEND_REQUEST":
        const request = await prisma.friendRequest.create({
          data: {
            fromId: session.user.id,
            toId: friendId,
          },
          include: {
            fromUser: true,
            toUser: true,
          },
        });

        // Send real-time notification to recipient
        await pusher.trigger(`user-${friendId}`, "friend-request", {
          type: "NEW_REQUEST",
          request: {
            id: request.id,
            from: {
              id: request.fromUser.id,
              name: request.fromUser.name,
              image: request.fromUser.image,
            },
          },
        });

        return NextResponse.json(request);

      case "ACCEPT_REQUEST":
        const acceptedRequest = await prisma.$transaction(async (tx) => {
          // Update request status
          const updatedRequest = await tx.friendRequest.update({
            where: { id: friendId }, // friendId here is the request ID
            data: { status: "ACCEPTED" },
            include: { fromUser: true },
          });

          // Create friendship connection
          await tx.user.update({
            where: { id: session.user.id },
            data: {
              friends: {
                connect: { id: updatedRequest.fromId },
              },
            },
          });

          return updatedRequest;
        });

        // Notify the request sender
        await pusher.trigger(
          `user-${acceptedRequest.fromId}`,
          "friend-request",
          {
            type: "REQUEST_ACCEPTED",
            request: {
              id: acceptedRequest.id,
              from: {
                id: session.user.id,
                name: session.user.name,
                image: session.user.image,
              },
            },
          }
        );

        return NextResponse.json(acceptedRequest);

      case "REJECT_REQUEST":
        const rejectedRequest = await prisma.friendRequest.update({
          where: { id: friendId }, // friendId here is the request ID
          data: { status: "REJECTED" },
          include: { fromUser: true },
        });

        // Notify the request sender
        await pusher.trigger(
          `user-${rejectedRequest.fromId}`,
          "friend-request",
          {
            type: "REQUEST_REJECTED",
            request: {
              id: rejectedRequest.id,
              from: {
                id: session.user.id,
                name: session.user.name,
                image: session.user.image,
              },
            },
          }
        );

        return NextResponse.json(rejectedRequest);

      case "REMOVE":
        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            friends: {
              disconnect: { id: friendId },
            },
            friendOf: {
              disconnect: { id: friendId },
            },
          },
        });
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Friends API Error:", error);
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
    const requestsOnly = searchParams.get("requestsOnly") === "true";

    if (requestsOnly) {
      // Get pending friend requests
      const requests = await prisma.friendRequest.findMany({
        where: {
          toId: session.user.id,
          status: "PENDING",
        },
        include: {
          fromUser: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      });
      return NextResponse.json(requests);
    }

    // Get all friends (both directions)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        friends: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        friendOf: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    // Combine friends and friendOf to get all connections
    const allFriends = [
      ...(user?.friends || []),
      ...(user?.friendOf || []),
    ].filter(
      (friend, index, self) =>
        index === self.findIndex((f) => f.id === friend.id)
    );

    return NextResponse.json(allFriends);
  } catch (error) {
    console.error("Friends API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
