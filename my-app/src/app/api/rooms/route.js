import prisma from '../../lib/prisma'; 
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

// export async function GET(req) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const page = parseInt(searchParams.get("page")) || 1;
//     const pageSize = parseInt(searchParams.get("pageSize")) || 10;

//     const rooms = await prisma.room.findMany({
//       take: pageSize,
//       skip: (page - 1) * pageSize,
//       orderBy: { createdAt: "desc" },
//       where: {
//         numPeople: { not: prisma.room.fields.maxPeople },
//         private: false,
//         active: true,
//       },
//     });

//     return NextResponse.json(rooms, { status: 200 });
//   } catch (error) {
//     console.error("Error fetching rooms:", error);
//     return NextResponse.json({ error: "Failed to fetch rooms" }, { status: 500 });
//   }
// }

export async function GET(req) {
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get("page")) || 1;
      const pageSize = parseInt(searchParams.get("pageSize")) || 10;
  
      const rooms = await prisma.room.findMany({
        take: pageSize,
        skip: (page - 1) * pageSize,
        orderBy: { createdAt: "desc" },
        where: {
          numPeople: { gt: 0 } ,
          private: false,
          active: true,
        },
      });
  
      return NextResponse.json(rooms, { status: 200 });
    } catch (error) {
      console.error("Error fetching rooms:", error);
      return NextResponse.json({ error: "Failed to fetch rooms" }, { status: 500 });
    }
  }


  //   export async function POST(request) {
//     const { job } = await request.json();
//     const newJob = await prisma.job.create({data: {
//       ...job
//     }});
//     return Response.json({job: newJob});
//   }
  
//   export async function GET(request, { params }) {
//     const id = (await params).id;
//     const job = await prisma.job.findUnique({ where: { id: parseInt(id) }} );
//     return Response.json({job});
//   }

export async function POST(request) {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const data = await request.json();
    
    // Create the room
    const room = await prisma.room.create({
      data: {
        maxPeople: data.maxPeople,
        numPeople: 1,
        private: data.private,
        active: data.active,
        owner: data.owner,
        difficulty: data.difficulty,
        numProblems:data.numProblems,
        problemTypes:data.problemTypes,
        users: {
          connect: { username: data.owner }, // Add owner to the `users[]` relation
        }      
      },
    });
    
    // Create a game associated with the room
    const game = await prisma.game.create({
      data: {
        rid: room.id,
        numQuestions: data.numProblems,
      }
    });
    
    // Get the appropriate questions based on difficulty and type
    const questions = await prisma.question.findMany({
      where: {
        difficulty: data.difficulty,
        topic: {
          in: data.problemTypes,
        }
      },
      take: data.numProblems,
    });
    
    // Associate questions with the game
    for (const question of questions) {
      await prisma.gameQuestion.create({
        data: {
          gid: game.id,
          qid: question.id,
        }
      });
    }
    
    return NextResponse.json(room);
  } catch (error) {
    console.error('Error creating room:', error.message, error.stack);
    return NextResponse.json(
      { error: 'Failed to create room', details: error.message },
      { status: 500 }
    );
  }
}

  

// PATCH used for editing of the settings of a room that already exists
// const editRoomSettings = async (roomId, updates) => {
//   const response = await fetch('/api/rooms', {
//     method: 'PATCH',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({
//       roomId,
//       ...updates, // Example: { maxPeople: 8, private: true }
//     }),
//   });

//   const data = await response.json();
//   console.log(data); // Success or error message
// };
// Example usage: Replace 1 with room id and other fields with specific settings
// editRoomSettings(1, { maxPeople: 8, private: true, difficulty: 'Hard' });

export async function PATCH(req) {
  try {
    const body = await req.json(); // Parse the request body

    console.log('Received body:', body);

    if (!body || !body.roomId) {
      return new Response(JSON.stringify({ error: 'Room ID is required' }), { status: 400 });
    }

    var { roomId, maxPeople, isPrivate, difficulty } = body;

    // Find the room by ID
    const room = await prisma.room.findUnique({
      where: { id: parseInt(roomId) },
    });

    if (!room) {
      return new Response(JSON.stringify({ error: 'Room not found' }), { status: 404 });
    }

    maxPeople = parseInt(maxPeople);

    // Update the room with the provided data, ensuring only provided fields are updated
    const updatedRoom = await prisma.room.update({
      where: { id: parseInt(roomId) },
      data: {
        ...(maxPeople !== undefined && { maxPeople }), // Only update if maxPeople is provided
        ...(isPrivate !== undefined && { private: isPrivate }), // Update privacy status if given
        ...(difficulty && { difficulty }), // Update difficulty if provided
        // If you want to update 'active' or other fields, add them here
      },
    });

    // Return a success response with the updated room
    console.log('Updated room:', updatedRoom);
    return new Response(JSON.stringify({ message: 'Room updated successfully', room: updatedRoom }), { status: 200 });

  } catch (error) {
    console.error('Error updating room settings:', error);
    return new Response(JSON.stringify({ error: 'An error occurred while updating the room settings', details: error.message }), { status: 500 });
  }
}





// DELETE used for deleting a room once all users are done. Use this function  
// async function deleteRoom(roomId) {
//   try {
//       const response = await fetch(`/api/rooms?id=${roomId}`, {
//           method: 'DELETE',
//       });

//       const data = await response.json();

//       if (!response.ok) {
//           throw new Error(data.error || 'Failed to delete the room');
//       }

//       alert('Room deleted successfully');
//       console.log(data);
//   } catch (error) {
//       console.error('Error deleting room:', error.message);
//       alert(error.message);
//   }
// }

// // Example usage with a button: replace 1 with the room id
// <button onClick={() => deleteRoom(1)}>Delete Room</button>;

export async function DELETE(req) {
  try {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get('id');

      // Validate ID
      const roomId = parseInt(id, 10);
      if (isNaN(roomId)) {
          return new Response(JSON.stringify({ error: 'Invalid room ID' }), { status: 400 });
      }

      // Check if the room exists
      const room = await prisma.room.findUnique({
          where: { id: roomId },
      });

      if (!room) {
          return new Response(JSON.stringify({ error: 'Room not found' }), { status: 404 });
      }

      // Delete the room
      await prisma.room.delete({
          where: { id: roomId },
      });

      return new Response(JSON.stringify({ message: 'Room deleted successfully' }), { status: 200 });
  } catch (error) {
      console.error(error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}
