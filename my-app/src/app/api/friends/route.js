import prisma from "../../lib/prisma";
import { NextResponse } from "next/server";

// Add Friend
export async function POST(req) {
  try {
    const { username, friendUsername } = await req.json();

    // Basic validation
    if (!username || !friendUsername) {
      return NextResponse.json({ error: "Both usernames are required" }, { status: 400 });
    }

    if (username === friendUsername) {
      return NextResponse.json({ error: "You cannot add yourself as a friend" }, { status: 400 });
    }

    // Check if both users exist
    const [user, friend] = await Promise.all([
      prisma.user.findUnique({ where: { username } }),
      prisma.user.findUnique({ where: { username: friendUsername } }),
    ]);

    if (!user || !friend) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if already friends (both directions)
    const existingFriendship = await prisma.user.findFirst({
      where: {
        username,
        User_A: { some: { username: friendUsername } },
      },
    });

    if (existingFriendship) {
      return NextResponse.json({ message: "Already friends" }, { status: 400 });
    }

    // Add both sides in transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { username },
        data: {
          User_A: { connect: { username: friendUsername } }, // outgoing
        },
      }),
      prisma.user.update({
        where: { username: friendUsername },
        data: {
          User_B: { connect: { username } }, // incoming
        },
      }),
    ]);

    return NextResponse.json({ message: "Friend added successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error adding friend:", error);
    return NextResponse.json({ error: "Failed to add friend" }, { status: 500 });
  }
}

// Remove Friend
export async function DELETE(req) {
  try {
    const { username, friendUsername } = await req.json();

    // Basic validation
    if (!username || !friendUsername) {
      return NextResponse.json({ error: "Both usernames are required" }, { status: 400 });
    }

    if (username === friendUsername) {
      return NextResponse.json({ error: "You cannot remove yourself" }, { status: 400 });
    }

    // Check if both users exist
    const [user, friend] = await Promise.all([
      prisma.user.findUnique({ where: { username } }),
      prisma.user.findUnique({ where: { username: friendUsername } }),
    ]);

    if (!user || !friend) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Remove both sides in transaction
    await prisma.$transaction([
      prisma.user.update({
        where: { username },
        data: {
          User_A: { disconnect: { username: friendUsername } }, // outgoing
        },
      }),
      prisma.user.update({
        where: { username: friendUsername },
        data: {
          User_B: { disconnect: { username } }, // incoming
        },
      }),
    ]);

    return NextResponse.json({ message: "Friend removed successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error removing friend:", error);
    return NextResponse.json({ error: "Failed to remove friend" }, { status: 500 });
  }
}
