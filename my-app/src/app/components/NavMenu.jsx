"use client";
import Link from "next/link";
import { signIn, signOut, useSession } from "next-auth/react";

function AuthButton() {
    const { data: session } = useSession();
    const username = session?.user?.name; // Get the username from session


    if (session) {
        return (
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                <Link 
                    href={`/${username}/stats`} // Dynamic stats link
                    style={{ textDecoration: "none", color: "#ffffff", fontSize: "14px", fontWeight: "bold" }}>
                    Stats
                </Link>
                <Link href="/lobby" style={{ textDecoration: "none", color: "#ffffff", fontSize: "14px", fontWeight: "bold" }}>Lobby</Link>
                <span style={{ fontSize: "14px", fontWeight: "bold", color: "#ffffff" }}>
                    {session?.user?.name}
                </span>
                <button
                    onClick={() => signOut()}
                    style={{
                        padding: "6px 12px",
                        backgroundColor: "#DC3545",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer",
                        fontSize: "12px"
                    }}>
                    Sign Out
                </button>
            </div>
        );
    }
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <span style={{ fontSize: "14px", fontWeight: "bold", color: "#ffffff" }}>Not signed in</span>
            <button
                onClick={() => signIn()}
                style={{
                    padding: "6px 12px",
                    backgroundColor: "#007BFF",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                    fontSize: "12px"
                }}>
                Sign In
            </button>
        </div>
    );
}

export default function NavMenu() {
    return (
        <>
            <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 20px",
                background: "#333",
                color: "white",
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "50px",
                zIndex: 1000
            }}>
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "bold", color: "#ffffff" }}>EliteCode Wars</h2>
                <AuthButton />
            </div>
            {/* Push down content to prevent overlap */}
            <div style={{ height: "50px" }}></div>
        </>
    );
}