"use client";

import { useState, useMemo, useEffect, useRef, Fragment } from 'react';
import { 
  Search, Filter, Plus, Edit3, Trash2, UploadCloud, 
  ChevronLeft, ChevronRight, CheckCircle2, XCircle, 
  Database, Loader2, KeySquare, FileSpreadsheet, X, Save,
  MessageCircle, Briefcase, GraduationCap
} from 'lucide-react';
import { getSiswaDB, deleteSiswaDB, deleteSiswaMassalDB, saveSiswaDB, updateAksesSiswaDB, importSiswaMassalDB, luluskanSiswaMassalDB } from './actions';

interface Siswa {
  id: string; nis: string; nama: string; jk: string; kelas: string; 
  ortu: string; telepon: string; alamat: string; status: string; kesibukan: string; email: string | null;
}

export default function ManajemenSiswaPage() {
  const [students, setStudents] = useState<Siswa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [filterKelas, setFilterKelas] = useState("Semua");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"CREATE" | "EDIT" | "AKSES">("CREATE");
  const [currentStudent, setCurrentStudent] = useState<any>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    setIsLoading(true);
    // PERBAIKAN 1: Hapus hardcode email, biarkan backend mendeteksinya otomatis
    const res = await getSiswaDB();
    if (res?.success && res?.data) setStudents(res.data as Siswa[]);
    setIsLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const kelasOptions = Array.from(new Set(students.map(s => s.kelas))).sort();
  
  const filteredData = useMemo(() => {
    return students.filter(s => {
      const matchSearch = s.nama.toLowerCase().includes(searchQuery.toLowerCase()) || s.nis.includes(searchQuery);
      const matchStatus = filterStatus === "Semua" || s.status === filterStatus;
      const matchKelas = filterKelas === "Semua" || s.kelas === filterKelas;
      return matchSearch && matchStatus && matchKelas;
    });
  }, [students, searchQuery, filterStatus, filterKelas]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(paginatedData.map(s => s.id));
    else setSelectedIds([]);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleDelete = async (id: string, nama: string) => {
    if(confirm(`Hapus permanen data santri ${nama}?`)) {
      setIsLoading(true);
      await deleteSiswaDB(id);
      await loadData();
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleBulkDelete = async () => {
    if(confirm(`Hapus permanen ${selectedIds.length} santri terpilih?`)) {
      setIsLoading(true);
      await deleteSiswaMassalDB(selectedIds);
      await loadData();
      setSelectedIds([]);
    }
  };

  const handleBulkLulus = async () => {
    if(confirm(`Ubah status ${selectedIds.length} santri terpilih menjadi LULUS?`)) {
      setIsLoading(true);
      await luluskanSiswaMassalDB(selectedIds);
      await loadData();
      setSelectedIds([]);
    }
  };

  const openModal = (type: "CREATE" | "EDIT" | "AKSES", data: any = {}) => {
    setModalType(type);
    if (type === "CREATE") {
      setCurrentStudent({ jk: "L", status: "Aktif", kelas: new Date().getFullYear().toString(), kesibukan: "Santri Reguler" });
    } else {
      setCurrentStudent(data);
    }
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setIsModalOpen(false);
    
    if (modalType === "AKSES") {
      await updateAksesSiswaDB(currentStudent.id, currentStudent.email, currentStudent.password);
    } else {
      // PERBAIKAN 2: Hanya kirim currentStudent. Backend akan mengurus sisanya.
      const res = await saveSiswaDB(currentStudent);
      if (!res.success) {
        alert(res.error);
      }
    }
    await loadData();
  };

  const handleDownloadTemplate = () => {
    const headers = "NIS,NamaLengkap,Email,Password,JK,Kelas,NamaWali,NoHP,Alamat,Status\n";
    const example = "2026001,Ahmad Fulan,ahmad@email.com,rahasia123,L,2026,Bapak Fulan,08123456,Jl. Mawar No.1,Aktif\n";
    const blob = new Blob([headers + example], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `Template_Import_Siswa.csv`; link.click();
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      setIsLoading(true);
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
      const newSiswaData = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length >= 2) {
          newSiswaData.push({
            NIS: values[0], Nama: values[1], Email: values[2], Password: values[3], JK: values[4], 
            Kelas: values[5], NamaWali: values[6], NoHP: values[7], Alamat: values[8], Status: values[9]
          });
        }
      }
      await importSiswaMassalDB(newSiswaData);
      await loadData();
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  // Fungsi konversi nomor HP ke format WA (62...)
  const getWhatsAppLink = (phone: string) => {
    if (!phone || phone === "-") return "#";
    let formatted = phone.replace(/\D/g, ""); // Hapus karakter non-angka
    if (formatted.startsWith("0")) formatted = "62" + formatted.substring(1);
    return `https://wa.me/${formatted}`;
  };

  return (
    <Fragment>
      {isLoading && (
        <div className="fixed inset-0 z-[120] bg-white/60 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white px-5 py-3 rounded-xl shadow-lg border border-slate-100 flex items-center gap-3">
            <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
            <span className="font-bold text-slate-700 text-sm">Sistem sedang memproses...</span>
          </div>
        </div>
      )}

      {/* MODAL FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative z-10 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-black text-slate-800">
                {modalType === "CREATE" ? "Tambah Siswa Baru" : modalType === "EDIT" ? "Edit Data Siswa" : "Atur Akses Login"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded-xl transition-colors cursor-pointer"><X className="w-5 h-5"/></button>
            </div>
            <form onSubmit={handleSaveModal} className="p-6 space-y-5">
              {modalType === "AKSES" ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Email Santri</label>
                    <input type="email" value={currentStudent.email || ""} onChange={e => setCurrentStudent({...currentStudent, email: e.target.value})} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-medium text-slate-800 text-sm"/>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Kata Sandi Baru</label>
                    <input type="password" placeholder="Minimal 6 karakter" onChange={e => setCurrentStudent({...currentStudent, password: e.target.value})} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 font-medium text-slate-800 text-sm"/>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Nama Lengkap</label>
                    <input type="text" value={currentStudent.nama || ""} onChange={e => setCurrentStudent({...currentStudent, nama: e.target.value})} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-sm"/>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">NIS</label>
                    <input type="text" value={currentStudent.nis || ""} onChange={e => setCurrentStudent({...currentStudent, nis: e.target.value})} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-sm"/>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Jenis Kelamin</label>
                    <select value={currentStudent.jk || "L"} onChange={e => setCurrentStudent({...currentStudent, jk: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-sm cursor-pointer">
                      <option value="L">Laki-Laki</option><option value="P">Perempuan</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Kelas / Angkatan</label>
                    <input type="text" placeholder="Contoh: 2026" value={currentStudent.kelas || ""} onChange={e => setCurrentStudent({...currentStudent, kelas: e.target.value})} required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-sm"/>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Status Akademik</label>
                    <select value={currentStudent.status || "Aktif"} onChange={e => setCurrentStudent({...currentStudent, status: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-sm cursor-pointer">
                      <option value="Aktif">Aktif</option><option value="Lulus">Lulus</option><option value="Mutasi">Mutasi / Keluar</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Nomor WhatsApp Wali</label>
                    <input type="text" placeholder="Contoh: 0812345678" value={currentStudent.telepon || ""} onChange={e => setCurrentStudent({...currentStudent, telepon: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-sm"/>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 mb-1 block">Kesibukan / Organisasi</label>
                    <input type="text" placeholder="Ekskul / Kesibukan" value={currentStudent.kesibukan || ""} onChange={e => setCurrentStudent({...currentStudent, kesibukan: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-sm"/>
                  </div>
                  
                  {modalType === "CREATE" && (
                    <div className="col-span-2 border-t border-slate-100 pt-4 mt-2">
                      <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-3">Informasi Akun (Otomatis)</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">Email Akun</label>
                          <input type="email" placeholder="Kosong = Auto Generate" value={currentStudent.email || ""} onChange={e => setCurrentStudent({...currentStudent, email: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-sm"/>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 mb-1 block">Password Default</label>
                          <input type="text" placeholder="Sesuai NIS jika kosong" value={currentStudent.password || ""} onChange={e => setCurrentStudent({...currentStudent, password: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 text-sm"/>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">Batal</button>
                <button type="submit" className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-colors cursor-pointer"><Save className="w-4 h-4"/> Simpan Data</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KONTEN UTAMA */}
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
              <Database className="w-7 h-7" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Database Master Siswa</h2>
              <p className="text-sm text-slate-500 font-medium mt-0.5">Kelola data akademik, biografi, dan akses login santri.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button onClick={handleDownloadTemplate} className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition-all text-sm shadow-sm cursor-pointer">
              <FileSpreadsheet className="w-4 h-4" /> Unduh Template
            </button>
            <input type="file" accept=".csv" ref={fileInputRef} onChange={handleImportCSV} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 bg-white border border-indigo-200 text-indigo-700 px-4 py-2.5 rounded-xl font-bold hover:bg-indigo-50 transition-all text-sm shadow-sm cursor-pointer">
              <UploadCloud className="w-4 h-4" /> Import CSV
            </button>
            <button onClick={() => openModal("CREATE")} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all text-sm shadow-md shadow-indigo-200 cursor-pointer">
              <Plus className="w-4 h-4" strokeWidth={3} /> Tambah Siswa Baru
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
          
          {/* TOOLBAR BULK ACTION */}
          {selectedIds.length > 0 ? (
            <div className="p-4 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center">
              <div className="flex items-center gap-3 text-indigo-700">
                <span className="bg-indigo-600 text-white text-xs font-black px-2.5 py-1 rounded-lg">{selectedIds.length} Terpilih</span>
              </div>
              <div className="flex gap-2">
                <button onClick={handleBulkLulus} className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg text-sm font-bold hover:bg-emerald-100 transition-all cursor-pointer">
                  <GraduationCap className="w-4 h-4" /> Luluskan Massal
                </button>
                <button onClick={handleBulkDelete} className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg text-sm font-bold hover:bg-rose-100 transition-all cursor-pointer">
                  <Trash2 className="w-4 h-4" /> Hapus Massal
                </button>
              </div>
            </div>
          ) : (
            <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row justify-between gap-4 bg-slate-50/50">
              <div className="relative w-full md:max-w-md group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input type="text" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} placeholder="Cari nama atau NIS..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium placeholder:text-slate-400 shadow-sm transition-all" />
              </div>
              
              <div className="flex gap-2">
                 <select value={filterKelas} onChange={(e) => {setFilterKelas(e.target.value); setCurrentPage(1);}} className="bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer shadow-sm transition-all">
                   <option value="Semua">Semua Kelas/Angkatan</option>
                   {kelasOptions.map(k => <option key={k} value={k}>Kelas: {k}</option>)}
                 </select>
                 <select value={filterStatus} onChange={(e) => {setFilterStatus(e.target.value); setCurrentPage(1);}} className="bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer shadow-sm transition-all">
                   <option value="Semua">Semua Status</option>
                   <option value="Aktif">Aktif</option>
                   <option value="Lulus">Lulus</option>
                 </select>
              </div>
            </div>
          )}

          {/* TABLE DATA */}
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-white sticky top-0 shadow-[0_1px_2px_rgba(0,0,0,0.04)] z-10">
                <tr className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                  <th className="px-5 py-4 w-12 text-center"><input type="checkbox" onChange={handleSelectAll} checked={paginatedData.length > 0 && selectedIds.length === paginatedData.length} className="w-4 h-4 rounded border-slate-300 text-indigo-600 cursor-pointer" /></th>
                  <th className="px-2 py-4 w-12 text-center">No</th>
                  <th className="px-4 py-4 min-w-[280px]">Profil Siswa</th>
                  <th className="px-4 py-4 text-center">L/P</th>
                  <th className="px-4 py-4 min-w-[220px]">Kontak & Info Tambahan</th>
                  <th className="px-4 py-4 text-center">Rombel</th>
                  <th className="px-4 py-4 text-center">Status</th>
                  <th className="px-5 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {paginatedData.map((siswa, idx) => {
                  const isSelected = selectedIds.includes(siswa.id);
                  const waLink = getWhatsAppLink(siswa.telepon);

                  return (
                    <tr key={siswa.id} className={`transition-colors ${isSelected ? 'bg-indigo-50/40' : 'hover:bg-slate-50/70'}`}>
                      <td className="px-5 py-4 text-center"><input type="checkbox" checked={isSelected} onChange={() => toggleSelect(siswa.id)} className="w-4 h-4 rounded border-slate-300 text-indigo-600 cursor-pointer" /></td>
                      <td className="px-2 py-4 text-center text-sm font-bold text-slate-400">{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-100 to-blue-50 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                            {siswa.nama.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{siswa.nama}</p>
                            <p className="text-[11px] font-bold text-slate-500 mt-0.5">NIS: {siswa.nis}</p>
                            {siswa.email ? (
                              <span className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-50 text-emerald-600 border border-emerald-100/50"><CheckCircle2 className="w-3 h-3"/> Akun</span>
                            ) : (
                              <span className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-500 border border-slate-200/50"><XCircle className="w-3 h-3"/> No Akun</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center"><span className={`inline-flex w-7 h-7 items-center justify-center rounded-lg text-xs font-black ${siswa.jk === 'L' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>{siswa.jk}</span></td>
                      
                      {/* KOLOM KONTAK DAN KESIBUKAN */}
                      <td className="px-4 py-4">
                        <div className="flex flex-col items-start gap-1">
                          <a href={waLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 px-2 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer">
                            <MessageCircle className="w-3 h-3" /> {siswa.telepon && siswa.telepon !== "-" ? siswa.telepon : "Input No WA"}
                          </a>
                          <p className="text-[11px] font-bold text-slate-500 flex items-center gap-1 mt-1 truncate max-w-[180px]" title={siswa.kesibukan}><Briefcase className="w-3 h-3 text-slate-400"/> {siswa.kesibukan}</p>
                        </div>
                      </td>
                      
                      <td className="px-4 py-4 text-center"><span className="inline-block px-3 py-1 bg-slate-100 text-slate-600 font-bold text-xs rounded-lg">{siswa.kelas}</span></td>
                      <td className="px-4 py-4 text-center"><span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-black uppercase border ${siswa.status === 'Aktif' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>{siswa.status}</span></td>
                      
                      {/* AKSI (SEKARANG SELALU MUNCUL, TIDAK DI-HIDE) */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openModal("AKSES", siswa)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors cursor-pointer" title="Akses Login"><KeySquare className="w-4 h-4" /></button>
                          <button onClick={() => openModal("EDIT", siswa)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer" title="Edit Data"><Edit3 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(siswa.id, siswa.nama)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer" title="Hapus Data"><Trash2 className="w-4 h-4" /></button>
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
              Menampilkan <span className="text-slate-900">{paginatedData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> - <span className="text-slate-900">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> dari <span className="text-slate-900">{filteredData.length}</span>
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