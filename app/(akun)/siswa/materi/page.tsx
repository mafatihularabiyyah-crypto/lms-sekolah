"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  BookOpen, PlayCircle, Video, Lock, CheckCircle2, 
  FileText, Play, Clock, 
  Users, ArrowLeft, Loader2, Link as LinkIcon, ExternalLink,
  Search, X
} from "lucide-react";
import { getMateriSantriDB, markAttendanceSantriDB, markMaterialCompletedDB } from "./actions";
import { createPortal } from "react-dom";

const getYouTubeId = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export default function MateriBelajarSantri() {
  const [selectedClass, setSelectedClass] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"IN_PROGRESS" | "COMPLETED">("IN_PROGRESS");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [enrolledClasses, setEnrolledClasses] = useState<any[]>([]);
  const [allMateri, setAllMateri] = useState<any[]>([]);
  const [completedMaterials, setCompletedMaterials] = useState<string[]>([]);

  const gradients = [
    "from-blue-600 to-indigo-700",
    "from-emerald-500 to-teal-600",
    "from-rose-500 to-pink-600",
    "from-amber-500 to-orange-600",
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const res = await getMateriSantriDB();
    if (res.success) {
      setEnrolledClasses(res.enrolledClasses || []);
      setAllMateri(res.data || []);
      if (res.completedMaterials) {
         setCompletedMaterials(res.completedMaterials);
      }
    }
    setIsLoading(false);
  };

  const handleMarkAsCompleted = async (materiId: string, classRoomId: string) => {
    const newProgress = [...completedMaterials, materiId];
    setCompletedMaterials(newProgress);
    await markMaterialCompletedDB(materiId, classRoomId);
    await markAttendanceSantriDB(classRoomId);
  };

  const safeClassName = selectedClass?.name || selectedClass?.nama || "Dashboard Kelas";

  const filteredMateri = useMemo(() => {
    if (!selectedClass) return [];
    return allMateri.filter(m => {
      const matchClass = m.classRoomId === selectedClass.id;
      const matchSearch = m.judul.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (m.deskripsi && m.deskripsi.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchClass && matchSearch;
    });
  }, [allMateri, selectedClass, searchQuery]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 size={48} className="animate-spin text-indigo-600 mb-4" />
        <p className="text-slate-500 font-bold animate-pulse">Menyiapkan Ruang Belajar Anda...</p>
      </div>
    );
  }

  // --- VIEW 1: DAFTAR KELAS ---
  if (!selectedClass) {
    const displayClasses = activeTab === "IN_PROGRESS" ? enrolledClasses : [];

    return (
      <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3 mb-2">
              <BookOpen className="text-indigo-600" size={32} /> Katalog Kelas Saya
            </h1>
            <p className="text-slate-500 font-medium">Lanjutkan pembelajaran dan selesaikan seluruh materi secara berurutan.</p>
          </div>
          
          <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1 border border-slate-200/40">
            <button 
              onClick={() => setActiveTab("IN_PROGRESS")} 
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 cursor-pointer ${
                activeTab === "IN_PROGRESS" 
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Kelas Aktif
            </button>
            <button 
              onClick={() => setActiveTab("COMPLETED")} 
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 cursor-pointer ${
                activeTab === "COMPLETED" 
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20" 
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Selesai
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {displayClasses.length === 0 ? (
            <div className="col-span-full py-20 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300"><BookOpen size={40} /></div>
              <p className="text-slate-500 font-medium">Belum ada kelas yang didaftarkan untuk Anda.</p>
            </div>
          ) : (
            displayClasses.map((cls, idx) => {
              const classMats = allMateri.filter(m => m.classRoomId === cls.id);
              const firstVideo = classMats.find(m => getYouTubeId(m.youtubeLink) || getYouTubeId(m.fileUrl));
              const ytCoverId = firstVideo ? (getYouTubeId(firstVideo.youtubeLink) || getYouTubeId(firstVideo.fileUrl)) : null;
              const coverImgUrl = ytCoverId ? `https://img.youtube.com/vi/${ytCoverId}/hqdefault.jpg` : null;
              
              const defaultColor = gradients[idx % gradients.length];
              
              return (
                <div 
                  key={cls.id} 
                  onClick={() => setSelectedClass({ ...cls, coverColor: defaultColor })}
                  className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden cursor-pointer group hover:-translate-y-1 hover:shadow-[0_15px_40px_rgb(0,0,0,0.08)] transition-all duration-300 flex flex-col"
                >
                  <div 
                    className={`h-40 relative p-6 flex flex-col justify-between ${!coverImgUrl ? `bg-gradient-to-br ${defaultColor}` : ''}`}
                    style={coverImgUrl ? { backgroundImage: `url(${coverImgUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
                  >
                    {coverImgUrl && <div className="absolute inset-0 bg-black/50 group-hover:bg-black/30 transition-colors"></div>}
                    <div className="relative z-10 flex justify-between items-start w-full">
                      <span className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-[10px] font-black uppercase tracking-widest border border-white/20 shadow-sm">
                        Kelas Aktif
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xl font-black text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">{cls.name}</h3>
                      <div className="text-sm font-bold text-slate-500 flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] shrink-0">Ust</div>
                        <span className="truncate">{cls.pengajar || "Pengajar Utama"}</span>
                      </div>

                      {cls.zoomLink && (
                        <a 
                          href={cls.zoomLink.startsWith('http') ? cls.zoomLink : `https://${cls.zoomLink}`}
                          target="_blank" rel="noreferrer"
                          onClick={(e) => e.stopPropagation()} 
                          className="mb-4 flex items-center justify-center gap-2 w-full py-2.5 bg-red-600 animate-pulse text-white text-xs font-black rounded-xl shadow-md shadow-red-600/30 text-center"
                        >
                          <Video size={16} /> TATAP MUKA VIRTUAL (LIVE ZOOM)
                        </a>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                      <span className="text-xs font-bold text-slate-500 flex items-center gap-1"><Users size={14} className="text-slate-400"/> Santri Terdaftar</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // --- VIEW 2: INSIDE CLASS (LEARNING PATH) ---
  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in slide-in-from-bottom-8 duration-500 pb-12">
      
      <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl shadow-sm border border-slate-100">
        <button 
          onClick={() => { setSelectedClass(null); setSearchQuery(""); }}
          className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors px-3 py-1.5 rounded-xl hover:bg-slate-50 cursor-pointer"
        >
          <ArrowLeft size={18} /> Kembali ke Katalog
        </button>
        <div className="relative w-48 sm:w-64 group ml-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input type="text" placeholder="Cari materi..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-indigo-500 transition-all"/>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* KOLOM KIRI (70%): TIMELINE BERKAS DAN MATERI */}
        <div className="xl:col-span-2 space-y-6">
          <div className={`bg-gradient-to-br ${selectedClass.coverColor} rounded-[2rem] p-8 md:p-10 text-white shadow-lg relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="relative z-10">
              <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] font-black uppercase tracking-widest border border-white/20 mb-4 inline-block">
                Ruang Belajar Utama
              </span>
              <h1 className="text-3xl md:text-4xl font-black mb-3 leading-tight">{safeClassName}</h1>
              <p className="text-white/80 font-medium text-sm max-w-lg mb-6">Materi dikunci secara berurutan. Anda wajib mengeklik tombol 'Selesai' pada materi sebelumnya untuk membuka akses ke materi berikutnya.</p>
              
              {selectedClass.zoomLink && (
                <a 
                  href={selectedClass.zoomLink.startsWith('http') ? selectedClass.zoomLink : `https://${selectedClass.zoomLink}`}
                  target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 bg-red-600 animate-pulse text-white font-black text-xs rounded-xl shadow-lg shadow-red-900/30"
                >
                  <Video size={16}/> GABUNG LIVE ZOOM KELAS INI SEKARANG
                </a>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
              <div className="flex gap-4 items-start mb-8 pb-6 border-b border-slate-100">
                 <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 font-black text-lg bg-indigo-50 text-indigo-600">1</div>
                 <div>
                   <h2 className="text-xl font-black text-slate-800">Alur Pembelajaran</h2>
                   <p className="text-sm text-slate-500 mt-1">Ikuti materi secara berurutan dari atas ke bawah.</p>
                 </div>
              </div>

              <div className="relative border-l-2 border-slate-100 ml-5 md:ml-6 space-y-8">
                {filteredMateri.length === 0 ? (
                  <p className="pl-8 text-sm font-bold text-slate-400 italic">Materi belum diunggah oleh asatidz.</p>
                ) : (
                  filteredMateri.map((materi: any, matIdx: number) => {
                    const fileType = materi.tipe?.toUpperCase() || "PDF";
                    
                    // PERBAIKAN: Fokus deteksi YouTube Link secara spesifik
                    const ytId = getYouTubeId(materi.youtubeLink);
                    
                    const isCompleted = completedMaterials.includes(materi.id);
                    const isUnlocked = matIdx === 0 || completedMaterials.includes(filteredMateri[matIdx - 1].id);
                    const isLocked = !isUnlocked;
                    
                    let IconComponent = FileText;
                    if (fileType === "VIDEO" || ytId) IconComponent = PlayCircle;
                    else if (fileType === "LINK") IconComponent = LinkIcon;
                    
                    return (
                      <div key={materi.id} className={`relative pl-8 md:pl-10 transition-all duration-500 ${isLocked ? 'opacity-30 grayscale pointer-events-none select-none' : ''}`}>
                        
                        <div className={`absolute -left-[17px] top-4 w-8 h-8 rounded-full border-4 flex items-center justify-center z-10 transition-all ${
                          isCompleted ? 'bg-emerald-500 border-emerald-100' : 
                          isUnlocked ? 'bg-indigo-600 border-indigo-100 shadow-[0_0_15px_rgba(79,70,229,0.5)]' : 
                          'bg-slate-200 border-slate-50'
                        }`}>
                          {isCompleted ? <CheckCircle2 size={14} className="text-white" strokeWidth={3}/> : <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                        </div>
                        
                        <div className={`p-5 rounded-2xl border transition-all ${
                          isCompleted ? 'bg-white border-slate-200 hover:border-indigo-300' :
                          isUnlocked ? 'bg-indigo-50/30 border-indigo-200 ring-1 ring-indigo-100 shadow-sm' : 
                          'bg-slate-50 border-slate-100'
                        }`}>
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
                            
                            <div className="flex gap-4 items-start w-full">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                                isCompleted ? 'bg-emerald-500 text-white' : 
                                isUnlocked ? 'bg-indigo-600 text-white' : 
                                'bg-slate-300 text-white'
                              }`}>
                                {isLocked ? <Lock size={20}/> : <IconComponent size={22} strokeWidth={2} />}
                              </div>
                              
                              <div className="w-full">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                                    isCompleted ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                    'bg-slate-50 text-slate-600 border-slate-200'
                                  }`}>
                                    {materi.youtubeLink && materi.fileUrl ? "VIDEO & MODUL" : fileType}
                                  </span>
                                  <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                                    <Clock size={12}/> {new Date(materi.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                                  </span>
                                </div>
                                <h4 className={`text-base font-bold mb-1 ${isLocked ? 'text-slate-500' : 'text-slate-800'}`}>
                                  {matIdx + 1}. {materi.judul}
                                </h4>
                                {materi.deskripsi && (
                                  <p className="text-xs font-medium text-slate-500 mb-4 line-clamp-2">{materi.deskripsi}</p>
                                )}

                                {/* Thumbnail Video Utama */}
                                {ytId && isUnlocked && (
                                  <div 
                                    onClick={() => setActiveVideoId(ytId)}
                                    className="relative w-full max-w-sm rounded-xl overflow-hidden mb-4 shadow-sm border border-slate-200 cursor-pointer group/thumb"
                                  >
                                    <img src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`} alt="Video Thumbnail" className="w-full h-auto object-cover aspect-video group-hover/thumb:scale-105 transition duration-500" />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover/thumb:bg-black/10 transition-colors">
                                      <div className="w-12 h-12 bg-white/95 rounded-full flex items-center justify-center shadow-lg transform group-hover/thumb:scale-110 transition duration-300"><Play size={24} className="text-rose-600 ml-1"/></div>
                                    </div>
                                  </div>
                                )}

                                {/* PERBAIKAN: Tombol-Tombol Terpisah & Bisa Muncul Bersamaan */}
                                <div className="flex flex-wrap items-center gap-3 mt-2">
                                  
                                  {/* 1. TOMBOL VIDEO */}
                                  {ytId && (
                                    <button 
                                      onClick={() => setActiveVideoId(ytId)}
                                      className="flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200 cursor-pointer"
                                    >
                                      <Play size={14} /> {isCompleted ? 'Tonton Ulang Video' : 'Mulai Tonton Video'}
                                    </button>
                                  )}

                                  {/* 2. TOMBOL BERKAS/PDF */}
                                  {materi.fileUrl && materi.fileUrl.length > 5 && (
                                    <a 
                                      href={materi.fileUrl.startsWith('http') ? materi.fileUrl : `https://${materi.fileUrl}`} 
                                      target="_blank" rel="noreferrer" 
                                      className={`flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold rounded-xl shadow-sm transition-colors ${
                                        isCompleted ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-slate-800 text-white hover:bg-black shadow-slate-200'
                                      }`}
                                    >
                                      <ExternalLink size={14}/>
                                      {isCompleted ? 'Buka Kembali Berkas' : 'Buka Berkas Modul'}
                                    </a>
                                  )}

                                  {/* 3. TOMBOL SELESAI */}
                                  {!isCompleted && !isLocked && (
                                    <button 
                                      onClick={() => handleMarkAsCompleted(materi.id, selectedClass.id)}
                                      className="flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-500 hover:text-white transition-colors cursor-pointer"
                                    >
                                      <CheckCircle2 size={16}/> Selesaikan & Lanjut
                                    </button>
                                  )}

                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* KOLOM KANAN (30%): INFO ASATIDZ */}
        <div className="space-y-6">
          <div className="bg-white rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
             <h3 className="text-sm font-black text-slate-800 mb-4 uppercase tracking-widest">Instruktur Kelas</h3>
             <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-black text-xl shrink-0">
                  {selectedClass.pengajar ? selectedClass.pengajar.substring(0, 1) : "U"}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{selectedClass.pengajar || "Pengajar Utama"}</h4>
                  <p className="text-[11px] text-slate-500 font-medium mt-0.5">Ustadz / Pengampu Materi</p>
                </div>
             </div>
          </div>
        </div>

      </div>

      {activeVideoId && createPortal(
        <div className="fixed inset-0 z-[255] bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300">
          <button 
            onClick={() => setActiveVideoId(null)}
            className="fixed top-6 right-6 p-3 bg-white/10 hover:bg-red-600 border border-white/20 hover:border-red-500 text-white rounded-full transition-all duration-300 cursor-pointer shadow-xl z-[260]"
            title="Tutup Player Bioskop"
          >
            <X size={24} />
          </button>
          <div className="w-full max-w-5xl bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-800/60 aspect-video relative">
            <iframe 
              src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1&rel=0`}
              title="LMS Cinema Video Player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}