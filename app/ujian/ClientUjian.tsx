"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { 
  CheckCircle2, ChevronLeft, ChevronRight, Clock, 
  Flag, Monitor, AlertCircle, XCircle, FileText, ArrowLeft,
  Key, Target, BookOpen, Layers, ShieldCheck, Loader2, AlertTriangle
} from "lucide-react";
import { submitCbtResultDB } from "./actions";

export default function ClientUjian({ ujian, pengaturan }: { ujian: any, pengaturan?: any }) {
  const namaSekolah = pengaturan?.schoolName || "CBT Platform";
  const logoSekolah = pengaturan?.schoolLogo || "/logo.png"; 

  const soalAsli = typeof ujian.dataSoal === "string" ? JSON.parse(ujian.dataSoal) : ujian.dataSoal || [];
  
  const [status, setStatus] = useState<'login' | 'ujian' | 'hasil' | 'review'>('login');
  const [namaSiswa, setNamaSiswa] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  
  const [urutanSoal, setUrutanSoal] = useState<number[]>([]);
  const [soalAktif, setSoalAktif] = useState(0); 
  const [jawabanSiswa, setJawabanSiswa] = useState<Record<number, any>>({}); 
  const [raguRagu, setRaguRagu] = useState<Record<number, boolean>>({});
  const [sisaWaktu, setSisaWaktu] = useState(ujian.durasi * 60);
  
  const [pelanggaran, setPelanggaran] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [statistik, setStatistik] = useState({ benar: 0, salah: 0, kosong: 0, nilai: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // STATE MODAL KUSTOM (Mencegah Fullscreen Keluar)
  const [dialog, setDialog] = useState<{type: 'alert'|'confirm', msg: string, onOk?: ()=>void} | null>(null);
  const [cheatWarningActive, setCheatWarningActive] = useState(false);

  const terjawabCount = Object.keys(jawabanSiswa).filter(k => {
    const ans = jawabanSiswa[k as any];
    return Array.isArray(ans) ? ans.length > 0 : (ans !== undefined && ans !== null && ans !== "");
  }).length;

  useEffect(() => {
    let urutan = Array.from({ length: soalAsli.length }, (_, i) => i);
    if (ujian.acakSoal) {
      for (let i = urutan.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [urutan[i], urutan[j]] = [urutan[j], urutan[i]];
      }
    }
    setUrutanSoal(urutan);
  }, [ujian.acakSoal, soalAsli.length]);

  // ENGINE TIMER & ANTI CHEAT (BACKGROUND)
  useEffect(() => {
    if (status !== 'ujian') return;
    const timer = setInterval(() => setSisaWaktu((prev) => prev - 1), 1000);
    if (sisaWaktu <= 0) selesaikanUjian();

    const handleVisibility = () => {
      // Jika user pindah tab/minimize, trigger peringatan
      if (document.hidden && ujian.antiCheat) {
        setPelanggaran(p => p + 1);
        setCheatWarningActive(true);
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [status, sisaWaktu, ujian.antiCheat]);

  const formatWaktu = (totalDetik: number) => {
    const menit = Math.floor(totalDetik / 60);
    const detik = totalDetik % 60;
    return `${menit.toString().padStart(2, '0')}:${detik.toString().padStart(2, '0')}`;
  };

  const idxAsli = urutanSoal[soalAktif];
  const soalSekarang = soalAsli[idxAsli];

  const tanganiJawaban = (nilai: any) => {
    if (status !== 'ujian') return;
    setJawabanSiswa((prev) => ({ ...prev, [idxAsli]: nilai }));
  };

  const tanganiCheckboxKompleks = (opsiIndex: string) => {
    if (status !== 'ujian') return;
    setJawabanSiswa((prev) => {
      const jawabanSkrg = Array.isArray(prev[idxAsli]) ? [...prev[idxAsli]] : [];
      if (jawabanSkrg.includes(opsiIndex)) return { ...prev, [idxAsli]: jawabanSkrg.filter((v) => v !== opsiIndex) };
      else return { ...prev, [idxAsli]: [...jawabanSkrg, opsiIndex] };
    });
  };

  const mulaiUjian = async () => {
    if (!namaSiswa.trim()) return alert("Masukkan nama lengkap Anda!");
    if (ujian.butuhToken && tokenInput.toUpperCase() !== ujian.token) return alert("Token Akses tidak valid!");
    
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (e) {
      console.log("Browser menolak Fullscreen.");
    }
    setStatus('ujian');
  };

  const handleKumpul = () => {
    const belumTerjawab = soalAsli.length - terjawabCount;
    if (belumTerjawab > 0) {
      // Pakai Custom Dialog, bukan alert() bawaan
      setDialog({
        type: 'alert',
        msg: `⚠️ Maaf, Anda belum menjawab ${belumTerjawab} soal. Semua soal wajib diisi sebelum dikumpulkan.`
      });
      return;
    }
    setDialog({
      type: 'confirm',
      msg: 'Apakah Anda yakin ingin mengakhiri ujian ini? Anda tidak bisa mengubah jawaban setelah menekan Kumpulkan.',
      onOk: selesaikanUjian
    });
  };

  const selesaikanUjian = async () => {
    setDialog(null);
    if (document.fullscreenElement) {
        document.exitFullscreen().catch(()=>{});
    }

    setIsSubmitting(true);
    let benar = 0; let salah = 0; let kosong = 0;
    soalAsli.forEach((soal: any, i: number) => {
      const jawab = jawabanSiswa[i];
      if (!jawab || (Array.isArray(jawab) && jawab.length === 0)) { kosong++; }
      else {
        if (soal.tipe === 'pilgan' || soal.tipe === 'benarsalah') {
          if (jawab.toString() === soal.kunci.toString()) benar++; else salah++;
        } else if (soal.tipe === 'kompleks') {
          const sK = Array.isArray(soal.kunci) ? soal.kunci.map((k:any)=>k.toString()).sort().join() : "";
          const sJ = Array.isArray(jawab) ? jawab.map((k:any)=>k.toString()).sort().join() : "";
          if (sK === sJ) benar++; else salah++;
        } else { benar++; }
      }
    });

    const nilaiAkhir = Math.round((benar / (soalAsli.length || 1)) * 100);
    setStatistik({ benar, salah, kosong, nilai: nilaiAkhir });

    const emailOtomatis = `${namaSiswa.toLowerCase().replace(/\s/g, '')}@student.cbt`;
    await submitCbtResultDB({
      examId: ujian.id,
      namaPeserta: namaSiswa,
      emailPeserta: emailOtomatis, 
      nilai: nilaiAkhir,
      detailJawaban: jawabanSiswa,
    });

    setIsSubmitting(false);
    setStatus('hasil');
  };

  const toggleRaguRagu = () => setRaguRagu((prev) => ({ ...prev, [idxAsli]: !prev[idxAsli] }));

  const BrandingFooter = () => (
    <div className="py-6 flex flex-col items-center justify-center gap-2 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-500">
      <div className="flex items-center gap-2.5">
        <Image src="/logo-lms.png" alt="Logo LMS" width={24} height={24} className="object-contain" />
        <span className="text-[11px] font-black tracking-[0.2em] text-slate-400 uppercase">Powered by Tarbiyah Tech</span>
      </div>
    </div>
  );

  // KOTAK DIALOG KUSTOM AGAR FULLSCREEN TIDAK BOCOR
  const CustomDialog = () => {
    if (!dialog) return null;
    return (
      <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full rounded-[2rem] p-8 shadow-2xl text-center border border-slate-100 scale-100 animate-in zoom-in-95 duration-200">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${dialog.type === 'alert' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
            {dialog.type === 'alert' ? <AlertTriangle size={32} /> : <AlertCircle size={32} />}
          </div>
          <h3 className="text-xl font-black text-slate-800 mb-2">{dialog.type === 'alert' ? 'Peringatan' : 'Konfirmasi Ujian'}</h3>
          <p className="text-slate-500 font-medium text-sm leading-relaxed mb-8">{dialog.msg}</p>
          
          <div className="flex gap-3 justify-center">
            {dialog.type === 'confirm' && (
              <button onClick={() => setDialog(null)} className="flex-1 py-3.5 rounded-xl font-black text-sm bg-slate-100 text-slate-600 hover:bg-slate-200 transition">Batal</button>
            )}
            <button onClick={() => { if(dialog.onOk) dialog.onOk(); else setDialog(null); }} className={`flex-1 py-3.5 rounded-xl font-black text-sm text-white transition shadow-lg ${dialog.type === 'alert' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}>
              {dialog.type === 'confirm' ? 'Ya, Kumpulkan' : 'Saya Mengerti'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // LAYAR PERINGATAN KECURANGAN FULL GELAP
  const CheatOverlay = () => {
    if (!cheatWarningActive) return null;
    return (
      <div className="fixed inset-0 z-[10000] bg-black flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
         <AlertTriangle size={100} className="text-rose-600 animate-pulse mb-8 drop-shadow-[0_0_20px_rgba(225,29,72,0.8)]" />
         <h1 className="text-4xl md:text-6xl font-black text-rose-600 uppercase tracking-widest mb-6 animate-pulse">Peringatan Kecurangan!</h1>
         <p className="text-xl md:text-2xl text-slate-300 font-medium max-w-3xl leading-relaxed mb-12">
           Sistem mendeteksi Anda meninggalkan halaman ujian atau membuka aplikasi lain. Tindakan ini direkam ke dalam log pelanggaran server! <br/><br/>
           Harap <strong className="text-white border-b-2 border-rose-500">TIDAK membuka halaman atau aplikasi lain</strong> selama ujian berlangsung.
         </p>
         <button onClick={() => {
             setCheatWarningActive(false);
             if (ujian.antiCheat && document.documentElement.requestFullscreen && !document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(()=>{});
             }
           }} 
           className="px-8 py-5 bg-rose-600 text-white text-sm md:text-base font-black rounded-2xl hover:bg-rose-700 transition shadow-[0_0_40px_rgba(225,29,72,0.4)] tracking-widest active:scale-95">
           SAYA MENGERTI & KEMBALI KE UJIAN
         </button>
      </div>
    );
  };

  // ==========================================
  // LAYAR 1: KARTU PERSIAPAN (PREP SCREEN)
  // ==========================================
  if (status === 'login') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
        <div className="flex-1 flex items-center justify-center p-4 lg:py-10">
            <div className="bg-white max-w-[1100px] w-full rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col lg:flex-row min-h-[650px]">
                <div className="lg:w-1/2 bg-slate-900 flex flex-col border-r border-slate-800 relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none"></div>
                    <div className="p-10 lg:p-14 flex-1 flex flex-col overflow-hidden">
                        <div className="mb-10 mt-auto pt-4 lg:pt-0">
                            <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-md border border-indigo-500/30 mb-4 inline-block">CBT Platform</span>
                            <h1 className="text-3xl lg:text-5xl font-black text-white tracking-tight leading-tight uppercase italic">{ujian.judul}</h1>
                        </div>
                        <div className="flex-1 flex flex-col min-h-0">
                            <div className="flex items-center gap-3 mb-4 text-emerald-400">
                                <BookOpen size={22} strokeWidth={2.5}/>
                                <h3 className="font-black uppercase tracking-widest text-sm">Instruksi & Tata Tertib</h3>
                            </div>
                            <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                                <p className="text-[15px] text-slate-400 leading-relaxed font-medium whitespace-pre-wrap">
                                    {ujian.deskripsi || "Silakan kerjakan ujian ini dengan jujur. Pastikan koneksi internet stabil. Layar akan otomatis berubah menjadi mode penuh (Fullscreen). \n\nSemua jawaban wajib diisi. Waktu akan berjalan otomatis setelah Anda menekan tombol mulai."}
                                </p>
                            </div>
                        </div>
                        <div className="mt-8 pt-8 border-t border-slate-800 flex items-center gap-4">
                            <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 border border-indigo-500/20 shrink-0"><ShieldCheck size={20}/></div>
                            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider leading-snug">Ujian ini didukung oleh sistem keamanan <br/> <span className="text-indigo-400">Auto-Fullscreen & Proctoring</span></p>
                        </div>
                    </div>
                </div>

                <div className="lg:w-1/2 p-10 lg:p-14 bg-white flex flex-col relative">
                    <div className="flex justify-end mb-8 lg:absolute lg:top-10 lg:right-12">
                        <span className="bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl border border-slate-200 flex items-center gap-2.5 shadow-sm">
                            <img src={logoSekolah} alt="Logo" className="w-5 h-5 object-contain" />
                            {namaSekolah}
                        </span>
                    </div>

                    <div className="flex-1 flex flex-col justify-center mt-4 lg:mt-6">
                        <h2 className="text-xl font-black text-slate-800 mb-8 flex items-center gap-3"><span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span> Konfirmasi Peserta</h2>
                        <div className="grid grid-cols-3 gap-4 mb-10">
                            {[
                                { label: 'Waktu', val: `${ujian.durasi} Menit`, icon: Clock, color: 'text-blue-500' },
                                { label: 'Soal', val: `${soalAsli.length} Butir`, icon: Layers, color: 'text-indigo-500' },
                                { label: 'KKM', val: ujian.kkm, icon: Target, color: 'text-emerald-500' }
                            ].map((item, i) => (
                                <div key={i} className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex flex-col items-center text-center group hover:bg-white hover:border-indigo-200 transition-all cursor-default">
                                    <item.icon className={`${item.color} mb-2 group-hover:scale-110 transition-transform`} size={24}/>
                                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-[0.1em] mb-0.5">{item.label}</span>
                                    <span className="font-black text-slate-700 text-sm">{item.val}</span>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-5">
                            <div className="relative group">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest absolute -top-2 left-4 bg-white px-2 z-10">Nama Lengkap</label>
                                <input type="text" required value={namaSiswa} onChange={(e) => setNamaSiswa(e.target.value)} className="w-full bg-white border-2 border-slate-100 p-4 rounded-2xl outline-none focus:border-indigo-600 font-bold text-slate-800 transition shadow-sm group-hover:border-slate-200 text-sm" placeholder="Ahmad Fulan" />
                            </div>
                            {ujian.butuhToken && (
                                <div className="relative group">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest absolute -top-2 left-4 bg-white px-2 z-10">Token Akses</label>
                                    <input type="text" required value={tokenInput} onChange={(e) => setTokenInput(e.target.value.toUpperCase())} className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl outline-none focus:bg-white focus:border-indigo-600 font-black text-indigo-700 uppercase tracking-[0.4em] transition text-center group-hover:border-slate-200 text-sm" placeholder="XXXXXX" />
                                </div>
                            )}
                            <button onClick={mulaiUjian} className="w-full mt-6 bg-indigo-600 text-white font-black text-lg py-5 rounded-[1.5rem] hover:bg-indigo-700 transition-all active:scale-[0.98] shadow-[0_12px_24px_rgba(79,70,229,0.3)]">
                                Konfirmasi & Mulai
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <BrandingFooter />
      </div>
    );
  }

  // ==========================================
  // LAYAR 2 & 4: AREA UJIAN / REVIEW
  // ==========================================
  if (status === 'ujian' || status === 'review') {
    const isModeReview = status === 'review';

    return (
      <div ref={containerRef} className="min-h-screen bg-[#F1F5F9] flex flex-col h-screen overflow-hidden text-slate-800 font-sans">
        <CheatOverlay />
        <CustomDialog />
        
        {!isModeReview && (
          <div className="h-1.5 w-full bg-slate-200 absolute top-0 left-0 z-[60]">
            <div className="h-full bg-indigo-600 transition-all duration-700 shadow-[0_0_10px_rgba(79,70,229,0.5)]" style={{ width: `${(terjawabCount / soalAsli.length) * 100}%` }}></div>
          </div>
        )}

        <header className="bg-white border-b border-slate-200 px-4 md:px-8 py-3 flex justify-between items-center shrink-0 z-50 mt-1.5">
          <div className="flex items-center gap-4">
            <div className="bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                <img src={logoSekolah} alt="School Logo" className="w-8 h-8 object-contain rounded-lg" />
            </div>
            <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
            <div>
              <h1 className="text-sm md:text-base font-black tracking-tight text-slate-900 uppercase italic leading-tight">{ujian.judul}</h1>
              <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Peserta: <span className="text-indigo-600">{namaSiswa}</span></p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             {isModeReview ? (
               <button onClick={() => setStatus('hasil')} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-black transition">
                 <ArrowLeft size={16} /> Kembali
               </button>
             ) : (
               <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-black tabular-nums transition-all ${
                 sisaWaktu < 300 ? 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse' : 'bg-white border-slate-200 text-slate-800 shadow-sm'
               }`}>
                 <Clock size={16} className={sisaWaktu < 300 ? 'text-rose-500' : 'text-slate-400'} />
                 <span className="text-base">{formatWaktu(sisaWaktu)}</span>
               </div>
             )}
          </div>
        </header>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden max-w-6xl w-full mx-auto relative p-3 lg:p-6 gap-4 lg:gap-6">
          <div className="flex-1 flex flex-col bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden relative">
            {isModeReview && <div className="bg-amber-100 text-amber-900 p-2 text-center text-[10px] font-black uppercase tracking-[0.2em] border-b border-amber-200">Mode Koreksi Jawaban</div>}

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10">
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                  <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border border-slate-200">NO {soalAktif + 1}</span>
                  <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border border-indigo-100 italic">{soalSekarang?.tipe?.replace('_', ' ')}</span>
                </div>

                {soalSekarang?.gambar && (
                    <div className="mb-6 rounded-2xl border border-slate-100 p-3 bg-slate-50/50 inline-block shadow-inner">
                        <img src={soalSekarang.gambar} className="max-h-60 object-contain rounded-xl" alt="Soal"/>
                    </div>
                )}

                <p className="text-lg lg:text-[1.15rem] font-medium text-slate-800 mb-8 leading-relaxed whitespace-pre-wrap">
                  {soalSekarang?.pertanyaan || "Pertanyaan belum diatur."}
                </p>

                <div className="space-y-3">
                  {(soalSekarang?.tipe === 'pilgan' || soalSekarang?.tipe === 'benarsalah') && soalSekarang?.opsi?.map((opsi: string, index: number) => {
                    const idIndexStr = index.toString();
                    const isSelected = jawabanSiswa[idxAsli] === (soalSekarang.tipe==='benarsalah' ? opsi : idIndexStr);
                    const isCorrectAnswer = isModeReview && (soalSekarang.tipe==='benarsalah' ? opsi===soalSekarang.kunci : idIndexStr===soalSekarang.kunci.toString());
                    const isWrongAnswerSelected = isModeReview && isSelected && !isCorrectAnswer;

                    let btnS = "border-slate-200 hover:border-indigo-300 hover:bg-slate-50 bg-white text-slate-600";
                    let cirS = "border-slate-300 text-slate-500 bg-white";

                    if (isModeReview) {
                      if (isCorrectAnswer) { btnS = "border-emerald-500 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-500 font-bold z-10"; cirS = "bg-emerald-500 border-emerald-500 text-white"; } 
                      else if (isWrongAnswerSelected) { btnS = "border-rose-300 bg-rose-50 opacity-70 text-rose-800 line-through decoration-rose-300"; cirS = "bg-rose-400 border-rose-400 text-white"; } 
                      else { btnS = "opacity-40 border-slate-100"; }
                    } else if (isSelected) {
                      btnS = "border-indigo-600 bg-indigo-50 text-indigo-900 ring-1 ring-indigo-600 font-bold shadow-sm z-10";
                      cirS = "bg-indigo-600 border-indigo-600 text-white";
                    }

                    return (
                      <button key={index} onClick={() => tanganiJawaban(soalSekarang.tipe==='benarsalah' ? opsi : idIndexStr)} disabled={isModeReview} className={`w-full text-left p-4 lg:p-4 rounded-2xl border-2 transition-all duration-200 flex items-center gap-4 group ${btnS}`}>
                        <div className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center shrink-0 font-black text-sm transition-colors shadow-sm ${cirS}`}>
                          {isModeReview && isCorrectAnswer ? <CheckCircle2 size={20} /> : isModeReview && isWrongAnswerSelected ? <XCircle size={20} /> : String.fromCharCode(65 + index)}
                        </div>
                        {soalSekarang?.gambar_opsi?.[index] && <img src={soalSekarang.gambar_opsi[index]} className="h-12 w-12 object-contain rounded-lg border border-slate-200 bg-white" alt="Opsi" />}
                        <span className="text-[15px] flex-1 leading-snug">{opsi}</span>
                      </button>
                    );
                  })}

                  {soalSekarang?.tipe === 'kompleks' && soalSekarang?.opsi?.map((opsi: string, index: number) => {
                    const idIndexStr = index.toString();
                    const isSelected = Array.isArray(jawabanSiswa[idxAsli]) && jawabanSiswa[idxAsli].includes(idIndexStr);
                    const isCorrectAnswer = isModeReview && Array.isArray(soalSekarang.kunci) && soalSekarang.kunci.includes(idIndexStr);
                    const isWrongAnswerSelected = isModeReview && isSelected && !isCorrectAnswer;

                    let bS = "border-slate-200 bg-white hover:bg-slate-50"; let cS = "border-slate-300 bg-white";
                    if (isModeReview) {
                      if (isCorrectAnswer) { bS = "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500 font-bold"; cS = "bg-emerald-500 border-emerald-500 text-white"; } 
                      else if (isWrongAnswerSelected) { bS = "border-rose-300 bg-rose-50 opacity-70 line-through"; cS = "bg-rose-400 border-rose-400 text-white"; }
                      else { bS = "opacity-40 border-slate-100"; }
                    } else if (isSelected) { bS = "border-indigo-600 bg-indigo-50 ring-1 ring-indigo-600 font-bold"; cS = "bg-indigo-600 border-indigo-600 text-white"; }

                    return (
                      <button key={index} onClick={() => tanganiCheckboxKompleks(idIndexStr)} disabled={isModeReview} className={`w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 flex items-center gap-4 ${bS}`}>
                        <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors shadow-sm ${cS}`}>
                          {(isSelected || (isModeReview && isCorrectAnswer)) && <CheckCircle2 size={16} />}
                        </div>
                        <span className="text-[15px] flex-1 leading-snug">{opsi}</span>
                      </button>
                    );
                  })}

                  {(soalSekarang?.tipe === 'essay_singkat' || soalSekarang?.tipe === 'essay_panjang') && (
                    <textarea value={jawabanSiswa[idxAsli] || ""} onChange={(e) => tanganiJawaban(e.target.value)} disabled={isModeReview} placeholder="Tuliskan jawaban Anda secara lengkap..." className="w-full border-2 border-slate-200 p-5 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white bg-slate-50 text-slate-800 font-medium transition resize-none text-base shadow-sm" rows={soalSekarang.tipe === 'essay_panjang' ? 6 : 3}></textarea>
                  )}
                </div>

                {/* INFO KOREKSI JAWABAN SAAT REVIEW */}
                {isModeReview && (
                  <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-2xl">
                    <h4 className="text-xs font-black uppercase text-blue-800 tracking-widest mb-3 flex items-center gap-2"><FileText size={16}/> Kunci Jawaban Resmi</h4>
                    <div className="bg-white px-5 py-3 rounded-xl border border-blue-100 text-blue-800 font-black inline-block shadow-sm">
                      {soalSekarang?.tipe === 'pilgan' ? soalSekarang?.opsi[parseInt(soalSekarang.kunci)] : 
                       soalSekarang?.tipe === 'kompleks' ? soalSekarang?.kunci.map((k:any) => soalSekarang?.opsi[parseInt(k)]).join(' & ') : 
                       soalSekarang?.tipe === 'benarsalah' ? soalSekarang?.kunci : 
                       "Menunggu koreksi manual guru (Essay)"}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 md:p-5 border-t border-slate-100 bg-slate-50/50 flex flex-wrap justify-between items-center gap-3 shrink-0">
              <button onClick={() => setSoalAktif((prev) => Math.max(0, prev - 1))} disabled={soalAktif === 0} className="flex items-center gap-2 px-5 py-3 font-bold text-[13px] text-slate-500 bg-white border border-slate-200 hover:text-slate-800 hover:bg-slate-100 rounded-xl disabled:opacity-30 transition-all">
                <ChevronLeft size={18} /> <span className="hidden sm:inline">Kembali</span>
              </button>
              
              {!isModeReview && (
                <label className="flex items-center gap-2 cursor-pointer bg-white border border-amber-200 px-4 py-3 rounded-xl hover:bg-amber-50 transition-all shadow-sm">
                  <input type="checkbox" checked={!!raguRagu[idxAsli]} onChange={toggleRaguRagu} className="w-4 h-4 accent-amber-500 cursor-pointer"/>
                  <span className="font-bold text-amber-700 text-[12px] uppercase tracking-wider flex items-center gap-1.5"><Flag size={14} /> Ragu</span>
                </label>
              )}

              {soalAktif === soalAsli.length - 1 ? (
                <button onClick={handleKumpul} disabled={isModeReview || isSubmitting} className="flex items-center gap-2 px-6 py-3 font-black uppercase tracking-wider text-[12px] text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all disabled:opacity-50">
                   {isSubmitting ? <><Loader2 size={18} className="animate-spin" /> Proses...</> : <>Kumpulkan <CheckCircle2 size={18} /></>}
                </button>
              ) : (
                <button onClick={() => setSoalAktif((prev) => Math.min(soalAsli.length - 1, prev + 1))} className="flex items-center gap-2 px-6 py-3 font-bold text-[13px] text-white bg-slate-800 hover:bg-black rounded-xl shadow-md transition-all">
                  Lanjut <ChevronRight size={18} />
                </button>
              )}
            </div>
          </div>

          {/* PALET NOMOR KANAN */}
          <div className="w-full lg:w-[320px] bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col shrink-0 max-h-[40vh] lg:max-h-none overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col items-center text-center">
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Status Navigasi</span>
            </div>
            
            <div className="p-5 flex-1 overflow-y-auto custom-scrollbar bg-white">
              <div className="grid grid-cols-5 gap-2.5">
                {urutanSoal.map((idxAwal, tIdx) => {
                  const jS = jawabanSiswa[idxAwal];
                  const isD = (Array.isArray(jS) ? jS.length > 0 : !!jS);
                  const isR = !!raguRagu[idxAwal];
                  const isActive = soalAktif === tIdx;
                  
                  let cC = "border-slate-200 text-slate-400 bg-white hover:bg-slate-50"; 
                  if (isModeReview) {
                     const isC = (soalAsli[idxAwal].tipe === 'pilgan' || soalAsli[idxAwal].tipe === 'benarsalah') ? (jS && jS.toString() === soalAsli[idxAwal].kunci.toString()) : isD; 
                     if (!isD) cC = "bg-slate-100 border-slate-200 text-slate-400";
                     else if (isC) cC = "bg-emerald-500 border-emerald-600 text-white shadow-sm";
                     else cC = "bg-rose-500 border-rose-600 text-white shadow-sm";
                  } else {
                    if (isR) cC = "bg-amber-400 border-amber-500 text-amber-900 shadow-sm";
                    else if (isD) cC = "bg-indigo-600 border-indigo-700 text-white shadow-sm";
                  }
                  const oC = isActive ? "ring-2 ring-indigo-300 border-indigo-600 scale-110 z-10 font-black" : "font-bold";

                  return (
                    <button key={tIdx} onClick={() => setSoalAktif(tIdx)} className={`h-10 rounded-xl text-[13px] transition-all border ${cC} ${oC}`}>
                      {tIdx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 space-y-3">
               <div className="grid grid-cols-1 gap-2">
                 {isModeReview ? (
                    <>
                        <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500"><div className="w-4 h-4 bg-emerald-500 rounded border border-emerald-600"></div> Benar</div>
                        <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500"><div className="w-4 h-4 bg-rose-500 rounded border border-rose-600"></div> Salah / Koreksi</div>
                    </>
                 ) : (
                    <>
                        <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500"><div className="w-4 h-4 bg-indigo-600 rounded shadow-sm"></div> Sudah Terjawab</div>
                        <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500"><div className="w-4 h-4 bg-amber-400 rounded shadow-sm"></div> Ragu-ragu</div>
                        <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500"><div className="w-4 h-4 bg-white rounded border border-slate-200"></div> Belum Diisi</div>
                    </>
                 )}
               </div>
            </div>
          </div>
        </div>
        
        <div className="shrink-0 bg-white border-t border-slate-200 px-6">
            <BrandingFooter />
        </div>
      </div>
    );
  }

  // ==========================================
  // LAYAR 3: HASIL UJIAN
  // ==========================================
  if (status === 'hasil') {
    const isLulus = statistik.nilai >= ujian.kkm;

    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
        <div className="flex-1 flex items-center justify-center p-4">
            <div className="bg-white max-w-2xl w-full rounded-[3rem] p-10 lg:p-14 shadow-2xl border border-slate-100 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
                
                <h2 className="text-2xl lg:text-3xl font-black text-slate-800 tracking-tighter uppercase italic mb-2">Evaluasi Selesai</h2>
                <p className="text-slate-400 font-medium tracking-wide mb-10 uppercase text-[11px]">Sesi ujian telah berakhir dan jawaban Anda tersimpan.</p>

                <div className="flex justify-center mb-10">
                    <div className="relative w-56 h-56 rounded-full flex flex-col items-center justify-center bg-white shadow-[0_10px_40px_rgba(0,0,0,0.04)] border-[10px] border-slate-50">
                        <span className="text-6xl lg:text-7xl font-black text-slate-900 tracking-tighter leading-none mt-2">{statistik.nilai}</span>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mt-2 italic">Final Score</span>
                        
                        <svg className="absolute inset-0 w-full h-full -rotate-90 scale-[1.04]" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="46" fill="none" stroke="#F1F5F9" strokeWidth="8" />
                            <circle cx="50" cy="50" r="46" fill="none" stroke={isLulus ? "#10b981" : "#f43f5e"} strokeWidth="8" strokeDasharray={`${(statistik.nilai / 100) * 289} 289`} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                        </svg>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-6 mb-10 max-w-md mx-auto">
                    {[
                        { l: 'Benar', v: statistik.benar, c: 'text-emerald-500' },
                        { l: 'Salah', v: statistik.salah, c: 'text-rose-500' },
                        { l: 'Kosong', v: statistik.kosong, c: 'text-slate-300' }
                    ].map((s, i) => (
                        <div key={i} className="text-center">
                            <p className={`text-3xl font-black ${s.c} leading-none mb-1`}>{s.v}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.l}</p>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 border-t border-slate-50">
                    <button onClick={() => { setSoalAktif(0); setStatus('review'); }} className="flex-1 bg-white border-2 border-slate-200 text-slate-600 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:border-indigo-600 hover:text-indigo-600 transition-all flex items-center justify-center gap-2">
                        <AlertCircle size={18}/> Koreksi Jawaban
                    </button>
                    <button onClick={() => window.location.href = '/'} className="flex-1 bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:bg-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2">
                        Beranda <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        </div>
        <BrandingFooter />
      </div>
    );
  }

  return null;
}