import prisma from "@/lib/prisma";
import { Bell, ChevronDown, UserCircle, Database } from "lucide-react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// BARIS SAKTI INI WAJIB ADA AGAR NAVBAR TIDAK DI-CACHE:
export const dynamic = "force-dynamic";

export default async function Navbar() {
  // 1. CEK SIAPA YANG SEDANG LOGIN SAAT INI
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;

  // 2. Ambil Data Sekolah
  const school = await prisma.systemSettings.findUnique({ where: { id: "default" } });
  
  // 3. Ambil Data Admin TEPAT sesuai yang sedang Login (Bukan acak lagi)
  let admin = null;
  if (userId) {
    admin = await prisma.user.findUnique({ where: { id: userId } });
  } else {
    // Fallback darurat jika sesi belum terbaca
    admin = await prisma.user.findFirst({ where: { role: "ADMIN" } }); 
  }

  const schoolName = school?.schoolName || "LMS Pesantren";
  const schoolLogo = school?.schoolLogo || null;
  const adminName = admin?.name || "Admin Utama";
  const adminImage = admin?.image || null;

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 h-[76px] px-6 md:px-8 flex justify-between items-center sticky top-0 z-10">
      
      {/* KIRI: IDENTITAS SEKOLAH (Sekarang akan SELALU TAMPIL di HP maupun Laptop) */}
      <div className="flex items-center gap-3">
        {schoolLogo ? (
          <img src={schoolLogo} className="w-9 h-9 rounded-full object-cover shadow-sm border border-slate-100" alt="Logo" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100">
            <Database className="text-indigo-600 w-4 h-4" />
          </div>
        )}
        <h1 className="text-[1.15rem] font-bold text-slate-800 tracking-tight">{schoolName}</h1>
      </div>

      {/* KANAN: MENU & PROFIL */}
      <div className="flex items-center gap-3 md:gap-5">
        
        <button className="relative p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all">
          <Bell className="w-[18px] h-[18px]" />
          <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 border-2 border-white rounded-full"></span>
        </button>
        
        <div className="hidden md:block h-8 w-[1px] bg-slate-200 mx-1"></div>
        
        <button className="flex items-center gap-3 p-1.5 pr-3 rounded-full hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all group cursor-pointer">
          
          <div className="relative">
            {adminImage ? (
              <img src={adminImage} className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-sm" alt="Avatar"/>
            ) : (
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-slate-100 to-slate-50 border border-slate-200 flex items-center justify-center">
                <UserCircle className="w-5 h-5 text-slate-400" />
              </div>
            )}
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></div>
          </div>

          <div className="text-left hidden sm:block">
            <p className="text-[13px] font-bold text-slate-700 leading-tight group-hover:text-indigo-600 transition-colors">
              {adminName}
            </p>
            <p className="text-[11px] font-medium text-slate-400 mt-0.5">
              Administrator
            </p>
          </div>
          
          <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 ml-1 transition-transform group-hover:translate-y-0.5" />
        </button>
        
      </div>
    </header>
  );
}