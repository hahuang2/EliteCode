import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

// GET method to fetch questions
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const difficulty = searchParams.get("difficulty") as "Easy" | "Medium" | "Hard";

    let questions;

    if (id) {
      // Fetch a single question by ID
      questions = await prisma.question.findUnique({
        where: { id: Number(id) },
      });

      if (!questions) {
        return NextResponse.json({ error: "Question not found" }, { status: 404 });
      }
    } else if (difficulty) {
      // Fetch all questions filtered by difficulty
      questions = await prisma.question.findMany({
        where: { difficulty: difficulty },
      });
    } else {
      // Fetch all questions
      questions = await prisma.question.findMany();
    }

    return NextResponse.json(questions, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Error fetching questions", details: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    // Read the JSON file
    const filePath = path.join(process.cwd(), "data", "questions.json");
    const jsonData = fs.readFileSync(filePath, "utf8");
    const questions = JSON.parse(jsonData);

    // Insert questions into the database
    await prisma.question.createMany({
      data: questions.map((q) => ({
        title: q.title,
        description: q.description,
        difficulty: q.difficulty,
        input_example: q.input_example,
        output_example: q.output_example,
        topic: q.topic,
      })),
      skipDuplicates: true, // Prevent inserting duplicate records
    });

    // Send success response using NextResponse
    return NextResponse.json({ message: "Questions inserted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error inserting questions:", error);
    
    // Send error response using NextResponse
    return NextResponse.json({ error: "Failed to insert questions" }, { status: 500 });
  }
}
