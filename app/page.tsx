"use client";

import { useState } from "react";
import { 
  Database, Video, GraduationCap, BarChart3, ShieldCheck, 
  CalendarCheck, HeartHandshake, CreditCard, Archive, ClipboardEdit, 
  ArrowRight, CheckCircle2, Menu, X, Users, BookOpenText, Server, ChevronRight, Check
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
            <NavLink href="#harga">Harga & Paket</NavLink>
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
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-xs font-black mb-6 border border-indigo-100 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            Terpercaya oleh 50+ Pesantren di Indonesia
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[1.05] mb-8">
            Ekosistem Digital untuk <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Pesantren Masa Depan.</span>
          </h1>
          <p className="text-xl text-slate-500 mb-12 max-w-2xl mx-auto leading-relaxed">
            Kelola operasional pesantren, pantau hafalan santri, dan kelola keuangan dalam satu dasbor yang cerdas, aman, dan mudah digunakan.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/admin" className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 transition flex items-center justify-center gap-2 shadow-xl shadow-slate-900/20 hover:-translate-y-1">
              Jadwalkan Demo <ArrowRight size={18} />
            </Link>
            <Link href="#harga" className="bg-white text-slate-900 px-8 py-4 rounded-2xl font-bold hover:bg-slate-50 border border-slate-200 transition flex items-center justify-center hover:-translate-y-1 shadow-sm">
              Lihat Paket Harga
            </Link>
          </div>
        </div>
        
        {/* Dekorasi Background Hero */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -z-10"></div>
      </section>

      {/* Feature Showcase (Interactive) */}
      <section id="fitur" className="py-24 px-6 bg-slate-50 relative border-y border-slate-100">
        <div className="max-w-7xl mx-auto">
          <SectionTitle sub="Pusat Fitur Terpadu" main="Manajemen Pesantren Era Digital" />
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              {features.map((f) => (
                <div key={f.id} onClick={() => setActiveTab(f.id)} 
                  className={`p-6 rounded-3xl border cursor-pointer transition-all duration-300 ${activeTab === f.id ? "bg-white border-indigo-200 shadow-xl shadow-indigo-900/5 scale-[1.02]" : "bg-transparent border-transparent hover:bg-white/50"}`}>
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-2xl transition-colors ${activeTab === f.id ? "bg-indigo-600 text-white" : "bg-white text-indigo-600 shadow-sm border border-slate-100"}`}>
                      <f.icon size={24} />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-lg mb-1">{f.title}</h4>
                      <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="relative lg:h-[600px] flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 to-purple-600 rotate-3 rounded-[3rem] opacity-10 scale-95 transition-transform duration-700"></div>
              <div className="bg-white p-4 rounded-[2.5rem] shadow-2xl border border-slate-100 relative w-full h-full max-h-[500px] flex items-center justify-center z-10 transition-all duration-500">
                 <div className="w-full h-full bg-slate-50 rounded-3xl flex items-center justify-center overflow-hidden border border-slate-100">
                   <Image 
                     src={features[activeTab].img} 
                     alt={features[activeTab].title}
                     width={800} 
                     height={600} 
                     className="object-cover w-full h-full animate-in fade-in zoom-in-95 duration-500"
                     onError={(e) => (e.currentTarget.src = "https://placehold.co/800x600/e2e8f0/475569?text=Preview+Fitur+Tarbiyah+Tech")}
                   />
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section (Paket Harga) */}
      <section id="harga" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <SectionTitle sub="Investasi Pendidikan" main="Pilih Paket Sesuai Kebutuhan" />
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto items-center">
            
            {/* Paket Bulanan */}
            <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 relative">
              <h3 className="text-2xl font-black text-slate-900 mb-2">Paket Fleksibel</h3>
              <p className="text-slate-500 text-sm mb-6 h-10">Cocok untuk institusi yang ingin mencoba digitalisasi secara bertahap.</p>
              <div className="flex items-end gap-2 mb-8">
                <span className="text-5xl font-black text-slate-900">Rp 120</span>
                <span className="text-slate-500 font-bold mb-1">Ribu / bulan</span>
              </div>
              <ul className="space-y-4 mb-10">
                {["Akses Semua Fitur LMS Dasar", "Database Santri & Guru Tanpa Batas", "Modul Nilai & CBT Ujian", "Server Shared & Backup Mingguan", "Dukungan Teknis via Tiket"].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm font-medium text-slate-600">
                    <CheckCircle2 size={20} className="text-emerald-500 shrink-0" /> {item}
                  </li>
                ))}
              </ul>
              <Link href="/admin" className="block w-full py-4 text-center rounded-2xl font-black text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-colors">
                Mulai Berlangganan
              </Link>
            </div>

            {/* Paket Tahunan (Rekomendasi) */}
            <div className="bg-gradient-to-b from-indigo-600 to-purple-800 p-10 rounded-[3rem] shadow-2xl hover:-translate-y-2 transition-all duration-300 relative text-white transform md:scale-105 border border-indigo-500">
              <div className="absolute top-0 right-10 -translate-y-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                Paling Diminati
              </div>
              <h3 className="text-2xl font-black mb-2">Paket Enterprise</h3>
              <p className="text-indigo-200 text-sm mb-6 h-10">Solusi paripurna untuk pesantren dengan layanan dukungan prioritas VVIP.</p>
              <div className="flex items-end gap-2 mb-8">
                <span className="text-5xl font-black">Rp 2</span>
                <span className="text-indigo-200 font-bold mb-1">Juta / tahun</span>
              </div>
              <ul className="space-y-4 mb-10">
                {["Semua Fitur di Paket Fleksibel", "Gratis Setup Awal & Migrasi Data", "Modul Keuangan & Tahfidz Advanced", "Server Cloud Prioritas (Uptime 99.9%)", "Customer Support 24/7 via WhatsApp", "Akses Fitur Baru Lebih Awal"].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm font-medium text-indigo-50">
                    <Check size={20} className="text-amber-400 shrink-0" strokeWidth={3} /> {item}
                  </li>
                ))}
              </ul>
              <Link href="/admin" className="block w-full py-4 text-center rounded-2xl font-black text-slate-900 bg-white hover:bg-slate-100 shadow-xl transition-colors">
                Ambil Paket Tahunan
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* Stats/Trust */}
      <section className="py-20 px-6 border-t border-slate-100 bg-slate-50">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { val: "10,000+", label: "Santri Aktif" },
            { val: "50+", label: "Pesantren Mitra" },
            { val: "99.9%", label: "Uptime Sistem" },
            { val: "24/7", label: "Support Teknis" }
          ].map((stat, i) => (
            <div key={i} className="text-center p-8 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
              <div className="text-4xl font-black mb-1 text-slate-900">{stat.val}</div>
              <div className="text-xs text-indigo-600 font-bold uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto bg-slate-900 rounded-[3rem] p-12 md:p-20 text-center text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/30 blur-[100px] rounded-full pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/20 blur-[100px] rounded-full pointer-events-none"></div>
          
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-black mb-6">Siap Melangkah ke Era Digital?</h2>
            <p className="text-slate-400 mb-10 text-lg max-w-2xl mx-auto leading-relaxed">
              Bergabunglah dengan puluhan pesantren yang telah mempercayakan manajemen pendidikannya kepada kami. Tingkatkan efisiensi dan transparansi sekarang juga.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/admin" className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/20">
                Konsultasi Gratis
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0B0F19] text-white pt-24 pb-12 px-6 border-t-4 border-indigo-600">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-2 space-y-5">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-black text-xl">T</div>
               <span className="font-black text-2xl tracking-tight">Tarbiyah Tech</span>
            </div>
            <p className="text-slate-400 text-sm max-w-md leading-relaxed">
              Membangun ekosistem pendidikan Islam berbasis teknologi tinggi yang memudahkan manajemen santri, guru, dan pengasuh dalam menjaga amanah pendidikan umat.
            </p>
          </div>
          <div>
            <h4 className="font-black mb-6 text-slate-300 uppercase tracking-widest text-xs">Produk Utama</h4>
            <ul className="space-y-4 text-sm font-medium text-slate-400">
              <li className="hover:text-indigo-400 cursor-pointer transition flex items-center gap-2"><ChevronRight size={14}/> LMS Pesantren</li>
              <li className="hover:text-indigo-400 cursor-pointer transition flex items-center gap-2"><ChevronRight size={14}/> Tahfidz Cloud Tracker</li>
              <li className="hover:text-indigo-400 cursor-pointer transition flex items-center gap-2"><ChevronRight size={14}/> Portal Keuangan Syariah</li>
            </ul>
          </div>
          <div>
            <h4 className="font-black mb-6 text-slate-300 uppercase tracking-widest text-xs">Pusat Bantuan</h4>
            <ul className="space-y-4 text-sm font-medium text-slate-400">
              <li className="hover:text-indigo-400 cursor-pointer transition flex items-center gap-2"><ChevronRight size={14}/> Dokumentasi Sistem</li>
              <li className="hover:text-indigo-400 cursor-pointer transition flex items-center gap-2"><ChevronRight size={14}/> Hubungi Tim Support</li>
              <li className="hover:text-indigo-400 cursor-pointer transition flex items-center gap-2"><ChevronRight size={14}/> Syarat & Ketentuan</li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-800/80 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-xs font-bold text-slate-500">© 2026 Tarbiyah Tech Solutions. All Rights Reserved.</p>
          <div className="flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-full border border-slate-800">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sistem Operasional Normal</span>
          </div>
        </div>
      </footer>
    </div>
  );
}