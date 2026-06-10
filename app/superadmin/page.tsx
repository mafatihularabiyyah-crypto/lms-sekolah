"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Key, Building, User, Mail, Lock, PlusCircle, CheckCircle2, 
  Loader2, Search, Edit3, Trash2, Shield, ShieldOff, X, 
  Globe, ShieldAlert, Layers
} from "lucide-react";
import { 
  getSchoolAdminsDB, createSchoolAdminDB, updateSchoolAdminDB, 
  toggleLicenseDB, deleteSchoolAdminDB 
} from "./actions";

export default function SuperAdminPortal() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", password: "", schoolName: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = async () => {
    setIsLoading(true);
    const res = await getSchoolAdminsDB();
    if (res.success) setAdmins(res.data || []);
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let res;
    if (editingId) {
      res = await updateSchoolAdminDB(editingId, formData);
    } else {
      res = await createSchoolAdminDB(formData);
    }

    setIsSubmitting(false);

    if (res.success) {
      alert(`Data sistem sukses ${editingId ? 'diperbarui' : 'didaftarkan'}!`);
      closeModal();
      loadAdmins();
    } else {
      alert("Gagal: " + res.error);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: "", email: "", password: "", schoolName: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (admin: any) => {
    setEditingId(admin.id);
    setFormData({ 
      name: admin.name || "", 
      email: admin.email || "", 
      password: "", 
      schoolName: admin.tenant?.name || "" 
    });
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleToggleLicense = async (id: string, currentStatus: boolean) => {
    if (!confirm(`Yakin ingin ${currentStatus ? 'MEMBEKUKAN' : 'MENGAKTIFKAN'} akses instansi ini?`)) return;
    setIsLoading(true);
    await toggleLicenseDB(id, currentStatus);
    loadAdmins();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("TINDAKAN BERBAHAYA! Menghapus ini akan melenyapkan semua data guru, siswa, dan hasil ujian sekolah ini secara permanen. Lanjutkan?")) return;
    setIsLoading(true);
    await deleteSchoolAdminDB(id);
    loadAdmins();
  };

  // GLOBAL FILTER: Bisa mencari berdasarkan Nama Admin, Email, maupun Nama Instansi
  const filteredAdmins = useMemo(() => {
    return admins.filter(a => 
      a.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      a.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.tenant?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [admins, searchQuery]);

  // RINGKASAN STATISTIK LISENSI
  const totalInstansi = admins.length;
  const lisensiAktif = admins.filter(a => a.isActive).length;
  const lisensiMati = admins.filter(a => !a.isActive).length;

  return (
    <div className="min-h-screen bg-[#090D16] font-sans text-slate-200 pb-16">
      
      {/* Top Navigation Control */}
      <div className="bg-[#111827]/80 backdrop-blur-md border-b border-slate-800/60 px-8 py-4 flex justify-between items-center sticky top-0 z-40 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 rounded-xl flex items-center justify-center font-black shadow-[0_0_20px_rgba(16,185,129,0.25)]">
            <Key size={20}/>
          </div>
          <div>
            <h1 className="text-base font-black text-white tracking-wide leading-tight">SIAKAD Engine Control</h1>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400">Core Network Dashboard</p>
          </div>
        </div>
        <button onClick={() => window.location.href = '/login'} className="px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700/50 hover:bg-slate-700 text-slate-300 text-xs font-bold transition shadow-sm">
          Keluar Portal
        </button>
      </div>

      <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
        
        {/* BENTO STATS CARDS BARU */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="bg-[#111827] border border-slate-800/80 rounded-2xl p-5 flex items-center gap-4 shadow-md">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center"><Globe size={22}/></div>
              <div><p className="text-2xl font-black text-white tabular-nums">{totalInstansi}</p><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Klien Instansi</p></div>
           </div>
           <div className="bg-[#111827] border border-slate-800/80 rounded-2xl p-5 flex items-center gap-4 shadow-md">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center"><CheckCircle2 size={22}/></div>
              <div><p className="text-2xl font-black text-emerald-400 tabular-nums">{lisensiAktif}</p><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Lisensi Aktif (Server Open)</p></div>
           </div>
           <div className="bg-[#111827] border border-slate-800/80 rounded-2xl p-5 flex items-center gap-4 shadow-md">
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center"><ShieldAlert size={22}/></div>
              <div><p className="text-2xl font-black text-rose-400 tabular-nums">{lisensiMati}</p><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Lisensi Beku (Suspended)</p></div>
           </div>
        </div>

        {/* Kontrol Pencarian & Tambah */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-[#111827] p-4 rounded-2xl border border-slate-800/80 shadow-sm">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
            <input 
              type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari instansi, admin, atau email..." 
              className="w-full bg-[#090D16] border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-sm font-medium text-white focus:outline-none focus:border-emerald-500 transition shadow-inner" 
            />
          </div>
          <button onClick={openAddModal} className="w-full md:w-auto bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black uppercase tracking-widest text-xs px-5 py-3.5 rounded-xl transition shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-2 active:scale-95">
            <PlusCircle size={18} /> Registrasi Instansi
          </button>
        </div>

        {/* TABEL CORE DATA */}
        <div className="bg-[#111827] rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left min-w-[900px]">
              <thead className="bg-[#090D16] text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-800">
                <tr>
                  <th className="py-4 px-6 w-16 text-center">No</th>
                  <th className="py-4 px-6 border-r border-slate-800/40">Nama Instansi / Sekolah</th>
                  <th className="py-4 px-6 border-r border-slate-800/40">Administrator Utama</th>
                  <th className="py-4 px-6 border-r border-slate-800/40">Kredensial Email</th>
                  <th className="py-4 px-6 text-center border-r border-slate-800/40">Status Server</th>
                  <th className="py-4 px-6 text-center w-36">Tindakan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-[#111827]/40">
                {isLoading ? (
                  <tr><td colSpan={6} className="py-16 text-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto"/></td></tr>
                ) : filteredAdmins.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-slate-500 font-medium">Belum ada institusi terdaftar yang cocok.</td></tr>
                ) : filteredAdmins.map((admin, i) => (
                  <tr key={admin.id} className="hover:bg-slate-800/30 transition text-sm">
                    <td className="py-4 px-6 text-center font-bold text-slate-600">{i + 1}</td>
                    
                    {/* KOLOM BARU: NAMA INSTANSI */}
                    <td className="py-4 px-6 border-r border-slate-800/30">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-indigo-500/10 text-indigo-400 rounded-lg flex items-center justify-center border border-indigo-500/20">
                          <Building size={16} />
                        </div>
                        <span className="font-black text-white uppercase tracking-wide">{admin.tenant?.name || "Tidak Terikat"}</span>
                      </div>
                    </td>

                    <td className="py-4 px-6 border-r border-slate-800/30">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 bg-slate-800 rounded-full flex items-center justify-center text-slate-400 border border-slate-700 text-xs font-bold">
                          {admin.name?.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-slate-200">{admin.name}</span>
                      </div>
                    </td>

                    <td className="py-4 px-6 border-r border-slate-800/30">
                      <span className="text-xs font-mono text-emerald-400 bg-emerald-500/5 px-2.5 py-1 rounded-md border border-emerald-500/10 shadow-inner">
                        {admin.email}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-center border-r border-slate-800/30">
                      <button 
                        onClick={() => handleToggleLicense(admin.id, admin.isActive)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${admin.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 shadow-sm shadow-emerald-500/5' : 'bg-rose-500/10 text-rose-400 border-rose-500/20 hover:bg-rose-500/20'}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${admin.isActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
                        {admin.isActive ? 'Online / Aktif' : 'Suspended'}
                      </button>
                    </td>

                    <td className="py-4 px-6 text-center whitespace-nowrap">
                      <button onClick={() => openEditModal(admin)} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-blue-400 rounded-xl border border-slate-700/50 transition mr-1.5 shadow-sm" title="Edit System">
                        <Edit3 size={15}/>
                      </button>
                      <button onClick={() => handleDelete(admin.id)} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-rose-400 rounded-xl border border-slate-700/50 transition shadow-sm" title="Delete Tenant">
                        <Trash2 size={15}/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* MODAL FORM REGISTRASI / EDIT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#111827] w-full max-w-md rounded-[2rem] shadow-2xl border border-slate-800 overflow-hidden animate-in zoom-in-95">
            <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-[#090D16]">
              <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="text-emerald-400" size={16}/> 
                {editingId ? 'Update Data Klien' : 'Registrasi Klien Baru'}
              </h2>
              <button onClick={closeModal} className="text-slate-500 hover:text-slate-300 transition"><X size={22}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Nama Instansi / Sekolah</label>
                <div className="relative">
                  <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                  <input type="text" required value={formData.schoolName} onChange={(e) => setFormData({...formData, schoolName: e.target.value})} className="w-full bg-[#090D16] border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition shadow-inner font-bold" placeholder="Contoh: SMA Alam Bin Zubair" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Nama Administrator Utama</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                  <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-[#090D16] border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition shadow-inner font-bold" placeholder="Contoh: Ustadz Ahmad Fauzi" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Kredensial Email Login</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                  <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-[#090D16] border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition shadow-inner font-mono font-bold" placeholder="admin@sekolah.id" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Kata Sandi Sistem</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                  <input type="text" required={!editingId} minLength={6} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full bg-[#090D16] border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-white text-sm focus:outline-none focus:border-emerald-500 transition shadow-inner" placeholder={editingId ? "Kosongkan jika sandi tetap" : "Buat kata sandi baru..."} />
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black uppercase tracking-widest text-xs rounded-xl py-4 mt-4 hover:opacity-90 transition flex justify-center items-center gap-2 shadow-lg shadow-emerald-500/10">
                {isSubmitting ? <Loader2 className="animate-spin w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                {isSubmitting ? "Mengunggah Log..." : "Simpan Berkas Klien"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}