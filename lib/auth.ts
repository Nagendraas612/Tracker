import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import crypto from "crypto";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Demo Account",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "demo@sih-tracker.com" },
        name: { label: "Name", type: "text", placeholder: "Demo Developer" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase() || "demo@sih-tracker.com";
        const name = credentials?.name?.trim() || "SIH Developer";

        await connectToDatabase();
        let user = await User.findOne({ email });

        if (!user) {
          const defaultTopic = `sih-alert-${crypto.randomBytes(4).toString("hex")}`;
          user = await User.create({
            name,
            email,
            image: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(email)}`,
            ntfyTopic: defaultTopic,
          });
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.image,
          ntfyTopic: user.ntfyTopic,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        await connectToDatabase();
        let dbUser = await User.findOne({ email: user.email });
        if (!dbUser) {
          const defaultTopic = `sih-alert-${crypto.randomBytes(4).toString("hex")}`;
          dbUser = await User.create({
            name: user.name || "SIH User",
            email: user.email,
            image: user.image || "",
            ntfyTopic: defaultTopic,
          });
        }
        (user as any).id = dbUser._id.toString();
        (user as any).ntfyTopic = dbUser.ntfyTopic;
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.ntfyTopic = (user as any).ntfyTopic;
      }
      if (trigger === "update" && session?.ntfyTopic) {
        token.ntfyTopic = session.ntfyTopic;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).ntfyTopic = token.ntfyTopic as string;

        // Fetch latest user data from DB to guarantee ntfyTopic sync
        if (token.id) {
          try {
            await connectToDatabase();
            const dbUser = await User.findById(token.id);
            if (dbUser) {
              (session.user as any).ntfyTopic = dbUser.ntfyTopic;
            }
          } catch (e) {
            // Fallback to token
          }
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET || "sih-tracker-super-secret-key-32chars-min",
};
