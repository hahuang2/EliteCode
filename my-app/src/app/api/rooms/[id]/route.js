import prisma from "../../../lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req, {params}) {
  try {
    let {id} = await params;
     id= parseInt(id);
    if (!id) {
      return NextResponse.json({ error: "Lobby ID is required" }, { status: 400 });
    }

    const lobby = await prisma.room.findUnique({
        where: {id},
        include: {
          games: {
            include: {
              gameQuestions: {
                include: {
                  question: true,
                },
              },
            },
          },
          users: {
            include: {
              solutions: {
                include: {
                  question: true,
                },
              },
              room: true,
            },
          },
        },
      });
      

    if (!lobby) {
      return NextResponse.json({ error: "Lobby not found" }, { status: 404 });
    }

    return NextResponse.json(lobby, { status: 200 });
  } catch (error) {
    console.error("Error fetching lobby:", error.message, error.stack);
    return NextResponse.json(
      { error: "Failed to fetch lobby", details: error.message },
      { status: 500 }
    );
  }
}
