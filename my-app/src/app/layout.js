import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Inter } from "next/font/google";
import { getServerSession } from "next-auth";
import SessionProvider from "./components/SessionProvider";
import NavMenu from "./components/NavMenu";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
    title: "EliteCode",
    description: "Multiplayer LeetCode",
};

export default async function RootLayout({ children }) {
    const session = await getServerSession();
    return (
        <html lang="en">
            <body className={inter.className}>
                <SessionProvider session={session}>
                    <NavMenu />
                    <main className="">
                        {children}
                    </main>
                </SessionProvider>
            </body>
        </html>
    );
}
