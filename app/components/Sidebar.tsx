"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react"; // Ikon keren untuk pintu keluar
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Users, BookOpen, 
  Settings, Archive, UserSquare2, 
  HeartHandshake, CreditCard, Database,
  FileVideo, ClipboardEdit, CalendarCheck, Code2, ArrowRight
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const menuGroups = [
    {
      label: "Utama",
      items: [
        { name: "Dashboard", icon: LayoutDashboard, href: "/admin" },
        { name: "Manajemen Siswa", icon: Users, href: "/admin/students" },
        { name: "Direktori Guru", icon: UserSquare2, href: "/admin/users" },
      ]
    },
    {
      label: "Akademik",
      items: [
        { name: "Data Kelas & Rombel", icon: BookOpen, href: "/admin/courses" },
        { name: "Materi Pembelajaran", icon: FileVideo, href: "/admin/materials" },
        { name: "Tugas & Ujian (CBT)", icon: ClipboardEdit, href: "/admin/cbt" },
        { name: "Nilai dan Presensi", icon: CalendarCheck, href: "/admin/report" },
        { name: "Buku Pembelajaran", icon: BookOpen, href: "/admin/buku" },
      ]
    },
    {
      label: "Administrasi",
      items: [
        { name: "Dokumen Rapor", icon: Archive, href: "/admin/rapor" },
        { name: "Informasi & Pengumuman", icon: Archive, href: "/admin/informasi" },
        { name: "Keuangan & Tagihan", icon: CreditCard, href: "/admin/keuangan" },
      ]
    }
  ];

  return (
    <aside className="w-[280px] bg-white border-r border-slate-200 hidden md:flex flex-col fixed h-full z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      
      {/* === HEADER SIDEBAR (Desain Baru dengan Gambar) === */}
      <div className="h-[76px] flex items-center px-6 border-b border-slate-100/80">
        <div className="flex items-center gap-3.5">
          {/* Logo Baru menggunakan Image Component */}
          <Image 
            src="/logo-lms.png" 
            alt="Logo LMS" 
            width={32} 
            height={32} 
            className="object-contain drop-shadow-sm" 
          />
          <div>
            <h1 className="text-[15px] font-black text-slate-900 tracking-tight leading-tight">LMS</h1>
            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span> Sistem Aktif
            </p>
          </div>
        </div>
      </div>
      
      {/* === MENU NAVIGASI === */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto custom-scrollbar space-y-7">
        {menuGroups.map((group, index) => (
          <div key={index}>
            <p className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.items.map((menu) => {
                const Icon = menu.icon;
                const isActive = menu.href === "/admin" 
                  ? pathname === "/admin" 
                  : pathname.startsWith(menu.href);

                return (
                  <Link 
                    key={menu.href}
                    href={menu.href} 
                    className={`flex items-center gap-3.5 px-3 py-2.5 rounded-xl font-semibold transition-all duration-200 text-sm ${
                      isActive 
                        ? "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-100/50" 
                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} strokeWidth={isActive ? 2.5 : 2} /> 
                    {menu.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Pemisah Pengaturan */}
        <div className="pt-2">
            <div className="h-px bg-slate-100 w-full mb-6"></div>
            <Link 
              href="/admin/settings" 
              className={`flex items-center gap-3.5 px-3 py-2.5 rounded-xl font-semibold transition-all duration-200 text-sm ${
                pathname.startsWith("/admin/settings") 
                  ? "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-100/50" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Settings className="w-[18px] h-[18px] text-slate-400" strokeWidth={2} /> Pengaturan Sistem
            </Link>
        </div>

        {/* Tombol Logout (Taruh di area bawah Sidebar) */}
<div className="p-4 mt-auto border-t border-slate-200">
  <button 
    onClick={() => signOut({ callbackUrl: "/login" })}
    className="flex items-center gap-3 px-4 py-3 w-full text-rose-600 hover:bg-rose-50 hover:text-rose-700 rounded-xl font-bold transition-all group"
  >
    <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
    Keluar Sistem
  </button>
</div>
      </nav>



      {/* === FOOTER SIDEBAR (Branding Elegan) === */}
      <div className="p-5 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group">
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 p-1.5 rounded-lg text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Powered by</p>
              <p className="text-xs font-black text-slate-800 tracking-tight">Tarbiyah Tech</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-transform group-hover:translate-x-1" />
        </div>
      </div>
    </aside>
  );
}