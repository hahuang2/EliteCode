import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";


const prisma = new PrismaClient();


//used to create a tuple in the solution's table
// export async function POST(req){
//   {
//     try {
//       const body = await req.json();
//       const { code, timeStart, timeEnd, qid, username, points, gid, output } = body;
  
//       if (!code || !timeStart || !timeEnd || !qid || !username || !gid || points === undefined || !output) {
//         return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
//       }
  
//       const newSolution = await prisma.solution.create({
//         data: {
//           code,
//           timeStart:new Date(timeStart),
//           timeEnd: new Date(timeEnd),
//           qid,
//           gid,
//           username,
//           points,
//           output,
//         },
//       });
  
//       return NextResponse.json(newSolution, { status: 201 });
//     } catch (error) {
//       return NextResponse.json({ error: "Error creating solution" }, { status: 500 });
//     }
//   }
// }

// //can update the output String, solution String, timeStart, timeEnd, and/or points values
// export async function PATCH(req){
//   {
//     try {
//       const body = await req.json();
//       const { id, code, timeStart, timeEnd, points, output } = body;
  
//       if (!id) {
//         return NextResponse.json({ error: "Solution ID is required" }, { status: 400 });
//       }
  
//       const existingSolution = await prisma.solution.findUnique({
//         where: { id },
//       });
  
//       if (!existingSolution) {
//         return NextResponse.json({ error: "Solution not found" }, { status: 404 });
//       }
  
//       const updatedSolution = await prisma.solution.update({
//         where: { id },
//         data: {
//           code: code ?? existingSolution.code,
//           timeStart: timeStart ? new Date(timeStart) : existingSolution.timeStart,
//           timeEnd: timeEnd ? new Date(timeEnd) : existingSolution.timeEnd,
//           points: points ?? existingSolution.points,
//           output: output ?? existingSolution.output,
//         },
//       });
  
//       return NextResponse.json(updatedSolution, { status: 200 });
//     } catch (error) {
//       return NextResponse.json({ error: "Error updating solution" }, { status: 500 });
//     }
//   }
// }

//gets all of the data in a solution tuple for a certain game, question, and user
export async function GET(req){
    {
        try {
          const { searchParams } = new URL(req.url);
          const qid = searchParams.get("qid");
          const gid = searchParams.get("gid");
          const uid = searchParams.get("uid");
      
          const whereCondition: any = {};
          if (qid) whereCondition.qid = parseInt(qid);
          if (uid) whereCondition.username = uid;
      
          // If gid (game ID) is provided, filter solutions by game questions
          if (gid) {
            whereCondition.question = {
              gameQuestions: {
                some: {
                  gid: parseInt(gid),
                },
              },
            };
          }
      
          const solutions = await prisma.solution.findMany({
            where: whereCondition,
            include: {
              user: true, // Include full user details
              question: {
                include: {
                  gameQuestions: true, // Include game-question relationships
                },
              },
            },
          });
      
          return NextResponse.json(solutions, { status: 200 });
        } catch (error) {
          return NextResponse.json({ error: "Error fetching solutions" }, { status: 500 });
        }
      }
    }