import { NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';

export async function POST(req, context) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "Lobby ID is required" }, { status: 400 });
    }
    const roomId = parseInt(id, 10);

    let data;
    try {
      data = await req.json();
    } catch (error) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { difficulty, problemTypes, numProblems } = data;
    if (!difficulty || !problemTypes || !Array.isArray(problemTypes) || !numProblems) {
      return NextResponse.json({ error: "Missing or invalid difficulty/problemTypes/numProblems" }, { status: 400 });
    }

    // Create the game with room (adjusted to use `room` instead of `roomId`)
    const game = await prisma.game.create({
      data: {
        room: { connect: { id: roomId } }, // Connect the room with the `id`
        numQuestions: numProblems, // Add numQuestions field here
      },
    });

    if (!game?.id) {
      return NextResponse.json({ error: "Failed to create game" }, { status: 500 });
    }

    // const questions = await prisma.question.findMany({
    //   where: { difficulty, topic: { in: problemTypes } },
    //   take: numProblems, // Fetch the specified number of questions
    // });

    // if (!questions.length) {
    //   return NextResponse.json({ error: "No questions found" }, { status: 404 });
    // }

    // await prisma.gameQuestion.createMany({
    //   data: questions.map((q) => ({
    //     gid: game.id,     // gameId should be referenced as gid
    //     qid: q.id,        // questionId should be referenced as qid
    //   })),
    // });
    
    const questions = await prisma.question.findMany({
      where: { difficulty, topic: { in: problemTypes } },
      orderBy: { id: 'asc' }, // Ensure a deterministic order before shuffling
      distinct:['title']
    });
    
    if (!questions.length) {
      return NextResponse.json({ error: "No questions found" }, { status: 404 });
    }
    
    // Shuffle questions randomly
    const shuffledQuestions = questions.sort(() => 0.5 - Math.random()).slice(0, numProblems);
    
    await prisma.gameQuestion.createMany({
      data: shuffledQuestions.map((q) => ({
        gid: game.id,
        qid: q.id,
      })),
    });

    return NextResponse.json({ message: "Game started successfully!", gameId: game.id }, { status: 200 });
  } catch (error) {
    console.error("Error starting game:", error);
    return NextResponse.json(
      { error: "Failed to start game", details: error.message },
      { status: 500 }
    );
  }
}
