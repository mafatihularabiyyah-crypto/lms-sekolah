"use client";

import React, { useState, useEffect } from "react";
import { 
  Award, Download, FileText, Loader2, 
  CheckCircle2, AlertCircle, ShieldCheck, Star
} from "lucide-react";
import { getRaporSantriDB } from "./actions";

// Helper untuk mengubah nilai 0 atau kosong menjadi '-'
const formatNilai = (val: any) => (!val || val === 0 ? '-' : val);

export default function RaporSantriPage() {
  const [grades, setGrades] = useState<any[]>([]);
  const [studentInfo, setStudentInfo] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'RAPOR' | 'SERTIFIKAT'>('RAPOR');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const res = await getRaporSantriDB();
    if (res.success) {
      setGrades(res.data || []);
      setStudentInfo({ name: res.studentName, wa: res.studentWa });
    }
    setIsLoading(false);
  };

  const totalKelas = grades.length;
  const kelasLulus = grades.filter(g => g.isLulus).length;
  const sertifikatTerbuka = grades.filter(g => g.isLulus && g.certLink); // Mengambil sertifikat asli dari DB
  const rataRataKeseluruhan = totalKelas > 0 ? Math.round(grades.reduce((acc, curr) => acc + curr.nilaiAkhir, 0) / totalKelas) : 0;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 size={48} className="animate-spin text-amber-600 mb-4" />
        <p className="text-slate-500 font-bold animate-pulse">Menyiapkan brankas akademik Anda...</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-50/50 min-h-screen pb-24 font-sans max-w-7xl mx-auto space-y-8 p-4 md:p-8 animate-in fade-in duration-700">
      
      {/* HERO BANNER */}
      {activeTab === 'RAPOR' ? (
        <div className="bg-gradient-to-br from-amber-600 via-amber-500 to-orange-600 rounded-[2.5rem] p-8 md:p-12 text-white shadow-2xl shadow-amber-900/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div>
              <span className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-white text-[10px] font-black uppercase tracking-widest border border-white/20 shadow-sm mb-4 inline-flex items-center gap-2">
                <Award size={14}/> Pusat Prestasi Akademik
              </span>
              <h1 className="text-3xl md:text-5xl font-black mb-2 leading-tight">Buku Nilai & Rapor</h1>
              <p className="text-amber-100 font-medium text-sm max-w-lg">Pantau perkembangan akademik Anda secara real-time dan tinjau transkrip nilai keseluruhan Anda.</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-3xl text-center min-w-[120px]">
                <p className="text-amber-100 text-[10px] font-black uppercase tracking-widest mb-1">Rata-Rata</p>
                <p className="text-4xl font-black text-white">{rataRataKeseluruhan}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-3xl text-center min-w-[120px]">
                <p className="text-amber-100 text-[10px] font-black uppercase tracking-widest mb-1">Status Lulus</p>
                <p className="text-4xl font-black text-white">{kelasLulus}<span className="text-lg text-amber-200">/{totalKelas}</span></p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* HERO BANNER KHUSUS TAB SERTIFIKAT */
        <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>
          
          <div className="relative z-10 md:w-1/2 space-y-6">
            <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 px-4 py-2 rounded-full">
              <Award size={16} className="text-amber-400" />
              <span className="text-xs font-black uppercase tracking-widest text-amber-300">Pencapaian Akademik</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight">Koleksi Syahadah <br /> & Sertifikat Anda.</h1>
            <p className="text-slate-400 font-medium text-sm leading-relaxed max-w-md">Bukti resmi dedikasi, kerja keras, dan kelulusan Anda dalam menyelesaikan program pembelajaran.</p>
            <div className="flex items-center gap-6 pt-2">
              <div>
                <p className="text-3xl font-black text-white">{sertifikatTerbuka.length}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Sertifikat Diraih</p>
              </div>
            </div>
          </div>

          {/* Graphic Certificate Preview */}
          <div className="relative z-10 md:w-1/2 flex justify-center w-full">
            <div className="relative w-full max-w-md aspect-[4/3] bg-gradient-to-br from-slate-100 to-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] rotate-2 hover:rotate-0 transition-transform duration-500 border-8 border-white p-6 flex flex-col items-center justify-center text-center">
              <div className="absolute inset-0 border border-slate-200 m-2 rounded-xl pointer-events-none"></div>
              <Award size={48} className="text-amber-500 mb-4 drop-shadow-md" />
              <h3 className="font-serif text-2xl font-bold text-slate-800 mb-1 leading-tight">Syahadah Kelulusan</h3>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-black mb-4">Portal Akademik Santri</p>
              <div className="w-16 h-0.5 bg-amber-400 mb-4"></div>
              <div className="w-3/4 h-2 bg-slate-100 rounded-full mb-2"></div>
              <div className="w-1/2 h-2 bg-slate-100 rounded-full"></div>
              <div className="absolute bottom-6 right-6 w-12 h-12 bg-gradient-to-br from-amber-300 to-yellow-500 rounded-full flex items-center justify-center shadow-lg"><ShieldCheck size={20} className="text-white" /></div>
            </div>
          </div>
        </div>
      )}

      {/* NAVIGATION TABS BAR KINI LEBIH CLEAN */}
      <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-2 overflow-x-auto custom-scrollbar w-fit">
        <button onClick={() => setActiveTab('RAPOR')} className={`px-6 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'RAPOR' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>
          Transkrip Nilai
        </button>
        <button onClick={() => setActiveTab('SERTIFIKAT')} className={`px-6 py-2.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'SERTIFIKAT' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>
          Sertifikat Kelas
        </button>
      </div>

      {/* TAB 1: TRANSKRIP NILAI */}
      {activeTab === 'RAPOR' && (
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          <div className="p-6 md:p-8 border-b border-slate-50">
             <h2 className="text-xl font-black text-slate-800">Rekapitulasi Nilai Akademik</h2>
             <p className="text-sm text-slate-500 mt-1">Daftar seluruh nilai mata pelajaran yang Anda ambil pada periode ini.</p>
          </div>

          {grades.length === 0 ? (
            <div className="p-16 text-center">
              <FileText size={48} className="text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-black text-slate-800 mb-2">Belum Ada Nilai</h3>
              <p className="text-slate-500 text-sm">Nilai Anda akan muncul di sini setelah asatidz menerbitkannya.</p>
            </div>
          ) : (
            <div className="overflow-x-auto p-6 md:p-8 pt-0">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider font-bold">
                  <tr>
                    <th className="p-4 text-center rounded-tl-xl">No</th>
                    <th className="p-4">Mata Pelajaran</th>
                    <th className="p-4 text-center">KKM</th>
                    <th className="p-4 text-center">TGS 1</th>
                    <th className="p-4 text-center">TGS 2</th>
                    <th className="p-4 text-center">TGS 3</th>
                    <th className="p-4 text-center">UTS</th>
                    <th className="p-4 text-center">UAS</th>
                    <th className="p-4 text-center bg-amber-50 text-amber-700">Nilai Akhir</th>
                    <th className="p-4 text-center rounded-tr-xl">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {grades.map((g, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 text-center font-medium text-slate-500">{idx + 1}</td>
                      <td className="p-4">
                        <div className="font-black text-slate-800">{g.namaKelas}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Pengajar: {g.pengajar}</div>
                      </td>
                      <td className="p-4 text-center font-bold text-slate-500">{g.kkm}</td>
                      <td className="p-4 text-center font-medium text-slate-700">{formatNilai(g.tugas1)}</td>
                      <td className="p-4 text-center font-medium text-slate-700">{formatNilai(g.tugas2)}</td>
                      <td className="p-4 text-center font-medium text-slate-700">{formatNilai(g.tugas3)}</td>
                      <td className="p-4 text-center font-bold text-slate-700">{formatNilai(g.uts)}</td>
                      <td className="p-4 text-center font-bold text-slate-700">{formatNilai(g.uas)}</td>
                      <td className="p-4 text-center bg-amber-50/30 font-black text-amber-700">{formatNilai(g.nilaiAkhir)}</td>
                      <td className="p-4 text-center">
                        {g.isLulus ? (
                          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                            <CheckCircle2 size={12}/> Lulus
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-600 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border border-rose-100">
                            <AlertCircle size={12}/> Remedial
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={8} className="p-4 text-right font-black text-slate-800 uppercase text-xs">Rata-Rata Keseluruhan</td>
                    <td className="p-4 text-center font-black text-lg text-amber-600 bg-amber-50 rounded-b-xl">{rataRataKeseluruhan}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SERTIFIKAT (MURNI DATA REAL DARI DATABASE) */}
      {activeTab === 'SERTIFIKAT' && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle2 className="text-emerald-500" size={24} />
            <h2 className="text-xl font-black text-slate-800">Daftar Sertifikat Kelulusan</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sertifikatTerbuka.length === 0 ? (
              <div className="col-span-full bg-white rounded-3xl p-16 text-center border border-dashed border-slate-200 shadow-sm text-slate-400 font-bold">
                <Award size={48} className="mx-auto mb-4 opacity-40" />
                Belum ada sertifikat kelulusan yang diterbitkan untuk Anda saat ini.
              </div>
            ) : sertifikatTerbuka.map((cert, idx) => (
              <div key={idx} className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col group hover:border-amber-200 transition-colors">
                
                {/* Card Header Visual */}
                <div className={`h-24 p-6 relative flex items-center justify-between ${idx % 2 === 0 ? 'bg-gradient-to-r from-amber-400 to-orange-500' : 'bg-gradient-to-r from-emerald-400 to-teal-600'}`}>
                  <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                  <ShieldCheck size={40} className="text-white/20 absolute -bottom-4 -right-2 transform rotate-12" />
                  <div className="relative z-10 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white text-[10px] font-black uppercase tracking-widest border border-white/30">
                    Resmi Terverifikasi
                  </div>
                  <div className="relative z-10 text-white font-black text-lg">Nilai: {cert.nilaiAkhir}</div>
                </div>

                {/* Card Body */}
                <div className="p-6 md:p-8 flex-1 flex flex-col">
                  <h3 className="text-xl font-black text-slate-800 leading-tight mb-2 group-hover:text-amber-600 transition-colors">{cert.namaKelas}</h3>
                  <p className="text-xs font-bold text-slate-400 mb-6 flex items-center gap-1.5"><Star size={14} className="text-amber-400 fill-amber-400"/> Lulus KKM ({cert.kkm})</p>

                  <div className="space-y-4 mb-8">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pengajar / Instruktur</p>
                      <p className="text-sm font-bold text-slate-700">{cert.pengajar}</p>
                    </div>
                  </div>

                  {/* Card Actions (Hanya Tombol Unduh PDF - Full Width) */}
                  <div className="mt-auto pt-6 border-t border-slate-100">
                    <a href={cert.certLink.startsWith('http') ? cert.certLink : `https://${cert.certLink}`} target="_blank" rel="noreferrer" className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer">
                      <Download size={16} /> Unduh E-Sertifikat (PDF)
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}