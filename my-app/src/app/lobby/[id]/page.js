"use client";
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from "next-auth/react";
import { Button } from "../../components/ui/Button";
import { Heading, MainText, SubText } from "../../components/ui/Text";
import {Container} from "../../components/ui/Container";
import { RoundedContainer } from "../../components/ui/RContainer";

import io from 'socket.io-client';

// Create socket connection outside component to prevent multiple connections
let socket;
if (typeof window !== 'undefined') {
  socket = io("http://localhost:4000", {
    reconnectionDelay: 1000,
    reconnection: true,
    transports: ['websocket'],
  });
}

const WaitingRoom = () => {
  const [lobby, setLobby] = useState(null);
  const [customSettings, setCustomSettings] = useState({
    numQuestions: 10,
    questionType: 'multiple-choice',
    difficulty: 'medium',
    timeLimit: 30
  });
  
  // New settings from create lobby
  const [formData, setFormData] = useState({
    numProblems: 3,
    problemTypes: ["Array", "String", "Dynamic Programming"],
    difficulty: "Easy",
    isPrivate: false,
    maxPeople: 4
  });
  
  // Available problem types
  const availableProblemTypes = [
    "Array", "String", "Hash Table", "Dynamic Programming",
    "Math", "Greedy", "Depth-First Search", "Binary Search",
    "Breadth-First Search", "Tree", "Matrix", "Graph"
  ];
  
  const [currentUsers, setCurrentUsers] = useState([]);
  const [inviteLink, setInviteLink] = useState('');
  const [showCopied, setShowCopied] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [error, setError] = useState("");
  const [hostName, setHostName] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [readyUsers, setReadyUsers] = useState([]);
  const [readyCount, setReadyCount] = useState(0);
  const [readyPercentage, setReadyPercentage] = useState(0);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [countdown, setCountdown] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [tempFormData, setTempFormData] = useState(formData);
  
  const { id } = useParams();
  const { data: session } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    if (!id) return;
  
    // Fetch lobby data once when the component mounts
    const fetchLobbyData = async () => {
      try {
        const response = await fetch(`/api/rooms/${id}`);
        if (!response.ok) throw new Error("Failed to fetch lobby data");
        const data = await response.json();
  
        setLobby(data);
        setInviteLink(`${window.location.origin}/lobby/${id}`);
        setIsHost(data.owner === session?.user?.name);
        setHostName(data.owner);
  
        setFormData({
          numProblems: data.numProblems ,
          problemTypes: data.problemTypes ,
          difficulty: data.difficulty ,
          isPrivate: data.private ,
          maxPeople: data.maxPeople 
        });
      } catch (error) {
        console.error("Error fetching lobby:", error);
        setError("Failed to fetch lobby data. Please try again later.");
      }
    };
  
    fetchLobbyData();
  }, [id, session?.user?.name]); // Added session to dependencies
  
  // Handle real-time socket updates separately
  useEffect(() => {
    if (!id || !session?.user?.name || !socket) return;
  
    console.log("Joining lobby:", id, session.user.name);
    socket.emit("join-lobby", { lobbyId: id, username: session.user.name });
  
    // Socket event handlers
    const handleLobbyUpdate = (updatedUsers) => {
      console.log("Updated Users:", updatedUsers);
      setCurrentUsers(updatedUsers); 
    };
    
    const handleReadyUpdate = (readyData) => {
      console.log("Ready update received:", readyData);
      setReadyUsers(readyData.readyUsers);
      
      // Check if current user is in the ready list
      const userIsReady = readyData.readyUsers.some(
        user => user.name === session.user.name && user.isReady
      );
      setIsReady(userIsReady);
      
      // Calculate ready counts
      const readyCount = readyData.readyUsers.filter(user => user.isReady).length;
      setReadyCount(readyCount);
    };
    
    const handleChatMessage = (messageData) => {
      console.log("Chat message received:", messageData);
      setMessages(prev => [...prev, messageData]);
    };
    
    const handleGameCountdown = (countData) => {
      setCountdown(countData.seconds);
    };
    
    const handleSettingsUpdate = (updatedSettings) => {
      setLobby(prev => ({
        ...prev,
        ...updatedSettings
      }));
      
      setFormData(prev => ({
        ...prev,
        numProblems: updatedSettings.numProblems || prev.numProblems,
        difficulty: updatedSettings.difficulty || prev.difficulty,
        isPrivate: updatedSettings.private || prev.isPrivate,
        maxPeople: updatedSettings.maxPeople || prev.maxPeople
      }));
    };
  
    // Register socket event listeners
    socket.on("lobby-update", handleLobbyUpdate);
    socket.on("ready-update", handleReadyUpdate);
    socket.on("chat-message", handleChatMessage);
    socket.on("game-countdown", handleGameCountdown);
    socket.on("settings-updated", handleSettingsUpdate);
    
    // Handle game started
    socket.on("game-started", (data) => {
      window.location.href = `/lobby/${id}/game/${data.gameId}`;
    });

    socket.on("redirect-to-game", ({ gameId }) => {
      console.log("Redirecting to game:", gameId);
      window.location.href = `/lobby/${id}/game/${data.gameId}`;
    });
  
    // Request initial data
    socket.emit("get-lobby-users", id);
    socket.emit("get-ready-status", id);
    
    return () => {
      console.log("Leaving lobby:", id);
      socket.emit("leave-lobby", { lobbyId: id, username: session.user.name });
      socket.off("lobby-update", handleLobbyUpdate);
      socket.off("ready-update", handleReadyUpdate);
      socket.off("chat-message", handleChatMessage);
      socket.off("game-countdown", handleGameCountdown);
      socket.off("settings-updated", handleSettingsUpdate);
      socket.off("game-started");
    };
  }, [id, session?.user?.name]); // Keep dependencies minimal
  
  // Update ready percentage whenever readyCount or currentUsers change
  useEffect(() => {
    setReadyPercentage(currentUsers.length > 0 ? Math.round((readyCount / currentUsers.length - 1) * 100) : 0);
  }, [readyCount, currentUsers]);


  const handleCustomSettingChange = (e) => {
    const { name, value } = e.target;
    setCustomSettings((prevState) => ({
      ...prevState,
      [name]: value
    }));
  };

  // New handling functions for form data changes
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseInt(value, 10)
    }));
  };
  
  const handleProblemTypeChange = (type) => {
    setFormData(prev => {
      if (prev.problemTypes.includes(type)) {
        return {
          ...prev,
          problemTypes: prev.problemTypes.filter(t => t !== type)
        };
      } else {
        return {
          ...prev,
          problemTypes: [...prev.problemTypes, type]
        };
      }
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };
  
  const toggleReady = () => {
    const newReadyState = !isReady;
    setIsReady(newReadyState);
  
    if (!socket || !session?.user?.name) {
      console.error("Socket or user session not available");
      return;
    }
    
    console.log("Emitting player-ready:", {
      lobbyId: id,
      username: session.user.name,
      isReady: newReadyState
    });
    
    // Emit the ready status to the server
    socket.emit("toggle-ready", { 
      lobbyId: id, 
      username: session.user.name,
      isReady: newReadyState
    });
  };
  
  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !session?.user?.name) return;
    
    const messageData = {
      lobbyId: id,
      username: session.user.name,
      message: newMessage.trim(),
      timestamp: new Date().toISOString()
    };
    
    console.log("Sending chat message:", messageData);
    socket.emit("chat-message", messageData);
    setNewMessage("");
  };
  
  const updateRoomSettings = async () => {
    try {
        const response = await fetch('/api/rooms', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              roomId: id,
              maxPeople: tempFormData.maxPeople,
              isPrivate: tempFormData.isPrivate,
              difficulty: tempFormData.difficulty,
          }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || 'Failed to update room settings');
        }

        // Check if response has content before parsing
        const responseText = await response.text();
        const data = responseText ? JSON.parse(responseText) : {};

        setLobby(prev => ({
            ...prev,
            ...data.room
        }));

        socket.emit("settings-updated", { lobbyId: id, settings: data.room });

        setIsEditing(false);
        setError("");
    } catch (error) {
        console.error("Error updating room settings:", error);
        setError("Failed to update room settings: " + error.message);
    }
};


