import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@lms.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // 1. Cari user di database
        const user = await prisma.user.findUnique({ 
          where: { email: credentials.email } 
        });

        // 2. FITUR SULAP UNTUK DEVELOPMENT: 
        if (!user) {
          const userCount = await prisma.user.count();
          if (userCount === 0) {
            const hashedPassword = await bcrypt.hash(credentials.password, 10);
            const newUser = await prisma.user.create({
              data: {
                name: "Admin Utama",
                email: credentials.email,
                password: hashedPassword,
                role: "ADMIN",
                // SOLUSI ERROR 1: Tambahkan tenantId bawaan
                tenantId: "default_tenant" 
              }
            });
            return newUser; 
          }
          throw new Error("Email tidak ditemukan!");
        }

        // 3. Jika user ada, cocokkan password-nya
        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        if (!isPasswordValid) throw new Error("Password salah!");

        return user;
      }
    })
  ],
  callbacks: {
    // SOLUSI ERROR 2-5: Menambahkan definisi tipe eksplisit (any) untuk menenangkan TypeScript
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    }
  },
  session: { strategy: "jwt" as const },
  secret: process.env.NEXTAUTH_SECRET || "rahasia_lms_sementara_123",
  pages: { 
    signIn: "/login"
  } 
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };