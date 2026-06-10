"use client";

import { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  Search, PlusCircle, Medal, Copy, Edit3, Trash2, Calendar, Timer, 
  Target, Settings, CheckCircle2, XCircle, Users, Monitor, Link as LinkIcon,
  CircleDot, CheckSquare, Type, AlignLeft, UploadCloud, Info, X, ChevronUp, ChevronDown,
  Image as ImageIcon, Loader2, Save, BarChart3, FileSpreadsheet, Eye, RefreshCw, ServerCrash
} from 'lucide-react';
import { 
  getCbtExamsDB, saveCbtExamDB, deleteCbtExamDB, toggleCbtStatusDB, 
  getCbtResultsDB, updateCbtScoreDB, deleteCbtResultDB, getClassesForCbtDB, syncCbtToGradeDB 
} from './actions';

export default function CbtManagerPage() {
  const [activeTab, setActiveTab] = useState<'daftar'|'buat'|'hasil'>('daftar');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState("terbaru");

  const [exams, setExams] = useState<any[]>([]);
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  
  const [currentExam, setCurrentExam] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [resultSearchQuery, setResultSearchQuery] = useState(""); // Filter Nilai

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftExam, setDraftExam] = useState<any>({
    judul: "", deskripsi: "", coverImage: "", token: "", durasi: 60, kkm: 75,
    acakSoal: true, antiCheat: true, butuhToken: true, deadline: "", namaKelas: []
  });
  const [draftQuestions, setDraftQuestions] = useState<any[]>([]);
  const [classSearchQuery, setClassSearchQuery] = useState("");

  const [modalAnalisis, setModalAnalisis] = useState(false);
  const [modalDetail, setModalDetail] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);

  const [modalSync, setModalSync] = useState(false);
  const [syncClass, setSyncClass] = useState("");
  const [syncColumn, setSyncColumn] = useState("tugas1");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [resExams, resClasses] = await Promise.all([getCbtExamsDB(), getClassesForCbtDB()]);
    if (resExams.success) setExams(resExams.data || []);
    if (resClasses.success) setAvailableClasses(resClasses.data || []);
    setIsLoading(false);
  };

  const generateToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = '';
    for (let i = 0; i < 6; i++) token += chars.charAt(Math.floor(Math.random() * chars.length));
    setDraftExam({ ...draftExam, token });
  };

  const isArabic = (text: string) => /[\u0600-\u06FF]/.test(text || "");

  const handleImageUpload = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  };

  const uploadQImage = async (qIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) return alert("Ukuran maksimal 1MB!");
    const base64 = await handleImageUpload(file);
    const newQs = [...draftQuestions];
    newQs[qIndex].gambar = base64;
    setDraftQuestions(newQs);
  };

  const uploadOptImage = async (qIndex: number, optIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) return alert("Ukuran maksimal 1MB!");
    const base64 = await handleImageUpload(file);
    const newQs = [...draftQuestions];
    if (!newQs[qIndex].gambar_opsi) newQs[qIndex].gambar_opsi = ["", "", "", ""];
    newQs[qIndex].gambar_opsi[optIndex] = base64;
    setDraftQuestions(newQs);
  };

  const addQuestion = (tipe: string) => {
    const base = { id: `q_${Date.now()}`, tipe, pertanyaan: "", gambar: "", opsi: [], gambar_opsi: [], kunci: "" };
    if (tipe === 'pilgan') { base.opsi = ["", "", "", ""] as any; base.kunci = "0"; }
    else if (tipe === 'benarsalah') { base.opsi = ["Benar", "Salah"] as any; base.kunci = "Benar"; }
    else if (tipe === 'kompleks') { base.opsi = ["", "", "", ""] as any; base.kunci = [] as any; }
    setDraftQuestions([...draftQuestions, base]);
  };

  const removeQuestion = (idx: number) => setDraftQuestions(draftQuestions.filter((_, i) => i !== idx));

  const moveQuestion = (idx: number, dir: -1 | 1) => {
    if (idx + dir < 0 || idx + dir >= draftQuestions.length) return;
    const newQs = [...draftQuestions];
    const temp = newQs[idx];
    newQs[idx] = newQs[idx + dir];
    newQs[idx + dir] = temp;
    setDraftQuestions(newQs);
  };

  const saveCBT = async (e: React.FormEvent) => {
    e.preventDefault();
    if (draftQuestions.length === 0) return alert("Tambahkan minimal 1 soal!");
    for (let i = 0; i < draftQuestions.length; i++) {
      if (!draftQuestions[i].pertanyaan.trim()) return alert(`Soal ke-${i + 1} kosong!`);
      if (draftQuestions[i].tipe === 'kompleks' && draftQuestions[i].kunci.length === 0) return alert(`Soal Kompleks ke-${i + 1} belum dikunci!`);
    }

    setIsLoading(true);
    const payload = {
      ...draftExam,
      durasi: Number(draftExam.durasi), kkm: Number(draftExam.kkm),
      namaKelas: draftExam.namaKelas.join(', '),
      dataSoal: draftQuestions,
      deadline: draftExam.deadline ? new Date(draftExam.deadline) : null,
    };

    const res = await saveCbtExamDB(payload, editingId || undefined);
    setIsLoading(false);
    if (res.success) {
      alert(`CBT berhasil ${editingId ? 'diperbarui' : 'diterbitkan'}!`);
      resetBuilder();
      loadData();
    } else {
      alert("Error: " + res.error);
    }
  };

  const resetBuilder = () => {
    setEditingId(null);
    setDraftExam({ judul: "", deskripsi: "", coverImage: "", token: "", durasi: 60, kkm: 75, acakSoal: true, antiCheat: true, butuhToken: true, deadline: "", namaKelas: [] });
    setDraftQuestions([]);
    generateToken();
    setActiveTab('daftar');
  };

  const editExam = (exam: any, duplicate = false) => {
    setEditingId(duplicate ? null : exam.id);
    setDraftExam({
      judul: exam.judul + (duplicate ? " (Copy)" : ""),
      deskripsi: exam.deskripsi || "",
      coverImage: exam.coverImage || "",
      token: duplicate ? Math.random().toString(36).substr(2, 6).toUpperCase() : exam.token,
      durasi: exam.durasi, kkm: exam.kkm,
      acakSoal: exam.acakSoal, antiCheat: exam.antiCheat, butuhToken: exam.butuhToken,
      deadline: (exam.deadline && !duplicate) ? new Date(exam.deadline).toISOString().slice(0, 16) : "",
      namaKelas: exam.namaKelas ? exam.namaKelas.split(',').map((k:any) => k.trim()) : []
    });
    setDraftQuestions(JSON.parse(JSON.stringify(exam.dataSoal || [])));
    setActiveTab('buat');
    if (duplicate) alert("CBT disalin! Silakan edit dan Simpan.");
  };

  const viewResults = async (exam: any) => {
    setCurrentExam(exam);
    setActiveTab('hasil');
    setResultSearchQuery("");
    setIsLoading(true);
    const res = await getCbtResultsDB(exam.id);
    if (res.success) {
      const sorted = (res.data || []).sort((a: any, b: any) => b.nilai - a.nilai);
      setResults(sorted);
    }
    setIsLoading(false);
  };

  const exportExcel = () => {
    if (results.length === 0) return;
    const data = results.map((r, i) => {
      let row: any = { 
        "Peringkat": i + 1, 
        "Selesai Pada": new Date(r.createdAt).toLocaleString('id-ID'), 
        "Peserta": r.namaPeserta, 
        "Nilai": r.nilai, 
        "Status": r.nilai >= currentExam.kkm ? "LULUS" : "GAGAL" 
      };
      
      currentExam.dataSoal.forEach((soal: any, idx: number) => {
        let ans = r.detailJawaban[idx];
        let isCorrect = 0; 
        if (ans !== undefined && ans !== null && ans !== "" && (!Array.isArray(ans) || ans.length > 0)) {
           if (soal.tipe === 'pilgan' || soal.tipe === 'benarsalah') {
             let ansStr = ans.toString();
             if (soal.tipe === 'benarsalah') { if(ansStr==="0") ansStr="Benar"; if(ansStr==="1") ansStr="Salah"; }
             if (ansStr === soal.kunci.toString()) isCorrect = 1;
           } else if (soal.tipe === 'kompleks') {
             const sK = Array.isArray(soal.kunci) ? soal.kunci.map((k:any)=>k.toString()).sort().join() : "";
             const sJ = Array.isArray(ans) ? ans.map((x:any)=>x.toString()).sort().join() : "";
             if (sK === sJ) isCorrect = 1;
           } else {
             isCorrect = 1; 
           }
        }
        row[`Soal ${idx + 1}`] = isCorrect;
      });
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Nilai");
    XLSX.writeFile(wb, `Nilai_${currentExam.judul.replace(/\s+/g, '_')}.xlsx`);
  };

  const handleSyncRaport = async () => {
    if (!syncClass) return alert("Pilih kelas target terlebih dahulu!");
    setIsLoading(true);
    const res = await syncCbtToGradeDB(currentExam.id, syncClass, syncColumn);
    setIsLoading(false);
    if (res.success) {
      alert(`Berhasil! Nilai ujian telah ditransfer ke raport ${res.count} siswa di kelas ${syncClass}.`);
      setModalSync(false);
    } else {
      alert(`Gagal sinkronisasi: ${res.error}`);
    }
  };

  const filteredExams = useMemo(() => {
    let s = exams.filter(e => e.judul.toLowerCase().includes(searchQuery.toLowerCase()) || (e.namaKelas && e.namaKelas.toLowerCase().includes(searchQuery.toLowerCase())));
    if (sortMode === 'az') s.sort((a,b) => a.judul.localeCompare(b.judul));
    else if (sortMode === 'za') s.sort((a,b) => b.judul.localeCompare(a.judul));
    return s;
  }, [exams, searchQuery, sortMode]);

  // PENCARIAN & STATISTIK HASIL
  const filteredResults = useMemo(() => {
    return results.filter(r => r.namaPeserta.toLowerCase().includes(resultSearchQuery.toLowerCase()));
  }, [results, resultSearchQuery]);

  const rataRataNilai = useMemo(() => {
    if (filteredResults.length === 0) return 0;
    const total = filteredResults.reduce((sum, curr) => sum + curr.nilai, 0);
    return (total / filteredResults.length).toFixed(1);
  }, [filteredResults]);

  return (
    <div className="flex flex-col h-full bg-slate-50 text-slate-800 animate-in fade-in duration-500">
      
      <div className="flex flex-wrap border-b border-slate-200 bg-white/50 text-sm rounded-t-[2rem] overflow-hidden shadow-sm">
        <button onClick={() => {setActiveTab('daftar'); setCurrentExam(null);}} className={`flex-1 sm:flex-none px-6 py-4 transition-all flex items-center justify-center gap-2 outline-none font-bold ${activeTab === 'daftar' ? 'border-b-4 border-blue-600 text-blue-700 bg-blue-50' : 'text-slate-500 hover:bg-slate-50'}`}><Monitor size={18} /> Daftar CBT</button>
        <button onClick={() => {if(activeTab!=='buat') resetBuilder(); setActiveTab('buat');}} className={`flex-1 sm:flex-none px-6 py-4 transition-all flex items-center justify-center gap-2 outline-none font-bold ${activeTab === 'buat' ? 'border-b-4 border-blue-600 text-blue-700 bg-blue-50' : 'text-slate-500 hover:bg-slate-50'}`}><PlusCircle size={18} /> {editingId ? "Edit CBT" : "Buat CBT Baru"}</button>
        {activeTab === 'hasil' && (
          <button className={`flex-1 sm:flex-none px-6 py-4 transition-all flex items-center justify-center gap-2 outline-none font-bold border-b-4 border-blue-600 text-blue-700 bg-blue-50`}><Medal size={18} /> Data Nilai CBT</button>
        )}
      </div>

      <div className="p-4 lg:p-6 w-full relative">
        {isLoading && <div className="fixed inset-0 z-[120] bg-white/60 backdrop-blur-sm flex items-center justify-center"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>}

        {activeTab === 'daftar' && (
          <div className="space-y-6">
            <div className="bg-white p-4 lg:p-6 rounded-[1.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
               <div className="relative flex-1">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                 <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Cari judul ujian atau kelas..." className="w-full bg-slate-50 border border-slate-200 py-3 pl-12 pr-4 rounded-xl outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-bold text-slate-700 transition" />
               </div>
               <select value={sortMode} onChange={e => setSortMode(e.target.value)} className="bg-slate-50 border border-slate-200 py-3 px-4 rounded-xl outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-bold text-slate-700 cursor-pointer min-w-[160px] transition">
                 <option value="terbaru">Paling Baru</option><option value="az">A - Z</option><option value="za">Z - A</option>
               </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExams.length === 0 ? (
                <div className="col-span-full text-center py-20 bg-white border border-slate-200 border-dashed rounded-[2rem] text-slate-400 font-bold"><Monitor size={48} className="mx-auto mb-4 opacity-50"/>Belum ada CBT yang tersedia.</div>
              ) : filteredExams.map(f => {
                const now = new Date().getTime();
                const deadlineTime = f.deadline ? new Date(f.deadline).getTime() : 0;
                let isActive = f.isAktif;
                if (deadlineTime && now > deadlineTime && isActive) isActive = false;

                const urlIsi = `${window.location.origin}/ujian?id=${f.id}`;
                return (
                  <div key={f.id} className={`bg-white p-6 rounded-[2rem] shadow-md border flex flex-col h-full hover:-translate-y-1 transition duration-300 relative overflow-hidden group ${isActive ? 'border-indigo-100' : 'border-slate-100 opacity-80'}`}>
                    {f.coverImage && <img src={f.coverImage} className="absolute top-0 left-0 w-full h-24 object-cover opacity-5 group-hover:opacity-10 transition pointer-events-none" alt="" />}
                    
                    <div className="flex justify-between items-start mb-2 relative z-10">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner shrink-0"><Monitor size={24}/></div>
                      <div className="flex flex-col items-end">
                        <label className="relative inline-flex items-center cursor-pointer" title="Buka/Tutup Manual">
                          <input type="checkbox" className="sr-only peer" checked={isActive} onChange={async (e) => {
                              await toggleCbtStatusDB(f.id, e.target.checked);
                              loadData();
                          }}/>
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500 shadow-inner"></div>
                        </label>
                        <span className={`text-[9px] font-black uppercase mt-1 ${isActive ? 'text-emerald-500' : 'text-slate-400'}`}>{isActive ? 'STATUS: LIVE' : 'DITUTUP'}</span>
                      </div>
                    </div>
                    
                    <h3 className="font-black text-slate-800 text-lg leading-tight mb-1 relative z-10">{f.judul}</h3>
                    <div className="mt-1 mb-2 relative z-10 flex flex-wrap gap-1">
                      {f.namaKelas ? f.namaKelas.split(',').map((k:string, i:number) => <span key={i} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border border-blue-100">{k.trim()}</span>) : null}
                    </div>
                    <p className="text-xs text-slate-500 font-medium mb-1 flex-1 line-clamp-2 relative z-10">{f.deskripsi}</p>
                    
                    {f.deadline && <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mt-1 mb-3 relative z-10"><Calendar size={12} className="inline mb-0.5"/> Bts: {new Date(f.deadline).toLocaleString('id-ID')}</p>}

                    <div className="grid grid-cols-2 gap-2 mb-4 relative z-10">
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Token</p><p className={`font-mono font-black ${f.butuhToken ? 'text-blue-700' : 'text-slate-400'} text-base tracking-widest`}>{f.butuhToken ? f.token : 'NO TOKEN'}</p></div>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Waktu</p><p className="font-bold text-slate-700 text-sm flex items-center justify-center gap-1"><Timer size={14}/> {f.durasi} Min</p></div>
                    </div>

                    <div className="flex items-center gap-2 mb-4 bg-blue-50/50 p-2 rounded-xl border border-blue-100 relative z-10">
                      <input type="text" readOnly value={urlIsi} className="w-full bg-transparent text-[10px] text-blue-800 font-mono outline-none px-2 font-bold" />
                      <button onClick={() => {navigator.clipboard.writeText(urlIsi); alert("Link disalin!");}} className="p-1.5 bg-white shadow-sm border border-blue-200 rounded-lg text-blue-600 hover:bg-blue-100 transition cursor-pointer"><Copy size={14}/></button>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-auto border-t border-slate-100 pt-4 relative z-10">
                      <button onClick={() => viewResults(f)} className="flex-1 py-2 bg-blue-50 text-blue-700 border border-blue-200 font-bold rounded-xl hover:bg-blue-600 hover:text-white transition text-xs shadow-sm flex justify-center items-center gap-1.5 cursor-pointer"><Users size={14}/> {f._count.results} Nilai</button>
                      <button onClick={() => editExam(f, true)} className="p-2 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-800 hover:text-white transition text-xs shadow-sm cursor-pointer" title="Copy"><Copy size={14}/></button>
                      <button onClick={() => editExam(f, false)} className="p-2 bg-amber-50 text-amber-600 font-bold rounded-xl hover:bg-amber-600 hover:text-white transition text-xs shadow-sm cursor-pointer" title="Edit"><Edit3 size={14}/></button>
                      <button onClick={async () => {if(confirm("Hapus CBT dan nilainya?")) { await deleteCbtExamDB(f.id); loadData(); }}} className="p-2 bg-rose-50 text-rose-600 font-bold rounded-xl hover:bg-rose-600 hover:text-white transition text-xs shadow-sm cursor-pointer" title="Hapus"><Trash2 size={14}/></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================= TAB: CBT BUILDER ======================= */}
        {activeTab === 'buat' && (
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            <div className="flex-1 w-full bg-white border border-slate-200 rounded-[2rem] p-6 lg:p-10 shadow-xl relative z-10">
              <form onSubmit={saveCBT}>
                <div className="mb-8 border-b-4 border-blue-500 pb-6 rounded-t-lg">
                  <input type="url" value={draftExam.coverImage} onChange={e => setDraftExam({...draftExam, coverImage: e.target.value})} placeholder="Link Gambar Header (Opsional)" className="w-full bg-blue-50 border border-blue-200 rounded-xl p-3 font-medium text-blue-800 outline-none mb-4 text-xs" />
                  <input type="text" value={draftExam.judul} onChange={e => setDraftExam({...draftExam, judul: e.target.value})} placeholder="Judul Ujian" required className="w-full text-3xl font-black text-slate-900 bg-transparent outline-none mb-3 placeholder-slate-300" />
                  <textarea value={draftExam.deskripsi} onChange={e => setDraftExam({...draftExam, deskripsi: e.target.value})} placeholder="Tuliskan instruksi ujian di sini..." className="w-full text-sm font-medium text-slate-500 bg-transparent outline-none resize-none h-14" required></textarea>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-center">
                      <label className="text-[10px] font-black uppercase text-slate-500 block mb-1 text-center">Waktu (Menit)</label>
                      <div className="flex items-center justify-center gap-2"><Timer size={18} className="text-amber-500"/><input type="number" required min="1" value={draftExam.durasi} onChange={e => setDraftExam({...draftExam, durasi: e.target.value})} className="bg-transparent font-black text-xl text-slate-800 outline-none w-16 text-center"/></div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-center">
                      <label className="text-[10px] font-black uppercase text-slate-500 block mb-1 text-center">Batas Lulus</label>
                      <div className="flex items-center justify-center gap-2"><Target size={18} className="text-emerald-500"/><input type="number" required min="0" max="100" value={draftExam.kkm} onChange={e => setDraftExam({...draftExam, kkm: e.target.value})} className="bg-transparent font-black text-xl text-slate-800 outline-none w-16 text-center"/></div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col items-center justify-center gap-2">
                      <label className="relative inline-flex items-center cursor-pointer group w-full px-2">
                        <input type="checkbox" checked={draftExam.acakSoal} onChange={e => setDraftExam({...draftExam, acakSoal: e.target.checked})} className="sr-only peer" />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 shadow-inner"></div>
                        <span className="ml-3 text-[10px] font-black uppercase mt-1 text-slate-500 group-hover:text-blue-600 transition tracking-widest leading-none text-center">Acak Soal</span>
                      </label>
                      <label className="relative inline-flex items-center cursor-pointer group w-full px-2">
                        <input type="checkbox" checked={draftExam.antiCheat} onChange={e => setDraftExam({...draftExam, antiCheat: e.target.checked})} className="sr-only peer" />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500 shadow-inner"></div>
                        <span className="ml-3 text-[10px] font-black uppercase mt-1 text-slate-500 group-hover:text-rose-600 transition tracking-widest leading-none text-center">Anti Cheat</span>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 flex flex-col justify-center">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2"><LockIcon size={16} className="text-blue-600"/><label className="text-[10px] font-black uppercase text-blue-800">Gunakan Token</label></div>
                        <input type="checkbox" checked={draftExam.butuhToken} onChange={e => setDraftExam({...draftExam, butuhToken: e.target.checked})} className="w-4 h-4 text-blue-600 rounded cursor-pointer" />
                      </div>
                      <div className={`flex items-center gap-3 transition-opacity ${draftExam.butuhToken ? 'opacity-100' : 'opacity-50'}`}>
                        <input type="text" value={draftExam.token} onChange={e => setDraftExam({...draftExam, token: e.target.value.toUpperCase()})} disabled={!draftExam.butuhToken} required className="bg-white px-2 py-1 rounded border border-blue-200 font-mono font-black text-sm text-blue-700 outline-none w-full uppercase tracking-widest text-center" placeholder="XXXXXX" />
                        <button type="button" onClick={generateToken} disabled={!draftExam.butuhToken} className="p-1.5 bg-blue-200 text-blue-800 rounded-lg hover:bg-blue-300 cursor-pointer disabled:cursor-not-allowed"><RefreshCw size={16}/></button>
                      </div>
                    </div>
                    <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-2"><Calendar size={16} className="text-rose-600"/><label className="text-[10px] font-black uppercase text-rose-800">Tutup Otomatis (Opsional)</label></div>
                      <div className="flex items-center gap-3"><input type="datetime-local" value={draftExam.deadline} onChange={e => setDraftExam({...draftExam, deadline: e.target.value})} className="bg-transparent font-bold text-xs text-rose-700 outline-none cursor-pointer w-full text-left" title="Kosongkan jika tanpa deadline"/></div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 min-h-[200px]">
                  {draftQuestions.length === 0 ? (
                    <div className="p-10 border-2 border-dashed border-slate-300 rounded-3xl text-center text-slate-400 font-bold bg-slate-50/50">Belum ada soal. Tambahkan dari menu samping.</div>
                  ) : draftQuestions.map((soal, idx) => {
                    const isArab = isArabic(soal.pertanyaan) ? 'font-arabic' : 'font-latin';
                    const typeLabel = soal.tipe.replace('_', ' ').toUpperCase();

                    return (
                      <div key={soal.id} className="bg-white p-5 lg:p-6 rounded-[1.5rem] border border-slate-200 shadow-sm relative group mb-4 transition-all hover:shadow-md border-l-4 border-l-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                        <div className="absolute -top-3 left-6 bg-blue-100 text-blue-700 px-3 py-0.5 rounded-full text-[9px] font-black tracking-widest border border-blue-200 shadow-sm">{typeLabel}</div>
                        
                        {soal.gambar ? (
                          <div className="relative inline-block mb-3 border border-slate-200 rounded-lg p-1 bg-white">
                            <img src={soal.gambar} className="h-24 rounded object-contain" alt="Gambar Soal"/>
                            <button type="button" onClick={() => {const n=[...draftQuestions]; n[idx].gambar=""; setDraftQuestions(n);}} className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-rose-600 shadow-md cursor-pointer"><X size={12}/></button>
                          </div>
                        ) : (
                          <div className="relative overflow-hidden mb-3 w-fit">
                            <button type="button" className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-200 text-xs font-bold hover:bg-blue-100 flex items-center gap-1 cursor-pointer"><ImageIcon size={14}/> <span>Upload Gambar Soal</span></button>
                            <input type="file" accept="image/*" onChange={(e) => uploadQImage(idx, e)} className="absolute inset-0 opacity-0 cursor-pointer" />
                          </div>
                        )}

                        <textarea placeholder="Ketik soal/pertanyaan di sini..." value={soal.pertanyaan} onChange={e => {const n=[...draftQuestions]; n[idx].pertanyaan=e.target.value; setDraftQuestions(n);}} className={`w-full bg-slate-50 hover:bg-white border border-slate-300 rounded-xl p-3 mb-3 font-medium outline-none focus:ring-2 focus:ring-blue-500 resize-none h-20 transition ${isArab}`}></textarea>

                        {soal.tipe === 'pilgan' && (
                          <>
                            <div className="space-y-3 mb-3">
                              {['A','B','C','D'].map((hrf, i) => (
                                <div key={i} className="flex items-center w-full">
                                  <span className="w-8 h-8 shrink-0 bg-slate-100 rounded-lg flex items-center justify-center font-black text-slate-500 text-xs mr-2">{hrf}</span>
                                  {soal.gambar_opsi?.[i] ? (
                                    <div className="relative mr-2">
                                      <img src={soal.gambar_opsi[i]} className="w-10 h-10 object-cover rounded border border-slate-200" alt=""/>
                                      <button type="button" onClick={() => {const n=[...draftQuestions]; n[idx].gambar_opsi[i]=""; setDraftQuestions(n);}} className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px] hover:bg-rose-600 shadow-sm cursor-pointer"><X size={10}/></button>
                                    </div>
                                  ) : (
                                    <div className="relative overflow-hidden w-10 h-10 bg-slate-100 rounded flex items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition border border-slate-200 border-dashed mr-2 cursor-pointer"><ImageIcon size={18}/><input type="file" accept="image/*" onChange={(e) => uploadOptImage(idx, i, e)} className="absolute inset-0 opacity-0 cursor-pointer"/></div>
                                  )}
                                  <input type="text" placeholder={`Opsi ${hrf}`} value={soal.opsi[i]} onChange={e => {const n=[...draftQuestions]; n[idx].opsi[i]=e.target.value; setDraftQuestions(n);}} className={`w-full bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 ${isArabic(soal.opsi[i]) ? 'font-arabic text-left' : 'font-latin text-left'}`}/>
                                </div>
                              ))}
                            </div>
                            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex items-center gap-3">
                              <label className="font-bold text-emerald-800 text-xs">Kunci Jawaban:</label>
                              <select value={soal.kunci} onChange={e => {const n=[...draftQuestions]; n[idx].kunci=e.target.value; setDraftQuestions(n);}} className="bg-white border border-emerald-200 rounded-lg p-1.5 text-sm font-bold text-emerald-700 outline-none cursor-pointer">
                                {['A','B','C','D'].map((h, i) => <option key={i} value={i}>Pilihan {h}</option>)}
                              </select>
                            </div>
                          </>
                        )}

                        {soal.tipe === 'benarsalah' && (
                          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100 flex items-center gap-3">
                            <label className="font-bold text-emerald-800 text-xs">Kunci Benar:</label>
                            <select value={soal.kunci} onChange={e => {const n=[...draftQuestions]; n[idx].kunci=e.target.value; setDraftQuestions(n);}} className="bg-white border border-emerald-200 rounded-lg p-1.5 text-sm font-bold text-emerald-700 outline-none cursor-pointer">
                              <option value="Benar">BENAR</option><option value="Salah">SALAH</option>
                            </select>
                          </div>
                        )}

                        {soal.tipe === 'kompleks' && (
                          <>
                            <p className="text-[10px] text-slate-500 font-bold mb-2 uppercase">*Centang jawaban yang benar (bisa &gt;1).</p>
                            <div className="space-y-3 mb-3">
                              {[0,1,2,3].map(i => (
                                <div key={i} className="flex items-center w-full">
                                  <input type="checkbox" checked={soal.kunci.includes(i.toString())} onChange={e => {
                                    const n=[...draftQuestions]; 
                                    if(e.target.checked) { if(!n[idx].kunci.includes(i.toString())) n[idx].kunci.push(i.toString()); } 
                                    else { n[idx].kunci = n[idx].kunci.filter((k:string) => k !== i.toString()); }
                                    setDraftQuestions(n);
                                  }} className="w-6 h-6 text-blue-600 rounded cursor-pointer mr-2"/>
                                  {soal.gambar_opsi?.[i] ? (
                                    <div className="relative mr-2">
                                      <img src={soal.gambar_opsi[i]} className="w-10 h-10 object-cover rounded border border-slate-200" alt=""/>
                                      <button type="button" onClick={() => {const n=[...draftQuestions]; n[idx].gambar_opsi[i]=""; setDraftQuestions(n);}} className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px] hover:bg-rose-600 shadow-sm cursor-pointer"><X size={10}/></button>
                                    </div>
                                  ) : (
                                    <div className="relative overflow-hidden w-10 h-10 bg-slate-100 rounded flex items-center justify-center text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition border border-slate-200 border-dashed mr-2 cursor-pointer"><ImageIcon size={18}/><input type="file" accept="image/*" onChange={(e) => uploadOptImage(idx, i, e)} className="absolute inset-0 opacity-0 cursor-pointer"/></div>
                                  )}
                                  <input type="text" placeholder={`Opsi ${i+1}`} value={soal.opsi[i]} onChange={e => {const n=[...draftQuestions]; n[idx].opsi[i]=e.target.value; setDraftQuestions(n);}} className={`w-full bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-blue-500 ${isArabic(soal.opsi[i]) ? 'font-arabic text-left' : 'font-latin text-left'}`}/>
                                </div>
                              ))}
                            </div>
                          </>
                        )}

                        <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-sm">
                          <div className="flex items-center gap-3">
                            <button type="button" onClick={() => moveQuestion(idx, -1)} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"><ChevronUp size={18}/></button>
                            <button type="button" onClick={() => moveQuestion(idx, 1)} className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition cursor-pointer"><ChevronDown size={18}/></button>
                          </div>
                          <span className="font-black text-slate-300 text-xs uppercase tracking-widest">Soal {idx + 1}</span>
                          <button type="button" onClick={() => removeQuestion(idx)} className="text-rose-500 hover:text-rose-700 bg-rose-50 p-2 rounded-lg transition cursor-pointer"><Trash2 size={18}/></button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-10 pt-6 border-t border-slate-100"><button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex justify-center items-center gap-2 text-base active:scale-95 cursor-pointer"><Save size={20} /> {editingId ? "Simpan Perubahan CBT" : "Terbitkan Ujian CBT"}</button></div>
              </form>
            </div>

            <div className="w-full lg:w-72 bg-white p-5 rounded-2xl shadow-xl border border-slate-200 sticky top-28 shrink-0">
              <h3 className="font-black text-slate-800 mb-4 text-sm uppercase tracking-widest flex items-center gap-2"><PlusCircle className="text-blue-600" size={18}/> Tambah Bank Soal</h3>
              <div className="flex flex-col gap-2">
                <button type="button" onClick={() => addQuestion('pilgan')} className="w-full text-left p-3 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition font-bold text-xs text-slate-600 flex items-center gap-3 cursor-pointer"><CircleDot size={18}/> Pilihan Ganda</button>
                <button type="button" onClick={() => addQuestion('benarsalah')} className="w-full text-left p-3 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition font-bold text-xs text-slate-600 flex items-center gap-3 cursor-pointer"><CheckCircle2 size={18}/> Benar / Salah</button>
                <button type="button" onClick={() => addQuestion('kompleks')} className="w-full text-left p-3 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition font-bold text-xs text-slate-600 flex items-center gap-3 cursor-pointer"><CheckSquare size={18}/> Pilgan Kompleks</button>
                <div className="border-t my-2 border-slate-100"></div>
                <button type="button" onClick={() => addQuestion('essay_singkat')} className="w-full text-left p-3 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition font-bold text-xs text-slate-600 flex items-center gap-3 cursor-pointer"><Type size={18}/> Essay Singkat</button>
                <button type="button" onClick={() => addQuestion('essay_panjang')} className="w-full text-left p-3 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition font-bold text-xs text-slate-600 flex items-center gap-3 cursor-pointer"><AlignLeft size={18}/> Essay Panjang</button>
                <button type="button" onClick={() => addQuestion('upload_file')} className="w-full text-left p-3 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 hover:text-emerald-800 transition font-bold text-xs text-emerald-700 flex items-center gap-3 cursor-pointer"><UploadCloud size={18}/> Upload Berkas</button>
                
                <div className="mt-6 border-t border-slate-100 pt-6">
                  <h3 className="font-black text-slate-800 mb-3 text-sm uppercase tracking-widest flex items-center gap-2"><Target className="text-emerald-500" size={18}/> Target Kelas</h3>
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input type="text" placeholder="Cari kelas..." value={classSearchQuery} onChange={e => setClassSearchQuery(e.target.value)} className="w-full bg-slate-50 border border-slate-200 py-2 pl-9 pr-3 rounded-lg outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-xs font-bold text-slate-700 transition"/>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 max-h-48 overflow-y-auto custom-scrollbar shadow-inner">
                    {availableClasses.filter(k => k.toLowerCase().includes(classSearchQuery.toLowerCase())).length === 0 ? (
                      <p className="text-xs text-slate-400 italic p-2 text-center">Kelas tidak ditemukan.</p>
                    ) : (
                      availableClasses.filter(k => k.toLowerCase().includes(classSearchQuery.toLowerCase())).map(k => (
                        <label key={k} className="flex items-center p-2 hover:bg-white rounded-lg cursor-pointer transition border border-transparent hover:border-slate-200 hover:shadow-sm mb-1">
                          <input type="checkbox" checked={draftExam.namaKelas.includes(k)} onChange={e => {
                              const newClasses = e.target.checked ? [...draftExam.namaKelas, k] : draftExam.namaKelas.filter((x:string) => x !== k);
                              setDraftExam({...draftExam, namaKelas: newClasses});
                            }} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 mr-2.5 cursor-pointer shrink-0"/>
                          <span className="text-xs font-bold text-slate-700 leading-tight">{k}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB: HASIL NILAI ======================= */}
        {activeTab === 'hasil' && currentExam && (
          <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-blue-50/50 flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-slate-800 text-lg flex items-center gap-2"><Medal className="text-blue-600" size={20}/> Peringkat Nilai: {currentExam.judul}</h3>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {/* FILTER SEARCH DI TABEL HASIL */}
                <div className="relative mr-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input type="text" placeholder="Cari nama peserta..." value={resultSearchQuery} onChange={e => setResultSearchQuery(e.target.value)} className="w-56 bg-white border border-slate-200 py-2 pl-9 pr-3 rounded-xl outline-none focus:border-blue-500 font-medium text-slate-700 text-sm shadow-sm transition" />
                </div>
                <button onClick={() => setModalAnalisis(true)} className="px-4 py-2.5 bg-amber-100 border border-amber-200 text-amber-700 rounded-xl text-xs font-bold hover:bg-amber-500 hover:text-white shadow-sm flex items-center gap-1.5 transition cursor-pointer"><BarChart3 size={16}/> Analisis Butir Soal</button>
                <button onClick={exportExcel} className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 shadow-sm flex items-center gap-1.5 transition cursor-pointer"><FileSpreadsheet size={16}/> Export Excel</button>
                <button onClick={() => setModalSync(true)} className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-md flex items-center gap-1.5 transition cursor-pointer"><RefreshCw size={16}/> Sinkron Rapor</button>
              </div>
            </div>
            
            <div className="overflow-x-auto custom-scrollbar flex-1 bg-white min-h-[400px]">
              <table className="w-full text-left min-w-[700px]">
                <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 tracking-widest border-b border-slate-200">
                  <tr>
                    <th className="py-4 px-6 text-center w-16">Rank</th>
                    <th className="py-4 px-6 border-r border-slate-200">Nama Peserta & Email</th>
                    <th className="py-4 px-6 border-r border-slate-200">Waktu Selesai</th>
                    <th className="py-4 px-6 text-center border-r border-slate-200">Nilai & Status</th>
                    <th className="py-4 px-6 text-center w-40">Aksi Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredResults.length === 0 ? <tr><td colSpan={5} className="p-8 text-center text-slate-400 font-medium">Data tidak ditemukan.</td></tr> : filteredResults.map((r, i) => (
                    <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50 transition text-sm">
                      <td className="py-4 px-6 text-center">
                         {/* RANKING ESTETIK TANPA ICON */}
                         <span className={`w-8 h-8 flex items-center justify-center rounded-lg mx-auto font-black text-sm shadow-sm ${
                           i === 0 ? 'bg-amber-100 text-amber-600 border border-amber-200' :
                           i === 1 ? 'bg-slate-100 text-slate-500 border border-slate-200' :
                           i === 2 ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                           'text-slate-400 bg-white border border-slate-100'
                         }`}>
                           {i + 1}
                         </span>
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-800">{r.namaPeserta} <br/><span className="text-xs font-medium text-slate-500">{r.emailPeserta}</span></td>
                      <td className="py-4 px-6 text-xs font-bold text-slate-500">{new Date(r.createdAt).toLocaleString('id-ID')}</td>
                      <td className="py-4 px-6 text-center">
                        <span className={`px-3 py-1.5 rounded-lg border font-black text-sm block w-max mx-auto mb-1 shadow-sm ${r.nilai >= currentExam.kkm ? 'text-emerald-700 bg-emerald-100 border-emerald-200' : 'text-rose-700 bg-rose-100 border-rose-200'}`}>{r.nilai}</span>
                        {r.nilai >= currentExam.kkm ? <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest"><CheckCircle2 className="inline w-3 h-3 mb-0.5"/> LULUS</span> : <span className="text-[10px] font-black uppercase text-rose-500 tracking-widest"><XCircle className="inline w-3 h-3 mb-0.5"/> GAGAL</span>}
                      </td>
                      <td className="py-4 px-6 text-center whitespace-nowrap">
                        <button onClick={() => {setDetailData(r); setModalDetail(true);}} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition mr-1 cursor-pointer" title="Lihat Jawaban"><Eye size={18}/></button>
                        <button onClick={async () => {
                          const n = prompt(`Ubah Nilai Akhir untuk: ${r.namaPeserta}\nMasukkan angka baru (0-100):`, r.nilai.toString());
                          if (n && !isNaN(parseInt(n))) { await updateCbtScoreDB(r.id, parseInt(n)); viewResults(currentExam); }
                        }} className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition mr-1 cursor-pointer" title="Edit Nilai"><Edit3 size={18}/></button>
                        <button onClick={async () => {
                          if(confirm("Hapus data nilai peserta ini?")) { await deleteCbtResultDB(r.id); viewResults(currentExam); }
                        }} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition cursor-pointer" title="Hapus"><Trash2 size={18}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {/* FOOTER TABEL STATISTIK */}
                {filteredResults.length > 0 && (
                  <tfoot className="bg-slate-50 border-t border-slate-200">
                    <tr>
                      <td colSpan={3} className="py-4 px-6 text-right font-black uppercase tracking-widest text-[10px] text-slate-500">
                        Total Peserta & Rata-Rata Nilai
                      </td>
                      <td className="py-4 px-6 text-center">
                         <span className="text-lg font-black text-blue-700 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200 shadow-sm">{rataRataNilai}</span>
                      </td>
                      <td className="py-4 px-6 text-center font-black text-slate-600 text-sm">
                         <Users size={16} className="inline mb-0.5 mr-1 text-slate-400" /> {filteredResults.length} Siswa
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MODAL SINKRON RAPOR */}
      {modalSync && currentExam && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-[2rem] p-0 shadow-2xl relative flex flex-col border border-slate-100">
            <div className="bg-emerald-50 px-6 py-5 border-b border-emerald-200 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-black text-emerald-800 flex items-center gap-2"><RefreshCw className="text-emerald-600" size={20}/> Sinkronisasi ke Rapor</h2>
              <button onClick={() => setModalSync(false)} className="text-emerald-400 hover:text-emerald-700 transition cursor-pointer"><X size={24}/></button>
            </div>
            <div className="p-6 bg-white space-y-4">
               <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm font-medium text-slate-600">
                  Nilai dari Ujian <span className="font-bold text-slate-800">"{currentExam.judul}"</span> akan dimasukkan secara massal ke kolom nilai raport kelas yang Anda pilih di bawah ini.
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Target Kelas</label>
                  <select value={syncClass} onChange={e => setSyncClass(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer">
                     <option value="">-- Pilih Kelas --</option>
                     {currentExam.namaKelas?.split(',').map((k:string, i:number) => <option key={i} value={k.trim()}>{k.trim()}</option>)}
                  </select>
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Target Kolom Penilaian</label>
                  <select value={syncColumn} onChange={e => setSyncColumn(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-slate-700 outline-none focus:border-blue-500 cursor-pointer">
                     <option value="tugas1">Nilai Tugas 1</option>
                     <option value="tugas2">Nilai Tugas 2</option>
                     <option value="tugas3">Nilai Tugas 3</option>
                     <option value="tugas4">Nilai Tugas 4</option>
                     <option value="tugas5">Nilai Tugas 5</option>
                     <option value="uts">Nilai Ujian Tengah Semester (UTS)</option>
                     <option value="uas">Nilai Ujian Akhir Semester (UAS)</option>
                  </select>
               </div>
               <button onClick={handleSyncRaport} className="w-full bg-emerald-600 text-white font-bold py-3.5 rounded-xl hover:bg-emerald-700 shadow-md flex items-center justify-center gap-2 mt-2">
                 <ServerCrash size={18}/> Jalankan Sinkronisasi
               </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ANALISIS SOAL */}
      {modalAnalisis && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2rem] p-0 shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden border border-slate-100">
            <div className="bg-slate-50 px-6 py-5 border-b border-slate-200 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2"><BarChart3 className="text-amber-500" size={20}/> Analisis Butir Soal (Akurasi)</h2>
              <button onClick={() => setModalAnalisis(false)} className="text-slate-400 hover:text-rose-500 transition cursor-pointer"><X size={24}/></button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-white space-y-4">
              {currentExam.dataSoal.map((soal: any, i: number) => {
                let benar = 0, salah = 0, kosong = 0;
                results.forEach(r => {
                  const j = r.detailJawaban[i];
                  if (j === undefined || j === null || j === "" || (Array.isArray(j) && j.length === 0)) { kosong++; }
                  else {
                    if (soal.tipe === 'pilgan' || soal.tipe === 'benarsalah') {
                      let ansStr = j.toString();
                      if (soal.tipe === 'benarsalah') { if(ansStr==="0") ansStr="Benar"; if(ansStr==="1") ansStr="Salah"; }
                      if (ansStr === soal.kunci.toString()) benar++; else salah++;
                    } else if (soal.tipe === 'kompleks') {
                      const strKunci = Array.isArray(soal.kunci) ? soal.kunci.map((k:any) => k.toString()) : [];
                      const strJawab = Array.isArray(j) ? j.map((x:any) => x.toString()) : [j.toString()];
                      if (strKunci.length > 0 && strKunci.length === strJawab.length && strKunci.every((k:string) => strJawab.includes(k))) benar++; else salah++;
                    } else { benar++; }
                  }
                });

                const total = results.length;
                const persen = Math.round((benar / (total || 1)) * 100);
                const barColor = persen >= 70 ? 'bg-emerald-500' : persen >= 40 ? 'bg-amber-500' : 'bg-rose-500';
                
                return (
                  <div key={i} className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                    <span className="bg-blue-100 text-blue-700 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full inline-block mb-2">{soal.tipe.replace('_', ' ')}</span>
                    <div className={isArabic(soal.pertanyaan) ? 'font-arabic' : 'font-latin font-bold text-slate-800'}>Soal {i+1}. {soal.pertanyaan}</div>
                    <div className="w-full bg-slate-200 rounded-full h-2.5 mb-2 mt-4 shadow-inner"><div className={`${barColor} h-2.5 rounded-full transition-all`} style={{width: `${persen}%`}}></div></div>
                    <div className="flex justify-between text-[11px] font-black uppercase text-slate-500 mt-2">
                      <span className="text-emerald-600">Benar/Diisi: {benar}</span>
                      <span className="text-rose-600">Salah/Koreksi: {salah}</span>
                      <span>Kosong: {kosong}</span>
                      <span>Akurasi: {persen}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODAL MATA: PREVIEW JAWABAN PESERTA */}
      {modalDetail && detailData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
           <div className="bg-white w-full max-w-3xl rounded-[2rem] p-0 shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden border border-slate-100">
              <div className="bg-blue-50 px-6 py-5 border-b border-blue-200 flex justify-between items-center shrink-0">
                <h2 className="text-lg font-black text-blue-900 flex items-center gap-2"><Eye className="text-blue-600" size={20}/> Lembar Jawaban: {detailData.namaPeserta}</h2>
                <button onClick={() => setModalDetail(false)} className="text-slate-400 hover:text-rose-500 transition cursor-pointer"><X size={24}/></button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50 space-y-4">
                 
                 {currentExam.dataSoal.map((soal: any, i: number) => {
                    const ans = detailData.detailJawaban[i];
                    
                    let isCorrect = false;
                    let textJawaban = "Tidak dijawab";
                    let badgeColor = "bg-slate-100 text-slate-500 border-slate-200";

                    if (ans !== undefined && ans !== null && ans !== "") {
                       if (soal.tipe === 'pilgan') {
                         textJawaban = soal.opsi[parseInt(ans.toString())] || ans.toString();
                         if (ans.toString() === soal.kunci.toString()) isCorrect = true;
                       } else if (soal.tipe === 'benarsalah') {
                         let ansStr = ans.toString();
                         if (ansStr === "0") ansStr = "Benar";
                         if (ansStr === "1") ansStr = "Salah";
                         textJawaban = ansStr;
                         if (ansStr === soal.kunci.toString()) isCorrect = true;
                       } else if (soal.tipe === 'kompleks') {
                         const ansArr = Array.isArray(ans) ? ans : [ans];
                         textJawaban = ansArr.map((a:any) => soal.opsi[parseInt(a)]).join(', ');
                         
                         const sK = Array.isArray(soal.kunci) ? soal.kunci.map((k:any)=>k.toString()).sort().join() : "";
                         const sJ = ansArr.map((x:any)=>x.toString()).sort().join();
                         if (sK === sJ) isCorrect = true;
                       } else {
                         textJawaban = ans; // Essay
                         isCorrect = true; // Essay default centang hijau agar dikoreksi manual guru
                       }
                       
                       badgeColor = isCorrect ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-rose-100 text-rose-700 border-rose-200";
                    }

                    return (
                       <div key={i} className={`bg-white p-5 rounded-2xl border ${isCorrect ? 'border-emerald-200' : 'border-rose-200'} shadow-sm`}>
                          <div className="flex items-start justify-between gap-4">
                             <div className="flex-1">
                                <span className="bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md inline-block mb-2">{soal.tipe.replace('_', ' ')}</span>
                                <p className={`font-medium mb-3 ${isArabic(soal.pertanyaan) ? 'font-arabic text-xl' : 'font-latin text-sm text-slate-800'}`}>
                                   {i+1}. {soal.pertanyaan}
                                </p>
                             </div>
                             <div className={`px-3 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest shrink-0 ${badgeColor}`}>
                                {isCorrect ? 'BENAR' : 'SALAH / KOSONG'}
                             </div>
                          </div>
                          
                          <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Jawaban Peserta:</p>
                             <p className="text-sm font-bold text-slate-800">{textJawaban}</p>
                          </div>
                       </div>
                    )
                 })}

              </div>
           </div>
        </div>
      )}
      
    </div>
  );
}

const LockIcon = ({size, className}:any) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>;