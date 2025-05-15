"use client";
import { useParams } from 'next/navigation';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Editor from "@monaco-editor/react";
import axios from "axios";
import { io } from "socket.io-client";
import { useSession } from "next-auth/react";

function ProblemStatement({ gameId, currentQIndex, isCorrect, onQuestionsFetched }) {
    const [questions, setQuestions] = useState([]);

    useEffect(() => {
        const fetchGameQuestions = async () => {
            try {
                const res = await axios.get(`http://localhost:8000/game/${gameId}/questions`);
                setQuestions(res.data);
                onQuestionsFetched(res.data);
            } catch (err) {
                console.error("Error fetching game questions:", err);
            }
        };
        fetchGameQuestions();
    }, [gameId]);

    const currentQuestion = questions[currentQIndex] || null;

    return (
        <div>
            {currentQuestion ? (
                <>
                    <h3>Question #{currentQuestion.id}:</h3>
                    <p><strong>Title:</strong> {currentQuestion.title}</p>
                    <p><strong>Description:</strong> {currentQuestion.description}</p>
                    <p><strong>Input Example:</strong> {currentQuestion.input_example}</p>
                    <p><strong>Expected Output:</strong> {currentQuestion.output_example}</p>
                    {isCorrect ? (
                        <p style={{ color: "green" }}>✅ Correct Output!</p>
                    ) : (
                        <p style={{ color: "red" }}>❌ Incorrect (or not checked yet)</p>
                    )}
                </>
            ) : (
                <p>Loading questions...</p>
            )}
        </div>
    );
}

