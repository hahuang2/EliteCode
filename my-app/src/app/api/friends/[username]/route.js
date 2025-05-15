import prisma from "../../../lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  try {
    const { username } = params;

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    // Find the user by username
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        User_A: { select: { username: true } }, // Outgoing friends
        User_B: { select: { username: true } }, // Incoming friends
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Map outgoing and incoming friends
    const outgoing = user.User_A.map(friend => friend.username);
    const incoming = user.User_B.map(friend => friend.username);

    // Combine both, remove duplicates
    const allFriends = [...new Set([...outgoing, ...incoming])];

    return NextResponse.json({ friends: allFriends }, { status: 200 });
  } catch (error) {
    console.error("Error fetching friends:", error);
    return NextResponse.json({ error: "Failed to fetch friends" }, { status: 500 });
  }
}
