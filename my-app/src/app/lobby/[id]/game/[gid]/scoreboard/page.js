"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "next/navigation";
import { Heading } from "../../../../../components/ui/Text";
import { useRouter } from "next/navigation";

export default function Scoreboard() {
    const { gid, id } = useParams(); // gid = gameId, id = lobbyId
    const [scores, setScores] = useState([]);
    const [expectedCount, setExpectedCount] = useState(0);
    const [finalizeMessage, setFinalizeMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();
    const lobbyId = id;

    useEffect(() => {
        if (!gid || !lobbyId) return;
        
        async function fetchGameDetailsAndMaybeFinalize() {
            try {
                // 1) Fetch scoreboard data
                const scoreboardRes = await axios.get(`http://localhost:8000/scoreboard/${gid}`);
                const rankedData = scoreboardRes.data.map((entry, index) => ({ ...entry, rank: index + 1 }));
                setScores(rankedData);
    
                // 2) check how much user
                const roomRes = await axios.get(`http://localhost:8000/initial-room-users/${lobbyId}`);
                const initialUsers = Array.isArray(roomRes.data) ? roomRes.data : [];
                setExpectedCount(initialUsers.length);
    
                // 3) Compare finish with total player
                if (rankedData.length === initialUsers.length) {
                    // All players have finished 
                    await axios.post(`http://localhost:8000/finalize-game/${gid}/${lobbyId}`);
                    setFinalizeMessage("Game finalized successfully!");
                } else {
                    setFinalizeMessage(`${rankedData.length}/${initialUsers.length} players have finished`);
                }
            } catch (err) {
                console.error("Error fetching or finalizing:", err);
                setError("Failed to load scores or finalize game.");
            } finally {
                setLoading(false);
            }
        }
    
        fetchGameDetailsAndMaybeFinalize();
    }, [gid, lobbyId]);

    const renderTable = (data, title) => (
        <div className="max-w-4xl mx-auto p-6">
            <Heading className="text-2xl font-bold mb-4 text-center">{title}</Heading>
            <div className="overflow-x-auto rounded-lg shadow-lg mb-8">
                <table className="min-w-full bg-white">
                    <thead className="bg-gray-800 text-white">
                        <tr>
                            <th className="px-6 py-3 text-left text-sm font-medium">Rank</th>
                            <th className="px-6 py-3 text-left text-sm font-medium">Username</th>
                            <th className="px-6 py-3 text-left text-sm font-medium">Total Points</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {data.map((entry) => (
                            <tr key={entry.username} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-gray-600">#{entry.rank}</td>
                                <td className="px-6 py-4 whitespace-nowrap font-medium">{entry.username}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-blue-600 font-semibold">
                                    {entry.totalPoints.toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen w-full">
            {error && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 flex" role="alert">
                    <p>{error}</p>
                </div>
            )}
            {renderTable(scores, "Game Leaderboard")}
            {finalizeMessage && (
                <div className="mt-4 text-center">
                    <p>{finalizeMessage}</p>
                </div>
            )}
            {/* Return Buttons */}
            <button
                onClick={() => router.push(`/lobby`)}
                className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-200"
            >
                Return to Lobby
            </button>
            <button
                onClick={() => router.push(`/lobby/${lobbyId}`)}
                className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-200"
            >
                Return to Waiting Room
            </button>
        </div>
    );
}
