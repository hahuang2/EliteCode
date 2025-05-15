"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "../../components/ui/Button";
import { Heading, MainText, SubText } from "../../components/ui/Text";
import { Container } from "../../components/ui/Container";
import { RoundedContainer } from "../../components/ui/RContainer";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import "../../style.css";

const UserStatsPage = () => {
  const { username } = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const loggedInUsername = session?.user?.name;
  const [userStats, setUserStats] = useState(null);
  const [friendUsername, setFriendUsername] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // "success" or "error"
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (username) {
      fetchStats(username);
    }
  }, [username]);

  const fetchStats = async (username) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/stats?username=${username}`);
      const data = await response.json();
      
      if (data.error) {
        console.error("Error:", data.error);
        setMessage(data.error);
        setMessageType("error");
        setIsLoading(false);
        return;
      }
      
      setUserStats(data);
      setIsLoading(false);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      setMessage("Failed to load stats. Please try again later.");
      setMessageType("error");
      setIsLoading(false);
    }
  };

  const handleAddFriend = async (e) => {
    e.preventDefault();
    setMessage("");
    
    if (!friendUsername.trim()) {
      setMessage("Please enter a username.");
      setMessageType("error");
      return;
    }
    
    if (status !== "authenticated") {
      setMessage("You must be logged in to add friends.");
      setMessageType("error");
      return;
    }
    
    try {
      const response = await fetch("/api/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loggedInUsername, friendUsername }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage("Friend added successfully!");
        setMessageType("success");
        setFriendUsername("");
      } else {
        setMessage(`Error: ${data.error}`);
        setMessageType("error");
      }
    } catch (error) {
      setMessage("Failed to add friend. Try again.");
      setMessageType("error");
    }
  };

  if (isLoading) {
    return (
      <Container fullScreen>
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-gray-500">Loading stats for {username}...</p>
        </div>
      </Container>
    );
  }

  // Prepare data for the pie chart
  const chartData = userStats ? [
    { name: "Wins", value: userStats.totalWins },
    { name: "Losses", value: userStats.totalLosses }
  ] : [];
  
  const COLORS = ["#4CAF50", "#F44336"];
  const winRate = userStats && userStats.totalGames > 0 
    ? ((userStats.totalWins / userStats.totalGames) * 100).toFixed(1) 
    : 0;

  return (
    <Container fullScreen>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header with back button */}
        <div className="flex items-center mb-6">
          <Link href="/" className="mr-4">
            <Button variant="ghost" size="sm" className="flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
              </svg>
              Back to Home
            </Button>
          </Link>
          <Heading className="font-bold text-2xl md:text-3xl">{username}'s Stats</Heading>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <RoundedContainer className="p-4">
            <div className="pb-2">
              <div className="text-lg flex items-center">
                <svg className="w-5 h-5 mr-2 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path>
                </svg>
                Total Wins
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold">{userStats.totalWins}</p>
            </div>
          </RoundedContainer>
          
          <RoundedContainer className="p-4">
            <div className="pb-2">
              <div className="text-lg flex items-center">
                <svg className="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                Total Losses
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold">{userStats.totalLosses}</p>
            </div>
          </RoundedContainer>
          
          <RoundedContainer className="p-4">
            <div className="pb-2">
              <div className="text-lg flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                </svg>
                Total Games
              </div>
            </div>
            <div>
              <p className="text-3xl font-bold">{userStats.totalGames}</p>
            </div>
          </RoundedContainer>
        </div>

        {/* Win Rate Chart */}
        <RoundedContainer className="p-4 mb-8">
          <div className="mb-4">
            <Heading className="text-xl">Performance Overview</Heading>
          </div>
          <div className="flex flex-col md:flex-row items-center">
            <div className="w-full md:w-1/2 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} games`, ""]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 p-4">
              <div className="mb-4">
                <SubText>Win Rate</SubText>
                <MainText className="text-2xl font-bold">{winRate}%</MainText>
              </div>
              
              <div className="flex items-center mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <SubText>Wins: {userStats.totalWins}</SubText>
              </div>
              
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <SubText>Losses: {userStats.totalLosses}</SubText>
              </div>
            </div>
          </div>
        </RoundedContainer>

        {/* Add Friend Section */}
        <RoundedContainer className="p-4">
          <div className="mb-4">
            <Heading className="text-xl flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
              </svg>
              Add a Friend
            </Heading>
          </div>
          <form onSubmit={handleAddFriend} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                placeholder="Enter friend's username"
                value={friendUsername}
                onChange={(e) => setFriendUsername(e.target.value)}
                required
                className="flex-1 p-2 border rounded text-black"
              />
              <Button type="submit">Add Friend</Button>
            </div>
            
            {message && (
              <div className={`p-3 rounded-md ${messageType === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                {message}
              </div>
            )}
            
            {loggedInUsername && (
              <Link href={`/${loggedInUsername}/friends`}>
                <Button variant="outline" className="mt-2 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                  </svg>
                  View My Friends
                </Button>
              </Link>
            )}
          </form>
        </RoundedContainer>
      </div>
    </Container>
  );
};

export default UserStatsPage;