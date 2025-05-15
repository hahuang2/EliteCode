"use client";
import { useState } from "react";
import Link from "next/link";
import { Button } from "../components/ui/Button";
import { Heading, MainText, SubText } from "../components/ui/Text";
import { Container } from "../components/ui/Container";

export default function RegisterPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsLoading(true);
    
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }
      
      setMessage("Account created successfully!");
      setForm({ username: "", password: "" });
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container fullScreen className="flex items-center justify-center bg-gradient-to-b from-slate-800 to-slate-900">
      <div className="w-full max-w-md px-6">
        <div className="bg-slate-700/30 backdrop-blur-sm rounded-xl shadow-2xl p-8 border border-slate-600">
          <div className="text-center mb-6">
            <Heading className="text-3xl font-bold text-white">Create an Account</Heading>
            <SubText className="text-slate-400 mt-2">Join the multiplayer coding experience</SubText>
          </div>
          
          {message && (
            <div className={`p-3 mb-4 rounded-md ${message.includes("success") ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}>
              {message}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-1">
                Username
              </label>
              <input
                id="username"
                type="text"
                name="username"
                placeholder="Enter your username"
                required
                value={form.username}
                onChange={handleChange}
                className="w-full bg-slate-800/50 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                name="password"
                placeholder="Create a strong password"
                required
                value={form.password}
                onChange={handleChange}
                className="w-full bg-slate-800/50 border border-slate-600 rounded-lg p-3 text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
              />
            </div>
            
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 rounded-lg transition-all disabled:opacity-70"
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <SubText className="text-slate-400">
              Already have an account?{" "}
              <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                Sign In
              </Link>
            </SubText>
          </div>
        </div>
      </div>
    </Container>
  );
}