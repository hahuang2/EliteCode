//USED FOR ADDING USERS TO ROOM
//To use the patch function do this, but replace the roomId and username fields
//with the username from session and roomId session from what is clicked
// const addUserToRoom = async () => {
//   const response = await fetch('/api/rooms/user', {
//     method: 'PATCH',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({
//       roomId: 1, // The ID of the room
//       username: 'newUser', // The username of the user to add
//     }),
//   });

//   const data = await response.json();
//   console.log(data); // Success or error message
// };
// Example usage: Replace 1 with room id and newUser with username
// addUserToRoom(1, 'newUser');

export async function PATCH(req) {
    try {
      const body = await req.json();
      const { roomId, username } = body;
  
      // Validate input
      if (!roomId || !username) {
        return new Response(JSON.stringify({ error: 'Room ID and username are required' }), { status: 400 });
      }
  
      // Find the room
      const room = await prisma.room.findUnique({
        where: { id: roomId },
        include: { users: true },
      });
  
      if (!room) {
        return new Response(JSON.stringify({ error: 'Room not found' }), { status: 404 });
      }
  
      // Check if the user exists
      let user = await prisma.user.findUnique({
        where: { username },
      });
  
      
  
      // Check if the user is already in the room
      // const userAlreadyInRoom = room.users.some((user) => user.username === username);
      const userAlreadyInRoom = false;
  
      if (userAlreadyInRoom) {
        return new Response(JSON.stringify({ error: 'User is already in the room' }), { status: 400 });
      }
  
      // // Add the user to the room
      // await prisma.room.update({
      //   where: { id: roomId },
      //   data: {
      //     users: {
      //       connect: {
      //         username: user.username, // Connect the user to the room
      //       },
      //     },
      //     numPeople: { increment: 1 }, // Increment the number of people in the room
      //   },
      // });
  
      return new Response(JSON.stringify({ message: 'User added to room successfully' }), { status: 200 });
  
    } catch (error) {
      console.error('Error adding user to room:', error);
      return new Response(JSON.stringify({ error: 'An error occurred while adding user to the room' }), { status: 500 });
    }
  }
  
  
  //USED FOR DELETEING USERS FROM ROOM
  //To use the delete function do this, but replace the roomId and username fields
//with the username from session and roomId from the room that the user is in
// const removeUser = async () => {
//   const response = await fetch('/api/rooms/user', {
//     method: 'PATCH',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify({
//       roomId: 1, // The ID of the room
//       username: 'newUser', // The username of the user to add
//     }),
//   });

//   const data = await response.json();
//   console.log(data); // Success or error message
// };
// Example usage: Replace 1 with room id and newUser with username
// removeUser(1, 'newUser');
  export async function DELETE(req) {
    try {
      const body = await req.json();
      const { roomId, username } = body;
  
      // Validate input
      if (!roomId || !username) {
        return new Response(JSON.stringify({ error: 'Room ID and username are required' }), { status: 400 });
      }
  
      // Find the room
      const room = await prisma.room.findUnique({
        where: { id: roomId },
        include: { users: true },
      });
  
      if (!room) {
        return new Response(JSON.stringify({ error: 'Room not found' }), { status: 404 });
      }
  
      // Check if the user exists in the room
      const userInRoom = room.users.some((user) => user.username === username);
  
      if (!userInRoom) {
        return new Response(JSON.stringify({ error: 'User is not in the room' }), { status: 400 });
      }
  
      // Find the user
      const user = await prisma.user.findUnique({
        where: { username },
      });
  
      if (!user) {
        return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
      }
  
      // Remove the user from the room and decrement the number of people in the room
      await prisma.room.update({
        where: { id: roomId },
        data: {
          users: {
            disconnect: {
              username: user.username, // Disconnect the user from the room
            },
          },
          numPeople: { decrement: 1 }, // Decrease the number of people in the room
        },
      });
  
      return new Response(JSON.stringify({ message: 'User removed from room successfully' }), { status: 200 });
  
    } catch (error) {
      console.error('Error removing user from room:', error);
      return new Response(JSON.stringify({ error: 'An error occurred while removing user from the room' }), { status: 500 });
    }
  }
  

  
  