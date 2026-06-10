// app/(akun)/santri/layout.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { 
  LayoutDashboard, BookOpen, GraduationCap, 
  CalendarCheck, UserCircle, LogOut, Database 
} from "lucide-react";

export default function SantriLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/santri" },
    { name: "Materi Belajar", icon: BookOpen, path: "/santri/materi" },
    { name: "Nilai & Rapor", icon: GraduationCap, path: "/santri/nilai" },
    { name: "Kehadiran", icon: CalendarCheck, path: "/santri/kehadiran" },
    { name: "Profil Saya", icon: UserCircle, path: "/santri/profil" },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans">
      
      {/* SIDEBAR (Desktop Kiri) */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20 sticky top-0 h-screen">
        
        {/* Branding Sidebar */}
        <div className="h-20 flex items-center gap-3 px-6 border-b border-slate-100">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <Database size={20} />
          </div>
          <div>
            <h1 className="font-black text-slate-800 text-lg leading-tight">LMS</h1>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Portal Santri</p>
          </div>
        </div>

        {/* Menu Navigasi */}
        <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          <p className="px-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Menu Utama</p>
          
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link key={item.name} href={item.path}>
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-[13px] transition-all ${
                  isActive 
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" 
                    : "text-slate-600 hover:bg-slate-50 hover:text-emerald-600"
                }`}>
                  <item.icon size={18} />
                  {item.name}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Tombol Logout di Bawah */}
        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl font-bold text-[13px] text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
          >
            <LogOut size={16} />
            Keluar Sistem
          </button>
        </div>
      </aside>

      {/* KONTEN UTAMA (Kanan) */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* Top Navbar Simple untuk Mobile/Desktop */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-10 flex items-center justify-end px-8">
            <div className="flex items-center gap-3">
               <div className="text-right hidden sm:block">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sistem Santri</p>
                  <p className="text-sm font-black text-slate-800">Tahun Ajaran 2026/2027</p>
               </div>
            </div>
        </header>

        {/* Area Render Halaman Dinamis */}
        <div className="p-8">
          {children}
        </div>
      </main>

    </div>
  );
}