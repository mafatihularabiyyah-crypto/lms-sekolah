"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Database, Lock, Mail, Loader2, LogIn } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Memanggil fungsi login bawaan NextAuth
    const res = await signIn("credentials", {
      redirect: false, // Kita atur redirect manual agar bisa menangkap error
      email,
      password,
    });

    if (res?.error) {
      setError(res.error);
      setIsLoading(false);
    } else {
      // Jika berhasil, arahkan ke halaman pengaturan (atau dasbor utama Anda)
      router.push("/admin/settings");
      router.refresh(); // Memaksa pembaruan data Navbar
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-500">
        
        {/* Header Login */}
        <div className="p-8 bg-violet-600 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm border border-white/30">
            <Database className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">LMS Pesantren</h1>
          <p className="text-violet-200 text-sm mt-1 font-medium">Masuk ke Dasbor Admin</p>
        </div>

        {/* Form Login */}
        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 text-sm font-bold rounded-xl text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Email Akses</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 transition" 
                  placeholder="admin@lms.com"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1.5">Kata Sandi</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500 transition" 
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading || !email || !password}
              className="w-full bg-slate-900 text-white rounded-xl py-4 font-bold shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition flex items-center justify-center gap-2 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
              {isLoading ? "Memverifikasi..." : "Masuk ke Sistem"}
            </button>
          </form>

          {/* Info Bantuan */}
          <div className="mt-8 text-center text-xs text-slate-400 font-medium border-t border-slate-100 pt-6">
            Lupa kata sandi? Hubungi teknisi IT Anda.
            <br />(Jika database masih kosong, login pertama akan otomatis membuat akun Admin).
          </div>
        </div>
      </div>
    </div>
  );
}