const startGame = async () => {
  try {
    const settings = {
      difficulty: formData.difficulty,
      numProblems: formData.numProblems,
      isPrivate: formData.isPrivate,
      maxPeople: formData.maxPeople,
      problemTypes: Array.isArray(formData.problemTypes) ? formData.problemTypes : formData.problemTypes.split(","),
    };
    

    console.log("Sending settings to API:", JSON.stringify(settings, null, 2));
    const response = await fetch(`/api/rooms/${id}/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    


    if (!response.ok) throw new Error("Failed to start game");
    const data = await response.json();

    // Emit the start-game event instead of start-countdown
    socket.emit("start-game", { lobbyId: id, gameId: data.gameId });
    // router.push(`/lobby/${id}/game/${data.gameId}`);
    // Host will be redirected by the same game-started event as other players
  } catch (error) {
    console.error("Error starting game:", error);
    setError("Failed to start game: " + error.message);
  }
};


  const handleEditClick = () => {
    setIsEditing(true);
    setTempFormData(formData);
  };

  const handleSaveClick = async () => {
    await updateRoomSettings();
    setIsEditing(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTempFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleLeaveLobby = () => {
    router.push('/lobby'); // Navigate back to the /lobby page
  };
  

  if (!lobby) return (
    <div className="min-h-screen bg-gray-900 p-6 flex items-center justify-center">
      <div className="text-xl text-yellow-500">Loading lobby...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black p-6 flex items-center justify-center">
      <div className="w-full max-w-5xl bg-black rounded-lg p-6 text-gray-100">
        {countdown !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
            <div className="text-7xl font-bold text-yellow-500 animate-pulse">
              Game starting in {countdown}...
            </div>
          </div>
        )}
        
        <div className="mb-6 flex justify-between items-center">
          <div>
            <Heading className="text-2xl font-bold">Lobby #{lobby.id}</Heading>
            <SubText>Host: {hostName}</SubText>
            {error && <div className="mt-2 text-red-500">{error}</div>}
          </div>
          
          {!isHost && (
            <div className="flex items-center">
              <button
                className={`px-6 py-2 rounded-md font-medium ${isReady 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-[#ffa116] hover:bg-yellow-700'}`}
                onClick={toggleReady}
              >
                {isReady ? 'Ready ✓' : 'Click when Ready'}
              </button>
            </div>
          )}

          <button 
            onClick={handleLeaveLobby} 
            className="relative top-0 left-0 bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-700 transition duration-200"
          >
            Leave Lobby
          </button>

        </div>
        

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Users and Room Info */}
          <div className="space-y-6">
            {/* Current Users with Ready Status */}
            <RoundedContainer className="rounded-lg p-4 space-y-2">
              <h2 className="text-xl font-semibold text-gray-500">Players ({currentUsers.length}/{formData.maxPeople})</h2>
              <div className="w-full bg-gray-400 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-green-500 h-full rounded-full" 
                  style={{width: `${readyPercentage}%`}}
                ></div>
              </div>
              <p className="text-sm text-gray-400 mb-2">{readyCount} of {currentUsers.length - 1} players ready</p>
              <ul className="space-y-2">
                {currentUsers.map((user, index) => (
                  <li key={user.id} className="flex items-center justify-between p-2 rounded bg-gray-800">
                    <div className="flex items-center space-x-2">
                      {/* Use user.name or user.id to ensure you're accessing the right value */}
                      <img src={`https://api.dicebear.com/8.x/pixel-art/svg?seed=${user.name}`} 
                          alt={user.name} className="w-8 h-8 rounded-full" />
                      <span className={`${user.name === hostName ? 'text-yellow-500 font-medium' : 'text-gray-300'}`}>
                        {user.name}
                        {user.name === hostName && <span className="ml-1 text-xs">(Host)</span>}
                      </span>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${readyUsers.some(rUser => rUser.name === user.name && rUser.isReady) ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                  </li>
                ))}
              </ul>
            </RoundedContainer>

            {/* Invite Link */}
            <RoundedContainer  className="rounded-lg p-4 space-y-2">
              <h2 className="text-xl font-semibold text-gray-500">Invite Friends</h2>
              <button
                className="w-full px-4 py-2 bg-[#ffa116] hover:bg-yellow-700 text-white rounded-md transition-colors flex items-center justify-center space-x-2"
                onClick={handleCopyLink}
              >
                <span className="material-icons text-sm">
                  {showCopied ? '✓' : '📋'}
                </span>
                <span>{showCopied ? 'Copied!' : 'Copy Invite Link'}</span>
              </button>
            </RoundedContainer>
            
            {/* Game Settings Display (Non-editable for non-hosts) */}
            <RoundedContainer className="rounded-lg p-4 space-y-2">
              <h2 className="text-gray-500 text-xl font-semibold">Current Game Settings</h2>
              {isHost && (
                <button 
                  onClick={handleEditClick} 
                  className="mt-2 px-4 py-2 bg-[#ffa116] hover:bg-yellow-700 text-white rounded-md"
                >
                  Edit
                </button>
              )}
              <div className="space-y-3 mt-2">
                <div className="flex justify-between">
                  <span className="text-gray-500">Difficulty:</span>
                  <span className={`font-medium ${
                    formData.difficulty === "Easy" ? "text-green-400" : 
                    formData.difficulty === "Medium" ? "text-yellow-400" : "text-red-400"
                  }`}>{formData.difficulty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Problems:</span>
                  <span className="font-medium text-gray-400">{formData.numProblems}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Privacy:</span>
                  <span className="font-medium text-gray-400">{formData.isPrivate ? "Private" : "Public"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Max Players:</span>
                  <span className="font-medium text-gray-400">{formData.maxPeople}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Problem Types:</span>
                  <div className="flex flex-wrap gap-2 max-w-[70%]">
                    {formData.problemTypes.map((type, index) => (
                      <span 
                        key={index} 
                        className="bg-gray-800 text-white text-xs font-medium px-3 py-1 rounded-full"
                      >
                        {type.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <div className="bg-gray-300 p-6 rounded-lg w-96 shadow-lg">
                    <h3 className="text-lg font-semibold mb-4 text-black">Edit Game Settings</h3>
                    <div className="space-y-3">
                      <label className="block text-gray-500">Difficulty
                        <select name="difficulty" value={tempFormData.difficulty} onChange={handleChange} className="w-full mt-1 p-2 bg-gray-700 text-white rounded">
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                        </select>
                      </label>
                      <label className="block text-gray-500">Number of Problems
                        <input type="number" name="numProblems" value={tempFormData.numProblems} onChange={handleChange} className="w-full mt-1 p-2 bg-gray-700 text-white rounded" />
                      </label>
                      <label className="block text-gray-500">Privacy
                        <select name="isPrivate" value={tempFormData.isPrivate} onChange={handleChange} className="w-full mt-1 p-2 bg-gray-700 text-white rounded">
                          <option value={true}>Private</option>
                          <option value={false}>Public</option>
                        </select>
                      </label>
                      <label className="block text-gray-500">Max Players
                        <input type="number" name="maxPeople" value={tempFormData.maxPeople} onChange={handleChange} className="w-full mt-1 p-2 bg-gray-700 text-white rounded" />
                      </label>
                    </div>
                    <div className="flex justify-end mt-4">
                      <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md mr-2">Cancel</button>
                      <button onClick={handleSaveClick} className="px-4 py-2 bg-[#ffa116] hover:bg-yellow-700 text-white rounded-md">Save</button>
                    </div>
                  </div>
                </div>
              )}
            </RoundedContainer>
          </div>

          {/* Middle Column - Chat for non-hosts */}
          <RoundedContainer className="rounded-lg p-4 flex flex-col h-[500px] lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-500 mb-2">Lobby Chat</h2>
            
            <div className="flex-1 overflow-y-auto mb-4 bg-gray-400 rounded p-3">
              {messages.length === 0 ? (
                <p className="text-white-300 text-center my-4">No messages yet. Be the first to say hello!</p>
              ) : (
                <div className="space-y-2">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`${msg.username === session?.user?.name ? 'text-right' : ''}`}>
                      <div className={`inline-block px-3 py-2 rounded-lg max-w-xs ${
                        msg.username === session?.user?.name 
                          ? 'bg-blue-600 text-white rounded-br-none' 
                          : 'bg-gray-700 text-gray-200 rounded-bl-none'
                      }`}>
                        {msg.username !== session?.user?.name && (
                          <div className="font-medium text-xs mb-1">{msg.username}</div>
                        )}
                        <p>{msg.message}</p>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <form onSubmit={sendMessage} className="flex items-center">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 bg-gray-400 border border-gray-200 rounded-l-md text-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-500 placeholder-gray-200"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#ffa116] hover:bg-yellow-700 text-white rounded-r-md transition-colors"
              >
                Send
              </button>
            </form>
          </RoundedContainer>
        </div>
        {isHost ? (
          <button
            onClick={startGame}
            className={`w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md mt-6 ${readyCount == currentUsers.length - 1 ? "" : "opacity-50 cursor-not-allowed"}`}
            disabled={!((readyCount == currentUsers.length - 1))}
          >
            Start Game
          </button>
        ) : (
          <p className="text-gray-400 text-center">{(readyCount == currentUsers.length - 1) ? "All players are ready! Waiting for Host" : "Waiting for host to start the game..."}</p>
        )}
      </div>
    </div>
  );
};

export default WaitingRoom;