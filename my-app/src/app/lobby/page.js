'use client';
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "../components/ui/Button";
import { Heading, MainText, SubText } from "../components/ui/Text";
import { Container } from "../components/ui/Container";
import { RoundedContainer } from "../components/ui/RContainer";

export function JoinRoomButton({ roomId, username }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  async function handleJoinRoom() {
    setLoading(true);
    try {
      const response = await fetch('/api/rooms/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId, username }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to join the room');
      }
      router.push(`/lobby/${roomId}`);
    } catch (error) {
      console.error('Error joining room:', error.message);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <Button 
      onClick={handleJoinRoom} 
      disabled={loading}
      className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg transition-all disabled:bg-emerald-400 disabled:opacity-70"
    >
      {loading ? 'Joining...' : 'Join Room'}
    </Button>
  );
}

export default function Lobby() {
  const router = useRouter();
  const { data: session } = useSession();
  const [rooms, setRooms] = useState([]);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [hasMoreRooms, setHasMoreRooms] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchRooms = async (newPage = 1) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/rooms?page=${newPage}&pageSize=${pageSize}`);
      if (!res.ok) throw new Error("Failed to fetch rooms");
      const data = await res.json();
      setRooms(data);
      setPage(newPage);
      setHasMoreRooms(data.length === pageSize);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    fetchRooms(page);
  }, []);
  
  const insertQuestions = async () => {
    const response = await fetch("/api/questions", { method: "POST" });
    const data = await response.json();
    console.log(data);
  };
  
  // Function to get difficulty badge color
  const getDifficultyColor = (difficulty) => {
    switch(difficulty?.toLowerCase()) {
      case 'easy': return 'bg-green-500/20 text-green-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'hard': return 'bg-red-500/20 text-red-400';
      default: return 'bg-blue-500/20 text-blue-400';
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-800 to-slate-900">
      <Container fullScreen className="py-8 px-4 md:px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-10">
            <Heading className="text-4xl font-bold mb-3 text-white">Welcome to Multiplayer LeetCode</Heading>
            <SubText className="text-xl text-slate-400">Practice coding with friends in real-time</SubText>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-10">
         
            <Button 
              onClick={() => router.push(`/lobby/create`)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium transition-all"
            >
              Create a Room
            </Button>
            {/* <button onClick={insertQuestions}> insert </button> */}
            <Button 
              onClick={() => router.push("/scoreboard")}
              className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-medium transition-all"
            >
              View Scoreboard
            </Button>
            <Button
              onClick={() => session?.user?.name
                ? router.push(`/${session.user.name}/stats`)
                : alert("Please sign in to view your profile.")}
              className="bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-medium transition-all"
            >
              My Profile
            </Button>
          </div>
          
          {/* Rooms Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-white">Available Rooms</h2>
              <div className="flex gap-2">
                {page > 1 && (
                  <Button
                    onClick={() => fetchRooms(page - 1)}
                    className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-all"
                  >
                    Previous
                  </Button>
                )}
                {hasMoreRooms && (
                  <Button
                    onClick={() => fetchRooms(page + 1)}
                    className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-all"
                  >
                    Next
                  </Button>
                )}
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center h-60">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
              </div>
            ) : rooms.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {rooms.map((room) => (
                  <RoundedContainer key={room.id} className="bg-slate-700/40 hover:bg-slate-700/60 backdrop-blur-sm p-5 rounded-xl border border-slate-600 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(room.difficulty)}`}>
                          {room.difficulty || 'Unknown'} 
                        </span>
                        <MainText className="text-white font-medium">
                          Room by <span className="text-emerald-400">{room.owner}</span>
                        </MainText>
                      </div>
                      <div className="ml-4">
                        <JoinRoomButton roomId={room.id} username={session?.user?.name} />
                      </div>
                    </div>
                  </RoundedContainer>
                ))}
              </div>
            ) : (
              <div className="bg-slate-700/30 backdrop-blur-sm p-10 rounded-xl border border-slate-600 text-center">
                <p className="text-lg text-slate-300">No rooms available at the moment.</p>
                <p className="text-slate-400 mt-2">Be the first to create a room!</p>
              </div>
            )}
          </div>
          
          {/* Pagination for mobile */}
          <div className="flex justify-center gap-2 mt-6 md:hidden">
            {page > 1 && (
              <Button
                onClick={() => fetchRooms(page - 1)}
                className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-all"
              >
                Previous
              </Button>
            )}
            {hasMoreRooms && (
              <Button
                onClick={() => fetchRooms(page + 1)}
                className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-all"
              >
                Next
              </Button>
            )}
          </div>
        </div>
      </Container>
    </div>
  );
}