'use client';
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "../../components/ui/Button";
import { Heading, MainText, SubText } from "../../components/ui/Text";
import {Container} from "../../components/ui/Container";
import { RoundedContainer } from "../../components/ui/RContainer";

export default function CreateLobby() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    numProblems: 3,
    problemTypes: [],
    difficulty: "Easy",
    isPrivate: false,
    maxPeople: 4
  });
  const [inviteLink, setInviteLink] = useState("");
  const [error, setError] = useState("");

  // Available problem types
  const availableProblemTypes = [
    "Arrays", "Bit Manipulation", "Dynamic Programming", "Graphs", "Math", 
    "Recursion", "Search", "Sorting", "Strings"
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === "checkbox") {
      setFormData({ ...formData, [name]: checked });
    } else if (name === "numProblems") {
      // Ensure number of problems is between 1 and 10
      const numProblems = Math.min(Math.max(1, parseInt(value)), 10);
      setFormData({ ...formData, [name]: numProblems });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleProblemTypeToggle = (type) => {
    const updatedTypes = formData.problemTypes.includes(type)
      ? formData.problemTypes.filter(t => t !== type)
      : [...formData.problemTypes, type];
    
    // Ensure at least one problem type is selected
    if (updatedTypes.length > 0) {
      setFormData({ ...formData, problemTypes: updatedTypes });
    }
  };

  const createRoom = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!session?.user?.name) {
      setError("You must be logged in to create a room");
      return;
    }

    if (formData.problemTypes.length === 0) {
      setError("Please select at least one problem type");
      return;
    }

    try {
      setIsCreating(true);
      
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          maxPeople: parseInt(formData.maxPeople,10),
          numPeople: 1, // Starting with the creator
          private: formData.isPrivate,
          active: true,
          owner: session.user.name,
          difficulty: formData.difficulty,
          problemTypes: formData.problemTypes,
          numProblems: parseInt(formData.numProblems,10)
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create room");
      }

      const data = await response.json();
      setInviteLink(`${window.location.origin}/lobby/join/${data.id}`);
      
      // Navigate to the room page once created
      router.push(`/lobby/${data.id}`);
    } catch (error) {
      console.error("Error creating room:", error);
      setError(error.message || "Failed to create room");
    } finally {
      setIsCreating(false);
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    alert("Invite link copied to clipboard!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-800 to-slate-900 py-8 px-4">
      <Container className="max-w-2xl mx-auto bg-transparent">
        <div className="mb-8 text-center">
          <Heading className="text-3xl font-bold mb-2 text-white">Create a Coding Room</Heading>
          <SubText className="text-slate-400">Customize your multiplayer coding session</SubText>
        </div>
        
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-6 py-4 rounded-lg mb-6">
            <p className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
          </div>
        )}
        
        <form onSubmit={createRoom} className="space-y-6">
          {/* Room Settings Section */}
          <RoundedContainer className="bg-slate-700/30 backdrop-blur-sm p-6 rounded-xl border border-slate-600 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
              <svg className="w-5 h-5 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Room Settings
            </h2>
            
            <div className="mb-5">
              <label className="block mb-2 text-sm font-medium text-slate-300">
                Maximum Players:
              </label>
              <input
                type="number"
                name="maxPeople"
                min="2"
                max="10"
                value={formData.maxPeople}
                onChange={handleInputChange}
                className="w-full rounded-lg bg-slate-800/50 border border-slate-600 p-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            
            <div>
              <label className="flex items-center cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    name="isPrivate"
                    checked={formData.isPrivate}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className={`w-12 h-6 rounded-full ${formData.isPrivate ? 'bg-emerald-500' : 'bg-slate-600'} transition-colors`}></div>
                  <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition transform ${formData.isPrivate ? 'translate-x-6' : ''}`}></div>
                </div>
                <span className="ml-3 text-slate-300">Private Room</span>
              </label>
              <p className="mt-1 text-xs text-slate-400 ml-12">Private rooms are only accessible via invite link</p>
            </div>
          </RoundedContainer>

          {/* Problem Settings Section */}
          <RoundedContainer className="bg-slate-700/30 backdrop-blur-sm p-6 rounded-xl border border-slate-600 shadow-lg">
            <h2 className="text-xl font-semibold mb-4 text-white flex items-center">
              <svg className="w-5 h-5 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Problem Settings
            </h2>
            
            <div className="mb-5">
              <label className="block mb-2 text-sm font-medium text-slate-300">
                Number of Problems:
              </label>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => handleInputChange({target: {name: 'numProblems', value: Math.max(1, formData.numProblems - 1)}})}
                  className="bg-slate-600 text-white p-2 rounded-l-lg hover:bg-slate-500 transition-colors"
                >
                  -
                </button>
                <input
                  type="number"
                  name="numProblems"
                  min="1"
                  max="10"
                  value={formData.numProblems}
                  onChange={handleInputChange}
                  className="w-16 text-center bg-slate-800/50 border-y border-slate-600 p-2 text-white focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleInputChange({target: {name: 'numProblems', value: Math.min(10, formData.numProblems + 1)}})}
                  className="bg-slate-600 text-white p-2 rounded-r-lg hover:bg-slate-500 transition-colors"
                >
                  +
                </button>
              </div>
            </div>
            
            <div className="mb-5">
              <label className="block mb-2 text-sm font-medium text-slate-300">
                Difficulty:
              </label>
              <div className="flex gap-3">
                {['Easy', 'Medium', 'Hard'].map((level) => (
                  <label key={level} className="flex-1">
                    <input
                      type="radio"
                      name="difficulty"
                      value={level}
                      checked={formData.difficulty === level}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className={`text-center p-2 rounded-lg cursor-pointer transition-all ${
                      formData.difficulty === level 
                        ? level === 'Easy' 
                          ? 'bg-green-500/20 text-green-400 border-2 border-green-500' 
                          : level === 'Medium' 
                            ? 'bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500' 
                            : 'bg-red-500/20 text-red-400 border-2 border-red-500'
                        : 'bg-slate-600/50 text-slate-300 border-2 border-transparent hover:bg-slate-600'
                    }`}>
                      {level}
                    </div>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block mb-3 text-sm font-medium text-slate-300">Problem Types:</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {availableProblemTypes.map((type) => (
                  <label key={type} className="cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.problemTypes.includes(type)}
                      onChange={() => handleProblemTypeToggle(type)}
                      className="sr-only"
                    />
                    <div className={`p-2 rounded-lg text-center text-sm transition-all ${
                      formData.problemTypes.includes(type)
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500'
                        : 'bg-slate-700 text-slate-400 border border-slate-600 hover:bg-slate-600/70'
                    }`}>
                      {type}
                    </div>
                  </label>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-400">Select at least one problem type</p>
            </div>
          </RoundedContainer>

          <div className="flex flex-col md:flex-row gap-4 pt-2">
            <button
              type="submit"
              disabled={isCreating}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 px-4 rounded-lg transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center"
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                  Creating...
                </>
              ) : (
                "Create Room"
              )}
            </button>
            <button
              type="button"
              onClick={() => router.push('/lobby')}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium py-3 px-4 rounded-lg transition-all"
            >
              Cancel
            </button>
          </div>
        </form>

        {inviteLink && (
          <div className="mt-8 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 p-6 rounded-lg">
            <div className="flex items-center mb-3">
              <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <h3 className="font-semibold text-lg">Room Created Successfully!</h3>
            </div>
            <p className="mb-3">Share this link with friends to invite them:</p>
            <div className="flex">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-grow p-3 bg-slate-800 border border-slate-600 text-white rounded-l-lg focus:outline-none"
              />
              <button
                onClick={copyInviteLink}
                className="bg-emerald-600 text-white px-4 rounded-r-lg hover:bg-emerald-700 transition-all"
              >
                Copy
              </button>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}