export default function CodeEditor() {
    const router = useRouter();
    const { data: session } = useSession();
    const username = session?.user?.name || "GuestUser";
    const { id, gid } = useParams();
    const lobbyId = id;
    const gameId = gid;

    // Editor states
    const [userCode, setUserCode] = useState({ python: "", cpp: "", java: "", c: "" });
    const [userLang, setUserLang] = useState("python");
    const [fontSize, setFontSize] = useState(18);
    const [userInput, setUserInput] = useState("");
    const [userOutput, setUserOutput] = useState("");
    const [loading, setLoading] = useState(false);
    const [windowHeight, setWindowHeight] = useState(800);
    const [executionTime, setExecutionTime] = useState("N/A");
    const [memoryUsage, setMemoryUsage] = useState("N/A");
    const [isQuestionVisible, setIsQuestionVisible] = useState(true);
    const [questions, setQuestions] = useState([]);
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [isCorrect, setIsCorrect] = useState(false);
    const [startTime, setStartTime] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState("");
    const [roomUsers, setRoomUsers] = useState([]);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        setStartTime(Date.now());
        setIsCorrect(false);
        setUserOutput("");
    }, [currentQIndex]);

    useEffect(() => {
        const updateHeight = () => setWindowHeight(window.innerHeight);
        window.addEventListener("resize", updateHeight);
        updateHeight();
        return () => window.removeEventListener("resize", updateHeight);
    }, []);

    useEffect(() => {
        if (gameId) {
            axios.get(`http://localhost:8000/game/${gameId}/questions`)
                .then(res => setQuestions(res.data))
                .catch(err => console.error("Error loading questions:", err));
        }
    }, [gameId]);

    useEffect(() => {
        const newSocket = io("http://localhost:8000");
        setSocket(newSocket);
        newSocket.emit("join-lobby", { lobbyId, username });

        const fetchOldMessages = async () => {
            try {
                const res = await axios.get(`http://localhost:8000/messages/${lobbyId}`);
                setChatMessages(res.data);
            } catch (err) {
                console.error("Error fetching old messages:", err);
            }
        };
        fetchOldMessages();

        newSocket.on("chat-message", (newMsg) => {
            setChatMessages((prev) => [...prev, newMsg]);
        });

        const fetchRoomUsers = async () => {
            try {
                const userRes = await axios.get(`http://localhost:8000/room-users/${lobbyId}`);
                setRoomUsers(userRes.data);
            } catch (err) {
                console.error("Error fetching room users:", err);
            }
        };
        fetchRoomUsers();

        return () => {
            newSocket.emit("leave-lobby", { lobbyId, username });
            newSocket.disconnect();
        };
    }, [lobbyId, username]);

    const compileCode = async () => {
        setLoading(true);
        setIsCorrect(false);
        try {
            const res = await axios.post("http://localhost:8000/compile", {
                code: userCode[userLang],
                language: userLang,
                input: userInput,
            });

            const stdout = res.data.stdout || "";
            const stderr = res.data.stderr || "";

            // Ensure numeric values for DB
            setExecutionTime(`${res.data.executionTime} ms`);
            setMemoryUsage(`${res.data.memoryUsage} KB`);

            // Handle correctness check
            const correct = questions[currentQIndex] &&
                stdout.trim() === questions[currentQIndex].output_example.trim();
            setIsCorrect(correct);

            setUserOutput(stdout || stderr);
        } catch (error) {
            console.error("Error compiling code:", error);
            setUserOutput("Compilation error");
            setExecutionTime("N/A");
            setMemoryUsage("N/A");
        } finally {
            setLoading(false);
        }
    };

    const sendChatMessage = () => {
        if (!chatInput.trim() || !socket) return;
        socket.emit("chat-message", {
            lobbyId,
            messageData: { username, content: chatInput },
        });
        setChatInput("");
    };

    const handleNext = async () => {
        const endTime = Date.now();
        console.log("Here");
        try {
            // Only save solution if we have valid data
            if (questions[currentQIndex]?.id && gameId) {
                console.log("In here");
                await axios.post("http://localhost:8000/solution", {
                    qid: questions[currentQIndex].id,
                    gid: Number(gameId),
                    username,
                    code: userCode[userLang],
                    output: userOutput,
                    language: userLang,
                    points: isCorrect ? 100 : 0,
                    executionTime: parseInt(executionTime.replace(' ms', '')) || 0,
                    timeStart: new Date(startTime).toISOString(),
                    timeEnd: new Date(endTime).toISOString(),
                });
            }

            // Handle question progression
            if (currentQIndex < questions.length - 1) {
                setCurrentQIndex(prev => prev + 1);
            } else {
                console.log("All questions done!");
                router.push(`/lobby/${lobbyId}/game/${gameId}/scoreboard`);

            }
        } catch (err) {
            console.error("Error saving solution:", err);
            setUserOutput(`Error saving solution: ${err.response?.data?.error || "Server error"}`);
        }

    };

    return (
        <div style={{
            width: "90%",
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "20px",
            fontFamily: "'Segoe UI', sans-serif",
            backgroundColor: "#f5f6fa"
        }}>
            <div style={{
                marginBottom: "20px",
                padding: "20px",
                border: "1px solid #dcdde1",
                borderRadius: "12px",
                backgroundColor: "white",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
            }}>
                <button
                    onClick={() => setIsQuestionVisible(!isQuestionVisible)}
                    style={{
                        background: "none",
                        border: "none",
                        fontSize: "16px",
                        cursor: "pointer",
                        fontWeight: "600",
                        color: "#2d3436",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                    }}
                >
                    {isQuestionVisible ? "▼ Hide Problem Statement" : "▲ Show Problem Statement"}
                </button>
                {isQuestionVisible && (
                    <ProblemStatement
                        gameId={gameId}
                        currentQIndex={currentQIndex}
                        isCorrect={isCorrect}
                        onQuestionsFetched={setQuestions}
                    />
                )}
            </div>

            <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px",
                marginBottom: "20px",
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
            }}>
                <div>
                    <h3 style={{ marginBottom: "12px", color: "#2d3436" }}>Select Language</h3>
                    <select
                        onChange={(e) => {
                            const newLang = e.target.value;
                            setUserLang(newLang);
                            if (!userCode[newLang]) {
                                setUserCode((prev) => ({ ...prev, [newLang]: "// Start coding here..." }));
                            }
                        }}
                        value={userLang}
                        style={{
                            width: "100%",
                            padding: "12px",
                            borderRadius: "8px",
                            border: "2px solid #3498db",
                            fontSize: "16px",
                            backgroundColor: "#f8f9fa",
                            cursor: "pointer",
                            transition: "all 0.3s ease"
                        }}
                    >
                        {["python", "cpp", "java", "c"].map((lang) => (
                            <option key={lang} value={lang} style={{ padding: "8px" }}>
                                {lang.toUpperCase()}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <h3 style={{ marginBottom: "12px", color: "#2d3436" }}>Custom Input</h3>
                    <textarea
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        style={{
                            width: "100%",
                            height: "120px",
                            padding: "12px",
                            borderRadius: "8px",
                            border: "2px solid #3498db",
                            fontSize: "14px",
                            backgroundColor: "#f8f9fa",
                            resize: "vertical"
                        }}
                        placeholder="Enter test input here..."
                    />
                </div>
            </div>

            <div style={{
                height: `${windowHeight * 0.5}px`,
                border: "2px solid #dcdde1",
                borderRadius: "12px",
                overflow: "hidden",
                marginBottom: "20px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
            }}>
                <Editor
                    options={{ fontSize }}
                    height="100%"
                    width="100%"
                    theme="vs-dark"
                    language={userLang}
                    value={userCode[userLang]}
                    onChange={(value) => setUserCode((prev) => ({ ...prev, [userLang]: value || "" }))}
                />
            </div>

            <div style={{ display: "flex", gap: "1rem", margin: "20px 0" }}>
                <button
                    onClick={compileCode}
                    disabled={loading}
                    style={{
                        backgroundColor: "#4CAF50",
                        padding: "10px 20px",
                        borderRadius: "5px",
                        cursor: loading ? "not-allowed" : "pointer"
                    }}
                >
                    {loading ? "🔄 Running..." : "🚀 Run Code"}
                </button>

                <button
                    onClick={handleNext}
                    style={{
                        backgroundColor: "#2196F3",
                        padding: "10px 20px",
                        borderRadius: "5px"
                    }}
                >
                    {currentQIndex < questions.length - 1
                        ? "⏭️ Next Question"
                        : "🏁 Finish Game"}
                </button>
            </div>

            <div style={{
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
            }}>
                <h3 style={{ marginBottom: "15px", color: "#2d3436" }}>Execution Results</h3>

                <div style={{
                    backgroundColor: "#2d3436",
                    padding: "15px",
                    borderRadius: "8px",
                    marginBottom: "15px"
                }}>
                    <pre style={{
                        color: "#dfe6e9",
                        whiteSpace: "pre-wrap",
                        fontFamily: "'Fira Code', monospace",
                        fontSize: "14px",
                        lineHeight: "1.5",
                        margin: 0
                    }}>
                        {userOutput || "Your output will appear here..."}
                    </pre>
                </div>

                <div style={{
                    display: "flex",
                    gap: "30px",
                    padding: "15px",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "8px"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{
                            backgroundColor: "#0984e3",
                            color: "white",
                            padding: "6px 12px",
                            borderRadius: "20px",
                            fontSize: "14px"
                        }}>
                            ⏱️ Time
                        </span>
                        <span style={{ fontWeight: "600", color: "#2d3436" }}>
                            {executionTime}
                        </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{
                            backgroundColor: "#d63031",
                            color: "white",
                            padding: "6px 12px",
                            borderRadius: "20px",
                            fontSize: "14px"
                        }}>
                            🧠 Memory
                        </span>
                        <span style={{ fontWeight: "600", color: "#2d3436" }}>
                            {memoryUsage}
                        </span>
                    </div>
                </div>
            </div>

            <div style={{
                marginTop: "30px",
                backgroundColor: "white",
                padding: "20px",
                borderRadius: "12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
            }}>
                <h2 style={{
                    marginBottom: "20px",
                    color: "#2d3436",
                    display: "flex",
                    alignItems: "center",
                    gap: "10px"
                }}>
                    <span>💬 Live Chat</span>
                    <span style={{
                        backgroundColor: "#6c5ce7",
                        color: "white",
                        padding: "4px 12px",
                        borderRadius: "20px",
                        fontSize: "14px"
                    }}>
                        Room #{lobbyId}
                    </span>
                </h2>

                <div style={{
                    border: "2px solid #dcdde1",
                    borderRadius: "8px",
                    padding: "15px",
                    height: "300px",
                    overflowY: "auto",
                    marginBottom: "15px",
                    backgroundColor: "#f8f9fa"
                }}>
                    {chatMessages.map((msg) => (
                        <div key={msg.id} style={{
                            marginBottom: "12px",
                            display: "flex",
                            flexDirection: msg.username === username ? "row-reverse" : "row"
                        }}>
                            <div style={{
                                maxWidth: "70%",
                                padding: "12px 18px",
                                borderRadius: "18px",
                                backgroundColor: msg.username === username ? "#6c5ce7" : "#00b894",
                                color: "white",
                                wordBreak: "break-word",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                                lineHeight: "1.4"
                            }}>
                                <div style={{
                                    fontSize: "12px",
                                    opacity: 0.9,
                                    marginBottom: "6px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "6px"
                                }}>
                                    <span>👤 {msg.username}</span>
                                    <span style={{ opacity: 0.7 }}>·</span>
                                    <span style={{ fontSize: "11px" }}>
                                        {new Date(msg.createdAt).toLocaleTimeString()}
                                    </span>
                                </div>
                                <div>{msg.content}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ display: "flex", gap: "12px" }}>
                    <input
                        type="text"
                        placeholder="Type your message here..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                        style={{
                            flex: 1,
                            padding: "14px",
                            borderRadius: "25px",
                            border: "2px solid #6c5ce7",
                            fontSize: "14px",
                            outline: "none",
                            transition: "all 0.3s ease"
                        }}
                    />
                    <button
                        onClick={sendChatMessage}
                        style={{
                            padding: "14px 28px",
                            backgroundColor: "#6c5ce7",
                            color: "white",
                            border: "none",
                            borderRadius: "25px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: "600",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            transition: "all 0.3s ease",
                            ":hover": {
                                backgroundColor: "#5b4bc4",
                                transform: "translateY(-1px)"
                            }
                        }}
                    >
                        <span>📨</span>
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}