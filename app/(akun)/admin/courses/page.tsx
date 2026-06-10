"use client";

import { useState, useMemo, useEffect, Fragment } from 'react';
import { 
  Search, Plus, Edit3, Trash2, ChevronLeft, ChevronRight, Filter,
  Loader2, X, Save, BookOpen, Users, Library, PieChart, UserPlus, MessageCircle
} from 'lucide-react';
import { getClassesDB, saveClassDB, deleteClassDB, deleteClassMassalDB, getStudentsForPlottingDB, updateClassEnrollmentDB } from './actions';

interface Kelas {
  id: string; nama: string; waliKelas: string; kapasitas: number; jumlahSiswa: number; waGroupLink: string;
}

export default function ManajemenKelasPage() {
  const [classes, setClasses] = useState<Kelas[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Filter
  const [filterWaliKelas, setFilterWaliKelas] = useState("Semua");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"CREATE" | "EDIT" | "PLOT">("CREATE");
  const [currentClass, setCurrentClass] = useState<any>({});
  
  // Plotting State
  const [plottingStudents, setPlottingStudents] = useState<any[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [plotSearchQuery, setPlotSearchQuery] = useState(""); // <-- State baru untuk pencarian di dalam modal

  const loadData = async () => {
    setIsLoading(true);
    const res = await getClassesDB();
    if (res.success && res.data) setClasses(res.data as Kelas[]);
    setIsLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const waliKelasOptions = Array.from(new Set(classes.map(c => c.waliKelas))).filter(w => w !== "Belum Ditentukan").sort();

  const filteredData = useMemo(() => {
    return classes.filter(c => {
      const matchSearch = c.nama.toLowerCase().includes(searchQuery.toLowerCase()) || c.waliKelas.toLowerCase().includes(searchQuery.toLowerCase());
      const matchWali = filterWaliKelas === "Semua" || c.waliKelas === filterWaliKelas;
      return matchSearch && matchWali;
    });
  }, [classes, searchQuery, filterWaliKelas]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Filter khusus untuk di dalam modal plotting
  const filteredPlottingStudents = useMemo(() => {
    return plottingStudents.filter(student => 
      student.nama.toLowerCase().includes(plotSearchQuery.toLowerCase()) || 
      student.nis.toLowerCase().includes(plotSearchQuery.toLowerCase())
    );
  }, [plottingStudents, plotSearchQuery]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(paginatedData.map(c => c.id));
    else setSelectedIds([]);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleDelete = async (id: string, nama: string) => {
    if(confirm(`Hapus permanen rombel/halaqah ${nama}? Data santri aman, hanya akan kehilangan status keanggotaan di kelas ini.`)) {
      setIsLoading(true);
      await deleteClassDB(id);
      await loadData();
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleBulkDelete = async () => {
    if(confirm(`Hapus permanen ${selectedIds.length} kelas terpilih?`)) {
      setIsLoading(true);
      await deleteClassMassalDB(selectedIds);
      await loadData();
      setSelectedIds([]);
    }
  };

  const openModal = async (type: "CREATE" | "EDIT" | "PLOT", data: any = {}) => {
    setModalType(type);
    setCurrentClass(data);
    setPlotSearchQuery(""); // Reset pencarian saat modal dibuka
    
    if (type === "CREATE") {
      setCurrentClass({ kapasitas: 30 });
    } else if (type === "PLOT") {
      setIsLoading(true);
      const res = await getStudentsForPlottingDB(data.id);
      if (res.success && res.data) {
        setPlottingStudents(res.data);
        setSelectedStudentIds(res.data.filter((s: any) => s.isEnrolled).map((s: any) => s.id));
      }
      setIsLoading(false);
    }
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  
  if (modalType === "PLOT") {
    await updateClassEnrollmentDB(currentClass.id, selectedStudentIds);
  } else {
    // Pastikan kapasitas dikirim sebagai angka
    const dataToSave = { 
      ...currentClass, 
      kapasitas: Number(currentClass.kapasitas) 
    };
    const res = await saveClassDB(dataToSave, modalType === "EDIT" ? currentClass.id : undefined);
    if (!res.success) alert(res.error);
  }
  
  setIsModalOpen(false);
  await loadData(); // <--- BARIS INI WAJIB ADA untuk menarik data baru dari DB
  setIsLoading(false);
};

  const toggleStudentPlotting = (id: string) => {
    setSelectedStudentIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const totalSiswa = classes.reduce((sum, c) => sum + c.jumlahSiswa, 0);
  const totalKapasitas = classes.reduce((sum, c) => sum + Number(c.kapasitas || 0), 0);
  const persentasePenuh = totalKapasitas === 0 ? 0 : Math.round((totalSiswa / totalKapasitas) * 100);

  return (
    <Fragment>
      {isLoading && (
        <div className="fixed inset-0 z-[120] bg-white/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white px-5 py-3 rounded-xl shadow-lg border border-slate-100 flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-violet-600 animate-spin" />
            <span className="font-bold text-slate-700 text-sm">Menyinkronkan data...</span>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer" onClick={() => setIsModalOpen(false)}></div>
          <div className={`bg-white rounded-3xl shadow-2xl w-full ${modalType === 'PLOT' ? 'max-w-2xl' : 'max-w-lg'} overflow-hidden relative z-10 animate-in zoom-in-95 duration-200`}>
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-black text-slate-800">
                {modalType === "CREATE" ? "Tambah Modul/Kelas Baru" : modalType === "EDIT" ? "Edit Modul/Kelas" : `Kelola Peserta: ${currentClass.nama}`}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded-xl transition-colors cursor-pointer"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={handleSaveModal} className="p-6 space-y-5">
              {modalType === "PLOT" ? (
                <div className="space-y-4">
                  <div className="bg-violet-50 text-violet-700 p-3 rounded-xl text-sm font-bold flex justify-between items-center border border-violet-100">
                    <span>Kapasitas: {currentClass.kapasitas} Santri</span>
                    <span>Terpilih: {selectedStudentIds.length} Santri</span>
                  </div>
                  
                  {/* KOLOM PENCARIAN SANTRI DI DALAM MODAL */}
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Cari nama atau NIS santri..." 
                      value={plotSearchQuery}
                      onChange={(e) => setPlotSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-sm font-medium transition-all"
                    />
                  </div>

                  <div className="max-h-[300px] overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                    {filteredPlottingStudents.length === 0 ? (
                      <p className="p-4 text-center text-slate-500 font-medium text-sm">Tidak ada santri yang cocok dengan pencarian.</p>
                    ) : (
                      filteredPlottingStudents.map(student => (
                        <label key={student.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer transition-colors group">
                          <input type="checkbox" checked={selectedStudentIds.includes(student.id)} onChange={() => toggleStudentPlotting(student.id)} className="w-4 h-4 rounded border-slate-300 text-violet-600 focus:ring-violet-500 cursor-pointer"/>
                          <div>
                            <p className="text-sm font-bold text-slate-800 group-hover:text-violet-700 transition-colors">{student.nama}</p>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">NIS: {student.nis}</p>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Nama Kelas / Halaqah</label>
                    <input type="text" placeholder="Contoh: Kelas A - Arabiyyah Baina Yadaik" value={currentClass.nama || ""} onChange={e => setCurrentClass({...currentClass, nama: e.target.value})} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-sm font-medium transition-all"/>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 mb-1 block">Pengajar / Wali Kelas</label>
                      <input type="text" placeholder="Ustadz Zaid" value={currentClass.waliKelas || ""} onChange={e => setCurrentClass({...currentClass, waliKelas: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-sm font-medium transition-all"/>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 mb-1 block">Kapasitas Maksimal</label>
                      <input type="number" min="1" value={currentClass.kapasitas || ""} onChange={e => setCurrentClass({...currentClass, kapasitas: Number(e.target.value)})} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-sm font-medium transition-all"/>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Link Group WhatsApp Kelas</label>
                    <input type="url" placeholder="https://chat.whatsapp.com/..." value={currentClass.waGroupLink || ""} onChange={e => setCurrentClass({...currentClass, waGroupLink: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-sm font-medium transition-all placeholder:text-slate-300"/>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">Batal</button>
                <button type="submit" className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-violet-600 rounded-xl hover:bg-violet-700 shadow-md shadow-violet-200 transition-colors cursor-pointer"><Save className="w-4 h-4"/> Simpan Data</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-violet-50 border border-violet-100 rounded-2xl flex items-center justify-center text-violet-600 shadow-sm">
              <Library className="w-7 h-7" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Akademik & Rombel</h2>
              <p className="text-sm text-slate-500 font-medium mt-0.5">Kelola modul kelas, penempatan santri, dan grup komunikasi.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => openModal("CREATE")} className="flex items-center gap-2 bg-violet-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-violet-700 transition-all text-sm shadow-md shadow-violet-200 cursor-pointer">
              <Plus className="w-4 h-4" strokeWidth={3} /> Buat Kelas Baru
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-violet-300 transition-colors">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><BookOpen size={24}/></div>
            <div>
              <p className="text-sm font-bold text-slate-500">Total Modul/Kelas</p>
              <p className="text-2xl font-black text-slate-900">{classes.length} <span className="text-sm font-medium text-slate-400">Rombel</span></p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-violet-300 transition-colors">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><Users size={24}/></div>
            <div>
              <p className="text-sm font-bold text-slate-500">Total Santri Enroll</p>
              <p className="text-2xl font-black text-slate-900">{totalSiswa} <span className="text-sm font-medium text-slate-400">Kursi</span></p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:border-violet-300 transition-colors">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center"><PieChart size={24}/></div>
            <div>
              <p className="text-sm font-bold text-slate-500">Kapasitas Terisi</p>
              <p className="text-2xl font-black text-slate-900">{persentasePenuh}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
          {selectedIds.length > 0 ? (
            <div className="p-4 bg-violet-50 border-b border-violet-100 flex justify-between items-center">
              <div className="flex items-center gap-3 text-violet-700">
                <span className="bg-violet-600 text-white text-xs font-black px-2.5 py-1 rounded-lg shadow-sm">{selectedIds.length} Terpilih</span>
              </div>
              <button onClick={handleBulkDelete} className="flex items-center gap-2 px-4 py-2 bg-white text-rose-600 border border-rose-200 rounded-lg text-sm font-bold hover:bg-rose-50 transition-all cursor-pointer shadow-sm">
                <Trash2 className="w-4 h-4" /> Hapus Massal
              </button>
            </div>
          ) : (
            <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between gap-4 bg-slate-50/50">
              <div className="relative w-full md:max-w-md group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-violet-600 transition-colors" />
                <input type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} placeholder="Cari nama kelas atau pengajar..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 font-medium placeholder:text-slate-400 shadow-sm transition-all" />
              </div>
              
              <div className="relative">
                <button onClick={() => setIsFilterOpen(!isFilterOpen)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all border cursor-pointer ${filterWaliKelas !== "Semua" ? "bg-violet-50 border-violet-200 text-violet-700" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
                  <Filter className="w-4 h-4" /> Filter Pengajar
                </button>
                {isFilterOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-slate-100 p-4 z-20">
                     <label className="text-xs font-bold text-slate-500 mb-2 block">Pilih Wali Kelas</label>
                     <select value={filterWaliKelas} onChange={(e) => {setFilterWaliKelas(e.target.value); setIsFilterOpen(false); setCurrentPage(1);}} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none cursor-pointer">
                       <option value="Semua">Semua Pengajar</option>
                       {waliKelasOptions.map(w => <option key={w} value={w}>{w}</option>)}
                     </select>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-white sticky top-0 shadow-[0_1px_2px_rgba(0,0,0,0.04)] z-10">
                <tr className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                  <th className="px-5 py-4 w-12 text-center"><input type="checkbox" onChange={handleSelectAll} checked={paginatedData.length > 0 && selectedIds.length === paginatedData.length} className="w-4 h-4 rounded border-slate-300 text-violet-600 cursor-pointer" /></th>
                  <th className="px-4 py-4 min-w-[220px]">Identitas Kelas & Info</th>
                  <th className="px-4 py-4">Pengajar Utama</th>
                  <th className="px-4 py-4 text-center">Rasio Kapasitas</th>
                  <th className="px-4 py-4 text-center">Status Enrollment</th>
                  <th className="px-5 py-4 text-right">Manajemen Peserta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {paginatedData.map((kelas) => {
                  const isSelected = selectedIds.includes(kelas.id);
                  const isFull = kelas.jumlahSiswa >= kelas.kapasitas;
                  const ratio = Math.min((kelas.jumlahSiswa / kelas.kapasitas) * 100, 100);

                  return (
                    <tr key={kelas.id} className={`transition-colors ${isSelected ? 'bg-violet-50/40' : 'hover:bg-slate-50/70'}`}>
                      <td className="px-5 py-4 text-center"><input type="checkbox" checked={isSelected} onChange={() => toggleSelect(kelas.id)} className="w-4 h-4 rounded border-slate-300 text-violet-600 cursor-pointer" /></td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-700 font-black text-xs flex items-center justify-center shrink-0 border border-violet-100/50 uppercase">
                            {kelas.nama.substring(0, 3)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{kelas.nama}</p>
                            <div className="mt-1 flex items-center gap-2">
                               {kelas.waGroupLink ? (
                                  <a href={kelas.waGroupLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100/50 px-1.5 py-0.5 rounded hover:bg-emerald-100 transition"><MessageCircle className="w-3 h-3"/> Grup Aktif</a>
                               ) : (
                                  <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest bg-slate-100 text-slate-500 border border-slate-200/50 px-1.5 py-0.5 rounded"><MessageCircle className="w-3 h-3"/> No Link WA</span>
                               )}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-4 py-4">
                        <p className="text-sm font-bold text-slate-700">{kelas.waliKelas}</p>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex flex-col items-center gap-1.5">
                          <p className="text-[11px] font-bold text-slate-500"><span className="text-slate-900 text-sm">{kelas.jumlahSiswa}</span> / {kelas.kapasitas} Santri</p>
                          <div className="w-28 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                             <div className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-rose-500' : ratio > 80 ? 'bg-amber-400' : 'bg-emerald-500'}`} style={{ width: `${ratio}%` }}></div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${
                          isFull ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        }`}>{isFull ? 'KELAS PENUH' : 'TERSEDIA'}</span>
                      </td>
                      
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openModal("PLOT", kelas)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-emerald-100" title="Plotting Peserta (Assign Santri)"><UserPlus className="w-4 h-4" /></button>
                          <button onClick={() => openModal("EDIT", kelas)} className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-violet-100" title="Edit Kelas"><Edit3 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(kelas.id, kelas.nama)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-rose-100" title="Hapus Kelas"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-4 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs font-bold text-slate-500">
              Menampilkan <span className="text-slate-900">{paginatedData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> - <span className="text-slate-900">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> dari <span className="text-slate-900">{filteredData.length}</span> Kelas
            </p>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="flex gap-1 px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-all cursor-pointer"><ChevronLeft className="w-4 h-4" /> Prev</button>
              <div className="px-3 py-1.5 text-xs font-black text-slate-800 bg-slate-100 rounded-lg">{currentPage} / {totalPages || 1}</div>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="flex gap-1 px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-all cursor-pointer">Next <ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
}