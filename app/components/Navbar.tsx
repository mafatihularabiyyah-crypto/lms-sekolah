import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";
import { Bell, ChevronDown, Database, User as UserIcon } from "lucide-react";

export default async function Navbar() {
  // 1. Ambil Sesi User
  const session = await getServerSession();
  let schoolName = "SIAKAD Network";
  let schoolLogo = null;
  let adminName = "Administrator";
  let adminPhoto = null;

  // 2. Tarik Data Spesifik Tenant jika ada yang login
  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { tenant: true }
    });

    if (user && user.tenantId) {
      adminName = user.name;
      adminPhoto = user.image;

      // Tarik pengaturan khusus sekolah ini
      const settings = await prisma.systemSettings.findUnique({
        where: { tenantId: user.tenantId }
      });

      if (settings) {
        schoolName = settings.schoolName;
        schoolLogo = settings.schoolLogo;
      } else {
        // Fallback ke nama instansi jika belum ada setting
        schoolName = user.tenant.name; 
      }
    }
  }

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-30">
      
      {/* SISI KIRI: Branding Sekolah */}
      <div className="flex items-center gap-3">
        {schoolLogo ? (
          <img 
            src={schoolLogo} 
            alt="Logo Sekolah" 
            className="w-10 h-10 object-contain rounded-md"
          />
        ) : (
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
            <Database size={20} />
          </div>
        )}
        <h1 className="font-black text-slate-800 text-lg tracking-tight">
          {schoolName}
        </h1>
      </div>

      {/* SISI KANAN: Profil Admin */}
      <div className="flex items-center gap-6">
        <button className="relative text-slate-400 hover:text-slate-600 transition">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
        </button>

        <div className="w-px h-8 bg-slate-200"></div>

        <div className="flex items-center gap-3 cursor-pointer group">
          {adminPhoto ? (
            <div className="relative">
              <img 
                src={adminPhoto} 
                alt="Profile" 
                className="w-10 h-10 rounded-full object-cover border-2 border-slate-100"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>
          ) : (
            <div className="relative w-10 h-10 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center text-slate-400">
              <UserIcon size={20} />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>
          )}
          
          <div className="hidden md:block text-left">
            <p className="text-sm font-bold text-slate-800 leading-tight">{adminName}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Administrator</p>
          </div>
          <ChevronDown size={16} className="text-slate-400 group-hover:text-slate-600 transition" />
        </div>
      </div>

    </header>
  );
}