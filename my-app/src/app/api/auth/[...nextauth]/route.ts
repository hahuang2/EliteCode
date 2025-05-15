import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "Username" },
        password: { label: "Password", type: "password", placeholder: "Password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Missing username or password");
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
        });

        if (!user || user.password !== credentials.password) {
          throw new Error("Invalid username or password");
        }

        return {
          id: user.username,
          name: user.username,
        };
      },
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
    }),
  ],
  
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "github") {
        try {
          // Check if user already exists in the database
          const existingUser = await prisma.user.findUnique({
            where: { username: user.name }, // use name as user
          });

          if (!existingUser) {
            // Create new user if they don't exist
            await prisma.user.create({
              data: {
                username: user.name || `github-${user.id}`, // GitHub username or fallback
                email: "github", // placeholder
                password: "github_auth", // placeholder
                totalWins: 0,
                totalLosses: 0,
                totalGames: 0,
              },
            });
          }
        } catch (error) {
          console.error("Error saving GitHub user to database:", error);
          return false; // Reject sign-in if something goes wrong
        }
      }
      return true; // Allow sign-in
    },

    async session({ session }) {
      return session;
    },
  },

  session: {
    strategy: "jwt" as "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,
};

export const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
