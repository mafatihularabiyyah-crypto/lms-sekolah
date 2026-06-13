"use client";

import { useState, useEffect } from "react";
import { 
  CreditCard, Wallet, Receipt, HeartHandshake, CheckCircle2, Clock, 
  Download, ShieldCheck, Loader2, XCircle, Landmark, CheckSquare
} from "lucide-react";
import { getKeuanganSantriDB, konfirmasiPembayaranDB, getDonasiSantriDB } from "./actions";

const nominalDonasi = [50000, 100000, 250000, 500000, 1000000];

export default function KeuanganSantri() {
  const [activeTab, setActiveTab] = useState<"TAGIHAN" | "RIWAYAT" | "DONASI">("TAGIHAN");
  
  const [tagihan, setTagihan] = useState<any[]>([]);
  const [donasi, setDonasi] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedNominal, setSelectedNominal] = useState<number | "CUSTOM">(100000);
  const [customNominal, setCustomNominal] = useState("");
  const [tglTransfer, setTglTransfer] = useState("");
  const [namaRekening, setNamaRekening] = useState("");

  const [kuitansiCetak, setKuitansiCetak] = useState<any>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [resTagihan, resDonasi] = await Promise.all([getKeuanganSantriDB(), getDonasiSantriDB()]);
    if (resTagihan.success) setTagihan(resTagihan.data);
    if (resDonasi.success) setDonasi(resDonasi.data);
    setIsLoading(false);
  };

  const tagihanAktif = tagihan.filter(t => t.status !== 'LUNAS');
  const riwayatTransaksi = tagihan.filter(t => t.status === 'LUNAS');
  const totalTagihan = tagihanAktif.reduce((sum, t) => sum + t.nominal, 0);

  const formatRupiah = (angka: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(angka);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  const handleKonfirmasiTagihan = async (id: string) => {
    if (confirm("Apakah Anda yakin sudah melakukan transfer untuk tagihan ini? Status akan berubah menjadi 'Menunggu Konfirmasi Admin'.")) {
      setIsLoading(true);
      await konfirmasiPembayaranDB(id);
      loadData();
    }
  };

  const handleKirimDonasi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tglTransfer || !namaRekening) return alert("Mohon lengkapi tanggal dan nama rekening pengirim!");
    alert("Alhamdulillah, laporan donasi berhasil dikirim dan sedang dicocokkan dengan mutasi oleh Admin. Jazakumullahu khairan!");
    setCustomNominal("");
    setTglTransfer("");
    setNamaRekening("");
  };

  const handlePrintKuitansi = (trx: any) => {
    setKuitansiCetak(trx);
    setTimeout(() => { window.print(); }, 200);
  };

  if (isLoading) return <div className="py-32 flex justify-center print:hidden"><Loader2 className="animate-spin text-indigo-600" size={48}/></div>;

  return (
    <div className="w-full bg-slate-50/50 print:bg-white">
      
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 font-sans pb-12 px-4 md:px-0 print:hidden">
        
        {/* HEADER WIDGETS */}
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 bg-slate-900 rounded-[2.5rem] p-8 md:p-10 shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
            <div className="relative z-10 mb-8">
              <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3 mb-2">
                <Wallet className="text-indigo-400" size={32} /> Keuangan & Administrasi
              </h1>
              <p className="text-slate-400 font-medium text-sm max-w-md">Kelola tagihan pendidikan Anda dan raih pahala jariyah melalui program donasi dakwah pesantren.</p>
            </div>
            <div className="relative z-10 flex gap-2">
              <ShieldCheck size={16} className="text-emerald-400" />
              <p className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">Transaksi 100% Aman & Terverifikasi</p>
            </div>
          </div>

          <div className="lg:w-80 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2.5rem] p-8 shadow-lg shadow-indigo-600/20 text-white relative overflow-hidden flex flex-col justify-between">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
             <div>
               <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6"><CreditCard size={24} className="text-white" /></div>
               <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mb-1">Total Tagihan Aktif</p>
               <h3 className="text-3xl md:text-4xl font-black mb-2">{formatRupiah(totalTagihan)}</h3>
             </div>
             <button onClick={() => setActiveTab("TAGIHAN")} className="w-full mt-4 bg-white text-indigo-600 font-black py-3 rounded-xl hover:bg-indigo-50 transition-colors shadow-sm text-sm">Lihat Rincian Tagihan</button>
          </div>
        </div>

        {/* TAB NAVIGATION */}
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-2 overflow-x-auto custom-scrollbar w-fit">
          <button onClick={() => setActiveTab("TAGIHAN")} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === "TAGIHAN" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"}`}>
            <Receipt size={18} /> Tagihan Aktif {tagihanAktif.length > 0 && <span className="ml-1 bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-full">{tagihanAktif.length}</span>}
          </button>
          <button onClick={() => setActiveTab("RIWAYAT")} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === "RIWAYAT" ? "bg-slate-900 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"}`}>
            <Clock size={18} /> Riwayat Transaksi
          </button>
          <button onClick={() => setActiveTab("DONASI")} className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === "DONASI" ? "bg-emerald-500 text-white shadow-md" : "text-emerald-600 hover:bg-emerald-50"}`}>
            <HeartHandshake size={18} /> Donasi Dakwah
          </button>
        </div>

        {/* --- KONTEN: TAGIHAN AKTIF --- */}
        {activeTab === "TAGIHAN" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {tagihanAktif.length === 0 ? (
               <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-slate-100 shadow-sm">
                  <Receipt className="mx-auto text-slate-300 mb-4" size={48}/>
                  <h3 className="text-xl font-black text-slate-800">Alhamdulillah!</h3>
                  <p className="text-slate-500 text-sm">Tidak ada tagihan yang belum dibayar saat ini.</p>
               </div>
            ) : tagihanAktif.map((t) => (
              <div key={t.id} className="bg-white rounded-[2rem] p-6 md:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-between hover:border-indigo-200 transition-all">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    {t.status === 'BELUM_BAYAR' ? (
                      <span className="bg-rose-50 text-rose-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-rose-100 flex items-center gap-1">
                        <XCircle size={12}/> Belum Dibayar
                      </span>
                    ) : (
                      <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-amber-100 flex items-center gap-1 animate-pulse">
                        <Clock size={12}/> Menunggu Verifikasi
                      </span>
                    )}
                    <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md uppercase">{t.tipe}</span>
                  </div>
                  <h3 className="text-xl font-black text-slate-800 mb-1 leading-tight">{t.judul}</h3>
                  <p className="text-sm font-bold text-slate-400 flex items-center gap-1.5 mb-6 mt-2">
                    <Clock size={14} /> Diterbitkan: {formatDate(t.createdAt)}
                  </p>
                </div>
                
                <div className="pt-6 border-t border-slate-100">
                  <div className="flex items-end justify-between mb-6">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total Tagihan</p>
                      <p className="text-3xl font-black text-slate-900">{formatRupiah(t.nominal)}</p>
                    </div>
                  </div>
                  
                  {t.status === 'BELUM_BAYAR' ? (
                    <button onClick={() => handleKonfirmasiTagihan(t.id)} className="w-full py-4 bg-slate-900 text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-indigo-600 transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer">
                      <CheckSquare size={16} /> Konfirmasi Sudah Transfer
                    </button>
                  ) : (
                    <div className="w-full py-4 bg-amber-50 text-amber-600 font-black uppercase tracking-widest text-xs rounded-xl text-center border border-amber-100 flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin"/> Admin Sedang Mengecek Mutasi
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- KONTEN: RIWAYAT TRANSAKSI & CETAK KUITANSI --- */}
        {activeTab === "RIWAYAT" && (
          <div className="bg-white rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <h3 className="text-lg font-black text-slate-800">Daftar Transaksi Selesai</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 bg-white">
                    <th className="px-8 py-5">Detail Transaksi</th>
                    <th className="px-6 py-5">Tanggal Lunas</th>
                    <th className="px-6 py-5 text-right">Nominal</th>
                    <th className="px-8 py-5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {riwayatTransaksi.length === 0 ? (
                    <tr><td colSpan={4} className="px-8 py-10 text-center font-bold text-slate-400">Belum ada riwayat transaksi lunas.</td></tr>
                  ) : riwayatTransaksi.map((trx) => (
                    <tr key={trx.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-8 py-5">
                        <p className="text-sm font-bold text-slate-800">{trx.judul}</p>
                        <span className="inline-flex mt-1 text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                          <CheckCircle2 size={10} className="mr-1 inline" /> {trx.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-xs font-bold text-slate-500">{formatDate(trx.updatedAt)}</td>
                      <td className="px-6 py-5 text-right text-sm font-black text-slate-900">{formatRupiah(trx.nominal)}</td>
                      <td className="px-8 py-5 text-center">
                        <button onClick={() => handlePrintKuitansi(trx)} className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white px-4 py-2 rounded-lg transition-colors cursor-pointer shadow-sm">
                          <Download size={14} /> Kuitansi PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- KONTEN: DONASI DAKWAH (TAMPILAN QRIS RAKSASA) --- */}
        {activeTab === "DONASI" && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
            
            {/* Banner Motivasi & QRIS Kiri */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-700 rounded-[2.5rem] p-8 md:p-12 text-white shadow-xl relative overflow-hidden flex flex-col items-center text-center">
              <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              
              <div className="relative z-10 w-full flex flex-col items-center mb-10">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6 border border-white/30"><HeartHandshake size={32} className="text-white" /></div>
                <h2 className="text-3xl md:text-4xl font-black mb-4 leading-tight tracking-tight">Investasi Abadi <br/>untuk Akhirat Anda.</h2>
                <p className="text-emerald-50 font-medium text-sm leading-relaxed max-w-md italic mb-2">"Jika seseorang meninggal dunia, maka terputuslah amalannya kecuali tiga perkara (yaitu): sedekah jariyah, ilmu yang dimanfaatkan, atau do'a anak yang sholeh"</p>
                <p className="text-xs font-bold text-emerald-200 mt-1 uppercase tracking-widest">(HR. Muslim)</p>
              </div>

              {donasi?.qrisUrl && (
                <div className="relative z-10 bg-white/10 backdrop-blur-md border border-white/20 rounded-[2.5rem] p-8 flex flex-col items-center w-full mt-auto shadow-2xl">
                  <h4 className="text-lg font-black uppercase tracking-widest text-emerald-100 mb-6 flex items-center gap-2">Scan QRIS Yayasan</h4>
                  <div className="bg-white p-4 rounded-3xl shrink-0 shadow-inner w-full max-w-[280px] aspect-square flex justify-center items-center mb-6">
                    <img src={donasi.qrisUrl} className="w-full h-full object-contain" alt="QRIS Yayasan"/>
                  </div>
                  <p className="text-sm font-bold text-white leading-relaxed max-w-[280px]">Buka E-Wallet atau M-Banking Anda dan scan kode di atas untuk donasi cepat.</p>
                </div>
              )}
            </div>

            {/* Form Konfirmasi Donasi Kanan */}
            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
              <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2"><CheckCircle2 className="text-emerald-500" size={24} /> Laporan Transfer Donasi</h3>
              <form onSubmit={handleKirimDonasi} className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 block">1. Nominal Donasi Anda</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                    {nominalDonasi.map((nom) => (
                      <button key={nom} type="button" onClick={() => setSelectedNominal(nom)} className={`py-3 rounded-xl text-sm font-bold border transition-all ${selectedNominal === nom ? "bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/20" : "bg-white border-slate-200 text-slate-600 hover:border-emerald-200"}`}>{formatRupiah(nom)}</button>
                    ))}
                    <button type="button" onClick={() => setSelectedNominal("CUSTOM")} className={`py-3 rounded-xl text-sm font-bold border transition-all ${selectedNominal === "CUSTOM" ? "bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/20" : "bg-white border-slate-200 text-slate-600 hover:border-emerald-200"}`}>Nominal Lain</button>
                  </div>
                  {selectedNominal === "CUSTOM" && (
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">Rp</span>
                      <input type="number" value={customNominal} onChange={(e) => setCustomNominal(e.target.value)} placeholder="Masukkan nominal donasi" className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 font-bold text-slate-800 outline-none" required/>
                    </div>
                  )}
                </div>

                {/* INFO REKENING BERSIH TANPA LOGO BANK */}
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><CreditCard size={14}/> Rekening Tujuan Resmi Yayasan</p>
                  <div className="mb-2">
                    <p className="text-sm font-black text-slate-800">{donasi?.bankName || 'Bank Tujuan Belum Diatur'}</p>
                    <p className="text-2xl font-black text-emerald-600 tracking-wider mt-0.5">{donasi?.bankAccount || '-'}</p>
                  </div>
                  <p className="text-xs font-bold text-slate-500 uppercase mt-3 pt-3 border-t border-slate-200">a.n. {donasi?.accountName || '-'}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-6">
                   <div className="md:col-span-2"><label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">2. Data Pengirim (Untuk Validasi Mutasi)</label></div>
                   <div>
                     <label className="text-[10px] font-bold text-slate-400 uppercase">Tanggal Transfer</label>
                     <input type="date" value={tglTransfer} onChange={e=>setTglTransfer(e.target.value)} className="w-full mt-1 p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-bold text-sm text-slate-700" required />
                   </div>
                   <div>
                     <label className="text-[10px] font-bold text-slate-400 uppercase">Nama Rekening Pengirim</label>
                     <input type="text" placeholder="Cth: Bpk. Abdullah" value={namaRekening} onChange={e=>setNamaRekening(e.target.value)} className="w-full mt-1 p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-bold text-sm text-slate-700" required />
                   </div>
                </div>

                <button type="submit" className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer">
                  Kirim Laporan Donasi
                </button>
              </form>
            </div>
          </div>
        )}

      </div>

      {/* ========================================================= */}
      {/* 2. TAMPILAN KHUSUS CETAK KUITANSI (MUNCUL HANYA SAAT PRINT) */}
      {/* ========================================================= */}
      {kuitansiCetak && (
        <div className="hidden print:block w-full max-w-[210mm] mx-auto min-h-screen p-8 bg-white text-black font-sans relative">
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
             <ShieldCheck size={400}/>
          </div>

          <div className="border-2 border-slate-800 rounded-2xl p-10 relative z-10">
             
             <div className="flex justify-between items-start border-b-2 border-slate-800 pb-6 mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-slate-900 text-white flex items-center justify-center rounded-xl font-black text-3xl">
                     <Landmark size={40}/>
                  </div>
                  <div>
                    <h1 className="text-2xl font-black uppercase tracking-wider mb-1">Yayasan Pendidikan</h1>
                    <p className="text-sm font-medium text-slate-600">Sistem Informasi Akademik & Keuangan Terpadu</p>
                    <p className="text-xs text-slate-500 mt-1">Dicetak pada: {new Date().toLocaleString('id-ID')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <h2 className="text-3xl font-black text-indigo-600 uppercase tracking-widest mb-1">Kuitansi</h2>
                  <p className="text-sm font-bold text-slate-600">No. REF: INV-{kuitansiCetak.id.substring(0,8).toUpperCase()}</p>
                </div>
             </div>

             <div className="space-y-6 mb-12">
                <div className="grid grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                   <div className="col-span-1 text-sm font-bold text-slate-500">Telah Terima Dari</div>
                   <div className="col-span-3 text-lg font-black text-slate-900">: {kuitansiCetak.student?.user?.name || "Santri Terdaftar"}</div>
                </div>
                <div className="grid grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                   <div className="col-span-1 text-sm font-bold text-slate-500">Uang Sejumlah</div>
                   <div className="col-span-3 text-xl font-black text-slate-900">: {formatRupiah(kuitansiCetak.nominal)}</div>
                </div>
                <div className="grid grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                   <div className="col-span-1 text-sm font-bold text-slate-500">Untuk Pembayaran</div>
                   <div className="col-span-3 text-lg font-black text-slate-900">
                      : {kuitansiCetak.judul} <span className="text-xs font-bold text-slate-500 bg-white px-2 py-1 rounded ml-2 border border-slate-200">{kuitansiCetak.tipe}</span>
                   </div>
                </div>
                <div className="grid grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                   <div className="col-span-1 text-sm font-bold text-slate-500">Tanggal Lunas</div>
                   <div className="col-span-3 text-lg font-black text-slate-900">: {formatDate(kuitansiCetak.updatedAt)}</div>
                </div>
             </div>

             <div className="flex justify-between items-end mt-16 pt-8 border-t border-slate-200">
                <div className="w-64">
                   <div className="border-4 border-emerald-500 text-emerald-500 font-black text-3xl uppercase tracking-widest text-center py-4 rounded-xl rotate-[-5deg] opacity-80">LUNAS</div>
                </div>
                <div className="text-center w-64">
                   <p className="text-sm font-bold mb-16">Bagian Keuangan Yayasan</p>
                   <div className="border-b-2 border-slate-800 pb-1 w-48 mx-auto font-black text-slate-800">Administrator</div>
                   <p className="text-xs text-slate-500 mt-1">Dokumen Sah & Terverifikasi Sistem</p>
                </div>
             </div>

          </div>
        </div>
      )}

    </div>
  );
}