"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Users, BookOpen, Monitor, GraduationCap, 
  TrendingUp, Calendar, ArrowRight, Activity, 
  Clock, ShieldCheck, Zap, MoreVertical, FileText, CheckCircle2, Loader2, Target, ChevronDown
} from "lucide-react";
import { getDashboardDataDB } from "./actions"; // Pastikan path import sesuai

export default function AdminDashboard() {
  const [greeting, setGreeting] = useState("Selamat Datang");
  const [currentTime, setCurrentTime] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // State Data Database
  const [stats, setStats] = useState({ santri: 0, guru: 0, kelas: 0, cbt: 0 });
  const [kelasOptions, setKelasOptions] = useState<any[]>([]);
  const [semuaNilai, setSemuaNilai] = useState<any[]>([]);
  const [ujianLive, setUjianLive] = useState<any[]>([]);
  const [logAktivitas, setLogAktivitas] = useState<any[]>([]);

  // State Filter Grafik
  const [filterKelas, setFilterKelas] = useState("all");

  useEffect(() => {
    // Pengatur Waktu
    const updateTime = () => {
      const now = new Date();
      const hour = now.getHours();
      if (hour < 11) setGreeting("Selamat Pagi");
      else if (hour < 15) setGreeting("Selamat Siang");
      else if (hour < 18) setGreeting("Selamat Sore");
      else setGreeting("Selamat Malam");
      setCurrentTime(now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);

    // Ambil Data Database
    loadData();

    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const res = await getDashboardDataDB();
    if (res.success && res.data) {
      setStats({
        santri: res.data.totalSantri,
        guru: res.data.totalGuru,
        kelas: res.data.totalKelas,
        cbt: res.data.cbtLive
      });
      setKelasOptions(res.data.daftarKelas);
      setSemuaNilai(res.data.semuaNilai);
      setUjianLive(res.data.ujianLive);
      setLogAktivitas(res.data.aktivitasTerbaru);
    }
    setIsLoading(false);
  };

  // MENGHITUNG RATA-RATA NILAI BERDASARKAN FILTER KELAS
  const chartData = useMemo(() => {
    let nilaiTerfilter = semuaNilai;
    if (filterKelas !== "all") {
      nilaiTerfilter = semuaNilai.filter((n) => n.classRoomId === filterKelas);
    }

    if (nilaiTerfilter.length === 0) {
      return [
        { label: 'TGS 1', val: 0 }, { label: 'TGS 2', val: 0 }, 
        { label: 'UTS', val: 0 }, { label: 'UAS', val: 0 }, { label: 'AKHIR', val: 0, active: true }
      ];
    }

    const avg = (key: string) => {
      const validGrades = nilaiTerfilter.filter(n => n[key] !== null && n[key] !== undefined);
      if (validGrades.length === 0) return 0;
      const sum = validGrades.reduce((a, b) => a + Number(b[key]), 0);
      return Math.round(sum / validGrades.length);
    };

    return [
      { label: 'TGS 1', val: avg('tugas1') },
      { label: 'TGS 2', val: avg('tugas2') },
      { label: 'UTS', val: avg('uts') },
      { label: 'UAS', val: avg('uas') },
      { label: 'AKHIR', val: avg('nilaiAkhir'), active: true }
    ];
  }, [semuaNilai, filterKelas]);

  if (isLoading) {
    return <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center"><Loader2 className="w-10 h-10 text-indigo-600 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB] p-4 md:p-8 font-sans pb-20">
      <div className="max-w-[1600px] mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2 opacity-50"></div>
          
          <div className="z-10">
            <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              {greeting}, Admin! <span className="animate-wave text-4xl origin-bottom-right">👋</span>
            </h1>
            <p className="text-slate-500 font-medium mt-1 flex items-center gap-2">
              <Calendar size={16} className="text-indigo-500" /> {currentTime}
            </p>
          </div>
          
          <div className="flex gap-3 z-10 w-full md:w-auto">
            <button onClick={loadData} className="flex-1 md:flex-none px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition shadow-sm flex items-center justify-center gap-2">
              <ShieldCheck size={18} className="text-emerald-500"/> Segarkan Data
            </button>
            <button className="flex-1 md:flex-none px-6 py-3 bg-indigo-600 text-white rounded-xl font-black hover:bg-indigo-700 transition shadow-[0_8px_20px_rgba(79,70,229,0.25)] flex items-center justify-center gap-2 active:scale-95">
              <Zap size={18}/> Aksi Cepat
            </button>
          </div>
        </div>

        {/* TOP STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[
            { label: "Total Santri Aktif", value: stats.santri, icon: Users, color: "text-blue-600", bg: "bg-blue-50", trend: "Database Terkini" },
            { label: "Pengajar Aktif", value: stats.guru, icon: GraduationCap, color: "text-emerald-600", bg: "bg-emerald-50", trend: "Database Terkini" },
            { label: "Kelas Berjalan", value: stats.kelas, icon: BookOpen, color: "text-amber-600", bg: "bg-amber-50", trend: "Belum Selesai" },
            { label: "Ujian CBT Live", value: stats.cbt, icon: Monitor, color: "text-indigo-600", bg: "bg-indigo-50", trend: "Bisa Diakses Siswa", pulsing: stats.cbt > 0 },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100 flex flex-col justify-between group hover:-translate-y-1 transition-all duration-300">
              <div className="flex justify-between items-start mb-4">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color} transition-transform group-hover:scale-110`}>
                  <stat.icon size={28} strokeWidth={2.5} />
                </div>
                {stat.pulsing && <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span></span>}
              </div>
              <div>
                <p className="text-4xl font-black text-slate-800 tracking-tight tabular-nums">{stat.value}</p>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mt-1">{stat.label}</p>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-50 flex items-center gap-2">
                <TrendingUp size={14} className={stat.color} />
                <span className="text-xs font-bold text-slate-500">{stat.trend}</span>
              </div>
            </div>
          ))}
        </div>

        {/* BENTO GRID MAIN SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* KOLOM 1: Grafik Akademik (Lebar 2 Kolom) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Custom CSS Bar Chart - Indeks Nilai */}
            <div className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100 min-h-[400px] flex flex-col">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                  <h3 className="text-lg font-black text-slate-800">Rata-Rata Komponen Nilai</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Ditarik dari Sistem Raport</p>
                </div>
                
                {/* FILTER KELAS */}
                <div className="relative">
                  <select 
                    value={filterKelas} 
                    onChange={(e) => setFilterKelas(e.target.value)}
                    className="appearance-none bg-slate-50 border border-slate-200 text-slate-700 font-bold text-sm py-2.5 pl-4 pr-10 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 cursor-pointer shadow-sm"
                  >
                    <option value="all">Semua Kelas Gabungan</option>
                    {kelasOptions.map(k => (
                      <option key={k.id} value={k.id}>{k.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16}/>
                </div>
              </div>
              
              {/* Grafik Batang Murni Tailwind */}
              <div className="flex-1 flex items-end justify-between gap-3 md:gap-6 pt-6 mt-auto">
                {chartData.map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-3 w-full group">
                    {/* Tulisan Angka di atas Bar */}
                    <span className={`text-xs md:text-sm font-black transition-all ${item.active ? 'text-indigo-600' : 'text-slate-500 group-hover:text-slate-800'}`}>
                      {item.val}
                    </span>
                    <div className="w-full relative flex justify-center items-end h-56 bg-slate-50 rounded-t-xl overflow-hidden border-x border-t border-slate-100">
                      <div 
                        className={`w-full rounded-t-xl transition-all duration-1000 ease-out group-hover:opacity-90 ${item.active ? 'bg-gradient-to-t from-indigo-600 to-blue-500 shadow-[0_0_20px_rgba(99,102,241,0.3)]' : 'bg-slate-300'}`} 
                        style={{ height: `${item.val}%` }}
                      ></div>
                    </div>
                    <span className={`text-[10px] md:text-xs font-black uppercase tracking-widest ${item.active ? 'text-indigo-600' : 'text-slate-400'}`}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions (Pintasan Cepat) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {[
                 { title: 'Manajemen CBT', icon: Monitor, color: 'bg-blue-600 text-white shadow-blue-200', link: '/admin/cbt' },
                 { title: 'Cetak Rapor', icon: FileText, color: 'bg-emerald-500 text-white shadow-emerald-200', link: '/admin/rapor' },
                 { title: 'Input Kelas', icon: BookOpen, color: 'bg-amber-500 text-white shadow-amber-200', link: '/admin/kelas' },
                 { title: 'Data Santri', icon: Users, color: 'bg-white text-slate-700 border-2 border-slate-200 hover:border-indigo-500 hover:text-indigo-600', link: '/admin/siswa' },
               ].map((action, i) => (
                 <button key={i} onClick={() => window.location.href = action.link} className={`p-5 rounded-3xl flex flex-col items-center justify-center gap-3 font-bold text-xs text-center transition-all hover:-translate-y-1 shadow-lg ${action.color}`}>
                   <action.icon size={24} />
                   {action.title}
                 </button>
               ))}
            </div>

          </div>

          {/* KOLOM 2: Panel Samping (Lebar 1 Kolom) */}
          <div className="space-y-6">
            
            {/* Monitor Live Ujian CBT */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-8 rounded-[2rem] shadow-xl text-white relative overflow-hidden flex flex-col h-[400px]">
               <div className="absolute top-0 right-0 p-32 bg-white/5 blur-[100px] rounded-full pointer-events-none"></div>
               
               <div className="flex items-center gap-3 mb-6 relative z-10 shrink-0">
                 <div className="w-10 h-10 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center border border-emerald-500/30">
                   <Target className="animate-pulse" size={20}/>
                 </div>
                 <div>
                   <h3 className="font-black text-sm uppercase tracking-widest text-indigo-200">Status Engine</h3>
                   <p className="text-white font-bold">Ujian Live Berlangsung</p>
                 </div>
               </div>

               <div className="space-y-3 relative z-10 flex-1 overflow-y-auto custom-scrollbar pr-2">
                 {ujianLive.length === 0 ? (
                   <div className="text-center text-slate-400 text-sm mt-10 italic">Tidak ada sesi ujian aktif.</div>
                 ) : ujianLive.map((cbt, i) => (
                   <div key={i} className="bg-white/10 border border-white/20 p-4 rounded-2xl hover:bg-white/20 transition cursor-pointer">
                     <div className="flex justify-between items-start mb-2">
                       <h4 className="font-bold text-sm text-white line-clamp-1 flex-1 pr-2">{cbt.judul}</h4>
                       <span className="text-[9px] font-black bg-emerald-500 text-white px-2 py-0.5 rounded uppercase tracking-widest shrink-0">LIVE</span>
                     </div>
                     <div className="flex justify-between items-center text-[11px] text-indigo-200 font-medium">
                       <span className="flex items-center gap-1.5"><Clock size={12}/> {cbt.durasi} Menit</span>
                       <span className="flex items-center gap-1.5"><Users size={12}/> {cbt._count.results} Selesai</span>
                     </div>
                   </div>
                 ))}
               </div>

               <button onClick={() => window.location.href = '/admin/cbt'} className="w-full mt-4 py-3.5 bg-white/10 hover:bg-white/20 border border-white/30 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 shrink-0">
                 Buka Panel Ujian <ArrowRight size={16}/>
               </button>
            </div>

            {/* Aktivitas Terbaru Sistem */}
            <div className="bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-slate-100">
               <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                 <Clock className="text-indigo-500" size={20}/> Aktivitas Ujian
               </h3>
               
               <div className="relative border-l-2 border-slate-100 ml-3 space-y-6">
                 {logAktivitas.length === 0 ? (
                    <p className="text-sm text-slate-400 italic pl-4">Belum ada riwayat pengerjaan.</p>
                 ) : logAktivitas.map((log, i) => (
                   <div key={i} className="pl-6 relative">
                     <span className="absolute -left-[17px] top-0 w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm text-emerald-600 bg-emerald-50">
                       <CheckCircle2 size={14}/>
                     </span>
                     <h4 className="text-sm font-black text-slate-800 leading-none mb-1 line-clamp-1">{log.namaPeserta} Selesai Ujian</h4>
                     <p className="text-[11px] text-slate-500 font-bold mb-1.5 line-clamp-1">{log.exam?.judul} - Nilai: {log.nilai}</p>
                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(log.createdAt).toLocaleString('id-ID')}</span>
                   </div>
                 ))}
               </div>
            </div>

          </div>

        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes wave {
          0% { transform: rotate(0deg); }
          10% { transform: rotate(14deg); }
          20% { transform: rotate(-8deg); }
          30% { transform: rotate(14deg); }
          40% { transform: rotate(-4deg); }
          50% { transform: rotate(10deg); }
          60%, 100% { transform: rotate(0deg); }
        }
        .animate-wave {
          display: inline-block;
          animation: wave 2.5s infinite;
          transform-origin: 70% 70%;
        }
      `}}/>
    </div>
  );
}