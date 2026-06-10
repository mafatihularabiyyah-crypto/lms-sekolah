import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Kredensial",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email dan kata sandi wajib diisi!");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user) throw new Error("Identitas tidak ditemukan dalam sistem.");

        const isMatch = await bcrypt.compare(credentials.password, user.password);
        if (!isMatch) throw new Error("Kata sandi tidak valid.");

        if (!user.isActive) throw new Error("Lisensi instansi ini sedang dibekukan!");

        // PENTING: Hanya kembalikan data dasar untuk mencegah error serialisasi JSON
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId, // Bawa ID Sekolah ke dalam sesi
        };
      }
    })
  ],
  callbacks: {
    // 1. Masukkan data ke dalam Token JWT
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.tenantId = (user as any).tenantId;
      }
      return token;
    },
    // 2. Keluarkan data dari Token ke Sesi Browser (agar bisa dibaca oleh getSession di frontend)
    async session({ session, token }) {
      if (session?.user) {
        (session.user as any).id = token.sub;
        (session.user as any).role = token.role;
        (session.user as any).tenantId = token.tenantId;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // Sesi tahan 30 hari
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

// Wajib di-export dengan nama GET dan POST untuk App Router Next.js 14+
export { handler as GET, handler as POST };