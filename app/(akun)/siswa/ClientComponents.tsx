"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { signOut } from "next-auth/react";
import { 
  LogOut, LayoutDashboard, BookOpen, GraduationCap, 
  CalendarCheck, UserCircle, CreditCard, MonitorPlay, ChevronDown
} from "lucide-react";

export function ClientNavList() {
  const pathname = usePathname();
  
  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard, path: "/siswa" },
    { name: "Materi Belajar", icon: BookOpen, path: "/siswa/materi" },
    { name: "Nilai & Rapor", icon: GraduationCap, path: "/siswa/nilai" },
    { name: "Informasi", icon: CalendarCheck, path: "/siswa/informasi" },
    { name: "Pembayaran", icon: CreditCard, path: "/siswa/pembayaran" },
    { name: "Media Belajar", icon: MonitorPlay, path: "/siswa/buku" },
    { name: "Profil Saya", icon: UserCircle, path: "/siswa/profil" },
  ];
  
  return (
    <>
      {menuItems.map((item) => {
        const isActive = pathname === item.path;
        return (
          <Link key={item.name} href={item.path}>
            <div className={`relative flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all duration-300 group ${
              isActive 
                ? "bg-white/20 text-white shadow-lg border border-white/20 backdrop-blur-md" 
                : "text-white/70 hover:bg-white/10 hover:text-white"
            }`}>
              {isActive && <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.9)]"></div>}
              <item.icon size={18} className={`transition-colors ${isActive ? "text-white ml-2" : "text-white/60 group-hover:text-white/90 ml-1"}`} strokeWidth={isActive ? 2.5 : 2} />
              {item.name}
            </div>
          </Link>
        );
      })}
    </>
  );
}

export function ClientGreeting({ action, userName }: { action: "greet" | "logout", userName?: string }) {
  const [greeting, setGreeting] = useState("Ahlan wa Sahlan");
  
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) setGreeting("Selamat Pagi");
    else if (hour >= 11 && hour < 15) setGreeting("Selamat Siang");
    else if (hour >= 15 && hour < 18) setGreeting("Selamat Sore");
    else setGreeting("Selamat Malam");
  }, []);

  if (action === "logout") {
    return (
      <button 
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="flex items-center justify-center gap-3 py-3.5 rounded-2xl font-bold text-sm text-white/70 hover:text-white hover:bg-rose-500/90 border border-transparent transition-all duration-300 w-full group shadow-sm cursor-pointer"
      >
        <LogOut size={18} className="text-white/60 group-hover:text-white transition-colors" strokeWidth={2} /> 
        Keluar Sistem
      </button>
    );
  }

  return (
    <>
      <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
        {greeting}, {userName}
      </h2>
      <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">
        Sistem Informasi Belajar Terpadu Santri
      </p>
    </>
  );
}

// 👇 KOMPONEN BARU UNTUK MENU DROPDOWN PROFIL
export function ClientUserMenu({ userName, userInitial, userImage }: { userName: string, userInitial: string, userImage: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Menutup dropdown jika user klik area kosong di luar menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

  return (
    <div className="relative z-50" ref={menuRef}>
      {/* Tombol Profil (Bisa Diklik) */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-4 cursor-pointer group ml-auto md:ml-0"
      >
        <div className="flex-col items-end hidden sm:flex">
          <p className="text-sm font-black text-slate-800 group-hover:text-blue-600 transition-colors tracking-tight">{userName}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Santri Aktif</p>
          </div>
        </div>

        <div className="w-11 h-11 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-lg border-2 border-white group-hover:rotate-3 transition-all duration-300 overflow-hidden">
          {userImage ? (
            <img src={userImage} alt="Foto Profil" className="w-full h-full object-cover" />
          ) : (
            userInitial
          )}
        </div>
        
        <ChevronDown size={16} className={`text-slate-400 group-hover:text-blue-600 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {/* Area Dropdown Pop-Up */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-3 border-b border-slate-50 mb-1 sm:hidden">
            <p className="text-sm font-black text-slate-800 truncate">{userName}</p>
            <p className="text-[10px] font-bold text-emerald-500 uppercase">Santri Aktif</p>
          </div>
          
          <Link href="/siswa/profil" onClick={() => setIsOpen(false)}>
            <div className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer">
              <UserCircle size={16} /> Pengaturan Profil
            </div>
          </Link>
          
          <div className="h-px bg-slate-100 my-1 mx-4"></div>
          
          <button 
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
          >
            <LogOut size={16} /> Keluar Sistem
          </button>
        </div>
      )}
    </div>
  );
}