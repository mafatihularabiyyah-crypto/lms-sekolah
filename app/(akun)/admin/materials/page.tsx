"use client";

import { useState, useEffect, useMemo, Fragment } from 'react';
import { 
  Search, Plus, Edit3, Trash2, Video, MessageCircle, 
  Eye, EyeOff, Loader2, X, Save, Copy, MonitorPlay, PlayCircle, ArrowLeft,
  LayoutTemplate, BookOpen, CheckCircle2, ChevronUp, ChevronDown, Filter, FileText
} from 'lucide-react';
import { 
  getClassesForMaterialsDB, getClassMaterialsDB, saveMaterialDB, 
  togglePublishDB, deleteMaterialDB, updateClassLinksDB, copyMaterialsDB,
  toggleClassStatusDB, updateMaterialOrderDB
} from './actions';

export default function KelolaPembelajaranPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [materials, setMaterials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("SEMUA");
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentMaterial, setCurrentMaterial] = useState<any>({});
  
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [copySourceClassId, setCopySourceClassId] = useState("");
  const [sourceMaterials, setSourceMaterials] = useState<any[]>([]);
  const [selectedCopyIds, setSelectedCopyIds] = useState<string[]>([]);
  
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [classLinks, setClassLinks] = useState({ zoom: "", wa: "" });

  const loadInitialData = async () => {
    setIsLoading(true);
    const res = await getClassesForMaterialsDB();
    if (res.success) setClasses(res.data || []);
    setIsLoading(false);
  };

  useEffect(() => { 
    loadInitialData(); 
  }, []);

  const selectClassToManage = async (classId: string) => {
    setIsLoading(true);
    const res = await getClassMaterialsDB(classId);
    if (res.success && res.data) {
      setSelectedClass(res.data);
      setMaterials(res.data.materials || []);
      setClassLinks({ zoom: res.data.zoomLink || "", wa: res.data.waGroupLink || "" });
    }
    setIsLoading(false);
  };

  // Logika Ekstraksi Youtube ID Super Kuat (Mendukung shorts, youtu.be, embed, dll)
  const getYoutubeThumbnail = (url: string) => {
    if (!url) return null;
    try {
      const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
      const match = url.match(regExp);
      
      if (match && match[2].length === 11) {
        const videoId = match[2];
        // Mengambil gambar resolusi tinggi langsung dari server YouTube
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      }
    } catch (error) {
      return null;
    }
    return null;
  };

  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      const matchSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = filterStatus === "SEMUA" 
        ? true 
        : filterStatus === "PUBLISHED" ? m.isPublished : !m.isPublished;
      return matchSearch && matchStatus;
    });
  }, [materials, searchQuery, filterStatus]);

  const activeClasses = classes.filter(c => !c.isFinished);
  const finishedClasses = classes.filter(c => c.isFinished);

  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await saveMaterialDB(selectedClass.id, currentMaterial, currentMaterial.id);
    setIsModalOpen(false);
    await selectClassToManage(selectedClass.id);
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    setIsLoading(true);
    await togglePublishDB(id, !currentStatus);
    await selectClassToManage(selectedClass.id);
  };

  const handleDelete = async (id: string) => {
    if(confirm("Hapus permanen materi ini?")) {
      setIsLoading(true);
      await deleteMaterialDB(id);
      await selectClassToManage(selectedClass.id);
    }
  };

  const handleSaveLinks = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await updateClassLinksDB(selectedClass.id, classLinks.zoom, classLinks.wa);
    setIsLinkModalOpen(false);
    await selectClassToManage(selectedClass.id);
  };

  const handleToggleClassStatus = async () => {
    const isFinished = !selectedClass.isFinished;
    const msg = isFinished 
      ? "Tandai kelas ini telah Selesai? Kelas akan diarsipkan." 
      : "Buka kembali kelas ini menjadi Aktif?";
      
    if (confirm(msg)) {
      setIsLoading(true);
      await toggleClassStatusDB(selectedClass.id, isFinished);
      setSelectedClass(null);
      await loadInitialData();
    }
  };

  const moveMaterial = async (index: number, direction: 'UP' | 'DOWN') => {
    if ((direction === 'UP' && index === 0) || (direction === 'DOWN' && index === materials.length - 1)) return;
    setIsLoading(true);
    const newMaterials = [...materials];
    const swapIndex = direction === 'UP' ? index - 1 : index + 1;
    const temp = newMaterials[index];
    newMaterials[index] = newMaterials[swapIndex];
    newMaterials[swapIndex] = temp;
    
    setMaterials(newMaterials);
    await updateMaterialOrderDB(newMaterials.map(m => m.id));
    setIsLoading(false);
  };

  const handleSourceClassSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sid = e.target.value;
    setCopySourceClassId(sid);
    if (sid) {
      setIsLoading(true);
      const res = await getClassMaterialsDB(sid);
      if (res.success && res.data) setSourceMaterials(res.data.materials || []);
      setIsLoading(false);
    } else {
      setSourceMaterials([]);
    }
  };

  const handleCopyMaterials = async () => {
    if (selectedCopyIds.length === 0) return alert("Pilih minimal 1 materi!");
    setIsLoading(true);
    await copyMaterialsDB(selectedClass.id, selectedCopyIds);
    setIsCopyModalOpen(false);
    setSelectedCopyIds([]);
    await selectClassToManage(selectedClass.id);
  };

  // Tampilan Daftar Kelas
  if (!selectedClass) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center text-amber-600 shadow-sm">
            <LayoutTemplate className="w-7 h-7" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Pusat Materi Pembelajaran</h2>
            <p className="text-sm text-slate-500 font-medium mt-0.5">Pilih kelas untuk mengelola video, lampiran PDF, dan sesi live.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 text-amber-500 animate-spin" /></div>
        ) : (
          <>
            <div className="mb-4">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200 pb-2">Halaqah / Kelas Aktif</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {activeClasses.length === 0 && <p className="text-sm text-slate-400 font-medium">Tidak ada kelas aktif.</p>}
              {activeClasses.map(c => (
                <div key={c.id} onClick={() => selectClassToManage(c.id)} className="bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-xl hover:border-amber-200 transition-all cursor-pointer group">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center"><BookOpen size={24}/></div>
                    <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-widest">{c.pengajar || c.waliKelas || "Belum Ditentukan"}</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-800 mb-1">{c.name}</h3>
                  <p className="text-sm font-bold text-slate-500 mb-6">{c._count.students} Santri Terdaftar</p>
                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                     <p className="text-xs font-bold text-amber-600">{c._count.materials} Modul/Materi</p>
                     <ArrowLeft className="w-4 h-4 text-amber-600 rotate-180 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0"/>
                  </div>
                </div>
              ))}
            </div>

            {finishedClasses.length > 0 && (
              <>
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2 flex items-center gap-2">
                    <CheckCircle2 size={16}/> Arsip Kelas (Telah Selesai)
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {finishedClasses.map(c => (
                    <div key={c.id} onClick={() => selectClassToManage(c.id)} className="bg-slate-50 border border-slate-200 rounded-3xl p-6 opacity-60 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-pointer group">
                      <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-slate-200 text-slate-500 rounded-xl flex items-center justify-center"><CheckCircle2 size={24}/></div>
                        <span className="bg-slate-200 text-slate-500 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-widest">SELESAI</span>
                      </div>
                      <h3 className="text-xl font-black text-slate-800 mb-1 line-through decoration-slate-300">{c.name}</h3>
                      <p className="text-sm font-bold text-slate-500 mb-6">{c._count.students} Alumni Terdaftar</p>
                      <div className="pt-4 border-t border-slate-200">
                         <p className="text-xs font-bold text-slate-500">Lihat Arsip Materi &gt;</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    );
  }

  // Tampilan Manajemen Materi Dalam Kelas
  return (
    <Fragment>
      {isLoading && (
        <div className="fixed inset-0 z-[120] bg-white/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-3 border border-slate-100">
            <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
            <span className="font-bold text-slate-700 text-sm">Menyinkronkan Perubahan...</span>
          </div>
        </div>
      )}

      {/* Modal Edit / Tambah Materi */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-black text-slate-800">{currentMaterial.id ? "Edit Materi" : "Upload Materi Baru"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleSaveMaterial} className="p-6 space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Judul Materi / Sesi</label>
                <input type="text" value={currentMaterial.title || ""} onChange={e => setCurrentMaterial({...currentMaterial, title: e.target.value})} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm font-medium"/>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">Link YouTube (Opsional)</label>
                  <div className="relative">
                    <MonitorPlay className="absolute left-3.5 top-3 text-slate-400" size={18} />
                    <input type="url" placeholder="https://youtu.be/..." value={currentMaterial.youtubeLink || ""} onChange={e => setCurrentMaterial({...currentMaterial, youtubeLink: e.target.value})} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm font-medium"/>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 mb-1 block">Link Modul PDF / Drive</label>
                  <div className="relative">
                    <FileText className="absolute left-3.5 top-3 text-slate-400" size={18} />
                    <input type="url" placeholder="Link GDrive / PDF" value={currentMaterial.fileUrl || ""} onChange={e => setCurrentMaterial({...currentMaterial, fileUrl: e.target.value})} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm font-medium"/>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Deskripsi / Instruksi Tambahan</label>
                <textarea rows={4} value={currentMaterial.description || ""} onChange={e => setCurrentMaterial({...currentMaterial, description: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-sm font-medium resize-none"/>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">Batal</button>
                <button type="submit" className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-amber-500 rounded-xl hover:bg-amber-600 shadow-md shadow-amber-200 cursor-pointer"><Save className="w-4 h-4"/> Publikasikan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Links */}
      {isLinkModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer" onClick={() => setIsLinkModalOpen(false)}></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative z-10">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-amber-50">
              <h3 className="text-lg font-black text-slate-800">Atur Jalur Komunikasi</h3>
              <button onClick={() => setIsLinkModalOpen(false)} className="p-2 text-amber-600 hover:bg-amber-100 rounded-xl transition-colors cursor-pointer"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleSaveLinks} className="p-6 space-y-5">
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><Video size={14}/> Link Zoom / GMeet Rutin</label>
                <input type="url" placeholder="https://zoom.us/j/..." value={classLinks.zoom} onChange={e => setClassLinks({...classLinks, zoom: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-sm outline-none"/>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1"><MessageCircle size={14}/> Link Group WhatsApp</label>
                <input type="url" placeholder="https://chat.whatsapp.com/..." value={classLinks.wa} onChange={e => setClassLinks({...classLinks, wa: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-sm outline-none"/>
              </div>
              <button type="submit" className="w-full py-3 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-black cursor-pointer shadow-lg">Simpan Konfigurasi</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Copy Materi */}
      {isCopyModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer" onClick={() => setIsCopyModalOpen(false)}></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 flex flex-col max-h-[80vh]">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-black text-slate-800">Copy Materi dari Kelas Lain</h3>
              <button onClick={() => setIsCopyModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 space-y-4 flex-1 overflow-hidden flex flex-col">
              <select value={copySourceClassId} onChange={handleSourceClassSelect} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none cursor-pointer">
                <option value="">-- Pilih Kelas Sumber Materi --</option>
                {classes.filter(c => c.id !== selectedClass.id).map(c => <option key={c.id} value={c.id}>{c.name} ({c.waliKelas})</option>)}
              </select>
              
              <div className="flex-1 overflow-y-auto border border-slate-100 rounded-xl p-2 bg-slate-50 space-y-2 min-h-[200px]">
                {sourceMaterials.length === 0 ? (
                  <p className="text-center text-slate-400 text-sm py-10 font-medium">Pilih kelas di atas untuk melihat materinya.</p>
                ) : (
                  sourceMaterials.map(m => (
                    <label key={m.id} className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-amber-300">
                      <input type="checkbox" checked={selectedCopyIds.includes(m.id)} onChange={() => setSelectedCopyIds(prev => prev.includes(m.id) ? prev.filter(i => i !== m.id) : [...prev, m.id])} className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 cursor-pointer"/>
                      <div>
                        <p className="text-sm font-bold text-slate-800">{m.title}</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">{m.youtubeLink ? "Memiliki Video" : "Hanya Teks/File"}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-white">
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">{selectedCopyIds.length} Materi Dipilih</span>
              <button onClick={handleCopyMaterials} className="px-6 py-2.5 text-sm font-bold text-white bg-slate-900 rounded-xl hover:bg-black cursor-pointer">Copy ke Kelas Ini</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex justify-between items-center bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-sm">
          <button onClick={() => { setSelectedClass(null); loadInitialData(); }} className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-amber-600 transition-colors cursor-pointer">
            <ArrowLeft size={16} /> Daftar Kelas
          </button>
          
          <button onClick={handleToggleClassStatus} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors cursor-pointer ${selectedClass.isFinished ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-slate-100 text-slate-700 hover:bg-rose-100 hover:text-rose-700'}`}>
            <CheckCircle2 size={16}/> {selectedClass.isFinished ? 'Buka Kembali Kelas (Reaktifasi)' : 'Tandai Kelas Selesai'}
          </button>
        </div>

        <div className={`rounded-[2rem] p-8 border shadow-sm relative overflow-hidden ${selectedClass.isFinished ? 'bg-slate-50 border-slate-200 grayscale' : 'bg-white border-slate-200'}`}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6">
            <div>
              <span className="bg-amber-100 text-amber-700 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full mb-4 inline-block">{selectedClass.isFinished ? "ARSIP KELAS" : "DASHBOARD KELAS"}</span>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-[1.1] mb-2">{selectedClass.name}</h1>
              <p className="text-slate-500 font-medium">Pengajar Utama: <span className="font-bold text-slate-800">{selectedClass.pengajar || selectedClass.waliKelas || "Belum Ditentukan"}</span></p>
            </div>
            
            <div className="flex flex-col gap-3 min-w-[250px]">
               {!selectedClass.isFinished && (
                 <button onClick={() => setIsLinkModalOpen(true)} className="text-xs font-bold text-slate-400 hover:text-amber-600 text-right cursor-pointer w-fit self-end">
                   Edit Jalur Komunikasi
                 </button>
               )}
               
               {/* Container Tombol Komunikasi (Bisa 1 atau 2 tombol berderet ke bawah) */}
               <div className="flex flex-col gap-2">
                 
                 {/* TOMBOL WHATSAPP (Muncul jika link ada) */}
                 {selectedClass.waGroupLink && (
                   <a href={selectedClass.waGroupLink} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-[#E8F8F5] text-[#0E6655] p-3 rounded-xl border border-[#A3E4D7] hover:bg-[#D1F2EB] transition group cursor-pointer shadow-sm">
                      <div className="bg-[#1ABC9C] text-white p-1.5 rounded-lg group-hover:scale-110 transition"><MessageCircle size={16}/></div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest leading-none">Grup WhatsApp</p>
                        <p className="text-[10px] opacity-80 mt-1">Buka Grup Komunikasi</p>
                      </div>
                   </a>
                 )}

                 {/* TOMBOL ZOOM (Muncul jika link ada) */}
                 {selectedClass.zoomLink && (
                   <a href={selectedClass.zoomLink} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-blue-50 text-blue-700 p-3 rounded-xl border border-blue-200 hover:bg-blue-100 transition group cursor-pointer shadow-sm">
                      <div className="bg-blue-600 text-white p-1.5 rounded-lg group-hover:scale-110 transition"><Video size={16}/></div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest leading-none">Live Class Zoom</p>
                        <p className="text-[10px] opacity-80 mt-1">Masuk Ruang Virtual</p>
                      </div>
                   </a>
                 )}

                 {/* PESAN JIKA KEDUANYA KOSONG */}
                 {(!selectedClass.waGroupLink && !selectedClass.zoomLink) && (
                   <div className="text-right p-3 border border-dashed border-slate-200 rounded-xl bg-slate-50">
                     <p className="text-xs font-medium text-slate-400 italic">Jalur komunikasi belum diatur.</p>
                   </div>
                 )}

               </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
           <div className="flex flex-1 w-full gap-4">
             <div className="relative flex-1 max-w-sm">
               <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Cari materi..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all font-medium" />
             </div>
             <div className="relative">
               <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
               <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none cursor-pointer hover:bg-slate-100 transition-colors appearance-none">
                 <option value="SEMUA">Semua Status</option>
                 <option value="PUBLISHED">Published Saja</option>
                 <option value="DRAFT">Draft Saja</option>
               </select>
             </div>
           </div>
           
           {!selectedClass.isFinished && (
             <div className="flex gap-2 w-full md:w-auto">
               <button onClick={() => setIsCopyModalOpen(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-sm cursor-pointer"><Copy size={16}/> Copy Materi</button>
               <button onClick={() => { setCurrentMaterial({}); setIsModalOpen(true); }} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-amber-500 rounded-xl hover:bg-amber-600 transition shadow-sm cursor-pointer"><Plus size={16}/> Tambah Materi</button>
             </div>
           )}
        </div>

        {filteredMaterials.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-3xl border border-slate-200 border-dashed shadow-inner">
             <MonitorPlay size={48} className="mx-auto text-slate-300 mb-4" />
             <h3 className="text-lg font-black text-slate-600 mb-1">Belum Ada Materi</h3>
             <p className="text-sm text-slate-400 font-medium max-w-sm mx-auto">Upload video rekaman atau instruksi tugas pertama Anda untuk kelas ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMaterials.map((m, index) => {
              const thumb = getYoutubeThumbnail(m.youtubeLink);
              return (
                <div key={m.id} className={`bg-white rounded-2xl overflow-hidden border transition-all duration-300 group flex flex-col ${m.isPublished ? 'border-slate-200 shadow-sm hover:shadow-xl' : 'border-slate-200 opacity-75 grayscale-[30%]'}`}>
                  
                  <div className="h-44 bg-slate-900 relative shrink-0">
                    {thumb ? (
                      <img src={thumb} alt={m.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900"><BookOpen size={48} className="text-slate-700" /></div>
                    )}
                    
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="px-2 py-1 bg-slate-900/80 backdrop-blur-sm text-white rounded text-[10px] font-black border border-white/20">#{index + 1}</span>
                      <span className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-widest shadow-sm ${m.isPublished ? 'bg-emerald-500 text-white' : 'bg-slate-600 text-slate-200'}`}>
                        {m.isPublished ? "Published" : "Draft"}
                      </span>
                    </div>

                    {thumb && (
                      <a href={m.youtubeLink} target="_blank" rel="noreferrer" className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/20 backdrop-blur-[2px] transition-all cursor-pointer">
                        <PlayCircle size={48} className="text-white shadow-xl rounded-full" />
                      </a>
                    )}
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="text-lg font-black text-slate-800 leading-tight mb-2 line-clamp-2" title={m.title}>{m.title}</h3>
                    <p className="text-xs text-slate-500 font-medium line-clamp-2 mb-4 leading-relaxed flex-1">{m.description || "Tidak ada deskripsi."}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                       {m.youtubeLink && (
                         <a href={m.youtubeLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest bg-rose-50 text-rose-600 hover:bg-rose-100 px-2 py-1 rounded-md transition-colors border border-rose-100 cursor-pointer">
                           <MonitorPlay size={14}/> Cek Video
                         </a>
                       )}
                       {m.fileUrl && (
                         <a href={m.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-1 rounded-md transition-colors border border-blue-100 cursor-pointer">
                           <FileText size={14}/> Lampiran Modul
                         </a>
                       )}
                    </div>
                    
                    <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                      {!selectedClass.isFinished && (
                        <div className="flex gap-1 bg-slate-50 border border-slate-100 rounded-lg p-1">
                          <button onClick={() => moveMaterial(index, 'UP')} disabled={index === 0} className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"><ChevronUp size={16}/></button>
                          <button onClick={() => moveMaterial(index, 'DOWN')} disabled={index === materials.length - 1} className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"><ChevronDown size={16}/></button>
                        </div>
                      )}
                      
                      <div className="flex gap-1 ml-auto">
                        <button onClick={() => handleTogglePublish(m.id, m.isPublished)} className={`p-2 rounded-lg transition-colors cursor-pointer ${m.isPublished ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' : 'text-slate-500 bg-slate-100 hover:bg-slate-200'}`} title={m.isPublished ? "Sembunyikan" : "Tampilkan"}>{m.isPublished ? <Eye size={16}/> : <EyeOff size={16}/>}</button>
                        {!selectedClass.isFinished && (
                          <>
                            <button onClick={() => {setCurrentMaterial(m); setIsModalOpen(true);}} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"><Edit3 size={16}/></button>
                            <button onClick={() => handleDelete(m.id)} className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"><Trash2 size={16}/></button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Fragment>
  );
}