"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Editor from "@monaco-editor/react";
import axios from "axios";
import { io } from "socket.io-client";
import { useSession } from "next-auth/react";

export default function CodeEditor() {
  const router = useRouter();
  const { data: session } = useSession();
  const username = session?.user?.name || "GuestUser";

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

  const programmingLanguages = ["python", "cpp", "java", "c"];

  // We'll keep your original "problem statement"
  const questionPrompt = "Write a function that returns the factorial of a given number.";

  // Game + Questions
  const lobbyId = 2; // The Room ID
  const gameId = 1;  // The Game with questions
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [isCorrect, setIsCorrect] = useState(false);

  // Start/End times
  const [startTime, setStartTime] = useState(null);

  // Chat states
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [roomUsers, setRoomUsers] = useState([]);
  const [socket, setSocket] = useState(null);

  // 1) Fetch questions
  useEffect(() => {
    async function fetchGameQuestions() {
      try {
        const res = await axios.get(`http://localhost:8000/game/${gameId}/questions`);
        setQuestions(res.data);
      } catch (err) {
        console.error("Error fetching game questions:", err);
      }
    }
    fetchGameQuestions();
  }, [gameId]);

  // 2) Whenever currentQIndex changes, set a new startTime
  useEffect(() => {
    setStartTime(Date.now());
    setIsCorrect(false); // reset correctness for the new question
    setUserOutput("");   // clear old output
  }, [currentQIndex]);

  // The current question object
  const currentQuestion = questions[currentQIndex] || null;

  // 3) Socket + Chat
  useEffect(() => {
    const updateHeight = () => setWindowHeight(window.innerHeight);
    window.addEventListener("resize", updateHeight);
    updateHeight();
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

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

  // 4) Compile code
  const compileCode = async () => {
    setLoading(true);
    setIsCorrect(false); 
    try {
      const startTimePerf = performance.now();
      const res = await axios.post("http://localhost:8000/compile", {
        code: userCode[userLang],
        language: userLang,
        input: userInput,
      });
      const endTimePerf = performance.now();

      const stdout = res.data.stdout || "";
      const stderr = res.data.stderr || "";
      setUserOutput(stdout || stderr);
      setExecutionTime(res.data.executionTime || `${(endTimePerf - startTimePerf).toFixed(2)} ms`);
      setMemoryUsage(res.data.memoryUsage || "N/A KB");

      // If we have a current question, compare output
      if (currentQuestion) {
        if (stdout.trim() === (currentQuestion.output_example || "").trim()) {
          setIsCorrect(true);
        } else {
          setIsCorrect(false);
        }
      }
    } catch (error) {
      console.error("Error compiling code:", error);
      setUserOutput("Compilation error");
      setExecutionTime("N/A");
      setMemoryUsage("N/A");
    } finally {
      setLoading(false);
    }
  };

  // 5) Send chat
  const sendChatMessage = () => {
    if (!chatInput.trim() || !socket) return;
    socket.emit("chat-message", {
      lobbyId,
      messageData: {
        username,
        content: chatInput,
      },
    });
    setChatInput("");
  };

  // 6) Handle Next or Finish
  const handleNext = async () => {
    if (!currentQuestion) {
      return;
    }

    // 1) endTime
    const endTime = Date.now();
    const timeSpent = endTime - startTime;

    // 2) Assign points if correct
    const points = isCorrect ? 10 : 0; // or your logic

    // 3) POST to /solution
    try {
      await axios.post("http://localhost:8000/solution", {
        qid: currentQuestion.id,
        gid: gameId,
        username,
        code: userCode[userLang] || "",
        output: userOutput,
        language: userLang,
        points,
        executionTime: parseInt(executionTime) || 0, // or parse from your data
        timeStart: new Date(startTime).toISOString(),
        timeEnd: new Date(endTime).toISOString(),
      });
      console.log("Solution saved!");
    } catch (err) {
      console.error("Error saving solution:", err);
    }

    // 4) If it's not the last question, go to next. Otherwise scoreboard?
    if (currentQIndex < questions.length - 1) {
      setCurrentQIndex((prev) => prev + 1);
    } else {
      // If it's the final question
      console.log("All questions done, go to scoreboard!");
      // e.g. router.push("/scoreboard");
    }
  };

  // 7) Render
  return (
    <div style={{ width: "90%", maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
      {/* Problem statement */}
      <div
        style={{
          marginBottom: "15px",
          padding: "10px",
          border: "1px solid #ccc",
          borderRadius: "5px",
          background: "#f9f9f9",
        }}
      >
        <button
          onClick={() => setIsQuestionVisible(!isQuestionVisible)}
          style={{
            background: "none",
            border: "none",
            fontSize: "16px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          {isQuestionVisible ? "Hide Problem Statement ▲" : "Show Problem Statement ▼"}
        </button>
        {isQuestionVisible && <p style={{ marginTop: "10px" }}>{questionPrompt}</p>}
      </div>

      {/* Current DB Question */}
      {currentQuestion && (
        <div style={{ marginBottom: "15px", padding: "10px", border: "1px solid #ccc", borderRadius: "5px" }}>
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
        </div>
      )}

      {/* Language Selector */}
      <h3>Select Language:</h3>
      <select
        onChange={(e) => {
          const newLang = e.target.value;
          setUserLang(newLang);
          if (!userCode[newLang]) {
            setUserCode((prev) => ({ ...prev, [newLang]: "// Start coding here..." }));
          }
        }}
        value={userLang}
        style={{ marginLeft: "10px", padding: "5px", fontSize: "16px" }}
      >
        {programmingLanguages.map((lang) => (
          <option key={lang} value={lang}>
            {lang.toUpperCase()}
          </option>
        ))}
      </select>

      {/* Input */}
      <h4>Input:</h4>
      <textarea
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        style={{ width: "100%", height: "100px", padding: "10px", borderRadius: "5px", border: "1px solid #ccc", fontSize: "14px" }}
      />

      {/* Code Editor */}
      <div
        style={{
          height: `${windowHeight * 0.5}px`,
          border: "1px solid #ccc",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
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

      {/* Buttons */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "20px",
          marginTop: "20px",
        }}
      >
        <button
          onClick={compileCode}
          disabled={loading}
          style={{
            padding: "12px 24px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "16px",
            minWidth: "150px",
          }}
        >
          {loading ? "Running..." : "Run Code"}
        </button>

        <button
          onClick={handleNext}
          style={{
            padding: "12px 24px",
            backgroundColor: "#FF5733",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontSize: "16px",
            minWidth: "150px",
          }}
        >
          {currentQIndex < questions.length - 1 ? "Next" : "Finish"}
        </button>
      </div>

      {/* Output */}
      <h4 style={{ marginTop: "20px" }}>Output:</h4>
      <pre
        style={{
          background: "#f4f4f4",
          padding: "10px",
          borderRadius: "5px",
          minHeight: "50px",
          fontSize: "14px",
          whiteSpace: "pre-wrap",
        }}
      >
        {userOutput}
      </pre>
      <p>
        <strong>Execution Time:</strong> {executionTime} ms
      </p>
      <p>
        <strong>Memory Usage:</strong> {memoryUsage} KB
      </p>

      {/* Show user list */}
      <h2>Users in Room #{lobbyId}</h2>
      <ul>
        {roomUsers.map((u) => (
          <li key={u.username}>{u.username}</li>
        ))}
      </ul>

      {/* Chat */}
      <h2 style={{ marginTop: 40 }}>Chat (Room #{lobbyId})</h2>
      <p>Logged in as: {username}</p>
      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: "5px",
          padding: "10px",
          maxHeight: "200px",
          overflowY: "auto",
          marginBottom: "10px",
          background: "#f9f9f9",
        }}
      >
        {chatMessages.map((msg) => (
          <div key={msg.id} style={{ marginBottom: "5px" }}>
            <strong>{msg.username}:</strong> {msg.content}
          </div>
        ))}
      </div>

      <div>
        <input
          type="text"
          placeholder="Type a message..."
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          style={{ width: "70%", padding: "8px" }}
        />
        <button
          onClick={sendChatMessage}
          style={{
            marginLeft: 8,
            padding: "8px 16px",
            backgroundColor: "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
