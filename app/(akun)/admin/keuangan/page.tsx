"use client";

import React, { useState, useEffect } from "react";
import { 
  Wallet, Receipt, Landmark, Users, CheckCircle2, 
  XCircle, Plus, Loader2, QrCode, CreditCard, Trash2, Save, 
  Search, Clock, Edit, Image as ImageIcon, X
} from "lucide-react";
import { 
  getKelasAktifKeuanganDB, getTagihanAdminDB, generateTagihanDB, 
  updateStatusTagihanDB, hapusTagihanDB, getDonasiSettingDB, saveDonasiSettingDB,
  editTagihanDB
} from "./actions";

const BULAN_NAMES = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

export default function AdminKeuanganPage() {
  const [activeTab, setActiveTab] = useState<'TAGIHAN' | 'BUAT' | 'DONASI'>('TAGIHAN');
  const [isLoading, setIsLoading] = useState(true);
  
  const [tagihan, setTagihan] = useState<any[]>([]);
  const [kelasAktif, setKelasAktif] = useState<any[]>([]);
  const [donasiSet, setDonasiSet] = useState({ qrisUrl: "", bankName: "", bankAccount: "", accountName: "" });

  const [genForm, setGenForm] = useState({ tipe: "BULANAN", judul: "", classRoomId: "", defaultNominal: 100000 });
  const [customNominals, setCustomNominals] = useState<Record<string, number>>({});
  
  const [search, setSearch] = useState("");
  const [filterKelas, setFilterKelas] = useState("");
  const [filterBulan, setFilterBulan] = useState("");
  const [filterTahun, setFilterTahun] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [editModal, setEditModal] = useState<{id: string, judul: string, nominal: number} | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [resTagihan, resKelas, resDonasi] = await Promise.all([
      getTagihanAdminDB(), getKelasAktifKeuanganDB(), getDonasiSettingDB()
    ]);
    if (resTagihan.success) setTagihan(resTagihan.data);
    if (resKelas.success) setKelasAktif(resKelas.data);
    if (resDonasi.success && resDonasi.data) {
      setDonasiSet({
        qrisUrl: resDonasi.data.qrisUrl || "",
        bankName: resDonasi.data.bankName || "",
        bankAccount: resDonasi.data.bankAccount || "",
        accountName: resDonasi.data.accountName || ""
      });
    }
    setIsLoading(false);
  };

  const handleGenerateTagihan = async () => {
    if (!genForm.judul || !genForm.classRoomId) return alert("Judul dan Kelas wajib dipilih!");
    const selectedClass = kelasAktif.find(c => c.id === genForm.classRoomId);
    if (!selectedClass || selectedClass.students.length === 0) return alert("Kelas tidak memiliki santri.");

    const nominals = selectedClass.students.map((s: any) => ({
      studentId: s.id,
      nominal: customNominals[s.id] !== undefined ? customNominals[s.id] : genForm.defaultNominal
    }));

    setIsLoading(true);
    await generateTagihanDB({ ...genForm, nominals });
    setActiveTab('TAGIHAN');
    loadData();
    alert("Tagihan berhasil diterbitkan ke dasbor santri!");
  };

  const handleCustomNominalChange = (studentId: string, rawValue: string) => {
    const cleanValue = rawValue.replace(/\D/g, ""); 
    setCustomNominals(prev => ({ ...prev, [studentId]: Number(cleanValue) }));
  };

  const handleQrisUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return alert("Ukuran gambar QRIS maksimal 2MB!");
    const reader = new FileReader();
    reader.onloadend = () => setDonasiSet({ ...donasiSet, qrisUrl: reader.result as string });
    reader.readAsDataURL(file);
  };

  const handleSaveEdit = async () => {
    if(!editModal) return;
    setIsLoading(true);
    await editTagihanDB(editModal.id, { judul: editModal.judul, nominal: editModal.nominal });
    setEditModal(null);
    loadData();
  };

  const formatRupiah = (angka: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(angka);
  const formatAngka = (angka: number) => new Intl.NumberFormat("id-ID").format(angka);

  const filteredTagihan = tagihan.filter(t => {
    const d = new Date(t.createdAt);
    const bulanDariTanggal = BULAN_NAMES[d.getMonth()].toLowerCase();
    const tahunDariTanggal = d.getFullYear().toString();

    const matchSearch = t.student?.user?.name?.toLowerCase().includes(search.toLowerCase()) || t.judul.toLowerCase().includes(search.toLowerCase());
    const matchKelas = filterKelas ? t.classRoomId === filterKelas : true;
    const matchStatus = filterStatus ? t.status === filterStatus : true;
    const matchBulan = filterBulan ? (t.judul.toLowerCase().includes(filterBulan.toLowerCase()) || bulanDariTanggal === filterBulan.toLowerCase()) : true;
    const matchTahun = filterTahun ? (t.judul.includes(filterTahun) || tahunDariTanggal === filterTahun) : true;
    
    return matchSearch && matchKelas && matchBulan && matchTahun && matchStatus;
  });

  if (isLoading) return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-indigo-600" size={48}/></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-white p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 mb-2">
            <Wallet className="text-indigo-600" size={32}/> Sentra Keuangan
          </h1>
          <p className="text-slate-500 font-medium">Kelola SPP Santri, Tagihan, dan Info Rekening Yayasan/Donasi.</p>
        </div>
        <div className="bg-slate-100 p-1.5 rounded-2xl flex items-center gap-1 border border-slate-200/40">
          <button onClick={() => setActiveTab('TAGIHAN')} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'TAGIHAN' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}><Receipt size={16} className="inline mr-2 mb-0.5"/>Daftar Tagihan</button>
          <button onClick={() => setActiveTab('BUAT')} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'BUAT' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}><Plus size={16} className="inline mr-2 mb-0.5"/>Buat Tagihan</button>
          <button onClick={() => setActiveTab('DONASI')} className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'DONASI' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500'}`}><Landmark size={16} className="inline mr-2 mb-0.5"/>Donasi & Rekening</button>
        </div>
      </div>

      {activeTab === 'TAGIHAN' && (
        <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
          <div className="p-6 bg-slate-50 border-b border-slate-100 grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
              <input type="text" placeholder="Cari santri atau judul..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-500" />
            </div>
            <select value={filterKelas} onChange={e=>setFilterKelas(e.target.value)} className="py-2.5 px-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none text-slate-600">
               <option value="">Semua Kelas</option>
               {kelasAktif.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="py-2.5 px-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none text-slate-600">
               <option value="">Semua Status</option>
               <option value="BELUM_BAYAR">Belum Bayar</option>
               <option value="MENUNGGU_KONFIRMASI">Menunggu Konfirmasi</option>
               <option value="LUNAS">Lunas</option>
            </select>
            <select value={filterBulan} onChange={e=>setFilterBulan(e.target.value)} className="py-2.5 px-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none text-slate-600">
               <option value="">Bulan Cerdas</option>
               {BULAN_NAMES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
            <select value={filterTahun} onChange={e=>setFilterTahun(e.target.value)} className="py-2.5 px-3 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none text-slate-600">
               <option value="">Tahun Cerdas</option>
               {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div className="overflow-x-auto p-6">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-100 text-slate-500 text-xs uppercase font-black tracking-widest rounded-xl">
                <tr>
                  <th className="p-4 rounded-l-xl">Nama Santri</th>
                  <th className="p-4">Kelas</th>
                  <th className="p-4">Judul Tagihan</th>
                  <th className="p-4 text-right">Nominal</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center rounded-r-xl">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTagihan.length === 0 ? <tr><td colSpan={6} className="p-8 text-center text-slate-400 font-bold">Tidak ada tagihan ditemukan.</td></tr> : filteredTagihan.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-slate-800">{t.student?.user?.name}</td>
                    <td className="p-4 text-slate-600">{t.classRoom?.name || '-'}</td>
                    <td className="p-4">
                       <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-black mb-1 inline-block">{t.tipe}</span>
                       <div className="font-bold text-slate-700">{t.judul}</div>
                    </td>
                    <td className="p-4 text-right font-black text-slate-800">{formatRupiah(t.nominal)}</td>
                    <td className="p-4 text-center">
                      {t.status === 'LUNAS' && <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase"><CheckCircle2 size={12} className="inline mr-1"/>Lunas</span>}
                      {t.status === 'MENUNGGU_KONFIRMASI' && <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase animate-pulse"><Clock size={12} className="inline mr-1"/>Cek Transfer</span>}
                      {t.status === 'BELUM_BAYAR' && <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase"><XCircle size={12} className="inline mr-1"/>Belum Bayar</span>}
                    </td>
                    <td className="p-4 flex items-center justify-center gap-2">
                      <button onClick={() => setEditModal({id: t.id, judul: t.judul, nominal: t.nominal})} className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-500 hover:text-white rounded-lg transition-colors" title="Edit Tagihan">
                        <Edit size={16}/>
                      </button>
                      {t.status !== 'LUNAS' && (
                        <button onClick={async () => { await updateStatusTagihanDB(t.id, 'LUNAS'); loadData(); }} className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-lg transition-colors" title="Tandai Lunas">
                          <CheckCircle2 size={16}/>
                        </button>
                      )}
                      {t.status === 'LUNAS' && (
                        <button onClick={async () => { await updateStatusTagihanDB(t.id, 'BELUM_BAYAR'); loadData(); }} className="p-2 bg-slate-100 text-slate-500 hover:bg-slate-500 hover:text-white rounded-lg transition-colors" title="Batalkan Lunas">
                          <XCircle size={16}/>
                        </button>
                      )}
                      <button onClick={async () => { if(confirm("Hapus tagihan?")) { await hapusTagihanDB(t.id); loadData(); } }} className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white rounded-lg transition-colors">
                        <Trash2 size={16}/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'BUAT' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-black text-slate-800 mb-6">Konfigurasi Tagihan</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-black text-slate-400 uppercase">Pilih Kelas Aktif</label>
                  <select value={genForm.classRoomId} onChange={e => { setGenForm({...genForm, classRoomId: e.target.value}); setCustomNominals({}); }} className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500">
                    <option value="">-- Pilih Kelas --</option>
                    {kelasAktif.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-black text-slate-400 uppercase">Jenis</label>
                    <select value={genForm.tipe} onChange={e => setGenForm({...genForm, tipe: e.target.value})} className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500">
                      <option value="BULANAN">Bulanan</option>
                      <option value="TAHUNAN">Tahunan</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-black text-slate-400 uppercase">Nominal Default</label>
                    <input type="text" value={formatAngka(genForm.defaultNominal)} onChange={e => setGenForm({...genForm, defaultNominal: Number(e.target.value.replace(/\D/g, ""))})} className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 text-right" />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-black text-slate-400 uppercase">Judul Tagihan</label>
                  <input type="text" placeholder="Cth: SPP September 2026" value={genForm.judul} onChange={e => setGenForm({...genForm, judul: e.target.value})} className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500" />
                </div>
              </div>
              <button onClick={handleGenerateTagihan} className="w-full mt-8 py-3 bg-indigo-600 text-white font-black rounded-xl shadow-lg shadow-indigo-600/30 hover:bg-indigo-700 transition-colors flex justify-center items-center gap-2">
                <Receipt size={18}/> Terbitkan Tagihan
              </button>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 min-h-[400px]">
              <div className="flex justify-between items-center mb-6">
                 <div>
                   <h3 className="font-black text-slate-800 text-lg">Pratinjau & Kustomisasi Santri</h3>
                   <p className="text-xs text-slate-500">Ubah nominal di bawah jika ada santri yang memiliki tarif khusus.</p>
                 </div>
              </div>
              {!genForm.classRoomId ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                  <Users size={48} className="mb-4 opacity-50"/>
                  <p className="font-bold">Pilih kelas di samping untuk melihat daftar santri.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {kelasAktif.find(c => c.id === genForm.classRoomId)?.students.map((s: any) => (
                    <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors">
                      <div className="font-bold text-slate-700 text-sm flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center uppercase text-xs">{s.user.name.charAt(0)}</div>
                         {s.user.name}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-black text-slate-400">Rp</span>
                        <input 
                          type="text" 
                          value={formatAngka(customNominals[s.id] !== undefined ? customNominals[s.id] : genForm.defaultNominal)} 
                          onChange={(e) => handleCustomNominalChange(s.id, e.target.value)}
                          className="w-32 p-2 text-right bg-white border border-slate-300 rounded-lg text-sm font-black text-indigo-600 outline-none focus:border-indigo-500 shadow-inner"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'DONASI' && (
         <div className="max-w-2xl mx-auto bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center"><Landmark size={28}/></div>
              <div>
                <h2 className="text-2xl font-black text-slate-800">Portal Donasi Yayasan</h2>
                <p className="text-sm text-slate-500">Informasi ini akan tampil di dasbor keuangan seluruh santri.</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 block"><QrCode size={14} className="inline mr-1"/> Upload Gambar QRIS</label>
                <div className="relative h-40 border-2 border-dashed border-emerald-200 bg-emerald-50/50 rounded-2xl flex flex-col items-center justify-center hover:bg-emerald-100 hover:border-emerald-400 transition-all cursor-pointer overflow-hidden group">
                  {donasiSet.qrisUrl ? (
                    <>
                      <img src={donasiSet.qrisUrl} className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500" alt="QRIS"/>
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="bg-white text-slate-900 px-4 py-2 rounded-xl text-xs font-bold shadow-xl">Ganti QRIS</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-white shadow-sm rounded-full flex items-center justify-center mb-2 text-emerald-400"><ImageIcon size={24}/></div>
                      <span className="text-xs font-bold text-emerald-600">Klik untuk Pilih Gambar</span>
                    </>
                  )}
                  <input type="file" accept="image/*" onChange={handleQrisUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="md:col-span-2 flex items-center gap-2 text-slate-700 font-black"><CreditCard size={18}/> Informasi Rekening Bank</div>
                
                {/* KEMBALI KE INPUT TEKS BEBAS */}
                <div>
                  <label className="text-[11px] font-black text-slate-400 uppercase">Nama Bank</label>
                  <input type="text" placeholder="Cth: BSI Syariah" value={donasiSet.bankName} onChange={e=>setDonasiSet({...donasiSet, bankName: e.target.value})} className="w-full mt-1 p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-bold text-slate-700" />
                </div>

                <div>
                  <label className="text-[11px] font-black text-slate-400 uppercase">Nomor Rekening</label>
                  <input type="text" value={donasiSet.bankAccount} onChange={e=>setDonasiSet({...donasiSet, bankAccount: e.target.value})} className="w-full mt-1 p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-bold" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase">Atas Nama (A.N)</label>
                  <input type="text" value={donasiSet.accountName} onChange={e=>setDonasiSet({...donasiSet, accountName: e.target.value})} className="w-full mt-1 p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-bold" />
                </div>
              </div>
              <button onClick={async () => {setIsLoading(true); await saveDonasiSettingDB(donasiSet); setIsLoading(false); alert("Tersimpan!")}} className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 transition-colors flex justify-center items-center gap-2">
                <Save size={18}/> Simpan Pengaturan
              </button>
            </div>
         </div>
      )}

      {editModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-slate-800">Edit Tagihan</h3>
                <button onClick={()=>setEditModal(null)} className="text-slate-400 hover:text-rose-500"><X size={24}/></button>
             </div>
             <div className="space-y-4 mb-8">
                <div>
                  <label className="text-[11px] font-black text-slate-400 uppercase">Judul Tagihan</label>
                  <input type="text" value={editModal.judul} onChange={e=>setEditModal({...editModal, judul: e.target.value})} className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500" />
                </div>
                <div>
                  <label className="text-[11px] font-black text-slate-400 uppercase">Nominal (Rp)</label>
                  <input type="text" value={formatAngka(editModal.nominal)} onChange={e=>setEditModal({...editModal, nominal: Number(e.target.value.replace(/\D/g, ""))})} className="w-full mt-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-500 text-right" />
                </div>
             </div>
             <button onClick={handleSaveEdit} className="w-full py-3 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 transition-colors">Simpan Perubahan</button>
           </div>
        </div>
      )}

    </div>
  );
}