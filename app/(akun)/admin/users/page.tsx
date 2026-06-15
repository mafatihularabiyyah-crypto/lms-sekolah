"use client";

import { useState, useMemo, useEffect, useRef, Fragment } from 'react';
import { 
  Search, Plus, Edit3, Trash2, UploadCloud, ChevronLeft, ChevronRight, 
  CheckCircle2, XCircle, Database, Loader2, KeySquare, FileSpreadsheet, 
  X, Save, MessageCircle, Briefcase, UserSquare2
} from 'lucide-react';
import { getGuruDB, deleteGuruDB, deleteGuruMassalDB, saveGuruDB, updateAksesGuruDB, importGuruMassalDB } from './actions';

interface Guru {
  id: string; nip: string; nama: string; jk: string; mapel: string; 
  telepon: string; alamat: string; status: string; email: string | null;
}

export default function DirektoriGuruPage() {
  const [teachers, setTeachers] = useState<Guru[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [filterMapel, setFilterMapel] = useState("Semua");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"CREATE" | "EDIT" | "AKSES">("CREATE");
  const [currentTeacher, setCurrentTeacher] = useState<any>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    setIsLoading(true);
    const res = await getGuruDB();
    if (res.success && res.data) setTeachers(res.data as unknown as Guru[]);
    setIsLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const mapelOptions = Array.from(new Set(teachers.map(g => g.mapel))).filter(m => m !== "-").sort();
  
  const filteredData = useMemo(() => {
    return teachers.filter(g => {
      const matchSearch = g.nama.toLowerCase().includes(searchQuery.toLowerCase()) || g.nip.includes(searchQuery);
      const matchStatus = filterStatus === "Semua" || g.status === filterStatus;
      const matchMapel = filterMapel === "Semua" || g.mapel === filterMapel;
      return matchSearch && matchStatus && matchMapel;
    });
  }, [teachers, searchQuery, filterStatus, filterMapel]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(paginatedData.map(g => g.id));
    else setSelectedIds([]);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleDelete = async (id: string, nama: string) => {
    if(confirm(`Hapus permanen data guru ${nama}?`)) {
      setIsLoading(true);
      await deleteGuruDB(id);
      await loadData();
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleBulkDelete = async () => {
    if(confirm(`Hapus permanen ${selectedIds.length} guru terpilih?`)) {
      setIsLoading(true);
      await deleteGuruMassalDB(selectedIds);
      await loadData();
      setSelectedIds([]);
    }
  };

  const openModal = (type: "CREATE" | "EDIT" | "AKSES", data: any = {}) => {
    setModalType(type);
    if (type === "CREATE") {
      setCurrentTeacher({ jk: "L", status: "Aktif", mapel: "" });
    } else {
      setCurrentTeacher(data);
    }
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    let res;
    if (modalType === "AKSES") {
      res = await updateAksesGuruDB(currentTeacher.id, currentTeacher.email, currentTeacher.password);
    } else {
      res = await saveGuruDB(currentTeacher, modalType === "EDIT" ? currentTeacher.id : undefined);
    }
    
    setIsLoading(false);

    // PERBAIKAN 2: Jangan tutup modal jika gagal, tampilkan pesan peringatan
    if (res?.success) {
      setIsModalOpen(false);
      await loadData();
    } else {
      alert((res as any)?.error || "Terjadi kesalahan saat menyimpan data ke database.");
    }
  };

  const handleDownloadTemplate = () => {
    const headers = "NIP,NamaLengkap,Email,Password,JK,Mapel,NoHP,Alamat,Status\n";
    const example = "19800101,Ustadz Ahmad,ahmad@sekolah.com,guru123,L,Fiqih,0812345678,Jl. Pesantren No.1,Aktif\n";
    const blob = new Blob([headers + example], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `Template_Import_Guru.csv`; link.click();
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      setIsLoading(true);
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      const newGuruData = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length >= 2) {
          newGuruData.push({
            NIP: values[0], Nama: values[1], Email: values[2], Password: values[3], JK: values[4], 
            Mapel: values[5], NoHP: values[6], Alamat: values[7], Status: values[8]
          });
        }
      }
      await importGuruMassalDB(newGuruData);
      await loadData();
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const getWhatsAppLink = (phone: string) => {
    if (!phone || phone === "-") return "#";
    let formatted = phone.replace(/\D/g, "");
    if (formatted.startsWith("0")) formatted = "62" + formatted.substring(1);
    return `https://wa.me/${formatted}`;
  };

  return (
    <Fragment>
      {/* LOADING OVERLAY */}
      {isLoading && (
        <div className="fixed inset-0 z-[120] bg-white/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white px-5 py-3 rounded-xl shadow-lg border border-slate-100 flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
            <span className="font-bold text-slate-700 text-sm">Sistem sedang memproses...</span>
          </div>
        </div>
      )}

      {/* MODAL FORM (AKSES, EDIT, CREATE) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-black text-slate-800">
                {modalType === "CREATE" ? "Tambah Guru Baru" : modalType === "EDIT" ? "Edit Data Guru" : "Atur Akses Login"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded-xl transition-colors cursor-pointer"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={handleSaveModal} className="p-6 space-y-5">
              {modalType === "AKSES" ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Email Guru</label>
                    <input type="email" value={currentTeacher.email || ""} onChange={e => setCurrentTeacher({...currentTeacher, email: e.target.value})} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-medium text-slate-800 text-sm"/>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Kata Sandi Baru</label>
                    <input type="password" placeholder="Minimal 6 karakter" onChange={e => setCurrentTeacher({...currentTeacher, password: e.target.value})} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-medium text-slate-800 text-sm"/>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Nama Lengkap & Gelar</label>
                    <input type="text" placeholder="Contoh: Ustadz Fulan, S.Pd." value={currentTeacher.nama || ""} onChange={e => setCurrentTeacher({...currentTeacher, nama: e.target.value})} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm"/>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">NIP / NUPTK</label>
                    <input type="text" value={currentTeacher.nip || ""} onChange={e => setCurrentTeacher({...currentTeacher, nip: e.target.value})} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm"/>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Jenis Kelamin</label>
                    <select value={currentTeacher.jk || "L"} onChange={e => setCurrentTeacher({...currentTeacher, jk: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm cursor-pointer">
                      <option value="L">Laki-Laki</option><option value="P">Perempuan</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Mata Pelajaran (Spesialisasi)</label>
                    <input type="text" placeholder="Contoh: Fiqih, Matematika" value={currentTeacher.mapel || ""} onChange={e => setCurrentTeacher({...currentTeacher, mapel: e.target.value})} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm"/>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Status Kepegawaian</label>
                    <select value={currentTeacher.status || "Aktif"} onChange={e => setCurrentTeacher({...currentTeacher, status: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm cursor-pointer">
                      <option value="Aktif">Aktif</option><option value="Cuti">Cuti</option><option value="Nonaktif">Nonaktif / Resign</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Nomor WhatsApp Aktif</label>
                    <input type="text" placeholder="Contoh: 0812345678" value={currentTeacher.telepon || ""} onChange={e => setCurrentTeacher({...currentTeacher, telepon: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm"/>
                  </div>
                  
                  {modalType === "CREATE" && (
                    <div className="col-span-2 border-t border-slate-100 pt-4 mt-2">
                      <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-3">Setup Akun Portal Guru</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">Email Akun</label>
                          <input type="email" placeholder="Kosong = Auto Generate" value={currentTeacher.email || ""} onChange={e => setCurrentTeacher({...currentTeacher, email: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm"/>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">Password Awal</label>
                          <input type="text" placeholder="guru123" value={currentTeacher.password || ""} onChange={e => setCurrentTeacher({...currentTeacher, password: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-sm"/>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">Batal</button>
                <button type="submit" className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-md shadow-blue-200 transition-colors cursor-pointer"><Save className="w-4 h-4"/> Simpan Data Guru</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KONTEN HALAMAN UTAMA */}
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header Title & Actions */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm">
              <UserSquare2 className="w-7 h-7" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Direktori Tenaga Pendidik</h2>
              <p className="text-sm text-slate-500 font-medium mt-0.5">Kelola profil ustadz/guru dan akses login mereka.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button onClick={handleDownloadTemplate} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition-all text-sm shadow-sm cursor-pointer">
              <FileSpreadsheet className="w-4 h-4" /> Unduh Template
            </button>
            <input type="file" accept=".csv" ref={fileInputRef} onChange={handleImportCSV} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-white border border-blue-200 text-blue-700 px-4 py-2.5 rounded-xl font-bold hover:bg-blue-50 transition-all text-sm shadow-sm cursor-pointer">
              <UploadCloud className="w-4 h-4" /> Import CSV
            </button>
            <button onClick={() => openModal("CREATE")} className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all text-sm shadow-md shadow-blue-200 cursor-pointer">
              <Plus className="w-4 h-4" strokeWidth={3} /> Tambah Guru
            </button>
          </div>
        </div>

        {/* Main Table Container */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
          
          {/* Toolbar Search & Bulk Actions */}
          {selectedIds.length > 0 ? (
            <div className="p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
              <div className="flex items-center gap-3 text-blue-700">
                <span className="bg-blue-600 text-white text-xs font-black px-2.5 py-1 rounded-lg shadow-sm">{selectedIds.length} Terpilih</span>
              </div>
              <button onClick={handleBulkDelete} className="flex items-center gap-2 px-4 py-2 bg-white text-rose-600 border border-rose-200 rounded-lg text-sm font-bold hover:bg-rose-50 transition-all cursor-pointer shadow-sm">
                <Trash2 className="w-4 h-4" /> Hapus Massal
              </button>
            </div>
          ) : (
            <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between gap-4 bg-slate-50/50">
              <div className="relative w-full md:max-w-md group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <input type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} placeholder="Cari nama atau NIP guru..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium placeholder:text-slate-400 shadow-sm transition-all" />
              </div>
              
              <div className="flex gap-2">
                 <select value={filterMapel} onChange={(e) => {setFilterMapel(e.target.value); setCurrentPage(1);}} className="bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer shadow-sm transition-all">
                   <option value="Semua">Semua Mata Pelajaran</option>
                   {mapelOptions.map(m => <option key={m} value={m}>{m}</option>)}
                 </select>
                 <select value={filterStatus} onChange={(e) => {setFilterStatus(e.target.value); setCurrentPage(1);}} className="bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer shadow-sm transition-all">
                   <option value="Semua">Semua Status</option>
                   <option value="Aktif">Aktif</option>
                   <option value="Cuti">Cuti</option>
                   <option value="Nonaktif">Nonaktif</option>
                 </select>
              </div>
            </div>
          )}

          {/* Table Data */}
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-white sticky top-0 shadow-[0_1px_2px_rgba(0,0,0,0.04)] z-10">
                <tr className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                  <th className="px-5 py-4 w-12 text-center"><input type="checkbox" onChange={handleSelectAll} checked={paginatedData.length > 0 && selectedIds.length === paginatedData.length} className="w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer" /></th>
                  <th className="px-2 py-4 w-12 text-center">No</th>
                  <th className="px-4 py-4 min-w-[280px]">Profil Pendidik</th>
                  <th className="px-4 py-4 min-w-[220px]">Kontak & Spesialisasi</th>
                  <th className="px-4 py-4 text-center">Status</th>
                  <th className="px-5 py-4 text-right">Manajemen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {paginatedData.map((guru, idx) => {
                  const isSelected = selectedIds.includes(guru.id);
                  const waLink = getWhatsAppLink(guru.telepon);

                  return (
                    <tr key={guru.id} className={`transition-colors ${isSelected ? 'bg-blue-50/40' : 'hover:bg-slate-50/70'}`}>
                      <td className="px-5 py-4 text-center"><input type="checkbox" checked={isSelected} onChange={() => toggleSelect(guru.id)} className="w-4 h-4 rounded border-slate-300 text-blue-600 cursor-pointer" /></td>
                      <td className="px-2 py-4 text-center text-sm font-bold text-slate-400">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-100 to-indigo-50 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 border border-blue-100/50">
                            {guru.nama.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{guru.nama}</p>
                            <p className="text-[11px] font-bold text-slate-500 mt-0.5">NIP: {guru.nip}</p>
                            {guru.email ? (
                              <span className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-50 text-emerald-600 border border-emerald-100/50"><CheckCircle2 className="w-3 h-3"/> Akun Terhubung</span>
                            ) : (
                              <span className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-500 border border-slate-200/50"><XCircle className="w-3 h-3"/> Belum Ada Akun</span>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-4 py-4">
                        <div className="flex flex-col items-start gap-1">
                          <a href={waLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 bg-green-50 hover:bg-green-100 text-green-700 px-2.5 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer border border-green-200/50 shadow-sm">
                            <MessageCircle className="w-3.5 h-3.5" /> {guru.telepon !== "-" ? guru.telepon : "Input No WA"}
                          </a>
                          <p className="text-[11px] font-bold text-slate-600 flex items-center gap-1 mt-1 bg-slate-100 px-2 py-0.5 rounded"><Briefcase className="w-3 h-3 text-slate-400"/> {guru.mapel}</p>
                        </div>
                      </td>
                      
                      <td className="px-4 py-4 text-center">
                        <span className={`inline-flex px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${
                          guru.status === 'Aktif' ? 'bg-blue-50 text-blue-600 border-blue-200' : 
                          guru.status === 'Cuti' ? 'bg-amber-50 text-amber-600 border-amber-200' : 
                          'bg-slate-50 text-slate-500 border-slate-200'
                        }`}>{guru.status}</span>
                      </td>
                      
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openModal("AKSES", guru)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-blue-100" title="Atur Login"><KeySquare className="w-4 h-4" /></button>
                          <button onClick={() => openModal("EDIT", guru)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-indigo-100" title="Edit Profil"><Edit3 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(guru.id, guru.nama)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-rose-100" title="Hapus Permanen"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-5 py-4 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs font-bold text-slate-500">
              Menampilkan <span className="text-slate-900">{paginatedData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> - <span className="text-slate-900">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> dari <span className="text-slate-900">{filteredData.length}</span> Guru
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