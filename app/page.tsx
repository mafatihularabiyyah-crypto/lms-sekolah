"use client";

import { useState } from "react";
import { 
  Database, Video, GraduationCap, BarChart3, ShieldCheck, 
  CalendarCheck, HeartHandshake, CreditCard, Archive, ClipboardEdit, 
  ArrowRight, CheckCircle2, Menu, X, Users, BookOpenText, Server, ChevronRight
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// --- KOMPONEN SUB-SEKSI ---

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">
    {children}
  </Link>
);

const SectionTitle = ({ sub, main }: { sub: string, main: string }) => (
  <div className="text-center mb-16">
    <span className="text-indigo-600 font-black text-xs uppercase tracking-[0.2em]">{sub}</span>
    <h2 className="text-3xl md:text-4xl font-black text-slate-900 mt-2 tracking-tight">{main}</h2>
  </div>
);

// --- UTAMA ---

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [mobileMenu, setMobileMenu] = useState(false);

  const features = [
    { 
      id: 0, 
      icon: Database, 
      title: "Manajemen Data Santri", 
      desc: "Sistem pendataan santri mulai dari pendaftaran hingga kelulusan yang terintegrasi.",
      img: "/features/santri-data.png" // Taruh file di public/features/
    },
    { 
      id: 1, 
      icon: GraduationCap, 
      title: "Monitoring Tahfidz", 
      desc: "Pantau perkembangan hafalan santri (Juz, Halaman, Mutqin) dengan dashboard yang mudah dipahami.",
      img: "/features/tahfidz.png"
    },
    { 
      id: 2, 
      icon: HeartHandshake, 
      title: "Jurnal Mutaba'ah", 
      desc: "Pencatatan ibadah harian santri (shalat, shaum, tilawah) yang bisa diakses wali santri.",
      img: "/features/mutabaah.png"
    },
    { 
      id: 3, 
      icon: CreditCard, 
      title: "Keuangan Digital", 
      desc: "Sistem tagihan SPP otomatis, kuitansi digital, dan laporan arus kas yayasan secara real-time.",
      img: "/features/keuangan.png"
    },
    { 
      id: 4, 
      icon: ClipboardEdit, 
      title: "Ujian CBT & Kitab", 
      desc: "Ujian berbasis komputer untuk materi umum maupun ujian sorogan kitab kuning.",
      img: "/features/cbt.png"
    },
    { 
      id: 5, 
      icon: Archive, 
      title: "Arsip Akademik", 
      desc: "Penyimpanan dokumen penting seperti rapot, ijazah, dan sertifikat yang anti-hilang.",
      img: "/features/arsip.png"
    }
  ];

  return (
    <div className="min-h-screen bg-[#FDFDFD] font-sans text-slate-800">
      
      {/* Header */}
      <header className="fixed w-full z-50 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black">T</div>
            <span className="font-black text-slate-900 tracking-tight text-xl">Tarbiyah Tech</span>
          </div>
          <nav className="hidden md:flex gap-8">
            <NavLink href="#fitur">Fitur Utama</NavLink>
            <NavLink href="#alur">Cara Kerja</NavLink>
            <NavLink href="#testimoni">Testimoni</NavLink>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/admin" className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition">Login</Link>
            <Link href="/admin" className="hidden sm:block bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">
              Mulai Demo
            </Link>
            <button className="md:hidden" onClick={() => setMobileMenu(!mobileMenu)}>
              <Menu />
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-40 pb-24 px-6 relative">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-xs font-black mb-6">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            Terpercaya oleh 50+ Pesantren di Indonesia
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[1.05] mb-8">
            Ekosistem Digital untuk <br />
            <span className="text-indigo-600">Pesantren Masa Depan.</span>
          </h1>
          <p className="text-xl text-slate-500 mb-12 max-w-2xl mx-auto leading-relaxed">
            Kelola operasional pesantren, pantau hafalan santri, dan kelola keuangan dalam satu dasbor yang cerdas dan aman.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/admin" className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 transition flex items-center justify-center gap-2">
              Jadwalkan Demo <ArrowRight size={18} />
            </Link>
            <Link href="#" className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-bold hover:bg-slate-50 border border-slate-200 transition">
              Lihat Brosur
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Showcase (Interactive) */}
      <section id="fitur" className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <SectionTitle sub="Pusat Fitur" main="Manajemen Pesantren Terpadu" />
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              {features.map((f) => (
                <div key={f.id} onClick={() => setActiveTab(f.id)} 
                  className={`p-6 rounded-3xl border cursor-pointer transition-all ${activeTab === f.id ? "bg-white border-indigo-200 shadow-xl" : "bg-transparent border-transparent hover:bg-white/50"}`}>
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-2xl ${activeTab === f.id ? "bg-indigo-600 text-white" : "bg-white text-indigo-600"}`}>
                      <f.icon size={24} />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-lg mb-1">{f.title}</h4>
                      <p className="text-slate-500 text-sm">{f.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-600 rotate-3 rounded-[3rem] opacity-10"></div>
              <div className="bg-white p-4 rounded-[2.5rem] shadow-2xl border border-slate-100 relative">
                 <div className="w-full h-96 bg-slate-100 rounded-3xl flex items-center justify-center overflow-hidden">
                   {/* Placeholder Gambar - Ganti src ini dengan gambar dari folder public */}
                   <Image 
                     src={features[activeTab].img} 
                     alt="Feature" 
                     width={800} 
                     height={500} 
                     className="object-cover w-full h-full"
                     onError={(e) => (e.currentTarget.src = "/placeholder-image.png")}
                   />
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats/Trust */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { val: "10,000+", label: "Santri Aktif" },
            { val: "50+", label: "Pesantren Mitra" },
            { val: "99.9%", label: "Uptime Sistem" },
            { val: "24/7", label: "Support Teknis" }
          ].map((stat, i) => (
            <div key={i} className="text-center p-8 bg-slate-900 rounded-3xl text-white">
              <div className="text-4xl font-black mb-1">{stat.val}</div>
              <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto bg-indigo-600 rounded-[3rem] p-12 md:p-20 text-center text-white relative overflow-hidden">
          <h2 className="text-4xl md:text-5xl font-black mb-6">Siap Mengubah Cara Belajar Santri Anda?</h2>
          <p className="text-indigo-100 mb-10 text-lg max-w-xl mx-auto">
            Bergabunglah dengan ratusan pesantren yang telah beralih ke era digital. Konsultasikan kebutuhan sistem Anda bersama tim Tarbiyah Tech.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/admin" className="bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black hover:bg-slate-100 transition shadow-xl">
              Hubungi Tarbiyah Tech
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-white pt-24 pb-12 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2">
               <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-black">T</div>
               <span className="font-black text-lg">Tarbiyah Tech</span>
            </div>
            <p className="text-slate-400 text-sm max-w-sm">Membangun ekosistem pendidikan Islam berbasis teknologi yang memudahkan santri, guru, dan pengasuh dalam mengelola amanah pendidikan.</p>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-slate-500 uppercase tracking-widest text-xs">Produk Utama</h4>
            <ul className="space-y-4 text-sm font-medium text-slate-300">
              <li className="hover:text-white cursor-pointer transition">LMS Pesantren</li>
              <li className="hover:text-white cursor-pointer transition">Tahfidz Cloud</li>
              <li className="hover:text-white cursor-pointer transition">Portal Keuangan</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-slate-500 uppercase tracking-widest text-xs">Informasi</h4>
            <ul className="space-y-4 text-sm font-medium text-slate-300">
              <li className="hover:text-white cursor-pointer transition">Tentang Kami</li>
              <li className="hover:text-white cursor-pointer transition">Kebijakan Privasi</li>
              <li className="hover:text-white cursor-pointer transition">Pusat Bantuan</li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs font-bold text-slate-600">© 2026 Tarbiyah Tech. All Rights Reserved.</p>
          <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-500">POWERED BY TARBIYAH TECH SOLUTIONS</span>
          </div>
        </div>
      </footer>
    </div>
  );
}