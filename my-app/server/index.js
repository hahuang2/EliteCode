/****************************************
 * index.js (Server with Socket.IO + DB)
 * INCREMENT 2: Fetch questions & check correctness
 ****************************************/
const http = require("http");
const express = require("express");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();
const process = require("process");


// In-memory maps to track players:
let lobbyUsersMap = {};         // Tracks current connected users (may change)
let initialLobbyUsersMap = {};    // Tracks the original players who joined (remains constant)

// Guard flag to prevent duplicate finalizations:
let finalizedGames = {};  // key: gameId, value: { winner: <username> }

// 1) IMPORT PRISMA
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8000;

// 2) COMPILE ENDPOINT
const languageMap = {
    c: { language: "c", version: "10.2.0" },
    cpp: { language: "cpp", version: "10.2.0" },
    python: { language: "python", version: "3.10.0" },
    java: { language: "java", version: "15.0.2" },
};

app.post("/compile", async (req, res) => {
    const { code, language, input } = req.body;
    if (!languageMap[language]) {
        return res.status(400).json({ error: "Unsupported language" });
    }
    const requestData = {
        language: languageMap[language].language,
        version: languageMap[language].version,
        files: [{ name: "main", content: code }],
        stdin: input,
    };

    const startMemory = process.memoryUsage().heapUsed / 1024;
    const startTime = Date.now();

    try {
        const response = await axios.post("https://emkc.org/api/v2/piston/execute", requestData, {
            headers: { "Content-Type": "application/json" },
        });
        const endTime = Date.now();
        const endMemory = process.memoryUsage().heapUsed / 1024;
        res.json({
            ...response.data.run,
            executionTime: endTime - startTime,
            memoryUsage: Math.abs(endMemory - startMemory).toFixed(2),
        });
    } catch (error) {
        console.error("Error executing code:", error);
        res.status(500).json({ error: "Code execution failed" });
    }
});

// 3) GET MESSAGES
app.get("/messages/:lobbyId", async (req, res) => {
    try {
        const lobbyId = parseInt(req.params.lobbyId, 10);
        const messages = await prisma.message.findMany({
            where: { lobbyId },
            orderBy: { createdAt: "asc" },
        });
        res.json(messages);
    } catch (err) {
        console.error("Error fetching messages:", err);
        res.status(500).json({ error: "Failed to fetch messages" });
    }
});

// 4) GET USERS in a specific room (live data)
app.get("/room-users/:roomId", async (req, res) => {
    try {
        const roomId = parseInt(req.params.roomId, 10);
        const room = await prisma.room.findUnique({
            where: { id: roomId },
            include: { users: true },
        });
        res.json(room?.users ?? []);
    } catch (err) {
        console.error("Error fetching room users:", err);
        res.status(500).json({ error: "Failed to fetch room users" });
    }
});

