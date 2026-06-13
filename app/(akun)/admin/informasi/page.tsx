"use client";

import React, { useState, useEffect } from "react";
import { 
  Megaphone, Plus, Image as ImageIcon, Trash2, Edit, 
  X, Save, Loader2, BarChart3, Eye, EyeOff, Tag
} from "lucide-react";
import { getPengumumanAdminDB, simpanPengumumanDB, hapusPengumumanDB } from "./actions";

export default function AdminInformasiPage() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'LIST' | 'FORM'>('LIST');
  const [form, setForm] = useState({ id: "", judul: "", konten: "", kategori: "BERITA", imageUrl: "", actionLink: "", isActive: true });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    const res = await getPengumumanAdminDB();
    if (res.success) setData(res.data || []);
    setIsLoading(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return alert("Ukuran gambar maksimal 2MB!");
    const reader = new FileReader();
    reader.onloadend = () => setForm({ ...form, imageUrl: reader.result as string });
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!form.judul || !form.konten) return alert("Judul dan konten wajib diisi!");
    setIsLoading(true);
    await simpanPengumumanDB(form, form.id ? form.id : undefined);
    setView('LIST');
    loadData();
  };

  const stats = {
    total: data.length,
    aktif: data.filter(d => d.isActive).length,
    draft: data.filter(d => !d.isActive).length
  };

  // --- VIEW: FORM UPLOAD MODERN ---
  if (view === 'FORM') {
    return (
      <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-8 duration-500">
        <div className="bg-white rounded-[2rem] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
          
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-black text-slate-800">{form.id ? 'Edit Informasi' : 'Terbitkan Info Baru'}</h2>
              <p className="text-sm text-slate-500 mt-1">Lengkapi data di bawah untuk disiarkan ke seluruh dasbor santri.</p>
            </div>
            <button onClick={() => setView('LIST')} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-rose-50 hover:text-rose-500 transition-colors shadow-sm cursor-pointer">
              <X size={24}/>
            </button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Judul Pengumuman</label>
                  <input type="text" placeholder="Misal: Kajian Akbar Akhir Pekan..." value={form.judul} onChange={e=>setForm({...form, judul: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-800 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all" />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Link Pendaftaran / Aksi (Opsional)</label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">🔗</div>
                    <input type="url" placeholder="https://forms.gle/..." value={form.actionLink || ""} onChange={e=>setForm({...form, actionLink: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 outline-none focus:border-indigo-500 transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Kategori</label>
                    <div className="relative">
                      <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                      <select value={form.kategori} onChange={e=>setForm({...form, kategori: e.target.value})} className="w-full pl-10 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer">
                        <option value="BERITA">Berita & Update</option>
                        <option value="PROMO">Promo Kelas Baru</option>
                        <option value="KAJIAN">Poster Kajian</option>
                        <option value="INFO">Info Akademik</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Status Tayang</label>
                    <select value={form.isActive ? "1" : "0"} onChange={e=>setForm({...form, isActive: e.target.value === "1"})} className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:border-indigo-500 transition-all cursor-pointer">
                      <option value="1">🟢 Publik (Aktif)</option>
                      <option value="0">⚪ Draft (Sembunyi)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Image Upload Zone */}
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Poster / Gambar Visual (Opsional)</label>
                <div className="relative h-48 border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-[2rem] flex flex-col items-center justify-center hover:bg-indigo-100 hover:border-indigo-400 transition-all cursor-pointer overflow-hidden group">
                  {form.imageUrl ? (
                    <>
                      <img src={form.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Preview"/>
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="bg-white text-slate-900 px-4 py-2 rounded-xl text-xs font-bold shadow-xl">Ganti Gambar</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 bg-white shadow-sm rounded-full flex items-center justify-center mb-3 text-indigo-400 group-hover:text-indigo-600 transition-colors">
                        <ImageIcon size={32}/>
                      </div>
                      <span className="text-xs font-bold text-indigo-600">Pilih atau Tarik Gambar ke sini</span>
                      <span className="text-[10px] font-medium text-slate-400 mt-1">Maksimal 2MB (JPG/PNG)</span>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Isi Konten / Keterangan</label>
              <textarea rows={6} placeholder="Tuliskan detail informasi di sini..." value={form.konten} onChange={e=>setForm({...form, konten: e.target.value})} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[2rem] text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none"></textarea>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button onClick={handleSubmit} className="w-full py-4 bg-indigo-600 text-white text-sm font-black tracking-widest uppercase rounded-2xl shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 cursor-pointer">
                <Save size={18}/> {form.id ? 'Simpan Perubahan' : 'Terbitkan Sekarang'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- VIEW: DASHBOARD LIST ---
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 pb-12">
      
      {/* Top Header & Stats Widgets */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 mb-2">
            <Megaphone className="text-indigo-600" size={36}/> Mading Control Panel
          </h1>
          <p className="text-slate-500 font-medium">Kelola informasi, berita, dan poster kajian untuk disiarkan ke santri.</p>
        </div>
        
        <div className="flex flex-wrap gap-4 w-full lg:w-auto">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 flex-1 lg:flex-none">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><BarChart3 size={20}/></div>
            <div><p className="text-[10px] font-black uppercase text-slate-400">Total Info</p><p className="text-xl font-black text-slate-800">{stats.total}</p></div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 flex-1 lg:flex-none">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><Eye size={20}/></div>
            <div><p className="text-[10px] font-black uppercase text-slate-400">Aktif Publik</p><p className="text-xl font-black text-slate-800">{stats.aktif}</p></div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 flex-1 lg:flex-none">
            <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center"><EyeOff size={20}/></div>
            <div><p className="text-[10px] font-black uppercase text-slate-400">Draft</p><p className="text-xl font-black text-slate-800">{stats.draft}</p></div>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center bg-slate-900 p-2 pl-6 rounded-2xl shadow-lg">
        <h3 className="text-white font-bold text-sm">Daftar Arsip Informasi</h3>
        <button onClick={() => { setForm({ id: "", judul: "", konten: "", kategori: "BERITA", imageUrl: "", actionLink: "", isActive: true }); setView('FORM'); }} className="px-5 py-2.5 bg-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md hover:bg-indigo-400 flex items-center gap-2 cursor-pointer transition-colors">
          <Plus size={16} strokeWidth={3}/> Buat Baru
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 flex flex-col items-center"><Loader2 className="animate-spin text-indigo-600 mb-4" size={48}/><p className="text-slate-500 font-bold">Menarik Arsip Data...</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {data.length === 0 && (
             <div className="col-span-full bg-white border border-dashed border-slate-300 rounded-[2rem] p-16 text-center">
                <Megaphone className="mx-auto text-slate-300 mb-4" size={64}/>
                <h3 className="text-xl font-black text-slate-800 mb-2">Mading Masih Kosong</h3>
                <p className="text-slate-500 font-medium">Belum ada pengumuman yang dibuat. Klik tombol 'Buat Baru' untuk mulai.</p>
             </div>
          )}
          
          {data.map((item) => (
            <div key={item.id} className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 hover:shadow-xl transition-all flex flex-col relative group">
              
              {/* Image & Status Badge */}
              <div className={`h-48 bg-slate-100 relative ${!item.isActive ? 'grayscale' : ''}`}>
                {item.imageUrl ? (
                  <img src={item.imageUrl} className="w-full h-full object-cover"/>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-slate-100 flex items-center justify-center">
                    <Megaphone size={40} className="text-indigo-200"/>
                  </div>
                )}
                
                {/* Floating Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  <span className="bg-white/90 backdrop-blur text-slate-800 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm">
                    {item.kategori}
                  </span>
                  <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm ${item.isActive ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-white'}`}>
                    {item.isActive ? 'LIVE' : 'DRAFT'}
                  </span>
                </div>
              </div>

              {/* Content Box */}
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-slate-800 leading-tight mb-2 line-clamp-2">{item.judul}</h3>
                <p className="text-[11px] text-slate-400 mb-4 font-medium">{new Date(item.createdAt).toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}</p>
                
                {/* Action Buttons overlayed on hover */}
                <div className="mt-auto grid grid-cols-2 gap-2 pt-4 border-t border-slate-50 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                  <button onClick={() => { setForm(item); setView('FORM'); }} className="flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 rounded-xl hover:bg-indigo-600 hover:text-white transition-colors cursor-pointer">
                    <Edit size={14}/> Edit
                  </button>
                  <button onClick={async () => { if(confirm("Hapus info ini permanen?")) { setIsLoading(true); await hapusPengumumanDB(item.id); loadData(); } }} className="flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-rose-700 bg-rose-50 rounded-xl hover:bg-rose-600 hover:text-white transition-colors cursor-pointer">
                    <Trash2 size={14}/> Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}