import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Middleware ini akan mengeksekusi pengecekan sesi sebelum halaman di-render
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // 1. Mengamankan rute SuperAdmin (Hanya untuk Developer)
    if (path.startsWith("/superadmin") && token?.role !== "SUPERADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // 2. Mengamankan rute Admin Sekolah (Hanya untuk Admin Sekolah/Guru)
    if (path.startsWith("/admin") && token?.role === "SANTRI") {
      return NextResponse.redirect(new URL("/siswa", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Return true jika token ada (user sudah login)
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login", // Jika belum login, tendang ke halaman ini
    },
  }
);

// Tentukan rute mana saja yang HARUS dikunci oleh middleware ini
export const config = {
  matcher: [
    "/admin/:path*",      // Kunci semua fitur admin sekolah
    "/siswa/:path*",  // Kunci semua fitur dashboard umum/santri
    "/ujian/:path*",      // Kunci halaman pengerjaan ujian CBT
    
  ],
};