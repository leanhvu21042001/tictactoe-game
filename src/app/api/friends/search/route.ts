import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Don't allow adding yourself as a friend
    if (user.id === session.user.id) {
      return NextResponse.json(
        { error: "Cannot add yourself as a friend" },
        { status: 400 }
      );
    }

    // Check if already friends
    const existingFriendship = await prisma.user.findFirst({
      where: {
        id: session.user.id,
        OR: [
          { friends: { some: { id: user.id } } },
          { friendOf: { some: { id: user.id } } },
        ],
      },
    });

    if (existingFriendship) {
      return NextResponse.json(
        { error: "Already friends with this user" },
        { status: 400 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Friend search API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
