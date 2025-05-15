import Link from "next/link";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Button } from "./components/ui/Button";
import { Heading, MainText, SubText } from "./components/ui/Text";
import { Container } from "./components/ui/Container";
import "./style.css"

export default async function Home() {
  const session = await getServerSession();
  if (session && session.user) {
    redirect("/lobby");
  }
  
  return (
    <>
      <head>
        <title>Multiplayer LeetCode</title>
      </head>
      <Container fullScreen className="flex items-center justify-center min-h-screen bg-gradient-to-b from-slate-800 to-slate-900">
        <div className="flex flex-col items-center justify-center bg-slate-700/30 backdrop-blur-sm rounded-xl shadow-2xl p-12 max-w-md border border-slate-600">
          <Heading className="text-5xl font-bold mb-6 text-white">
            Multiplayer <span className="text-emerald-400">LeetCode</span>
          </Heading>
          
          <MainText className="text-lg mb-8 text-slate-300">
            Solve coding challenges with friends in real-time. Practice together, learn faster.
          </MainText>
          
          <div className="space-y-4 w-full">
            <div className="flex items-center justify-center space-x-2">
              <SubText className="text-slate-400">Don't have an account?</SubText>
              <Link href="/register">
                <span className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors">
                  Sign Up
                </span>
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}