// New endpoint: Get initial room users from the in‑memory map
app.get("/initial-room-users/:lobbyId", (req, res) => {
    try {
        const lobbyId = req.params.lobbyId;
        const initialUsersSet = initialLobbyUsersMap[lobbyId] || new Set();
        res.json(Array.from(initialUsersSet));
    } catch (error) {
        console.error("Error in /initial-room-users:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// 5) GET QUESTIONS for a given gameId
app.get("/game/:gameId/questions", async (req, res) => {
    try {
        const gameId = parseInt(req.params.gameId, 10);
        const game = await prisma.game.findUnique({
            where: { id: gameId },
            include: { gameQuestions: { include: { question: true } } },
        });
        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }
        const questionList = game.gameQuestions.map(gq => gq.question);
        res.json(questionList);
    } catch (err) {
        console.error("Error fetching game questions:", err);
        res.status(500).json({ error: "Failed to fetch game questions" });
    }
});

// 6) Save Solution
app.post("/solution", async (req, res) => {
    try {
        const { qid, gid, username, code, output, language, points, executionTime, timeStart, timeEnd } = req.body;
        let start = new Date(timeStart);
        let end = new Date(timeEnd);
        const timeDiffInSeconds = (end - start) / 1000;
        let updatedPoints = points * (1800 - timeDiffInSeconds) * (1/executionTime);
        updatedPoints = Math.max(updatedPoints, 0);
        console.log(`Calculated points: ${points}`);
        updatedPoints = Math.floor(updatedPoints);

        const newSolution = await prisma.solution.create({
            data: {
                code,
                output,
                language,
                points: updatedPoints,
                executionTime,
                timeStart: start,
                timeEnd: end,
                question: { connect: { id: qid } },
                game: { connect: { id: gid } },
                user: { connect: { username } }
            }
        });
        if (points > 0) {
            await prisma.solution.create({
                data: {
                    code: "// bonus points",
                    output: "bonus",
                    language: "bonus",
                    points: 1000,
                    executionTime: 0,
                    timeStart: new Date(),
                    timeEnd: new Date(),
                    question: { connect: { id: qid } },
                    game: { connect: { id: gid } },
                    user: { connect: { username } }
                }
            });
        }
        res.json({
            message: "Solution saved! Bonus applied if correct.",
            solution: newSolution
        });
    } catch (err) {
        console.error("Error saving solution:", err);
        res.status(500).json({ error: "Failed to save solution" });
    }
});

// 7) Show Scoreboard for a Specific Game (updated)
app.get("/scoreboard/:gameId", async (req, res) => {
    try {
        const gameId = parseInt(req.params.gameId, 10);
        const solutions = await prisma.solution.findMany({
            where: { gid: gameId },
            include: { user: true }
        });
        const userPointsMap = {};
        solutions.forEach(solution => {
            const username = solution.user.username;
            if (!userPointsMap[username]) {
                userPointsMap[username] = 0;
            }
            userPointsMap[username] += solution.points;
            if (solution.points > 0) {
                userPointsMap[username] += 1000;
            }
        });
        const leaderboard = Object.entries(userPointsMap).map(([username, totalPoints]) => ({
            username,
            totalPoints
        })).sort((a, b) => b.totalPoints - a.totalPoints);
        res.json(leaderboard);
    } catch (error) {
        console.error("Error fetching scoreboard:", error);
        res.status(500).json({ error: "Failed to fetch scoreboard" });
    }
});

// 8) General Scoreboard (All Games)
app.get("/scoreboard", async (req, res) => {
    try {
        const scores = await prisma.solution.groupBy({
            by: ["username"],
            _sum: { points: true },
            orderBy: { _sum: { points: "desc" } }
        });
        res.json(scores.map(score => ({
            username: score.username,
            points: score._sum.points || 0
        })));
    } catch (error) {
        console.error("Error fetching scoreboard:", error);
        res.status(500).json({ error: "Failed to fetch scoreboard" });
    }
});

//choose when to end

app.post("/finalize-game/:gameId/:lobbyId", async (req, res) => {
    try {
        const gameId = parseInt(req.params.gameId, 10);
        const lobbyId = req.params.lobbyId;

        // Check if finalization is already in progress or completed.
        if (finalizedGames[gameId] && finalizedGames[gameId].finalizing) {
            return res.status(200).json({
                message: "Game finalization already in progress or completed.",
                winner: finalizedGames[gameId].winner
            });
        }

        // Immediately set a lock indicating finalization is in progress.
        finalizedGames[gameId] = { finalizing: true, winner: null };

        // Use the initial player list for expected count.
        const expectedUsersSet = initialLobbyUsersMap[lobbyId] || new Set();
        const expectedUserCount = expectedUsersSet.size;
        console.log(`Expected Player Count (initial): ${expectedUserCount}`);

        // Get distinct submitted users.
        const distinctUsers = await prisma.solution.findMany({
            where: { gid: gameId },
            select: { username: true },
            distinct: ['username']
        });
        const submittedUserCount = distinctUsers.length;
        console.log(`Submitted User Count: ${submittedUserCount}`);

        if (expectedUserCount !== submittedUserCount) {
            return res.status(400).json({
                message: `Not all players have finished yet. (${submittedUserCount}/${expectedUserCount})`
            });
        }

        // Finalize game logic: calculate scores, update wins/losses.
        const solutions = await prisma.solution.findMany({
            where: { gid: gameId },
            include: { user: true }
        });

        const userPointsMap = {};
        solutions.forEach(solution => {
            const username = solution.user.username;
            if (!userPointsMap[username]) {
                userPointsMap[username] = { points: 0 };
            }
            userPointsMap[username].points += solution.points;
            if (solution.points > 0) {
                userPointsMap[username].points += 1000;
            }
        });
        const sortedUsers = Object.entries(userPointsMap)
            .map(([username, { points }]) => ({ username, points }))
            .sort((a, b) => b.points - a.points);
        const topUser = sortedUsers[0];

        // Update winner (+1 win) and losers (+1 loss).
        await prisma.user.update({
            where: { username: topUser.username },
            data: { totalWins: { increment: 1 } }
        });
        const loserUpdates = sortedUsers.slice(1).map(user =>
            prisma.user.update({
                where: { username: user.username },
                data: { totalLosses: { increment: 1 } }
            })
        );
        await Promise.all(loserUpdates);
        console.log(`Game finalized: Winner is ${topUser.username}`);

        // Mark the game as finalized.
        finalizedGames[gameId].winner = topUser.username;
        // Optionally clear the initial player record for this lobby.
        delete initialLobbyUsersMap[lobbyId];
        console.log(`Initial player count for lobby ${lobbyId} deleted after finalization.`);

        res.json({
            message: "Game finalized after all players finished.",
            winner: topUser.username
        });
    } catch (err) {
        console.error("Error finalizing game:", err);
        res.status(500).json({ error: "Failed to finalize game" });
    }
});


// CREATE HTTP SERVER + SOCKET.IO
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
    cors: { origin: "*" },
});

// SOCKET.IO EVENTS
io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-lobby", ({ lobbyId, username }) => {
        socket.join(lobbyId.toString());
        console.log(`Socket ${socket.id} joined lobby ${lobbyId} as ${username}`);
        if (!lobbyUsersMap[lobbyId]) {
            lobbyUsersMap[lobbyId] = new Set();
        }
        lobbyUsersMap[lobbyId].add(username);
        console.log(`Current users in lobby ${lobbyId}:`, Array.from(lobbyUsersMap[lobbyId]));
        if (!initialLobbyUsersMap[lobbyId]) {
            initialLobbyUsersMap[lobbyId] = new Set();
        }
        initialLobbyUsersMap[lobbyId].add(username);
        console.log(`Initial users in lobby ${lobbyId}:`, Array.from(initialLobbyUsersMap[lobbyId]));
    });

    socket.on("chat-message", async ({ lobbyId, messageData }) => {
        const numericLobbyId = parseInt(lobbyId, 10);
        try {
            const newMsg = await prisma.message.create({
                data: {
                    content: messageData.content,
                    username: messageData.username,
                    lobbyId: numericLobbyId,
                },
            });
            io.to(lobbyId.toString()).emit("chat-message", newMsg);
        } catch (err) {
            console.error("Error storing message:", err);
        }
    });

    socket.on("leave-lobby", ({ lobbyId, username }) => {
        socket.leave(lobbyId.toString());
        console.log(`Socket ${socket.id} left lobby ${lobbyId} as ${username}`);
        if (lobbyUsersMap[lobbyId]) {
            lobbyUsersMap[lobbyId].delete(username);
            console.log(`Updated current users in lobby ${lobbyId}:`, Array.from(lobbyUsersMap[lobbyId]));
        }
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

// START SERVER
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
