"use client";

import { useState } from "react";
import { 
  CalendarCheck, Clock, CalendarX, ShieldAlert, 
  Filter, CheckCircle2, XCircle, Info, ChevronRight,
  TrendingUp, CalendarDays, Activity
} from "lucide-react";

// --- DATA DUMMY (Siap diganti dengan tarikan Prisma Database nantinya) ---
const attendanceStats = {
  percentage: 94,
  hadir: 45,
  sakitIzin: 2,
  alpa: 1,
  totalPertemuan: 48
};

const myClasses = [
  { id: "all", name: "Semua Kelas" },
  { id: "cls_01", name: "Fiqih Muamalah", percentage: 100 },
  { id: "cls_02", name: "Tafsir Al-Qur'an", percentage: 88 },
  { id: "cls_03", name: "Bahasa Arab", percentage: 95 },
];

const attendanceHistory = [
  { id: 1, classId: "cls_01", className: "Fiqih Muamalah", date: "2026-06-10", time: "08:00 WIB", status: "HADIR", note: "Hadir Tepat Waktu" },
  { id: 2, classId: "cls_02", className: "Tafsir Al-Qur'an", date: "2026-06-09", time: "10:15 WIB", status: "HADIR", note: "Hadir Tepat Waktu" },
  { id: 3, classId: "cls_03", className: "Bahasa Arab", date: "2026-06-08", time: "13:00 WIB", status: "IZIN", note: "Acara Keluarga (Disetujui)" },
  { id: 4, classId: "cls_01", className: "Fiqih Muamalah", date: "2026-06-03", time: "08:00 WIB", status: "HADIR", note: "Hadir Tepat Waktu" },
  { id: 5, classId: "cls_02", className: "Tafsir Al-Qur'an", date: "2026-06-02", time: "10:15 WIB", status: "ALPA", note: "Tanpa Keterangan" },
  { id: 6, classId: "cls_03", className: "Bahasa Arab", date: "2026-06-01", time: "13:00 WIB", status: "SAKIT", note: "Surat Dokter Terlampir" },
  { id: 7, classId: "cls_01", className: "Fiqih Muamalah", date: "2026-05-27", time: "08:00 WIB", status: "HADIR", note: "Hadir Tepat Waktu" },
];

