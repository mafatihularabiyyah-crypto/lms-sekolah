"use client";

import React, { useState, useEffect } from "react";
import { 
  BookOpen, Plus, Loader2, Edit, Trash2, X, 
  Image as ImageIcon, Link as LinkIcon, Save, Tag,
  FileText, ShoppingBag
} from "lucide-react";
import { getBukuAdminDB, simpanBukuDB, hapusBukuDB } from "./actions";

export default function AdminBukuPage() {
  const [bukuList, setBukuList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: "", judul: "", deskripsi: "", coverUrl: "", 
    isFisik: false, fileUrl: "", nomorWa: "", 
    hargaNormal: 0, potonganHarga: 0
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    const res = await getBukuAdminDB();
    if (res.success) setBukuList(res.data);
    setIsLoading(false);
  };

  const openAddModal = () => {
    setFormData({ id: "", judul: "", deskripsi: "", coverUrl: "", isFisik: false, fileUrl: "", nomorWa: "", hargaNormal: 0, potonganHarga: 0 });
    setIsModalOpen(true);
  };

  const openEditModal = (buku: any) => {
    setFormData({
      id: buku.id, judul: buku.judul, deskripsi: buku.deskripsi || "", coverUrl: buku.coverUrl || "",
      isFisik: buku.isFisik, fileUrl: buku.fileUrl || "", nomorWa: buku.nomorWa || "",
      hargaNormal: buku.hargaNormal, potonganHarga: buku.potonganHarga || 0
    });
    setIsModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const MAX_SIZE = 500;
        let width = img.width; let height = img.height;
        if (width > height && width > MAX_SIZE) { height *= MAX_SIZE / width; width = MAX_SIZE; } 
        else if (height > MAX_SIZE) { width *= MAX_SIZE / height; height = MAX_SIZE; }
        canvas.width = width; canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        setFormData({ ...formData, coverUrl: canvas.toDataURL("image/jpeg", 0.7) });
      };
    };
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.judul) return alert("Judul buku wajib diisi!");
    if (!formData.isFisik && !formData.fileUrl) return alert("Tautan PDF Modul Digital wajib diisi!");
    if (formData.isFisik && !formData.nomorWa) return alert("Nomor WA Admin wajib diisi untuk pemesanan buku cetak!");
    
    setIsSaving(true);
    await simpanBukuDB(formData);
    setIsSaving(false);
    setIsModalOpen(false);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (confirm("Yakin ingin menghapus buku/modul ini dari katalog?")) {
      setIsLoading(true);
      await hapusBukuDB(id);
      loadData();
    }
  };

  const formatAngka = (angka: number) => new Intl.NumberFormat("id-ID").format(angka);
  const formatRupiah = (angka: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(angka);

  if (isLoading && bukuList.length === 0) return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={48}/></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 mb-2">
            <BookOpen className="text-blue-600" size={32}/> Kelola Media Belajar
          </h1>
          <p className="text-slate-500 font-medium max-w-xl">Pusat unggah modul digital (PDF) dan etalase buku cetak (Fisik) untuk santri.</p>
        </div>
        <button onClick={openAddModal} className="px-6 py-3.5 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 shadow-lg flex items-center gap-2">
          <Plus size={18}/> Tambah Buku Baru
        </button>
      </div>

      <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto p-6">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-black tracking-widest rounded-xl">
              <tr>
                <th className="p-4 rounded-l-xl w-24 text-center">Cover</th>
                <th className="p-4">Info Buku</th>
                <th className="p-4 text-center">Akses / Tautan</th>
                <th className="p-4 text-right">Harga Final</th>
                <th className="p-4 text-center rounded-r-xl">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bukuList.length === 0 ? (
                <tr><td colSpan={5} className="p-10 text-center text-slate-400 font-bold">Katalog buku masih kosong.</td></tr>
              ) : bukuList.map((buku) => (
                <tr key={buku.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="p-4 flex justify-center">
                    <div className="w-12 h-16 bg-slate-100 rounded-md overflow-hidden border border-slate-200">
                      {buku.coverUrl ? <img src={buku.coverUrl} className="w-full h-full object-cover" alt="Cover"/> : <ImageIcon className="m-auto mt-4 text-slate-300"/>}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="font-black text-slate-800 text-base mb-1 flex items-center gap-2">
                      {buku.judul}
                      <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wider ${buku.isFisik ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                        {buku.isFisik ? 'Fisik' : 'Digital'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 line-clamp-1 max-w-sm">{buku.deskripsi || "-"}</div>
                  </td>
                  <td className="p-4 text-center">
                    {!buku.isFisik ? (
                      <a href={buku.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 font-bold text-xs rounded-lg hover:bg-blue-600 hover:text-white transition-colors"><LinkIcon size={12}/> Tautan PDF</a>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-600 font-bold text-xs rounded-lg"><LinkIcon size={12}/> WA: {buku.nomorWa}</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    {buku.hargaNormal === 0 ? <span className="text-emerald-600 font-black uppercase text-xs">Gratis</span> : (
                      <div className="flex flex-col items-end">
                        <span className="font-black text-slate-900">{formatRupiah(buku.hargaNormal - buku.potonganHarga)}</span>
                        {buku.potonganHarga > 0 && <span className="text-[10px] font-bold text-slate-400 line-through">{formatRupiah(buku.hargaNormal)}</span>}
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEditModal(buku)} className="p-2 bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white rounded-lg transition-colors"><Edit size={16}/></button>
                      <button onClick={() => handleDelete(buku.id)} className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white rounded-lg transition-colors"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FORM TAMBAH / EDIT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                {formData.id ? <Edit className="text-amber-500"/> : <Plus className="text-blue-600"/>} 
                {formData.id ? "Edit Buku / Modul" : "Tambah Buku Baru"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-500 p-1"><X size={24}/></button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <form id="bukuForm" onSubmit={handleSave} className="space-y-6">
                
                {/* PILIHAN JENIS BUKU (DIGITAL vs FISIK) */}
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-3">Tipe Media Belajar</label>
                  <div className="flex p-1 bg-slate-100 rounded-xl">
                    <button type="button" onClick={() => setFormData({...formData, isFisik: false})} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${!formData.isFisik ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>
                      <FileText size={18}/> Modul Digital (PDF)
                    </button>
                    <button type="button" onClick={() => setFormData({...formData, isFisik: true})} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all ${formData.isFisik ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500'}`}>
                      <ShoppingBag size={18}/> Buku Cetak (Fisik)
                    </button>
                  </div>
                </div>

                {/* Judul & Tautan / WA */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Judul Buku *</label>
                    <input type="text" value={formData.judul} onChange={e => setFormData({...formData, judul: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 focus:outline-none focus:border-blue-500" required placeholder="Cth: Modul Fiqih"/>
                  </div>
                  <div>
                    {!formData.isFisik ? (
                      <>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Tautan Modul (Drive/PDF) *</label>
                        <input type="url" value={formData.fileUrl} onChange={e => setFormData({...formData, fileUrl: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 focus:outline-none focus:border-blue-500" required={!formData.isFisik} placeholder="https://..."/>
                      </>
                    ) : (
                      <>
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Nomor WA Admin (Untuk Order) *</label>
                        <input type="text" value={formData.nomorWa} onChange={e => setFormData({...formData, nomorWa: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 focus:outline-none focus:border-amber-500" required={formData.isFisik} placeholder="Cth: 628123456789"/>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Deskripsi Singkat</label>
                  <textarea rows={3} value={formData.deskripsi} onChange={e => setFormData({...formData, deskripsi: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-700 focus:outline-none focus:border-blue-500 resize-none" placeholder="Jelaskan isi buku ini..."></textarea>
                </div>

                <hr className="border-slate-100" />

                {/* Cover & Harga */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Cover Buku (Gambar)</label>
                    <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-slate-200 border-dashed rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-all group overflow-hidden relative">
                      {formData.coverUrl ? (
                        <>
                          <img src={formData.coverUrl} className="w-full h-full object-contain p-2" alt="Cover"/>
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center"><span className="text-white text-xs font-bold">Ganti Gambar</span></div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400 group-hover:text-blue-500"><ImageIcon size={32} className="mb-2"/><span className="text-xs font-bold">Upload Cover</span></div>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  </div>

                  {/* Kalkulator Potongan Harga */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">Harga Normal (Rp)</label>
                      <input type="text" value={formatAngka(formData.hargaNormal)} onChange={e => setFormData({...formData, hargaNormal: Number(e.target.value.replace(/\D/g, ""))})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-black text-slate-900 focus:outline-none focus:border-blue-500 text-right" placeholder="0 = Gratis"/>
                    </div>
                    
                    {formData.hargaNormal > 0 && (
                      <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100">
                        <label className="text-xs font-bold text-rose-500 uppercase tracking-widest flex items-center gap-1.5 mb-2"><Tag size={12}/> Potongan Diskon (Rp)</label>
                        <input type="text" value={formatAngka(formData.potonganHarga)} onChange={e => setFormData({...formData, potonganHarga: Number(e.target.value.replace(/\D/g, ""))})} className="w-full bg-white border border-rose-200 rounded-xl px-4 py-3 font-black text-rose-700 focus:outline-none focus:border-rose-500 text-right" placeholder="Misal: 10000"/>
                        {formData.potonganHarga > 0 && (
                          <div className="mt-3 pt-3 border-t border-rose-200/50 flex justify-between items-center text-sm font-black text-rose-800">
                            <span>Harga Akhir:</span>
                            <span>{formatRupiah(formData.hargaNormal - formData.potonganHarga)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

              </form>
            </div>

            <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3 bg-slate-50 shrink-0">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-colors">Batal</button>
              <button form="bukuForm" type="submit" disabled={isSaving} className="px-8 py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition-colors shadow-lg flex items-center gap-2">
                {isSaving ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>} Simpan Katalog
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}