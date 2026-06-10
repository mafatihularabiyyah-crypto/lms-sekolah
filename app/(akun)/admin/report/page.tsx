"use client";

import { useState, useEffect, useMemo, useRef, Fragment } from 'react';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { 
  Search, FolderOpen, ChevronLeft, CheckCircle2, XCircle, 
  Award, Download, Save, Calculator, BookOpen, MessageCircle,
  Monitor, RefreshCw, AlertTriangle, Image as ImageIcon, Loader2
} from 'lucide-react';
import { 
  getClassesDB, getClassDetailDB, saveAttendancesDB, 
  saveGradebookDB, saveCertBackgroundDB, getCbtResultsForSyncDB 
} from './actions';

export default function ManajemenKelasAllInOne() {
  const [view, setView] = useState<'LIST' | 'DETAIL'>('LIST');
  const [activeTab, setActiveTab] = useState<'PRESENSI' | 'GRADEBOOK' | 'CBT' | 'SERTIFIKAT'>('PRESENSI');
  const [isLoading, setIsLoading] = useState(true);
  
  // ================= DATA GLOBAL (Dari Database) =================
  const [classes, setClasses] = useState<any[]>([]);
  const [activeClass, setActiveClass] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [cbtData, setCbtData] = useState<any[]>([]);
  
  // States Pencarian
  const [searchClass, setSearchClass] = useState("");
  const [searchSantri, setSearchSantri] = useState("");
  
  // States Presensi (Mode Angka)
  const [attendances, setAttendances] = useState<any>({}); 
  
  // States Gradebook
  const [jumlahTugas, setJumlahTugas] = useState(1);
  const [bobot, setBobot] = useState({ tugas: 20, uts: 30, uas: 50 });
  const [grades, setGrades] = useState<any>({}); 
  
  // States Sertifikat
  const [certBg, setCertBg] = useState<string>("");
  const certRef = useRef<HTMLDivElement>(null);
  
  // Pengecekan Bobot 100%
  const isBobotValid = bobot.tugas + bobot.uts + bobot.uas === 100;

  // ================= LOAD AWAL =================
  useEffect(() => {
    loadClasses();
    // Pre-load font elegan untuk sertifikat (agar terbaca oleh html2canvas)
    const link1 = document.createElement('link'); link1.href = "https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap"; link1.rel = "stylesheet"; document.head.appendChild(link1);
    const link2 = document.createElement('link'); link2.href = "https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&display=swap"; link2.rel = "stylesheet"; document.head.appendChild(link2);
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
      
      // Parse data Presensi
      const attMap: any = {};
      (res.data.attendances || []).forEach((a: any) => {
        attMap[a.studentId] = { hadir: a.hadir, sakit: a.sakit, izin: a.izin, alpa: a.alpa };
      });
      setAttendances(attMap);

      // Parse data Gradebook & Bobot
      if (res.data.weights) {
        const w = typeof res.data.weights === 'string' ? JSON.parse(res.data.weights) : res.data.weights;
        setBobot({ tugas: w.tugas || 20, uts: w.uts || 30, uas: w.uas || 50 });
        setJumlahTugas(w.jmlTugas || 1);
      }
      
      const gradeMap: any = {};
      (res.data.grades || []).forEach((g: any) => {
        gradeMap[g.studentId] = { 
          tugas1: g.tugas1, tugas2: g.tugas2, tugas3: g.tugas3, tugas4: g.tugas4, tugas5: g.tugas5, 
          uts: g.uts, uas: g.uas, nilaiAkhir: g.nilaiAkhir 
        };
      });
      setGrades(gradeMap);
      
      setCertBg(res.data.certBackground || "");
    }
    
    if (cbtRes.success) setCbtData(cbtRes.data || []);
    
    setView('DETAIL');
    setSearchSantri("");
    setIsLoading(false);
  };

  // Filter Data Cerdas (Aman dari property undefined)
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

  // ================= FUNGSI PRESENSI =================
  const handleAttChange = (studentId: string, field: 'hadir'|'sakit'|'izin'|'alpa', val: string) => {
    setAttendances((prev:any) => ({
      ...prev,
      [studentId]: { ...(prev[studentId] || {hadir:0,sakit:0,izin:0,alpa:0}), [field]: Number(val) }
    }));
  };

  const saveAttendances = async () => {
    setIsLoading(true);
    const payload = Object.keys(attendances).map(sId => ({
      studentId: sId, ...attendances[sId]
    }));
    const res = await saveAttendancesDB(activeClass.id, payload);
    setIsLoading(false);
    if (res.success) alert("Data presensi berhasil disimpan!");
  };

  // ================= FUNGSI GRADEBOOK =================
  const handleGradeChange = (studentId: string, field: string, val: string) => {
    setGrades((prev: any) => ({
      ...prev, [studentId]: { ...prev[studentId], [field]: val === "" ? null : Number(val) }
    }));
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

  const saveGradebook = async () => {
    if (!isBobotValid) return alert("Total bobot harus 100%!");
    setIsLoading(true);
    
    const payloadGrades = Object.keys(grades).map(sId => ({
      studentId: sId, ...grades[sId], nilaiAkhir: hitungNilaiAkhir(sId)
    }));
    const payloadWeights = { ...bobot, jmlTugas: jumlahTugas };

    const res = await saveGradebookDB(activeClass.id, payloadGrades, payloadWeights);
    setIsLoading(false);
    if (res.success) alert("Buku nilai & pengaturan bobot berhasil disimpan!");
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
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Gradebook");
    const safeName = (activeClass?.name || activeClass?.nama || "Kelas").replace(/\s+/g, '_');
    XLSX.writeFile(wb, `Nilai_${safeName}.xlsx`);
  };

  // ================= FUNGSI CBT SINKRONISASI =================
  const sinkronCBT = (cbtExam: any) => {
    const targetCol = prompt("Masukkan nilai ujian CBT ini ke kolom mana?\nKetik: 'uas', 'uts', atau 'tugas1', 'tugas2', dst.", "uas");
    if (!targetCol) return;
    
    setGrades((prev: any) => {
      const newGrades = { ...prev };
      // Cocokkan email peserta CBT dengan email santri di kelas
      (cbtExam.results || []).forEach((r: any) => {
        const santriMatch = students.find(s => s.user?.email === r.emailPeserta);
        if (santriMatch) {
          if (!newGrades[santriMatch.id]) newGrades[santriMatch.id] = {};
          newGrades[santriMatch.id][targetCol.toLowerCase()] = r.nilai;
        }
      });
      return newGrades;
    });
    alert(`Berhasil! Nilai dari CBT "${cbtExam.judul}" telah disuntikkan ke kolom [${targetCol.toUpperCase()}].\nSilakan cek Tab Buku Nilai dan klik SIMPAN DRAFT NILAI untuk menyimpannya permanen.`);
    setActiveTab('GRADEBOOK');
  };

  // ================= FUNGSI SERTIFIKAT =================
  const getPredikatArab = (nilai: number) => {
    if(nilai >= 90) return 'ممتاز';
    if(nilai >= 80) return 'جيد جدا';
    if(nilai >= 70) return 'جيد';
    if(nilai >= 60) return 'مقبول';
    return 'راسب';
  };

  const handleUploadCertBg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setCertBg(base64);
      await saveCertBackgroundDB(activeClass.id, base64);
      setIsLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const generateSertifikat = async (nama: string, nilai: number) => {
    if (!certRef.current) return alert("Kanvas sertifikat belum siap.");
    setIsLoading(true);
    try {
      document.getElementById('cert-nama')!.innerText = nama;
      document.getElementById('cert-nilai')!.innerText = nilai.toString();
      document.getElementById('cert-predikat')!.innerText = getPredikatArab(nilai);
      
      const canvas = await html2canvas(certRef.current, { scale: 2, useCORS: true, backgroundColor: null });
      const imgData = canvas.toDataURL('image/jpeg', 0.9);
      const link = document.createElement('a');
      link.download = `Sertifikat_${nama.replace(/\s+/g, '_')}.jpg`;
      link.href = imgData;
      link.click();
    } catch (e) {
      alert("Gagal membuat sertifikat. Pastikan gambar background yang diupload adalah JPG/PNG yang valid.");
    }
    setIsLoading(false);
  };

  // ==================== RENDER: DAFTAR KELAS (HOME) ====================
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
                <input type="text" value={searchClass} onChange={e => setSearchClass(e.target.value)} placeholder="Cari nama kelas..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-bold text-slate-700 shadow-sm" />
              </div>
            </div>

            <div className="overflow-x-auto min-h-[400px]">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 tracking-widest border-b border-slate-200">
                  <tr><th className="py-4 px-6 border-r border-slate-100">Identitas Kelas</th><th className="py-4 px-4 text-center">Pengajar</th><th className="py-4 px-4 text-center">Santri Terdaftar</th><th className="py-4 px-6 text-center border-l border-slate-100">Manajemen</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredClasses.length === 0 ? <tr><td colSpan={4} className="text-center py-10 text-slate-400 font-bold">Kelas tidak ditemukan atau belum ada.</td></tr> : filteredClasses.map(c => {
                    const kkm = c.kkm || 75;
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
                                <span className="text-[9px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded border border-amber-200 font-black uppercase tracking-widest">KKM: {kkm}</span>
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

  // Parameter aman untuk Dasbor Detail Kelas
  const safeClassName = activeClass?.name || activeClass?.nama || "Dashboard Kelas";
  const safeTeacherName = activeClass?.pengajar || activeClass?.waliKelas || "Pengajar Utama";
  const safeKkm = activeClass?.kkm || 75;

  // ==================== RENDER: DASBOR KELAS (DETAIL) ====================
  return (
    <Fragment>
      {isLoading && <div className="fixed inset-0 z-[120] bg-white/60 backdrop-blur-sm flex items-center justify-center"><Loader2 className="w-8 h-8 text-emerald-600 animate-spin" /></div>}
      <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
        
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
            <button onClick={() => setActiveTab('SERTIFIKAT')} className={`flex-1 sm:flex-none px-6 py-4 font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${activeTab === 'SERTIFIKAT' ? 'border-b-4 border-indigo-600 text-indigo-700 bg-indigo-50/50' : 'text-slate-500 hover:bg-slate-50'}`}><Award size={18}/> Sertifikat Lulus</button>
          </div>
        </div>

        {/* ================= TAB PRESENSI (Input Angka) ================= */}
        {activeTab === 'PRESENSI' && (
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex flex-wrap gap-4 items-center justify-between">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" value={searchSantri} onChange={e => setSearchSantri(e.target.value)} placeholder="Cari santri..." className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-bold text-slate-700" />
              </div>
              <button onClick={saveAttendances} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-md hover:bg-emerald-700 flex items-center gap-2 cursor-pointer"><Save size={16}/> Simpan Perubahan Presensi</button>
            </div>

            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-white text-[10px] text-slate-400 font-black uppercase tracking-widest border-b border-slate-100 sticky top-0 shadow-sm z-10">
                  <tr><th className="py-4 px-4 text-center w-12 border-r border-slate-50">No</th><th className="py-4 px-4 border-r border-slate-100">Nama Santri</th><th className="py-4 px-2 text-center text-emerald-600 bg-emerald-50/30">Hadir</th><th className="py-4 px-2 text-center text-amber-500 bg-amber-50/30">Sakit</th><th className="py-4 px-2 text-center text-blue-500 bg-blue-50/30">Izin</th><th className="py-4 px-2 text-center text-rose-500 bg-rose-50/30">Alpa</th><th className="py-4 px-6 text-center border-l border-slate-100">Total Sesi</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredSantri.length === 0 ? <tr><td colSpan={7} className="text-center py-10 text-slate-400 font-bold">Data santri tidak ditemukan di kelas ini.</td></tr> : filteredSantri.map((s, i) => {
                    const nama = s.user?.name || s.nama || "Tanpa Nama";
                    const noWa = s.user?.wa || s.wa;
                    const att = attendances[s.id] || { hadir: 0, sakit: 0, izin: 0, alpa: 0 };
                    const total = (att.hadir||0) + (att.sakit||0) + (att.izin||0) + (att.alpa||0);
                    return (
                      <tr key={s.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 text-center font-bold text-slate-400 border-r border-slate-50">{i+1}</td>
                        <td className="py-3 px-4 font-bold text-sm text-slate-800 border-r border-slate-100 flex items-center justify-between">
                          {nama}
                          {noWa && <a href={`https://wa.me/${noWa}`} target="_blank" rel="noreferrer" className="text-emerald-500 bg-emerald-50 p-1.5 rounded-lg hover:bg-emerald-500 hover:text-white transition cursor-pointer" title="Hubungi via WA"><MessageCircle size={14}/></a>}
                        </td>
                        <td className="py-3 px-2 text-center bg-emerald-50/10"><input type="number" min="0" value={att.hadir || ""} onChange={e => handleAttChange(s.id, 'hadir', e.target.value)} className="w-14 p-1.5 text-center font-bold text-sm bg-white border border-emerald-200 rounded-lg outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200" placeholder="0"/></td>
                        <td className="py-3 px-2 text-center bg-amber-50/10"><input type="number" min="0" value={att.sakit || ""} onChange={e => handleAttChange(s.id, 'sakit', e.target.value)} className="w-14 p-1.5 text-center font-bold text-sm bg-white border border-amber-200 rounded-lg outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200" placeholder="0"/></td>
                        <td className="py-3 px-2 text-center bg-blue-50/10"><input type="number" min="0" value={att.izin || ""} onChange={e => handleAttChange(s.id, 'izin', e.target.value)} className="w-14 p-1.5 text-center font-bold text-sm bg-white border border-blue-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" placeholder="0"/></td>
                        <td className="py-3 px-2 text-center bg-rose-50/10"><input type="number" min="0" value={att.alpa || ""} onChange={e => handleAttChange(s.id, 'alpa', e.target.value)} className="w-14 p-1.5 text-center font-bold text-sm bg-white border border-rose-200 rounded-lg outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-200" placeholder="0"/></td>
                        <td className="py-3 px-6 text-center font-black text-slate-600 border-l border-slate-100 bg-slate-50/50">{total}</td>
                      </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB GRADEBOOK ================= */}
        {activeTab === 'GRADEBOOK' && (
          <div className="bg-white rounded-[2rem] shadow-2xl shadow-amber-900/5 border border-amber-100 overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-wrap gap-4 items-center">
              <div className="relative w-full sm:w-auto flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" value={searchSantri} onChange={e => setSearchSantri(e.target.value)} placeholder="Cari santri..." className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 font-bold text-slate-700" />
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
              </div>

              <div className="flex gap-2 ml-auto">
                <button onClick={exportGradebook} className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 flex items-center gap-2 shadow-sm cursor-pointer"><Download size={14}/> Export</button>
                <button onClick={saveGradebook} className="px-4 py-2.5 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50" disabled={!isBobotValid}><Save size={14}/> Simpan Draft Nilai</button>
              </div>
            </div>

            {!isBobotValid && (
              <div className="bg-rose-50 p-3 text-rose-600 text-xs font-bold flex items-center justify-center gap-2 border-b border-rose-100">
                <AlertTriangle size={16}/> Peringatan: Total bobot saat ini {bobot.tugas + bobot.uts + bobot.uas}%. Harus tepat 100%!
              </div>
            )}

            <div className="overflow-x-auto min-h-[400px]">
              <table className="w-full text-left min-w-[800px] whitespace-nowrap">
                <thead className="bg-white text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="py-4 px-4 text-center w-10 border-r border-slate-50">No</th>
                    <th className="py-4 px-4 border-r border-slate-100">Nama Santri</th>
                    {Array.from({length: jumlahTugas}).map((_,i) => <th key={i} className="py-4 px-2 text-center w-20">Tgs {i+1}</th>)}
                    {jumlahTugas > 1 && <th className="py-4 px-2 text-center w-20 border-x border-slate-100 bg-slate-50">Rata TGS</th>}
                    <th className="py-4 px-2 text-center w-20 border-l border-slate-100 bg-blue-50/30">UTS</th>
                    <th className="py-4 px-2 text-center w-20 border-r border-slate-100 bg-indigo-50/30">UAS</th>
                    <th className="py-4 px-6 text-center w-32 bg-amber-50 text-amber-800 border-l border-amber-100">NILAI AKHIR</th>
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
                        <td className="py-3 px-4 font-bold text-sm text-slate-800 border-r border-slate-100">{nama}</td>
                        
                        {Array.from({length: jumlahTugas}).map((_,i) => (
                          <td key={i} className="py-3 px-2 text-center">
                            <input type="number" value={grades[s.id]?.[`tugas${i+1}`] !== undefined && grades[s.id]?.[`tugas${i+1}`] !== null ? grades[s.id][`tugas${i+1}`] : ""} onChange={e => handleGradeChange(s.id, `tugas${i+1}`, e.target.value)} className="w-14 p-1.5 text-center font-bold text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition" placeholder="-"/>
                          </td>
                        ))}
                        
                        {jumlahTugas > 1 && <td className="py-3 px-2 text-center bg-slate-50 font-black text-sm text-slate-500 border-x border-slate-100 shadow-inner">{Math.round(rataTugas)}</td>}
                        
                        <td className="py-3 px-2 text-center border-l border-slate-50 bg-blue-50/10">
                          <input type="number" value={grades[s.id]?.uts !== undefined && grades[s.id]?.uts !== null ? grades[s.id].uts : ""} onChange={e => handleGradeChange(s.id, 'uts', e.target.value)} className="w-14 p-1.5 text-center font-bold text-sm bg-white border border-blue-200 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition" placeholder="-"/>
                        </td>
                        <td className="py-3 px-2 text-center border-r border-slate-50 bg-indigo-50/10">
                          <input type="number" value={grades[s.id]?.uas !== undefined && grades[s.id]?.uas !== null ? grades[s.id].uas : ""} onChange={e => handleGradeChange(s.id, 'uas', e.target.value)} className="w-14 p-1.5 text-center font-bold text-sm bg-white border border-indigo-200 rounded-lg outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition" placeholder="-"/>
                        </td>
                        <td className="py-3 px-6 text-center bg-amber-50/40 border-l border-amber-100">
                          <span className={`px-3 py-1.5 rounded-lg border font-black text-sm shadow-sm inline-block min-w-[3rem] ${nilaiAkhir >= safeKkm ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 'bg-rose-100 text-rose-700 border-rose-300'}`}>{nilaiAkhir || 0}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================= TAB CBT ================= */}
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

        {/* ================= TAB SERTIFIKAT ================= */}
        {activeTab === 'SERTIFIKAT' && (
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
             <div className="p-6 border-b border-slate-100 bg-indigo-50/50 flex flex-wrap justify-between items-center gap-4">
               <div><h3 className="text-xl font-black text-slate-800 flex items-center gap-2"><Award className="text-indigo-600"/> Penerbitan Sertifikat</h3><p className="text-xs text-slate-500 mt-1">Sistem merender gambar sertifikat berdasarkan template & Gradebook.</p></div>
               <div className="relative overflow-hidden w-fit">
                 <button className="px-4 py-2.5 bg-white border border-indigo-200 text-indigo-700 font-bold rounded-xl text-xs hover:bg-indigo-50 shadow-sm flex items-center gap-2 cursor-pointer"><ImageIcon size={14}/> Ubah Background Template</button>
                 <input type="file" accept="image/jpeg, image/png" onChange={handleUploadCertBg} className="absolute inset-0 opacity-0 cursor-pointer" />
               </div>
             </div>
             
             <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar space-y-3">
                 {filteredSantri.map((s, idx) => {
                   const nama = s.user?.name || s.nama || "Tanpa Nama";
                   const nilaiAkhir = hitungNilaiAkhir(s.id);
                   const isLulus = nilaiAkhir >= safeKkm;
                   return (
                     <div key={s.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100 hover:border-indigo-200 transition">
                       <div className="flex items-center gap-3">
                         <div className="w-6 h-6 bg-slate-200 text-slate-500 rounded font-black text-[10px] flex items-center justify-center">{idx + 1}</div>
                         <div>
                           <p className="font-bold text-slate-800 text-sm leading-tight">{nama}</p>
                           <div className="flex items-center gap-2 mt-1">
                             <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Nilai Akhir: {nilaiAkhir}</p>
                             {isLulus ? <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Lulus</span> : <span className="text-[9px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Gagal</span>}
                           </div>
                         </div>
                       </div>
                       <button onClick={() => generateSertifikat(nama, nilaiAkhir)} disabled={!isLulus} className={`p-2.5 rounded-xl transition shadow-sm ${isLulus ? 'bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer shadow-indigo-200' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`} title={isLulus ? "Render & Unduh Sertifikat" : "Belum Memenuhi KKM"}><Download size={16}/></button>
                     </div>
                   );
                 })}
               </div>
               
               {/* ================= KANVAS SERTIFIKAT (HTML2CANVAS) ================= */}
               <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 bg-slate-50 flex items-center justify-center overflow-hidden relative">
                  <p className="absolute top-2 left-4 text-slate-400 font-bold text-[10px] uppercase tracking-widest z-10">Preview Template</p>
                  {/* Skala 0.35 agar muat di layar UI, saat didownload ukurannya asli 1123x794 px */}
                  <div style={{ transform: 'scale(0.35)', transformOrigin: 'top center', width: '1123px', height: '794px', backgroundImage: `url('${certBg || "/placeholder-cert.jpg"}')`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: '#fff', position: 'relative' }} className="border shadow-lg shrink-0" ref={certRef}>
                     
                     <div style={{ position: 'absolute', top: '220px', width: '100%', fontSize: '18px', fontWeight: 800, letterSpacing: '2px', color: '#1e3a8a', textAlign: 'center' }}>
                         NOMOR : 02/MA/03/2026/2
                     </div>

                     <div style={{ position: 'absolute', top: '280px', width: '100%', fontSize: '18px', color: '#475569', textAlign: 'center' }}>Diberikan kepada :</div>

                     {/* Font Sambung Nama */}
                     <div style={{ position: 'absolute', top: '310px', width: '100%', fontSize: '80px', fontFamily: "'Great Vibes', cursive", color: '#0f172a', lineHeight: 1, textAlign: 'center' }} id="cert-nama">
                         Nama Santri
                     </div>

                     <div style={{ position: 'absolute', top: '430px', width: '100%', fontSize: '16px', color: '#334155', padding: '0 100px', boxSizing: 'border-box', fontWeight: 500, textAlign: 'center' }}>
                         Atas semangatnya sebagai tholabul 'ilm dalam program <b>Mafatihul 'Arabiyyah</b><br/>
                         dengan buku <span>{safeClassName}</span>
                     </div>

                     {/* Teks Arab Spesifik */}
                     <div style={{ position: 'absolute', top: '490px', width: '100%', fontSize: '24px', fontWeight: 'bold', fontFamily: "'Amiri', serif", textAlign: 'center' }} dir="rtl">
                         أنواع الاسم وعلامات إعرابها
                     </div>

                     <div style={{ position: 'absolute', top: '540px', width: '100%', fontSize: '16px', color: '#334155', textAlign: 'center' }}>
                         yang diampu oleh <span>{safeTeacherName}</span><br/>
                         telah memperoleh nilai : <b id="cert-nilai" style={{ fontSize: '20px', color: '#0f172a'}}>100</b> <span id="cert-predikat" style={{ fontSize: '22px', fontWeight: 'bold', marginLeft: '10px' }} dir="rtl">ممتاز</span>
                     </div>

                     {/* TTD (Di kanan bawah) */}
                     <div style={{ position: 'absolute', bottom: '80px', width: '100%', fontSize: '16px', fontWeight: 800, color: '#1e293b', textAlign: 'center' }}>{safeTeacherName}</div>
                     <div style={{ position: 'absolute', bottom: '60px', width: '100%', fontSize: '14px', color: '#64748b', textAlign: 'center' }}>Mudir Mafatihul 'Arabiyyah</div>
                  </div>
               </div>
             </div>
          </div>
        )}

      </div>
    </Fragment>
  );
}