export default function KehadiranSantri() {
  const [activeFilter, setActiveFilter] = useState("all");

  // Filter history berdasarkan kelas yang dipilih
  const filteredHistory = activeFilter === "all" 
    ? attendanceHistory 
    : attendanceHistory.filter(record => record.classId === activeFilter);

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 font-sans pb-12">
      
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3 mb-2">
            <CalendarCheck className="text-emerald-500" size={32} /> Laporan Kehadiran
          </h1>
          <p className="text-slate-500 font-medium">Pantau rekam jejak kedisiplinan dan absensi Anda di setiap mata pelajaran.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-4 py-2.5 rounded-2xl">
          <Activity size={18} className="text-emerald-600" />
          <span className="text-sm font-bold text-emerald-700">Semester Genap 2026</span>
        </div>
      </div>

      {/* 2. STATISTIC WIDGETS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Persentase Utama */}
        <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-emerald-500 to-teal-600 p-6 md:p-8 rounded-[2rem] shadow-lg shadow-emerald-500/20 text-white relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10 flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
              <TrendingUp size={24} className="text-white" />
            </div>
            <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20">
              Rata-rata
            </span>
          </div>
          <div className="relative z-10">
            <h3 className="text-4xl md:text-5xl font-black mb-1">{attendanceStats.percentage}%</h3>
            <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest">Tingkat Kehadiran</p>
          </div>
        </div>

        {/* Total Hadir */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="flex items-end gap-2 mb-1">
              <h3 className="text-4xl font-black text-slate-800">{attendanceStats.hadir}</h3>
              <span className="text-sm font-bold text-slate-400 mb-1">/ {attendanceStats.totalPertemuan}</span>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Hadir</p>
          </div>
        </div>

        {/* Total Sakit / Izin */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-between hover:-translate-y-1 transition-transform">
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-6">
            <Info size={24} />
          </div>
          <div>
            <h3 className="text-4xl font-black text-slate-800 mb-1">{attendanceStats.sakitIzin}</h3>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sakit & Izin</p>
          </div>
        </div>

        {/* Total Alpa */}
        <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-rose-50 flex flex-col justify-between hover:-translate-y-1 transition-transform relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-100 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mb-6 relative z-10">
            <ShieldAlert size={24} />
          </div>
          <div className="relative z-10">
            <h3 className="text-4xl font-black text-rose-600 mb-1">{attendanceStats.alpa}</h3>
            <p className="text-xs font-bold text-rose-400 uppercase tracking-widest">Alpa / Tanpa Ket.</p>
          </div>
        </div>

      </div>

      {/* 3. MAIN CONTENT: FILTER & TIMELINE */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* KIRI (Span 2): Riwayat Kehadiran */}
        <div className="xl:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 border-b border-slate-100 pb-6">
            <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <Clock className="text-indigo-600" size={24} /> Riwayat Log Absensi
            </h2>
            
            {/* Filter Kelas (Pills) */}
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 hide-scrollbar">
              <Filter size={16} className="text-slate-400 shrink-0 mr-1" />
              {myClasses.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => setActiveFilter(cls.id)}
                  className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${
                    activeFilter === cls.id 
                      ? "bg-slate-800 text-white shadow-md" 
                      : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {cls.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {filteredHistory.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CalendarX size={32} />
                </div>
                <p className="text-slate-500 font-medium">Belum ada riwayat kehadiran untuk filter ini.</p>
              </div>
            ) : (
              filteredHistory.map((record) => {
                // Konfigurasi visual berdasarkan status absensi
                let badgeColor = "bg-emerald-50 text-emerald-600 border-emerald-100";
                let Icon = CheckCircle2;
                
                if (record.status === "ALPA") {
                  badgeColor = "bg-rose-50 text-rose-600 border-rose-100";
                  Icon = XCircle;
                } else if (record.status === "SAKIT") {
                  badgeColor = "bg-blue-50 text-blue-600 border-blue-100";
                  Icon = Info;
                } else if (record.status === "IZIN") {
                  badgeColor = "bg-amber-50 text-amber-600 border-amber-100";
                  Icon = Info;
                }

                // Format Tanggal yang Indah
                const dateObj = new Date(record.date);
                const dayName = new Intl.DateTimeFormat('id-ID', { weekday: 'short' }).format(dateObj);
                const dayNum = new Intl.DateTimeFormat('id-ID', { day: '2-digit' }).format(dateObj);
                const monthName = new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(dateObj);

                return (
                  <div key={record.id} className="group flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 p-4 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all cursor-pointer">
                    
                    {/* Kotak Tanggal (Kiri) */}
                    <div className="flex items-center sm:flex-col justify-center w-auto sm:w-16 h-12 sm:h-16 bg-slate-100 rounded-xl shrink-0 group-hover:bg-white group-hover:shadow-sm border border-transparent group-hover:border-slate-200 transition-all px-4 sm:px-0 gap-2 sm:gap-0">
                      <span className="text-[10px] font-black uppercase text-slate-400">{dayName}</span>
                      <span className="text-lg sm:text-xl font-black text-slate-800 leading-none">{dayNum}</span>
                      <span className="text-[10px] font-black uppercase text-slate-400 hidden sm:block">{monthName}</span>
                    </div>

                    {/* Informasi Utama (Tengah) */}
                    <div className="flex-1">
                      <h4 className="text-base font-bold text-slate-800 group-hover:text-indigo-600 transition-colors mb-1">
                        {record.className}
                      </h4>
                      <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                        <Clock size={12} className="text-slate-400"/> {record.time} &bull; {record.note}
                      </p>
                    </div>

                    {/* Badge Status (Kanan) */}
                    <div className="shrink-0 flex sm:justify-end">
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-black uppercase tracking-widest ${badgeColor}`}>
                        <Icon size={14} /> {record.status}
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* KANAN (Span 1): Analitik Per Kelas */}
        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            <h3 className="text-sm font-black text-slate-800 mb-6 uppercase tracking-widest flex items-center gap-2">
              <Activity size={18} className="text-indigo-600" /> Analitik Per Kelas
            </h3>
            
            <div className="space-y-6">
              {myClasses.filter(c => c.id !== "all").map((cls) => {
                // Menentukan warna progress bar berdasarkan persentase
                let barColor = "bg-emerald-400";
                if (cls.percentage! < 75) barColor = "bg-rose-400";
                else if (cls.percentage! < 90) barColor = "bg-amber-400";

                return (
                  <div key={cls.id}>
                    <div className="flex justify-between items-end mb-2">
                      <h4 className="text-sm font-bold text-slate-700 truncate pr-4">{cls.name}</h4>
                      <span className="text-xs font-black text-slate-900">{cls.percentage}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${barColor} relative`} style={{ width: `${cls.percentage}%` }}>
                         <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                <p className="text-xs font-bold text-indigo-800 leading-relaxed">
                  <span className="text-lg">💡</span> Pertahankan persentase kehadiran Anda di atas <span className="font-black">75%</span> untuk dapat mengikuti ujian akhir semester.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}