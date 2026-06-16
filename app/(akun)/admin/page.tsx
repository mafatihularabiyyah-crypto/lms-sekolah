"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Users, BookOpen, Monitor, GraduationCap, 
  TrendingUp, Calendar, ArrowRight, Activity, 
  Clock, ShieldCheck, Zap, FileText, CheckCircle2, 
  Loader2, Target, ChevronDown, Server, Database, BarChart3,
  RefreshCcw, LayoutDashboard
} from "lucide-react";
import { getDashboardDataDB } from "./actions";

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
      
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
      };
      setCurrentTime(now.toLocaleDateString('id-ID', options));
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
        santri: res.data.totalSantri || 0,
        guru: res.data.totalGuru || 0,
        kelas: res.data.totalKelas || 0,
        cbt: res.data.cbtLive || 0
      });
      setKelasOptions(res.data.daftarKelas || []);
      setSemuaNilai(res.data.semuaNilai || []);
      setUjianLive(res.data.ujianLive || []);
      setLogAktivitas(res.data.aktivitasTerbaru || []);
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
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full"></div>
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin relative z-10" />
        </div>
        <p className="text-sm font-bold text-slate-500 tracking-widest uppercase animate-pulse">Menyiapkan Workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-6 lg:p-8 font-sans pb-24 selection:bg-indigo-100">
      <div className="max-w-[1600px] mx-auto space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* ================= HEADER SECTION ================= */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-6 md:p-8 rounded-3xl shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-slate-100 relative overflow-hidden">
          <div className="absolute right-0 top-0 w-[500px] h-[500px] bg-gradient-to-bl from-indigo-50 via-transparent to-transparent rounded-full -z-10 translate-x-1/3 -translate-y-1/3 opacity-70"></div>
          
          <div className="z-10 flex items-center gap-5">
            <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0">
              <LayoutDashboard size={28} strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                {greeting}, Administrator.
              </h1>
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <p className="text-slate-500 font-medium text-sm flex items-center gap-1.5">
                  <Calendar size={14} className="text-indigo-500" /> {currentTime}
                </p>
                <span className="hidden md:inline-block w-1 h-1 bg-slate-300 rounded-full"></span>
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  System Online
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3 z-10 w-full md:w-auto">
            <button onClick={loadData} className="flex-1 md:flex-none px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 hover:text-indigo-600 transition-all shadow-sm flex items-center justify-center gap-2">
              <RefreshCcw size={16}/> Segarkan
            </button>
            <button className="flex-1 md:flex-none px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2 active:scale-95">
              <Zap size={16}/> Tindakan Cepat
            </button>
          </div>
        </div>

        {/* ================= TOP STATS CARDS ================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[
            { label: "Total Santri Aktif", value: stats.santri, icon: Users, color: "text-blue-600", bg: "bg-blue-50/50", border: "border-blue-100", trend: "+2.4% Bulan ini" },
            { label: "Pengajar Aktif", value: stats.guru, icon: GraduationCap, color: "text-emerald-600", bg: "bg-emerald-50/50", border: "border-emerald-100", trend: "Database Valid" },
            { label: "Kelas Berjalan", value: stats.kelas, icon: BookOpen, color: "text-amber-600", bg: "bg-amber-50/50", border: "border-amber-100", trend: "Periode Aktif" },
            { label: "Ujian CBT Live", value: stats.cbt, icon: Monitor, color: "text-indigo-600", bg: "bg-indigo-50/50", border: "border-indigo-100", trend: "Sedang Terkoneksi", pulsing: stats.cbt > 0 },
          ].map((stat, idx) => (
            <div key={idx} className="bg-white p-6 rounded-[1.5rem] shadow-[0_2px_15px_rgb(0,0,0,0.02)] border border-slate-100 flex flex-col justify-between group hover:border-slate-300 hover:shadow-[0_10px_30px_rgb(0,0,0,0.06)] transition-all duration-300">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                  <p className="text-3xl font-black text-slate-800 tracking-tight">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color} border ${stat.border}`}>
                  <stat.icon size={22} strokeWidth={2} />
                  {stat.pulsing && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500 border-2 border-white"></span></span>}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <TrendingUp size={14} className={stat.color} />
                <span className="text-xs font-bold text-slate-500">{stat.trend}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ================= BENTO GRID MAIN SECTION ================= */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          
          {/* KOLOM KIRI: Grafik Akademik & Quick Actions (Lebar 2 Kolom) */}
          <div className="xl:col-span-2 space-y-6">
            
            {/* Custom CSS Bar Chart - Indeks Nilai */}
            <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-slate-100 min-h-[420px] flex flex-col relative overflow-hidden">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4 relative z-10">
                <div>
                  <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <BarChart3 className="text-indigo-600" size={20}/> Rata-Rata Akademik
                  </h3>
                  <p className="text-sm font-medium text-slate-500 mt-1">Akumulasi nilai berdasarkan laporan Gradebook</p>
                </div>
                
                {/* FILTER KELAS */}
                <div className="relative w-full md:w-64">
                  <select 
                    value={filterKelas} 
                    onChange={(e) => setFilterKelas(e.target.value)}
                    className="w-full appearance-none bg-white border border-slate-200 text-slate-700 font-bold text-sm py-2.5 pl-4 pr-10 rounded-xl outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all cursor-pointer shadow-sm"
                  >
                    <option value="all">Semua Kelas Gabungan</option>
                    {kelasOptions.map(k => (
                      <option key={k.id} value={k.id}>{k.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16}/>
                </div>
              </div>
              
              {/* Grafik Batang CSS dengan Background Grid */}
              <div className="flex-1 relative flex items-end justify-between gap-2 md:gap-6 mt-auto z-10">
                {/* Background Grid Lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                  <div className="w-full h-[1px] bg-slate-400"></div>
                  <div className="w-full h-[1px] bg-slate-400"></div>
                  <div className="w-full h-[1px] bg-slate-400"></div>
                  <div className="w-full h-[1px] bg-slate-400"></div>
                  <div className="w-full h-[1px] bg-slate-400"></div>
                </div>

                {chartData.map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-3 w-full group relative z-10 h-full justify-end">
                    <span className={`text-xs md:text-sm font-black transition-all ${item.active ? 'text-indigo-700 bg-indigo-50 px-2 py-1 rounded-md' : 'text-slate-500 group-hover:text-slate-800'}`}>
                      {item.val}
                    </span>
                    <div className="w-full max-w-[60px] relative flex justify-center items-end h-[200px] md:h-[240px] bg-slate-50 rounded-t-xl overflow-hidden border-x border-t border-slate-100">
                      <div 
                        className={`w-full rounded-t-xl transition-all duration-1000 ease-out group-hover:opacity-90 ${item.active ? 'bg-gradient-to-t from-indigo-700 to-indigo-400 shadow-[0_0_20px_rgba(79,70,229,0.3)]' : 'bg-slate-300'}`} 
                        style={{ height: `${item.val}%` }}
                      ></div>
                    </div>
                    <span className={`text-[10px] md:text-xs font-black uppercase tracking-widest ${item.active ? 'text-indigo-600' : 'text-slate-400'}`}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions (Pintasan Cepat Modular) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {[
                 { title: 'Manajemen CBT', desc: 'Kelola Soal & Ujian', icon: Monitor, border: 'border-blue-100 hover:border-blue-500', text: 'text-blue-700', bg: 'bg-blue-50/50', link: '/admin/cbt' },
                 { title: 'Cetak Rapor', desc: 'Generate & Export', icon: FileText, border: 'border-emerald-100 hover:border-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50/50', link: '/admin/rapor' },
                 { title: 'Data Kelas', desc: 'Atur Halaqah/Kelas', icon: BookOpen, border: 'border-amber-100 hover:border-amber-500', text: 'text-amber-700', bg: 'bg-amber-50/50', link: '/admin/kelas' },
                 { title: 'Data Santri', desc: 'Database Peserta', icon: Users, border: 'border-slate-200 hover:border-slate-800', text: 'text-slate-700', bg: 'bg-white', link: '/admin/siswa' },
               ].map((action, i) => (
                 <button key={i} onClick={() => window.location.href = action.link} className={`p-5 rounded-2xl flex flex-col items-start justify-center gap-1 border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 text-left ${action.border} ${action.bg}`}>
                   <action.icon size={24} className={`mb-2 ${action.text}`} strokeWidth={1.5} />
                   <h4 className={`font-black text-sm ${action.text}`}>{action.title}</h4>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{action.desc}</p>
                 </button>
               ))}
            </div>

          </div>

          {/* KOLOM KANAN: Panel Samping (Lebar 1 Kolom) */}
          <div className="space-y-6">
            
            {/* Monitor Live Ujian CBT - Dark High-Tech UI */}
            <div className="bg-slate-900 p-6 md:p-8 rounded-[2rem] shadow-xl text-white relative overflow-hidden flex flex-col h-[420px] border border-slate-800">
               <div className="absolute top-0 right-0 p-32 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none"></div>
               <div className="absolute bottom-0 left-0 p-32 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none"></div>
               
               <div className="flex justify-between items-center mb-6 relative z-10 shrink-0">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-slate-800/80 text-emerald-400 rounded-xl flex items-center justify-center border border-slate-700 backdrop-blur-sm">
                     <Target className="animate-pulse" size={20}/>
                   </div>
                   <div>
                     <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400">Engine Status</h3>
                     <p className="text-white font-bold text-sm">CBT Live Monitor</p>
                   </div>
                 </div>
               </div>

               <div className="space-y-3 relative z-10 flex-1 overflow-y-auto custom-scrollbar pr-2">
                 {ujianLive.length === 0 ? (
                   <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                     <Server size={32} className="mb-3 text-slate-500" strokeWidth={1.5}/>
                     <p className="text-slate-400 text-sm font-medium">Server Standby.<br/>Tidak ada sesi ujian aktif.</p>
                   </div>
                 ) : ujianLive.map((cbt, i) => (
                   <div key={i} className="bg-slate-800/50 border border-slate-700/50 p-4 rounded-2xl hover:bg-slate-800 transition cursor-pointer backdrop-blur-md">
                     <div className="flex justify-between items-start mb-2">
                       <h4 className="font-bold text-sm text-white line-clamp-1 flex-1 pr-2">{cbt.judul}</h4>
                       <span className="text-[9px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded uppercase tracking-widest shrink-0">LIVE</span>
                     </div>
                     <div className="flex justify-between items-center text-[11px] text-slate-400 font-medium mt-3">
                       <span className="flex items-center gap-1.5"><Clock size={12}/> {cbt.durasi} Min</span>
                       <span className="flex items-center gap-1.5"><Activity size={12}/> {cbt._count.results} Submitted</span>
                     </div>
                   </div>
                 ))}
               </div>

               <button onClick={() => window.location.href = '/admin/cbt'} className="w-full mt-4 py-3.5 bg-indigo-600 hover:bg-indigo-500 border border-indigo-500 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-indigo-900/50">
                 Akses Ruang Kontrol <ArrowRight size={16}/>
               </button>
            </div>

            {/* Aktivitas Terbaru Sistem */}
            <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-[0_2px_20px_rgb(0,0,0,0.02)] border border-slate-100 flex-1">
               <h3 className="text-base font-black text-slate-800 mb-6 flex items-center gap-2">
                 <Database className="text-slate-400" size={18}/> Log Aktivitas
               </h3>
               
               <div className="relative border-l-2 border-slate-100 ml-3 space-y-6">
                 {logAktivitas.length === 0 ? (
                    <p className="text-sm text-slate-400 font-medium pl-4">Log sistem kosong.</p>
                 ) : logAktivitas.map((log, i) => (
                   <div key={i} className="pl-6 relative group">
                     <span className="absolute -left-[17px] top-0 w-8 h-8 rounded-full flex items-center justify-center border-4 border-white shadow-sm text-emerald-600 bg-emerald-50 group-hover:bg-emerald-100 transition-colors">
                       <CheckCircle2 size={14}/>
                     </span>
                     <h4 className="text-sm font-black text-slate-800 leading-tight mb-1 line-clamp-1">{log.namaPeserta}</h4>
                     <p className="text-xs text-slate-500 font-medium mb-1.5 line-clamp-1">Submit "{log.exam?.judul}" (Nilai: <span className="font-bold text-indigo-600">{log.nilai}</span>)</p>
                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(log.createdAt).toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}</span>
                   </div>
                 ))}
               </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}