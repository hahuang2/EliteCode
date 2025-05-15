import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function POST(req) {
  try {
    const body = await req.json();
    console.log("Received request:", body);

    if (!body.username || !body.password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    const { username, password } = body;
    const email = "email"; // Default email value

    console.log(`Checking if username "${username}" exists...`);

    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    console.log("Prisma Query Result:", existingUser);

    if (existingUser) {
      console.log("Username already taken:", username);
      return NextResponse.json({ error: "Username already taken" }, { status: 400 });
    }

    console.log("Creating new user...");
    const newUser = await prisma.user.create({
      data: {
        username,
        password,
        email,
        totalWins: 0,
        totalLosses: 0,
        totalGames: 0,
      },
    });

    console.log("User created:", newUser);
    return NextResponse.json({ message: "User created successfully!" }, { status: 201 });

  } catch (error) {
    console.error("Prisma Error:", error);
    return NextResponse.json({ error: "Something went wrong", details: error.message }, { status: 500 });
  }
}

export function GET() {
  return NextResponse.json({ error: "Method Not Allowed" }, { status: 405 });
}
