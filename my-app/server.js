const http = require("http");
const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

let lobbies = {}; // Store lobby users and state
let readyUsers = {}; // Track ready users
let lobbySettings = {}; // Store lobby settings

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-lobby", ({ lobbyId, username }) => {
    socket.join(lobbyId);

    if (!lobbies[lobbyId]) lobbies[lobbyId] = [];
    if (!readyUsers[lobbyId]) readyUsers[lobbyId] = [];
    if (!lobbySettings[lobbyId]) lobbySettings[lobbyId] = {};

    // Prevent duplicates
    if (!lobbies[lobbyId].some(user => user.id === socket.id)) {
      lobbies[lobbyId].push({ id: socket.id, name: username });
    }

    console.log(`Lobby ${lobbyId} users:`, lobbies[lobbyId]);

    // Send updated user list
    io.to(lobbyId).emit("lobby-update", lobbies[lobbyId]);
  });

  socket.on("leave-lobby", ({ lobbyId, username }) => {
    socket.leave(lobbyId);

    if (lobbies[lobbyId]) {
      lobbies[lobbyId] = lobbies[lobbyId].filter(user => user.id !== socket.id);
      console.log(`User ${username} left lobby ${lobbyId}`);
      io.to(lobbyId).emit("lobby-update", lobbies[lobbyId]);
    }

    if (readyUsers[lobbyId]) {
      readyUsers[lobbyId] = readyUsers[lobbyId].filter(user => user.name !== username);
      io.to(lobbyId).emit("ready-update", { readyUsers: readyUsers[lobbyId] });
    }
  });

  socket.on("get-lobby-users", (lobbyId) => {
    io.to(socket.id).emit("lobby-update", lobbies[lobbyId] || []);
  });

  socket.on("get-ready-status", (lobbyId) => {
    io.to(socket.id).emit("ready-update", { readyUsers: readyUsers[lobbyId] || [] });
  });

  socket.on("toggle-ready", ({ lobbyId, username, isReady }) => {
    if (!readyUsers[lobbyId]) readyUsers[lobbyId] = [];

    // Update ready status
    const index = readyUsers[lobbyId].findIndex(user => user.name === username);
    if (index !== -1) {
      readyUsers[lobbyId][index].isReady = isReady;
    } else {
      readyUsers[lobbyId].push({ name: username, isReady });
    }

    io.to(lobbyId).emit("ready-update", { readyUsers: readyUsers[lobbyId] });
  });

  socket.on("chat-message", ({ lobbyId, messageData }) => {
    io.to(lobbyId).emit("chat-message", messageData);
  });

  socket.on("game-countdown", ({ lobbyId, seconds }) => {
    io.to(lobbyId).emit("game-countdown", { seconds });
  });

  socket.on("settings-updated", ({ lobbyId, settings }) => {
    lobbySettings[lobbyId] = { ...lobbySettings[lobbyId], ...settings };
    io.to(lobbyId).emit("settings-updated", lobbySettings[lobbyId]);
  });

  socket.on("start-game", ({ lobbyId, gameId }) => {
    console.log("Starting game for lobby:", lobbyId, "with gameId:", gameId);
    
    // Notify all players to start countdown
    io.to(lobbyId).emit("game-countdown", { seconds: 3 });
  
    // After the countdown, redirect all users to the game
    setTimeout(() => {
      console.log("Countdown finished, redirecting all players in lobby:", lobbyId);
      io.to(lobbyId).emit("game-started", { gameId });
    }, 3000); // Reduced to 3 seconds to match the countdown
  });
  

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    for (const lobbyId in lobbies) {
      lobbies[lobbyId] = lobbies[lobbyId].filter(user => user.id !== socket.id);
      io.to(lobbyId).emit("lobby-update", lobbies[lobbyId]);

      readyUsers[lobbyId] = readyUsers[lobbyId].filter(user => user.id !== socket.id);
      io.to(lobbyId).emit("ready-update", { readyUsers: readyUsers[lobbyId] });
    }
  });
});

server.listen(4000, () => {
  console.log("Socket.io server running on port 4000");
});
