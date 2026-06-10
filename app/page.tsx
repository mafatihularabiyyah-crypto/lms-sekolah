"use client";

import { useState } from "react";
import { 
  CheckCircle2, BookOpen, Users, BarChart3, ShieldCheck, 
  ChevronRight, GraduationCap, Video, CalendarCheck, ArrowRight,
  Database, LayoutDashboard, FileVideo, ClipboardEdit, HeartHandshake, CreditCard, Archive
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  const features = [
    { icon: Database, title: "Database Terpusat", desc: "Manajemen data santri dan guru yang sinkron dan terintegrasi." },
    { icon: Video, title: "Zoom Terintegrasi", desc: "Kelas live tanpa ribet dengan manajemen link otomatis." },
    { icon: GraduationCap, title: "Tahfidz Tracker", desc: "Pantau setoran hafalan santri dengan laporan detail." },
    { icon: BarChart3, title: "Analitik Akademik", desc: "Dashboard nilai dan perkembangan belajar yang transparan." },
    { icon: ShieldCheck, title: "Keamanan Data", desc: "Infrastruktur cloud dengan enkripsi data kelas enterprise." },
    { icon: CalendarCheck, title: "Presensi Pintar", desc: "Sistem absensi otomatis untuk efisiensi kelas." },
    { icon: HeartHandshake, title: "Jurnal Harian", desc: "Catatan aktivitas ibadah (mutaba'ah) santri harian." },
    { icon: CreditCard, title: "Manajemen Keuangan", desc: "Integrasi sistem tagihan dan SPP dalam satu platform." },
    { icon: Archive, title: "Arsip Digital", desc: "Penyimpanan leges dan dokumen akademik jangka panjang." },
    { icon: ClipboardEdit, title: "Ujian CBT", desc: "Sistem ujian berbasis komputer dengan penilaian instan." }
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans text-slate-800">
      {/* Header */}
      <header className="fixed w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo-lms.png" alt="Logo LMS" width={40} height={40} className="object-contain" />
            <span className="font-black text-slate-900 tracking-tight text-xl">LMS Pesantren</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition">Login</Link>
            <Link href="/admin" className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">
              Mulai Sekarang
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-40 pb-24 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[1.05] mb-8">
            Ekosistem Digital untuk <br />
            <span className="text-indigo-600">Pesantren Modern.</span>
          </h1>
          <p className="text-xl text-slate-500 mb-12 max-w-2xl mx-auto leading-relaxed">
            Platform manajemen pembelajaran (LMS) terlengkap yang dirancang khusus untuk kebutuhan unik pesantren di era digital.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/admin" className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 transition flex items-center gap-2">
              Lihat Demo <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Fitur Grid */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-sm font-black text-indigo-600 uppercase tracking-[0.2em] mb-4 text-center">10 Fitur Unggulan</h2>
          <h3 className="text-4xl font-black text-slate-900 mb-16 text-center tracking-tight">Semua yang Anda Butuhkan</h3>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                  <f.icon size={24} />
                </div>
                <h4 className="text-lg font-black text-slate-900 mb-2">{f.title}</h4>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto bg-indigo-600 rounded-[3rem] p-12 md:p-20 text-center text-white relative overflow-hidden">
          <h2 className="text-4xl font-black mb-6">Siap Mengubah Cara Belajar Santri Anda?</h2>
          <p className="text-indigo-100 mb-10 text-lg">Hubungi kami untuk mendapatkan akses uji coba penuh hari ini.</p>
          <Link href="/admin" className="bg-white text-indigo-600 px-10 py-4 rounded-2xl font-black text-lg hover:bg-slate-100 transition shadow-xl">
            Hubungi Tarbiyah Tech
          </Link>
        </div>
      </section>

      {/* Footer Branding */}
      <footer className="py-12 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs font-bold text-slate-400">© 2026 Tarbiyah Tech. All Rights Reserved.</p>
          <div className="flex items-center gap-2 opacity-60">
             <Image src="/logo-lms.png" alt="Logo" width={24} height={24} />
             <span className="text-xs font-black text-slate-600">Powered by Tarbiyah Tech</span>
          </div>
        </div>
      </footer>
    </div>
  );
}