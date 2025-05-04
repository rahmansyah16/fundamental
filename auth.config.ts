import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import type { User } from "app/lib/definitions";
import bcrypt from "bcryptjs";
import postgres from "postgres";
import google from "next-auth/providers/google";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: "require" });

async function getUser(email: string): Promise<User | undefined> {
  try {
    const user = await sql<User[]>`SELECT * FROM users WHERE email=${email}`;
    return user[0];
  } catch (error) {
    console.error("Failed to fetch user:", error);
    throw new Error("Failed to fetch user.");
  }
}

export const authConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard");
      // jika ngarah ke dashboard dan childrennya (dashboard/.../..)
      if (isOnDashboard) {
        // jika user sudah login(terautentikasi), maka izinkan
        if (isLoggedIn) return true;
        // jika user belum login, maka redirect ke halaman login
        return false; // Redirect unauthenticated users to login page

        // jika ngarah ke halaman lain, maka cek apakah user sudah login
      } else if (isLoggedIn) {
        // jika user sudah login, maka redirect ke halaman dashboard
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      // "User tidak login, tapi halaman yang diminta adalah halaman publik, jadi silakan akses."
      return true;

      //  Jika user tidak sedang menuju ke /dashboard, dan juga belum login, izinkan saja aksesnya.
      //  Artinya halaman tersebut adalah halaman publik seperti:
      // /login
      // /register
      // /about
    },
  },
  // providers digunakan untuk menambakan opsi login (misal menggunakan google, facebook, github, dll)
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsedCredentials = z
          .object({
            email: z.string().email(),
            password: z.string().min(6),
          })
          .safeParse(credentials);
        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data;
          const user = await getUser(email);
          if (!user) return null;
          const passwordMatch = await bcrypt.compare(password, user.password);
          if (passwordMatch) return user;
        }
        console.log("invalid credentials");
        return null;
      },
    }),
    google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ], // Add providers with an empty array for now
} satisfies NextAuthConfig;
