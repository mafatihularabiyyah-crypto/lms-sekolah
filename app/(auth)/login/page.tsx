"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image"; 
import { 
  Mail, Lock, Eye, EyeOff, Loader2, 
  BookOpen, Pencil, Infinity, CheckCircle2, Trophy, TrendingUp 
} from "lucide-react"; 

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        redirect: false, 
        email,
        password,
      });

      if (!res || res.error || !res.ok) {
        setError("Email atau kata sandi tidak valid. Silakan periksa kembali.");
        setIsLoading(false);
        return; 
      }

      const session: any = await getSession();
      
      if (!session || !session.user) {
        setError("Sesi tidak terbaca. Coba muat ulang halaman.");
        setIsLoading(false);
        return;
      }

      if (session.user.role === "ADMIN" || session.user.role === "GURU") {
        router.push("/admin"); 
      } else if (session.user.role === "SUPERADMIN") {
        router.push("/superadmin"); 
      } else {
        router.push("/siswa"); 
      }
      
      router.refresh(); 

    } catch (err) {
      console.error("Kesalahan Login:", err);
      setError("Server sedang sibuk atau terjadi gangguan koneksi.");
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* 1. CSS KEYFRAMES (Didefinisikan di sini agar rapi dan tidak bocor ke global) */}
      <style>{`
        /* Pattern 1: Lambat, Vertikal Rendah, Rotasi Sangat Sedikit */
        @keyframes float-1 {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50% { transform: translateY(-10px) rotate(-1.5deg); }
        }
        /* Pattern 2: Sedang, Vertikal Sedang, Rotasi Sedikit ke Atas */
        @keyframes float-2 {
          0%, 100% { transform: translateY(0px) rotate(3deg); }
          50% { transform: translateY(-12px) rotate(4deg); }
        }
        /* Pattern 3: Agak Cepat, Vertikal Lebih Tinggi, Rotasi Menyilang */
        @keyframes float-3 {
          0%, 100% { transform: translateY(0px) rotate(-1deg); }
          50% { transform: translateY(-15px) rotate(1deg); }
        }
        /* Shimmer Effect untuk Progress Bar */
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>

      {/* 2. LAYOUT UTAMA */}
      <div className="h-screen bg-white flex font-sans overflow-hidden relative z-10">
        
        {/* SISI KIRI - BRANDING & PREMIUM ILLUSTRATION (Gerak Vertikal & Presisi) */}
        <div className="hidden lg:flex w-1/2 flex-col justify-center px-10 xl:px-16 relative bg-slate-50 h-full">
          
          {/* Dekorasi Background Aesthetic */}
          <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-400/20 rounded-full blur-[100px] pointer-events-none z-0"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-emerald-400/10 rounded-full blur-[100px] pointer-events-none z-0"></div>

          {/* Logo LMS (Fix di kiri atas layar) */}
          <div className="absolute top-8 left-10 xl:left-16 flex items-center gap-3 z-20">
            <Image src="/logo-lms.png" alt="LMS Logo" width={32} height={32} className="object-contain drop-shadow-sm" />
            <span className="text-[17px] font-black text-slate-800 tracking-tight">LMS - Portal Belajar</span>
          </div>

          {/* AREA TENGAH KIRI: Ditampung dalam satu div agar bisa ke-center secara vertikal */}
          <div className="relative z-20 flex flex-col justify-center mt-6">
            
            {/* Headline: Kutipan Hadits */}
            <div className="relative max-w-lg mb-6">
              <div className="text-[4.5rem] font-serif text-blue-200/50 absolute -top-5 -left-5 -z-10 leading-none select-none">
                "
              </div>
              <h1 className="text-[1.6rem] xl:text-[2rem] font-extrabold text-slate-800 leading-[1.25] tracking-tight">
                Siapa yang menempuh jalan untuk mencari ilmu, maka <span className="text-blue-600 bg-blue-50 px-2 py-0.5 leading-relaxed rounded-lg">Allah akan memudahkan</span> baginya jalan menuju surga.
              </h1>
              <div className="mt-4 flex items-center gap-3">
                <div className="w-8 h-[2px] bg-blue-600"></div>
                <p className="text-[11px] font-bold text-blue-600 uppercase tracking-widest">HR. Muslim</p>
              </div>
            </div>

            {/* CSS Floating Cards - WIDGET PREMIUM YANG SEKARANG GERAK (TINGGI DI-LOCK 260px) */}
            <div className="relative w-full h-[260px] pointer-events-none z-20">
              
              {/* Widget 1: Progres Hafalan (Kiri Atas) - Gunakan Pattern 'float-1' (Duration 8s) */}
              <div 
                className="absolute top-0 left-0 bg-white/95 backdrop-blur-xl p-3.5 rounded-2xl shadow-[0_15px_40px_rgba(15,23,42,0.05)] border border-white/50 w-60 xl:w-64 rotate-[-2deg]"
                style={{ animation: 'float-1 8s ease-in-out infinite' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-gradient-to-br from-emerald-400 to-emerald-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
                      <BookOpen size={16} strokeWidth={2} />
                    </div>
                    <div>
                      <h4 className="text-[13px] font-bold text-slate-800 leading-none mb-1">Progres Hafalan</h4>
                      <p className="text-[10px] text-slate-500 font-medium leading-none">Juz 30</p>
                    </div>
                  </div>
                  <span className="bg-emerald-50 text-emerald-600 text-[9px] font-bold px-2 py-1 rounded-md">Aktif</span>
                </div>
                <div className="space-y-1.5 mt-1">
                  <div className="flex justify-between text-[10px] font-bold">
                    <span className="text-slate-600">Pencapaian</span>
                    <span className="text-emerald-600">85%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="w-[85%] h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full relative overflow-hidden">
                      {/* Shimmer Effect */}
                      <div 
                        className="absolute inset-0 bg-white/25 w-full h-full"
                        style={{ animation: 'shimmer 2s linear infinite' }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Widget 2: Status Tugas (Kanan Tengah) - Gunakan Pattern 'float-2' (Duration 7s, Berbeda durasi) */}
              <div 
                className="absolute top-[35%] right-0 xl:right-6 bg-white/95 backdrop-blur-xl p-3.5 rounded-2xl shadow-[0_15px_40px_rgba(15,23,42,0.05)] border border-white/50 w-52 xl:w-56 rotate-[3deg]"
                style={{ animation: 'float-2 7s ease-in-out infinite' }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                    <Pencil size={16} strokeWidth={2} />
                  </div>
                  <div className="w-full">
                    <h4 className="text-[13px] font-bold text-slate-800 mb-1 leading-none">Fiqih Muamalah</h4>
                    <p className="text-[10px] text-slate-500 mb-2 leading-none">Tugas Pekan 4</p>
                    <div className="flex items-center gap-1 bg-blue-50 w-fit px-2 py-1 rounded-md border border-blue-100">
                      <CheckCircle2 size={10} className="text-blue-600" />
                      <span className="text-[9px] font-bold text-blue-700 uppercase tracking-wide">Terkumpul</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Widget 3: Statistik (Bawah Tengah) - Gunakan Pattern 'float-3' (Duration 9s, Lebih lambat & tinggi) */}
              <div 
                className="absolute bottom-0 left-8 xl:left-[15%] bg-white/95 backdrop-blur-xl p-3.5 rounded-2xl shadow-[0_15px_40px_rgba(15,23,42,0.05)] border border-white/50 w-60 xl:w-64 rotate-[-1deg]"
                style={{ animation: 'float-3 9s ease-in-out infinite' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center shrink-0">
                      <Trophy size={12} strokeWidth={2.5} />
                    </div>
                    <h4 className="text-[12px] font-bold text-slate-800">Nilai Rata-rata</h4>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                    <TrendingUp size={10} strokeWidth={3} />
                    <span className="text-[9px] font-bold">+4.2%</span>
                  </div>
                </div>
                
                {/* Mini Bar Chart CSS */}
                <div className="flex items-end justify-between h-10 gap-1.5 pt-2 border-t border-slate-100">
                  <div className="w-full bg-slate-100 rounded-t-sm h-[40%] relative group"><div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[8px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10">75</div></div>
                  <div className="w-full bg-slate-100 rounded-t-sm h-[65%] relative group"><div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[8px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10">82</div></div>
                  <div className="w-full bg-amber-400 rounded-t-sm h-[85%] relative group shadow-[0_0_8px_rgba(251,191,36,0.4)]"><div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[8px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10">92</div></div>
                  <div className="w-full bg-slate-100 rounded-t-sm h-[70%] relative group"><div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[8px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10">85</div></div>
                  <div className="w-full bg-slate-100 rounded-t-sm h-[90%] relative group"><div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[8px] px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10">95</div></div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* SISI KANAN - FORM LOGIN */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-20 lg:px-32 relative z-30 bg-white h-full shadow-[-20px_0_40px_rgba(0,0,0,0.02)]">
          <div className="max-w-md w-full mx-auto">
            
            <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">Login ke LMS</h2>

            {error && (
              <div className="mb-6 p-4 bg-rose-50 text-rose-600 text-[13px] font-bold rounded-xl border border-rose-100 animate-in shake duration-500">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              
              {/* Input Email */}
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#F3F5F9] border border-transparent rounded-xl pl-12 pr-4 py-3 text-[13px] font-medium text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" 
                  placeholder="ustadz@pesantren.id"
                />
              </div>

              {/* Input Password */}
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#F3F5F9] border border-transparent rounded-xl pl-12 pr-12 py-3 text-[13px] font-medium text-slate-800 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" 
                  placeholder="••••••••"
                />
                <button 
                  type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Tombol Login */}
              <button 
                type="submit" disabled={isLoading}
                className="w-full bg-[#0D6EFD] text-white rounded-xl py-3 font-bold text-[13px] hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70 disabled:active:scale-100 shadow-[0_4px_14px_rgba(13,110,253,0.3)]"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Masuk Sistem"}
              </button>

            </form>

            {/* Area Bawah Form */}
            <div className="mt-8 flex flex-col items-center gap-5">
              <button className="text-[12px] font-bold text-blue-600 hover:underline">Lupa kata sandi?</button>
              
              <div className="w-full h-px bg-slate-200"></div>
              
              <button onClick={() => alert("Silakan hubungi SuperAdmin untuk mendaftarkan institusi Anda.")} className="px-6 py-2 bg-white border border-slate-300 text-blue-600 font-bold text-[12px] rounded-full hover:bg-slate-50 transition shadow-sm">
                Buat akun baru
              </button>
            </div>

          </div>

          {/* Footer */}
          <div className="absolute bottom-6 left-0 right-0 text-center flex flex-col items-center opacity-50 hover:opacity-100 transition-opacity">
              <span className="flex items-center gap-1.5 text-slate-700 font-bold text-[11px]"><Infinity size={14}/> Tarbiyah Tech</span>
              <span className="text-[8px] text-slate-400 uppercase tracking-widest font-black mt-1">Powered by Tarbiyah Tech Ecosystem</span>
          </div>
        </div>

      </div>
    </>
  );
}