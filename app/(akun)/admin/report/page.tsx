"use client";

import React, { useState, useEffect, useMemo, Fragment } from 'react';
import * as XLSX from 'xlsx';
import { 
  Search, FolderOpen, ChevronLeft, CheckCircle2, 
  Award, Download, Save, Calculator, BookOpen, MessageCircle,
  Monitor, RefreshCw, AlertTriangle, Loader2, Send, Link as LinkIcon, ExternalLink,
  MonitorPlay, Settings
} from 'lucide-react';
import { 
  getClassesDB, getClassDetailDB, saveAttendancesDB, 
  saveGradebookDB, getCbtResultsForSyncDB 
} from './actions';

export default function ManajemenKelasAllInOne() {
  const [view, setView] = useState<'LIST' | 'DETAIL'>('LIST');
  const [activeTab, setActiveTab] = useState<'PRESENSI' | 'GRADEBOOK' | 'CBT' | 'SERTIFIKAT'>('PRESENSI');
  const [isLoading, setIsLoading] = useState(true);
  
  const [classes, setClasses] = useState<any[]>([]);
  const [activeClass, setActiveClass] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [cbtData, setCbtData] = useState<any[]>([]);
  
  const [searchClass, setSearchClass] = useState("");
  const [searchSantri, setSearchSantri] = useState("");
  
  // STATE UNTUK TAB PRESENSI DINAMIS
  const [attendances, setAttendances] = useState<any>({}); 
  const [meetingCount, setMeetingCount] = useState<number>(16);

  // STATE UNTUK TAB GRADEBOOK
  const [jumlahTugas, setJumlahTugas] = useState(1);
  const [bobot, setBobot] = useState({ tugas: 20, uts: 30, uas: 50 });
  const [kkm, setKkm] = useState(75); 
  const [grades, setGrades] = useState<any>({}); 
  
  const isBobotValid = bobot.tugas + bobot.uts + bobot.uas === 100;

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    setIsLoading(true);
    const res = await getClassesDB();
    if (res.success) setClasses(res.data || []); 
    setIsLoading(false);
  };

  const openClassDashboard = async (classItem: any) => {
    setIsLoading(true);
    const res = await getClassDetailDB(classItem.id);
    const cbtRes = await getCbtResultsForSyncDB(classItem.id);
    
    if (res.success && res.data) {
      setActiveClass(res.data);
      setStudents(res.data.students || []);
      
      if (res.data.weights) {
        const w = typeof res.data.weights === 'string' ? JSON.parse(res.data.weights) : res.data.weights;
        setBobot({ tugas: w.tugas || 20, uts: w.uts || 30, uas: w.uas || 50 });
        setJumlahTugas(w.jmlTugas || 1);
        setKkm(w.kkm || res.data.kkm || 75); 
        
        // Load settingan jumlah pertemuan & data presensi dari weights JSON
        setMeetingCount(w.totalMeetings || 16);
        setAttendances(w.attendanceRecord || {});
      } else {
        setKkm(res.data.kkm || 75);
        setMeetingCount(16);
        setAttendances({});
      }
      
      const gradeMap: any = {};
      (res.data.grades || []).forEach((g: any) => {
        gradeMap[g.studentId] = { 
          tugas1: g.tugas1, tugas2: g.tugas2, tugas3: g.tugas3, tugas4: g.tugas4, tugas5: g.tugas5, 
          uts: g.uts, uas: g.uas, nilaiAkhir: g.nilaiAkhir,
          certLink: g.certLink || ""
        };
      });
      setGrades(gradeMap);
    }
    
    if (cbtRes.success) setCbtData(cbtRes.data || []);
    
    setView('DETAIL');
    setSearchSantri("");
    setIsLoading(false);
  };

  const filteredClasses = useMemo(() => {
    return classes.filter(c => {
      const namaKelas = c.name || c.nama || ""; 
      const pencarian = searchClass || "";
      return namaKelas.toLowerCase().includes(pencarian.toLowerCase());
    });
  }, [classes, searchClass]);

  const filteredSantri = useMemo(() => {
    return students.filter(s => {
      const namaSantri = s.user?.name || s.nama || "";
      const pencarian = searchSantri || "";
      return namaSantri.toLowerCase().includes(pencarian.toLowerCase());
    });
  }, [students, searchSantri]);

  // Fungsi mengubah presensi di local state
  const handleAttChange = (studentId: string, pertemuanKe: number, value: string) => {
    setAttendances((prev: any) => ({
      ...prev,
      [`${studentId}_${pertemuanKe}`]: value
    }));
  };

  // Menyimpan tabel presensi ke JSON
  const saveAttendances = async () => {
    setIsLoading(true);
    const res = await saveAttendancesDB(activeClass.id, attendances, meetingCount);
    setIsLoading(false);
    if (res.success) alert("Data presensi berhasil disimpan!");
    else alert("Gagal menyimpan presensi.");
  };

  const handleGradeChange = (studentId: string, field: string, val: string) => {
    setGrades((prev: any) => ({ ...prev, [studentId]: { ...prev[studentId], [field]: val === "" ? null : (field === 'certLink' ? val : Number(val)) } }));
  };

  const hitungRataTugas = (studentId: string) => {
    const s = grades[studentId] || {};
    let sum = 0; let count = 0;
    for (let i = 1; i <= jumlahTugas; i++) {
      if (s[`tugas${i}`] !== undefined && s[`tugas${i}`] !== null) { sum += s[`tugas${i}`]; count++; }
    }
    return count > 0 ? sum / count : 0;
  };

  const hitungNilaiAkhir = (studentId: string) => {
    const s = grades[studentId] || {};
    const rataTugas = hitungRataTugas(studentId);
    const uts = s.uts || 0;
    const uas = s.uas || 0;
    const hasil = ((rataTugas * bobot.tugas) + (uts * bobot.uts) + (uas * bobot.uas)) / 100;
    return Math.round(hasil);
  };

  const saveGradebook = async (isPublished = false) => {
    if (!isBobotValid) return alert("Total bobot harus 100%!");
    setIsLoading(true);
    
    const payloadGrades = Object.keys(grades).map(sId => ({ studentId: sId, ...grades[sId], nilaiAkhir: hitungNilaiAkhir(sId) }));
    const payloadWeights = { ...bobot, jmlTugas: jumlahTugas, kkm: kkm, isPublished, totalMeetings: meetingCount, attendanceRecord: attendances };

    const res = await saveGradebookDB(activeClass.id, payloadGrades, payloadWeights);
    setIsLoading(false);
    
    if (res.success) {
      if (isPublished) alert("Berhasil! Nilai telah disinkronkan dan resmi diterbitkan ke Dasbor Santri.");
      else alert("Data berhasil disimpan!");
      loadClasses(); 
    }
  };

  const exportGradebook = () => {
    const data = students.map((s, i) => {
      const nama = s.user?.name || s.nama || "Tanpa Nama";
      let row: any = { "No": i + 1, "Nama Santri": nama };
      for (let j = 1; j <= jumlahTugas; j++) row[`Tugas ${j}`] = grades[s.id]?.[`tugas${j}`] || 0;
      row["Rata Tugas"] = Math.round(hitungRataTugas(s.id));
      row["UTS"] = grades[s.id]?.uts || 0;
      row["UAS"] = grades[s.id]?.uas || 0;
      row["Nilai Akhir"] = hitungNilaiAkhir(s.id);
      row["Status"] = hitungNilaiAkhir(s.id) >= kkm ? "LULUS" : "REMEDIAL";
      row["Link Sertifikat"] = grades[s.id]?.certLink || "-";
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Gradebook");
    XLSX.writeFile(wb, `Nilai_${(activeClass?.name || "Kelas").replace(/\s+/g, '_')}.xlsx`);
  };

  const sinkronCBT = (cbtExam: any) => {
    const targetCol = prompt("Masukkan nilai ujian CBT ini ke kolom mana?\nKetik: 'uas', 'uts', atau 'tugas1', 'tugas2', dst.", "uas");
    if (!targetCol) return;
    setGrades((prev: any) => {
      const newGrades = { ...prev };
      (cbtExam.results || []).forEach((r: any) => {
        const santriMatch = students.find(s => s.user?.email === r.emailPeserta);
        if (santriMatch) {
          if (!newGrades[santriMatch.id]) newGrades[santriMatch.id] = {};
          newGrades[santriMatch.id][targetCol.toLowerCase()] = r.nilai;
        }
      });
      return newGrades;
    });
    alert(`Berhasil! Nilai dari CBT "${cbtExam.judul}" telah disuntikkan ke kolom [${targetCol.toUpperCase()}].`);
    setActiveTab('GRADEBOOK');
  };

  if (view === 'LIST') {
    return (
      <Fragment>
        {isLoading && <div className="fixed inset-0 z-[120] bg-white/60 backdrop-blur-sm flex items-center justify-center"><Loader2 className="w-8 h-8 text-emerald-600 animate-spin" /></div>}
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="bg-white rounded-[2rem] shadow-sm border border-emerald-100 overflow-hidden">
            <div className="p-6 lg:p-8 bg-emerald-50/50 border-b border-emerald-100">
              <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2"><FolderOpen className="text-emerald-600"/> Manajemen Kelas Terpadu</h2>
              <p className="text-sm text-slate-500 font-medium mt-1">Satu dasbor pintar untuk mengelola seluruh ekosistem kelas akademik.</p>
            </div>
            
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="relative max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" value={searchClass} onChange={e => setSearchClass(e.target.value)} placeholder="Cari nama kelas..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-bold text-slate-700 shadow-sm" />
              </div>
            </div>

            <div className="overflow-x-auto min-h-[400px]">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 tracking-widest border-b border-slate-200">
                  <tr><th className="py-4 px-6 border-r border-slate-100">Identitas Kelas</th><th className="py-4 px-4 text-center">Pengajar</th><th className="py-4 px-4 text-center">Santri Terdaftar</th><th className="py-4 px-6 text-center border-l border-slate-100">Manajemen</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredClasses.length === 0 ? <tr><td colSpan={4} className="text-center py-10 text-slate-400 font-bold">Kelas tidak ditemukan.</td></tr> : filteredClasses.map(c => {
                    let cKkm = c.kkm || 75;
                    try { if (c.weights) { const w = typeof c.weights === 'string' ? JSON.parse(c.weights) : c.weights; if (w.kkm) cKkm = w.kkm; } } catch(e) {}
                    const namaKls = c.name || c.nama || "Kelas Tanpa Nama";
                    const pengajar = c.pengajar || c.waliKelas || "-";
                    const jmlSantri = c._count?.students || c.jumlahSiswa || 0;
                    
                    return (
                      <tr key={c.id} className={`transition hover:bg-emerald-50/40 ${c.isFinished ? 'bg-slate-50 grayscale opacity-70' : ''}`}>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${c.isFinished ? 'bg-slate-200 text-slate-500' : 'bg-emerald-100 text-emerald-600'}`}><BookOpen size={20}/></div>
                            <div>
                              <p className="font-bold text-slate-800 text-base">{namaKls}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200 font-black uppercase tracking-widest">KKM: {cKkm}</span>
                                {c.isFinished && <span className="text-[9px] bg-rose-50 text-rose-600 px-2 py-0.5 rounded border border-rose-200 font-black uppercase tracking-widest"><CheckCircle2 size={10} className="inline"/> Selesai</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center font-bold text-slate-600">{pengajar}</td>
                        <td className="py-4 px-4 text-center font-black text-slate-700">{jmlSantri}</td>
                        <td className="py-4 px-6 text-center">
                          <button onClick={() => openClassDashboard(c)} className="px-5 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-600 hover:text-white transition shadow-sm font-bold text-xs flex items-center gap-2 mx-auto cursor-pointer"><FolderOpen size={16}/> Buka Dasbor</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Fragment>
    );
  }

  const safeClassName = activeClass?.name || activeClass?.nama || "Dashboard Kelas";

  return (
    <Fragment>
      {isLoading && <div className="fixed inset-0 z-[120] bg-white/60 backdrop-blur-sm flex items-center justify-center"><Loader2 className="w-8 h-8 text-emerald-600 animate-spin" /></div>}
      
      <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 pb-24">
        
        {/* HEADER & TABS ATAS */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
            <button onClick={() => setView('LIST')} className="w-10 h-10 bg-white border border-slate-200 rounded-2xl flex items-center justify-center hover:bg-emerald-50 hover:text-emerald-600 transition text-slate-600 cursor-pointer shadow-sm"><ChevronLeft size={20}/></button>
            <div><p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">DASBOR MANAJEMEN</p><h2 className="text-xl font-black text-slate-800">{safeClassName}</h2></div>
          </div>
          <div className="flex flex-wrap text-sm border-b border-slate-200 bg-white">
            <button onClick={() => setActiveTab('PRESENSI')} className={`flex-1 sm:flex-none px-6 py-4 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${activeTab === 'PRESENSI' ? 'border-b-4 border-emerald-600 text-emerald-700 bg-emerald-50/50' : 'text-slate-500 hover:bg-slate-50'}`}><CheckCircle2 size={18}/> Rekap Presensi</button>
            <button onClick={() => setActiveTab('GRADEBOOK')} className={`flex-1 sm:flex-none px-6 py-4 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${activeTab === 'GRADEBOOK' ? 'border-b-4 border-amber-500 text-amber-700 bg-amber-50/50' : 'text-slate-500 hover:bg-slate-50'}`}><Calculator size={18}/> Buku Nilai</button>
            <button onClick={() => setActiveTab('CBT')} className={`flex-1 sm:flex-none px-6 py-4 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${activeTab === 'CBT' ? 'border-b-4 border-blue-600 text-blue-700 bg-blue-50/50' : 'text-slate-500 hover:bg-slate-50'}`}><Monitor size={18}/> Ujian CBT</button>
            <button onClick={() => setActiveTab('SERTIFIKAT')} className={`flex-1 sm:flex-none px-6 py-4 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${activeTab === 'SERTIFIKAT' ? 'border-b-4 border-indigo-600 text-indigo-700 bg-indigo-50/50' : 'text-slate-500 hover:bg-slate-50'}`}><LinkIcon size={18}/> Tautkan Sertifikat</button>
          </div>
        </div>

        {/* ================= TAB PRESENSI DINAMIS ================= */}
        {activeTab === 'PRESENSI' && (
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col">
             <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-wrap gap-4 items-center justify-between">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" value={searchSantri} onChange={e => setSearchSantri(e.target.value)} placeholder="Cari santri..." className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 font-bold text-slate-700 shadow-sm" />
              </div>

              <div className="flex gap-3 w-full md:w-auto">
                <div className="flex items-center gap-2 bg-white shadow-sm border border-slate-200 px-3 py-2 rounded-xl">
                  <Settings size={16} className="text-slate-400"/>
                  <span className="text-xs font-bold text-slate-600">Jml Sesi:</span>
                  <input 
                    type="number" 
                    min={1} 
                    max={50} 
                    value={meetingCount} 
                    onChange={e => setMeetingCount(Number(e.target.value) || 1)}
                    className="w-14 text-center text-sm font-bold bg-slate-50 border border-slate-200 rounded outline-none focus:border-emerald-500"
                  />
                </div>
                <button onClick={saveAttendances} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-md hover:bg-emerald-700 flex items-center gap-2 cursor-pointer transition">
                  <Save size={16}/> Simpan Data
                </button>
              </div>
            </div>

            <div className="overflow-x-auto min-h-[400px]">
              <table className="w-full text-left whitespace-nowrap min-w-max border-collapse">
                <thead className="bg-white text-[10px] text-slate-400 font-black uppercase tracking-widest border-b border-slate-200 sticky top-0 shadow-sm z-10">
                  <tr>
                    {/* PERBAIKAN: Ditambahkan Kolom Nomor Urut */}
                    <th className="py-4 px-4 text-center w-12 border-r border-slate-50">No</th>
                    <th className="py-4 px-4 border-r border-slate-100 sticky left-0 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] z-20">Nama Santri</th>
                    
                    {Array.from({length: meetingCount}).map((_, i) => (
                      <th key={i} className="py-4 px-2 text-center border-r border-slate-50 text-slate-500 w-16">
                        P{i + 1}
                      </th>
                    ))}
                    
                    <th className="py-4 px-3 text-center text-emerald-600 bg-emerald-50/50 border-l border-emerald-100 shadow-inner w-12">H</th>
                    <th className="py-4 px-3 text-center text-amber-500 bg-amber-50/50 border-l border-amber-100 shadow-inner w-12">S/I</th>
                    <th className="py-4 px-3 text-center text-rose-500 bg-rose-50/50 border-x border-rose-100 shadow-inner w-12">A</th>
                    
                    <th className="py-4 px-4 text-center border-l border-indigo-100 bg-indigo-50/50 text-indigo-600 shadow-inner sticky right-0 z-20 w-32">
                      <MonitorPlay size={12} className="mx-auto mb-1"/> Video Dilihat
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredSantri.length === 0 ? <tr><td colSpan={meetingCount + 6} className="text-center py-10 text-slate-400 font-bold">Data santri tidak ditemukan.</td></tr> : filteredSantri.map((s, i) => {
                    const nama = s.user?.name || s.nama || "Tanpa Nama";
                    
                    // KALKULASI PRESENSI BARU (I dan S digabung)
                    let totalH = 0, totalSI = 0, totalA = 0;
                    for (let x = 1; x <= meetingCount; x++) {
                      const stat = attendances[`${s.id}_${x}`];
                      if (stat === 'H') totalH++;
                      if (stat === 'S' || stat === 'I') totalSI++;
                      if (stat === 'A') totalA++;
                    }

                    return (
                      <tr key={s.id} className="hover:bg-slate-50 transition">
                        {/* PERBAIKAN: Data Kolom Nomor Urut */}
                        <td className="py-3 px-4 text-center text-slate-400 text-sm font-bold border-r border-slate-50">{i + 1}</td>
                        <td className="py-3 px-4 border-r border-slate-100 sticky left-0 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="font-bold text-sm text-slate-800">{nama}</p>
                              <p className="text-[10px] text-slate-400 font-medium">{s.nis || "-"}</p>
                            </div>
                            
                            {/* TOMBOL WA WALI MURID */}
                            {s.parentPhone && (
                              <a 
                                href={`https://wa.me/${s.parentPhone.replace(/\D/g, '').replace(/^0/, '62')}`} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="w-8 h-8 flex items-center justify-center bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-500 hover:text-white transition shadow-sm shrink-0 border border-emerald-100" 
                                title={`Hubungi Wali Murid (${s.parentPhone})`}
                              >
                                <MessageCircle size={14}/>
                              </a>
                            )}
                          </div>
                        </td>
                        
                        {Array.from({length: meetingCount}).map((_, x) => {
                          const val = attendances[`${s.id}_${x + 1}`] || "";
                          return (
                            <td key={x} className="py-2 px-1 text-center border-r border-slate-50">
                              <select 
                                value={val}
                                onChange={(e) => handleAttChange(s.id, x + 1, e.target.value)}
                                className={`w-12 py-1.5 text-center text-xs font-bold rounded-lg outline-none border cursor-pointer appearance-none transition shadow-sm ${
                                  val === 'H' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                                  (val === 'S' || val === 'I') ? 'bg-amber-50 border-amber-200 text-amber-700' :
                                  val === 'A' ? 'bg-rose-50 border-rose-200 text-rose-700' :
                                  'bg-white border-slate-200 text-slate-400 hover:border-emerald-300'
                                }`}
                              >
                                <option value="">-</option>
                                <option value="H">H</option>
                                <option value="S">S</option>
                                <option value="I">I</option>
                                <option value="A">A</option>
                              </select>
                            </td>
                          )
                        })}
                        
                        <td className="py-3 px-3 text-center text-sm font-black text-emerald-600 bg-emerald-50/30 border-l border-emerald-50">{totalH}</td>
                        <td className="py-3 px-3 text-center text-sm font-black text-amber-500 bg-amber-50/30 border-l border-amber-50">{totalSI}</td>
                        <td className="py-3 px-3 text-center text-sm font-black text-rose-500 bg-rose-50/30 border-l border-rose-50 border-r border-slate-100">{totalA}</td>
                        
                        <td className="py-3 px-4 text-center bg-indigo-50/50 sticky right-0 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] border-l border-indigo-100">
                           <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white border border-indigo-200 text-indigo-700 font-black shadow-sm text-xs">
                             {s.watchedVideosCount || 0}
                           </span>
                        </td>
                      </tr>
                    )})}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest justify-center sm:justify-end">
              <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm"></div> H: Hadir</span>
              <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm"></div> S/I: Sakit / Izin</span>
              <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm"></div> A: Alpha</span>
            </div>
          </div>
        )}

        {/* TAB GRADEBOOK */}
        {activeTab === 'GRADEBOOK' && (
          <div className="bg-white rounded-[2rem] shadow-2xl shadow-amber-900/5 border border-amber-100 overflow-hidden flex flex-col">
             <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-wrap gap-4 items-center">
              <div className="relative w-full xl:w-auto flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" value={searchSantri} onChange={e => setSearchSantri(e.target.value)} placeholder="Cari santri..." className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-amber-500 font-bold text-slate-700" />
              </div>
              
              <div className="flex border-l border-slate-200 pl-4 gap-4 items-center overflow-x-auto">
                <div>
                  <label className="text-[9px] font-black uppercase text-amber-800 mb-1 block">Jml Tugas</label>
                  <select value={jumlahTugas} onChange={e => setJumlahTugas(Number(e.target.value))} className="bg-white border border-amber-200 rounded-lg p-1.5 text-xs font-bold outline-none cursor-pointer text-amber-900 shadow-sm">
                    {[1,2,3,4,5].map(i => <option key={i} value={i}>{i} Kolom</option>)}
                  </select>
                </div>
                <div className="flex items-end gap-2">
                  <div><label className="text-[9px] font-black uppercase text-amber-800 mb-1 block">Bbt TGS (%)</label><input type="number" value={bobot.tugas} onChange={e=>setBobot({...bobot, tugas: Number(e.target.value)})} className="w-16 bg-white border border-slate-200 p-1.5 rounded-lg text-xs font-bold text-center outline-none"/></div>
                  <div><label className="text-[9px] font-black uppercase text-amber-800 mb-1 block">Bbt UTS (%)</label><input type="number" value={bobot.uts} onChange={e=>setBobot({...bobot, uts: Number(e.target.value)})} className="w-16 bg-white border border-slate-200 p-1.5 rounded-lg text-xs font-bold text-center outline-none"/></div>
                  <div><label className="text-[9px] font-black uppercase text-amber-800 mb-1 block">Bbt UAS (%)</label><input type="number" value={bobot.uas} onChange={e=>setBobot({...bobot, uas: Number(e.target.value)})} className="w-16 bg-white border border-slate-200 p-1.5 rounded-lg text-xs font-bold text-center outline-none"/></div>
                </div>
                <div className="border-l border-slate-200 pl-3">
                  <label className="text-[9px] font-black uppercase text-rose-600 mb-1 block">Batas KKM</label>
                  <input type="number" value={kkm} onChange={e=>setKkm(Number(e.target.value))} className="w-16 bg-rose-50 border border-rose-200 p-1.5 rounded-lg text-xs font-bold text-center text-rose-700 outline-none focus:ring-2 focus:ring-rose-200"/>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 ml-auto">
                <button onClick={exportGradebook} className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 flex items-center gap-2 shadow-sm cursor-pointer"><Download size={14}/> Export</button>
                <button onClick={() => saveGradebook(false)} className="px-4 py-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold hover:bg-amber-100 flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50" disabled={!isBobotValid}><Save size={14}/> Simpan Draft</button>
                <button onClick={() => saveGradebook(true)} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50" disabled={!isBobotValid} title="Simpan & Tampilkan Nilai di Dasbor Santri"><Send size={14}/> Sinkron ke Santri</button>
              </div>
            </div>

            {!isBobotValid && (
              <div className="bg-rose-50 p-3 text-rose-600 text-xs font-bold flex items-center justify-center gap-2 border-b border-rose-100">
                <AlertTriangle size={16}/> Peringatan: Total bobot saat ini {bobot.tugas + bobot.uts + bobot.uas}%. Harus tepat 100%!
              </div>
            )}

            <div className="overflow-x-auto min-h-[400px]">
              <table className="w-full text-left min-w-[900px] whitespace-nowrap">
                <thead className="bg-white text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="py-4 px-4 text-center w-10 border-r border-slate-50">No</th>
                    <th className="py-4 px-4 border-r border-slate-100 sticky left-0 bg-white z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Nama Santri</th>
                    {Array.from({length: jumlahTugas}).map((_,i) => <th key={i} className="py-4 px-2 text-center w-20">Tgs {i+1}</th>)}
                    {jumlahTugas > 1 && <th className="py-4 px-2 text-center w-20 border-x border-slate-100 bg-slate-50">Rata TGS</th>}
                    <th className="py-4 px-2 text-center w-20 border-l border-slate-100 bg-blue-50/30">UTS</th>
                    <th className="py-4 px-2 text-center w-20 border-r border-slate-100 bg-indigo-50/30">UAS</th>
                    <th className="py-4 px-6 text-center w-32 bg-amber-50 text-amber-800 border-l border-amber-100 sticky right-0 z-20 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">NILAI AKHIR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSantri.length === 0 ? <tr><td colSpan={10} className="text-center py-10 text-slate-400 font-bold">Data santri tidak ditemukan.</td></tr> : filteredSantri.map((s, idx) => {
                    const nama = s.user?.name || s.nama || "Tanpa Nama";
                    const rataTugas = hitungRataTugas(s.id);
                    const nilaiAkhir = hitungNilaiAkhir(s.id);
                    
                    return (
                      <tr key={s.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 text-center text-slate-400 text-sm font-bold border-r border-slate-50">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-sm text-slate-800 border-r border-slate-100 sticky left-0 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">{nama}</td>
                        
                        {Array.from({length: jumlahTugas}).map((_,i) => {
                          const val = grades[s.id]?.[`tugas${i+1}`];
                          const isBelowKkm = val !== undefined && val !== null && val !== "" && Number(val) < kkm;
                          return (
                            <td key={i} className="py-3 px-2 text-center">
                              <input type="number" value={val !== undefined && val !== null ? val : ""} onChange={e => handleGradeChange(s.id, `tugas${i+1}`, e.target.value)} className={`w-14 p-1.5 text-center font-bold text-sm bg-white border rounded-lg outline-none transition focus:ring-2 ${isBelowKkm ? 'border-rose-300 text-rose-600 bg-rose-50/50' : 'border-slate-200 text-slate-800 focus:border-amber-500'}`} placeholder="-"/>
                            </td>
                          );
                        })}
                        
                        {jumlahTugas > 1 && (
                          <td className={`py-3 px-2 text-center font-black text-sm border-x border-slate-100 shadow-inner ${rataTugas > 0 && rataTugas < kkm ? 'bg-rose-50/70 text-rose-600' : 'bg-slate-50 text-slate-500'}`}>
                            {Math.round(rataTugas)}
                          </td>
                        )}
                        
                        <td className="py-3 px-2 text-center border-l border-slate-50 bg-blue-50/10">
                          {(() => {
                            const valUts = grades[s.id]?.uts;
                            const isUtsBelow = valUts !== undefined && valUts !== null && valUts !== "" && Number(valUts) < kkm;
                            return <input type="number" value={valUts !== undefined && valUts !== null ? valUts : ""} onChange={e => handleGradeChange(s.id, 'uts', e.target.value)} className={`w-14 p-1.5 text-center font-bold text-sm bg-white border rounded-lg outline-none transition focus:ring-2 ${isUtsBelow ? 'border-rose-300 text-rose-600 bg-rose-50/50' : 'border-blue-200 focus:border-blue-500'}`} placeholder="-"/>
                          })()}
                        </td>
                        
                        <td className="py-3 px-2 text-center border-r border-slate-50 bg-indigo-50/10">
                          {(() => {
                            const valUas = grades[s.id]?.uas;
                            const isUasBelow = valUas !== undefined && valUas !== null && valUas !== "" && Number(valUas) < kkm;
                            return <input type="number" value={valUas !== undefined && valUas !== null ? valUas : ""} onChange={e => handleGradeChange(s.id, 'uas', e.target.value)} className={`w-14 p-1.5 text-center font-bold text-sm bg-white border rounded-lg outline-none transition focus:ring-2 ${isUasBelow ? 'border-rose-300 text-rose-600 bg-rose-50/50' : 'border-indigo-200 focus:border-indigo-500'}`} placeholder="-"/>
                          })()}
                        </td>
                        
                        <td className="py-3 px-6 text-center bg-amber-50/80 border-l border-amber-100 sticky right-0 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                          <span className={`px-3 py-1.5 rounded-lg border font-black text-sm shadow-sm inline-block min-w-[3rem] ${nilaiAkhir >= kkm ? 'bg-white text-emerald-700 border-emerald-200' : 'bg-rose-100 text-rose-700 border-rose-300'}`}>{nilaiAkhir || 0}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB CBT */}
        {activeTab === 'CBT' && (
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[400px]">
            <div className="p-6 border-b border-slate-100 bg-blue-50/50 flex flex-wrap justify-between items-center gap-4">
              <div><h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><Monitor className="text-blue-600"/> Ujian CBT Terkoneksi</h3><p className="text-xs text-slate-500 mt-1">Tarik hasil ujian CBT Publik yang ditargetkan untuk kelas ini langsung ke Gradebook.</p></div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {cbtData.length === 0 ? (
                  <div className="text-center py-10">
                    <Monitor size={48} className="mx-auto text-slate-300 mb-4"/>
                    <p className="font-bold text-slate-500">Tidak ada jadwal ujian CBT untuk kelas ini.</p>
                  </div>
                ) : cbtData.map((cbt, i) => (
                  <div key={i} className="p-5 border border-slate-200 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4 hover:border-blue-300 transition hover:shadow-md bg-white">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0"><Monitor size={24}/></div>
                      <div><h4 className="font-black text-slate-800 text-base md:text-lg">{cbt.judul}</h4><p className="text-xs font-bold text-slate-500 mt-0.5">{cbt.results?.length || 0} Peserta Mengumpulkan Nilai</p></div>
                    </div>
                    <button onClick={() => sinkronCBT(cbt)} className="px-5 py-3 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex items-center gap-2 cursor-pointer w-full md:w-auto justify-center"><RefreshCw size={16}/> Sinkron ke Gradebook</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB SERTIFIKAT */}
        {activeTab === 'SERTIFIKAT' && (
          <div className="bg-white rounded-[2rem] shadow-sm border border-indigo-100 overflow-hidden flex flex-col min-h-[500px]">
            <div className="p-6 border-b border-indigo-100 bg-indigo-50/50 flex flex-wrap justify-between items-center gap-4">
              <div>
                <h3 className="text-xl font-black text-indigo-900 flex items-center gap-2"><LinkIcon className="text-indigo-600"/> Tautkan Link Sertifikat</h3>
                <p className="text-xs text-indigo-600/80 mt-1 font-medium">Masukkan link/tautan (Google Drive, Canva, dll) agar santri dapat melihat/mengunduh sertifikat mereka di dasbor pribadi.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => saveGradebook(false)} className="px-5 py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-md hover:bg-indigo-700 flex items-center gap-2 cursor-pointer active:scale-95 transition">
                  <Save size={16}/> Simpan Link Sertifikat
                </button>
              </div>
            </div>
            
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" value={searchSantri} onChange={e => setSearchSantri(e.target.value)} placeholder="Cari santri..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 font-bold text-slate-700 shadow-sm" />
              </div>
            </div>

            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-white text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="py-4 px-6 text-center w-12 border-r border-slate-50">No</th>
                    <th className="py-4 px-6 border-r border-slate-100">Nama Santri</th>
                    <th className="py-4 px-6 text-center border-r border-slate-100 w-32">Status Nilai</th>
                    <th className="py-4 px-6 border-slate-100 min-w-[300px]">Tautan / Link Sertifikat URL</th>
                    <th className="py-4 px-6 text-center w-24">Tes Buka Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSantri.length === 0 ? <tr><td colSpan={5} className="text-center py-10 text-slate-400 font-bold">Data santri tidak ditemukan.</td></tr> : filteredSantri.map((s, idx) => {
                    const nama = s.user?.name || s.nama || "Tanpa Nama";
                    const nilaiAkhir = hitungNilaiAkhir(s.id);
                    const isLulus = nilaiAkhir >= kkm; 
                    const certLink = grades[s.id]?.certLink || "";
                    
                    return (
                      <tr key={s.id} className="hover:bg-slate-50 transition">
                        <td className="py-4 px-6 text-center text-slate-400 text-sm font-bold border-r border-slate-50">{idx + 1}</td>
                        <td className="py-4 px-6 font-bold text-sm text-slate-800 border-r border-slate-100">
                          {nama}
                          <div className="text-[10px] text-slate-400 mt-0.5">Nilai Akhir: {nilaiAkhir}</div>
                        </td>
                        <td className="py-4 px-6 text-center border-r border-slate-100">
                           {isLulus ? <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">Lulus KKM</span> : <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">Belum Lulus</span>}
                        </td>
                        <td className="py-3 px-6">
                           <input 
                             type="url" 
                             value={certLink}
                             onChange={e => handleGradeChange(s.id, 'certLink', e.target.value)}
                             placeholder="https://..." 
                             className="w-full p-2.5 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition text-indigo-600 font-medium"
                           />
                        </td>
                        <td className="py-4 px-6 text-center">
                           <a 
                              href={certLink ? (certLink.startsWith('http') ? certLink : `https://${certLink}`) : '#'} 
                              target="_blank" 
                              rel="noreferrer"
                              onClick={(e) => { if(!certLink) e.preventDefault(); }}
                              className={`inline-flex items-center justify-center p-2.5 rounded-xl transition shadow-sm ${certLink ? 'bg-white border border-slate-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}
                              title="Buka Link untuk Tes"
                           >
                             <ExternalLink size={16} />
                           </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </Fragment>
  );
}