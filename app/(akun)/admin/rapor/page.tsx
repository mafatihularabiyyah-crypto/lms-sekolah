"use client";

import { useState, useEffect, useMemo } from 'react';
import { 
  Search, FileText, Printer, ArrowLeft, 
  GraduationCap, Loader2, UserCircle, Settings, X, Save, UploadCloud
} from 'lucide-react';
import { getStudentsForRaporDB, getStudentTranscriptDB, saveTtdConfigDB } from './actions';

export default function RaporManagerPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [transcriptData, setTranscriptData] = useState<any>(null);

  // State untuk Konfigurasi Tanda Tangan (Dari Database)
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [ttdConfig, setTtdConfig] = useState({
    adminName: "Staff Tata Usaha",
    adminTtd: "",
    kepsekName: "Ahmad Fulan, M.Pd.",
    kepsekNip: "19800101 200501 1 001",
    kepsekTtd: ""
  });

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setIsLoading(true);
    const res = await getStudentsForRaporDB();
    if (res.success) setStudents(res.data || []);
    setIsLoading(false);
  };

  const openTranscript = async (student: any) => {
    setSelectedStudent(student);
    setIsLoading(true);
    const res = await getStudentTranscriptDB(student.id, student.userId);
    
    // PERBAIKAN TYPESCRIPT: Tambahkan && res.data agar TS yakin datanya ada
    if (res.success && res.data) {
      setTranscriptData(res.data);
      // Load pengaturan TTD dari database ke state menggunakan optional chaining (?)
      if (res.data?.settings) {
         setTtdConfig({
            adminName: res.data.settings.adminName || "Staff Tata Usaha",
            adminTtd: res.data.settings.adminTtd || "",
            kepsekName: res.data.settings.kepsekName || "Kepala Sekolah",
            kepsekNip: res.data.settings.kepsekNip || "",
            kepsekTtd: res.data.settings.kepsekTtd || ""
         });
      }
    } else {
      alert("Gagal mengambil data transkrip: " + res.error);
    }
    setIsLoading(false);
  };

  const closeTranscript = () => {
    setSelectedStudent(null);
    setTranscriptData(null);
  };

  const handlePrint = () => {
    window.print();
  };

  // Convert File to Base64 untuk menyimpan gambar TTD
  const handleImageUpload = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  };

  const uploadAdminTtd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await handleImageUpload(file);
      setTtdConfig({...ttdConfig, adminTtd: base64});
    }
  };

  const uploadKepsekTtd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await handleImageUpload(file);
      setTtdConfig({...ttdConfig, kepsekTtd: base64});
    }
  };

  // Menyimpan pengaturan TTD ke Database
  const handleSaveTtdConfig = async () => {
    setIsLoading(true);
    const res = await saveTtdConfigDB(ttdConfig);
    setIsLoading(false);
    if (res.success) {
       setShowConfigModal(false);
       alert("Pengaturan Tanda Tangan berhasil disimpan ke sistem.");
    } else {
       alert("Gagal menyimpan: " + res.error);
    }
  };

  const getPredikat = (nilai: number) => {
    if (nilai >= 85) return { huruf: 'A', ket: 'Sangat Baik', warna: 'text-emerald-600' };
    if (nilai >= 75) return { huruf: 'B', ket: 'Baik', warna: 'text-blue-600' };
    if (nilai >= 60) return { huruf: 'C', ket: 'Cukup', warna: 'text-amber-600' };
    return { huruf: 'D', ket: 'Kurang', warna: 'text-rose-600' };
  };

  const filteredStudents = useMemo(() => {
    return students.filter(s => 
      s.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.nis?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [students, searchQuery]);

  // ===============================================
  // MODE 1: DAFTAR SISWA
  // ===============================================
  if (!selectedStudent) {
    return (
      <div className="flex flex-col h-full bg-slate-50 text-slate-800 animate-in fade-in duration-500 max-w-7xl mx-auto p-4 lg:p-8">
        {isLoading && <div className="fixed inset-0 z-[120] bg-white/60 backdrop-blur-sm flex items-center justify-center"><Loader2 className="w-8 h-8 text-indigo-600 animate-spin" /></div>}
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <GraduationCap className="text-indigo-600" size={28}/> Manajemen Transkrip
            </h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">Cetak dan kelola rekapitulasi nilai akhir seluruh siswa.</p>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} 
              placeholder="Cari nama atau NIS..." 
              className="w-full bg-white border border-slate-200 py-3 pl-12 pr-4 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 font-bold text-slate-700 transition shadow-sm" 
            />
          </div>
        </div>

        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-500 tracking-widest border-b border-slate-200">
                <tr>
                  <th className="py-5 px-6 w-16 text-center">No</th>
                  <th className="py-5 px-6">Identitas Siswa</th>
                  <th className="py-5 px-6">Angkatan</th>
                  <th className="py-5 px-6">Status</th>
                  <th className="py-5 px-6 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.length === 0 ? (
                  <tr><td colSpan={5} className="p-10 text-center text-slate-400 font-medium">Data siswa tidak ditemukan.</td></tr>
                ) : filteredStudents.map((s, i) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-6 text-center font-bold text-slate-400">{i + 1}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center shrink-0">
                          <UserCircle size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{s.user?.name}</p>
                          <p className="text-xs font-medium text-slate-500 font-mono">NIS: {s.nis}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-700">{s.enrollYear}</td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${s.status === 'AKTIF' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button 
                        onClick={() => openTranscript(s)} 
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                      >
                        <FileText size={16}/> Lihat Rapor
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ===============================================
  // MODE 2: LEMBAR TRANSKRIP (SIAP CETAK)
  // ===============================================
  if (selectedStudent && transcriptData) {
    const { profile, grades, settings } = transcriptData;
    const namaSekolah = settings?.schoolName || "LMS Pesantren";
    const logoSekolah = settings?.schoolLogo || "/logo.png";
    
    const totalNilai = grades.reduce((sum: number, g: any) => sum + (g.nilaiAkhir || 0), 0);
    const avgNilai = grades.length > 0 ? (totalNilai / grades.length).toFixed(1) : "0";

    return (
      <div className="bg-slate-100 min-h-screen py-8 text-slate-800 font-sans relative">
        
        {/* MODAL PENGATURAN TANDA TANGAN */}
        {showConfigModal && (
          <div className="fixed inset-0 z-[200] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white max-w-lg w-full rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] flex flex-col">
              <div className="px-6 py-4 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center shrink-0">
                <h3 className="font-black text-indigo-900 flex items-center gap-2"><Settings size={18}/> Pengaturan Tanda Tangan</h3>
                <button onClick={() => setShowConfigModal(false)} className="text-indigo-400 hover:text-indigo-700"><X size={20}/></button>
              </div>
              <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                
                {/* Blok TTD Kepala Sekolah */}
                <div className="p-4 border border-slate-200 rounded-2xl bg-slate-50">
                   <h4 className="font-bold text-slate-800 mb-3 text-sm">Blok Kepala Sekolah (Kiri Bawah)</h4>
                   <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Nama Kepala Sekolah</label>
                        <input type="text" value={ttdConfig.kepsekName} onChange={(e) => setTtdConfig({...ttdConfig, kepsekName: e.target.value})} className="w-full bg-white border border-slate-200 p-2.5 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-500 text-sm" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">NIP / Identitas</label>
                        <input type="text" value={ttdConfig.kepsekNip} onChange={(e) => setTtdConfig({...ttdConfig, kepsekNip: e.target.value})} className="w-full bg-white border border-slate-200 p-2.5 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-500 text-sm" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Upload Scan TTD (Opsional)</label>
                        <div className="flex items-center gap-3">
                           {ttdConfig.kepsekTtd && <img src={ttdConfig.kepsekTtd} className="h-10 object-contain border border-slate-200 rounded bg-white p-1" alt="ttd" />}
                           <div className="relative overflow-hidden w-full">
                              <button type="button" className="w-full py-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-200 text-xs font-bold hover:bg-indigo-100 flex items-center justify-center gap-2 cursor-pointer"><UploadCloud size={14}/> {ttdConfig.kepsekTtd ? 'Ganti TTD' : 'Pilih Gambar'}</button>
                              <input type="file" accept="image/*" onChange={uploadKepsekTtd} className="absolute inset-0 opacity-0 cursor-pointer" />
                           </div>
                           {ttdConfig.kepsekTtd && <button onClick={() => setTtdConfig({...ttdConfig, kepsekTtd: ""})} className="p-2 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-100"><X size={16}/></button>}
                        </div>
                      </div>
                   </div>
                </div>

                {/* Blok TTD Admin */}
                <div className="p-4 border border-slate-200 rounded-2xl bg-slate-50">
                   <h4 className="font-bold text-slate-800 mb-3 text-sm">Blok Admin / TU (Kanan Bawah)</h4>
                   <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Nama Admin / Tata Usaha</label>
                        <input type="text" value={ttdConfig.adminName} onChange={(e) => setTtdConfig({...ttdConfig, adminName: e.target.value})} className="w-full bg-white border border-slate-200 p-2.5 rounded-xl font-bold text-slate-800 outline-none focus:border-indigo-500 text-sm" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-500 mb-1 block">Upload Scan TTD (Opsional)</label>
                        <div className="flex items-center gap-3">
                           {ttdConfig.adminTtd && <img src={ttdConfig.adminTtd} className="h-10 object-contain border border-slate-200 rounded bg-white p-1" alt="ttd" />}
                           <div className="relative overflow-hidden w-full">
                              <button type="button" className="w-full py-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-200 text-xs font-bold hover:bg-indigo-100 flex items-center justify-center gap-2 cursor-pointer"><UploadCloud size={14}/> {ttdConfig.adminTtd ? 'Ganti TTD' : 'Pilih Gambar'}</button>
                              <input type="file" accept="image/*" onChange={uploadAdminTtd} className="absolute inset-0 opacity-0 cursor-pointer" />
                           </div>
                           {ttdConfig.adminTtd && <button onClick={() => setTtdConfig({...ttdConfig, adminTtd: ""})} className="p-2 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-100"><X size={16}/></button>}
                        </div>
                      </div>
                   </div>
                </div>

              </div>
              <div className="p-4 border-t border-slate-100 bg-white shrink-0">
                 <button onClick={handleSaveTtdConfig} disabled={isLoading} className="w-full bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 flex items-center justify-center gap-2">
                   {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18}/>}
                   Simpan ke Database
                 </button>
              </div>
            </div>
          </div>
        )}

        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body * { visibility: hidden; }
            #area-cetak-rapor, #area-cetak-rapor * { visibility: visible; }
            #area-cetak-rapor { 
              position: absolute; 
              left: 0; 
              top: 0; 
              width: 100%; 
              padding: 0;
              margin: 0;
            }
            .no-print { display: none !important; }
            @page { size: A4 portrait; margin: 0.8cm; }
          }
        `}} />

        {/* Kontrol Navigasi */}
        <div className="max-w-[800px] mx-auto mb-6 flex justify-between items-center px-4 no-print animate-in slide-in-from-top-4">
          <button onClick={closeTranscript} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition shadow-sm">
            <ArrowLeft size={18}/> Kembali
          </button>
          <div className="flex gap-3">
            <button onClick={() => setShowConfigModal(true)} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl font-bold hover:bg-indigo-100 transition shadow-sm border border-indigo-200">
              <Settings size={18}/> Atur TTD
            </button>
            <button onClick={handlePrint} className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200">
              <Printer size={18}/> Cetak PDF
            </button>
          </div>
        </div>

        {/* ===================================== */}
        {/* KERTAS A4 UNTUK CETAK */}
        {/* ===================================== */}
        <div id="area-cetak-rapor" className="max-w-[800px] mx-auto bg-white min-h-[1122px] shadow-2xl p-12 lg:p-14 print:shadow-none print:min-h-0 print:p-0 relative overflow-hidden">
          
          <div className="absolute top-0 left-0 w-full h-2 bg-indigo-900 print:bg-black"></div>

          {/* KOP SURAT */}
          <div className="flex items-center gap-6 border-b-[3px] border-slate-800 pb-5 mb-6 print:border-black">
            <img src={logoSekolah} alt="Logo" className="w-20 h-20 object-contain shrink-0" />
            <div className="flex-1">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase print:text-black">{namaSekolah}</h1>
              <p className="text-[13px] text-slate-600 font-bold mt-1 uppercase tracking-wider print:text-black">Lembaga Pendidikan & Pengasuhan Terpadu</p>
              <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest print:text-black">Sistem Informasi Akademik Terpadu (SIAKAD)</p>
            </div>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-xl font-black text-slate-800 tracking-[0.2em] underline underline-offset-8 decoration-2 print:text-black">
              TRANSKRIP NILAI AKADEMIK
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-6 text-xs text-slate-700 print:text-black">
            <div className="flex border-b border-slate-100 pb-1.5 print:border-slate-300">
              <span className="font-bold w-32 uppercase tracking-wider text-slate-500 print:text-black">Nama Siswa</span>
              <span className="font-black text-slate-900 uppercase print:text-black">: {profile.user?.name}</span>
            </div>
            <div className="flex border-b border-slate-100 pb-1.5 print:border-slate-300">
              <span className="font-bold w-32 uppercase tracking-wider text-slate-500 print:text-black">Angkatan</span>
              <span className="font-bold text-slate-900 print:text-black">: {profile.enrollYear}</span>
            </div>
            <div className="flex border-b border-slate-100 pb-1.5 print:border-slate-300">
              <span className="font-bold w-32 uppercase tracking-wider text-slate-500 print:text-black">Nomor Induk (NIS)</span>
              <span className="font-bold font-mono text-slate-900 print:text-black">: {profile.nis}</span>
            </div>
            <div className="flex border-b border-slate-100 pb-1.5 print:border-slate-300">
              <span className="font-bold w-32 uppercase tracking-wider text-slate-500 print:text-black">Status Siswa</span>
              <span className="font-bold text-slate-900 print:text-black">: {profile.status}</span>
            </div>
          </div>

          {/* TABEL NILAI */}
          <div className="mb-6">
            <table className="w-full border-collapse border-2 border-slate-900 print:border-black text-xs">
              <thead className="bg-slate-100 print:bg-gray-200 text-slate-800 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="border-2 border-slate-900 print:border-black py-2.5 px-3 text-center w-12">No</th>
                  <th className="border-2 border-slate-900 print:border-black py-2.5 px-3">Kelas / Mata Pelajaran</th>
                  <th className="border-2 border-slate-900 print:border-black py-2.5 px-3 text-center w-28">Program</th>
                  <th className="border-2 border-slate-900 print:border-black py-2.5 px-3 text-center w-20">Angka</th>
                  <th className="border-2 border-slate-900 print:border-black py-2.5 px-3 text-center w-24">Huruf Mutu</th>
                </tr>
              </thead>
              <tbody className="text-slate-800 print:text-black">
                {grades.length === 0 ? (
                  <tr><td colSpan={5} className="border border-slate-400 py-6 text-center italic text-slate-400 print:border-black">Belum ada riwayat nilai terdaftar.</td></tr>
                ) : grades.map((g: any, i: number) => {
                  const p = getPredikat(g.nilaiAkhir || 0);
                  return (
                    <tr key={g.id}>
                      <td className="border border-slate-400 print:border-black py-2 px-3 text-center">{i + 1}</td>
                      <td className="border border-slate-400 print:border-black py-2 px-3 font-bold">{g.classRoom?.name || "-"}</td>
                      <td className="border border-slate-400 print:border-black py-2 px-3 text-center italic">{g.classRoom?.program || "-"}</td>
                      <td className="border border-slate-400 print:border-black py-2 px-3 text-center font-black tabular-nums text-sm">{g.nilaiAkhir || 0}</td>
                      <td className="border border-slate-400 print:border-black py-2 px-3 text-center font-black">
                        <span className={`print:text-black ${p.warna}`}>{p.huruf}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {grades.length > 0 && (
                <tfoot className="bg-slate-50 print:bg-gray-100 font-black">
                  <tr>
                    <td colSpan={3} className="border-2 border-slate-900 print:border-black py-3 px-4 text-right uppercase tracking-widest text-[10px]">
                      Indeks Prestasi / Rata-rata Akhir
                    </td>
                    <td colSpan={2} className="border-2 border-slate-900 print:border-black py-3 px-4 text-center text-lg text-indigo-700 print:text-black">
                      {avgNilai}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* TATA LETAK TANDA TANGAN (KIRI: KEPSEK, KANAN: ADMIN) */}
          <div className="mt-10 pt-4 text-[13px] print:text-black flex justify-between px-8">
            
            {/* KIRI: KEPALA SEKOLAH */}
            <div className="text-center w-64 flex flex-col items-center">
              <p className="mb-2">Mengetahui,<br/>Kepala Sekolah {namaSekolah}</p>
              {ttdConfig.kepsekTtd ? (
                <img src={ttdConfig.kepsekTtd} alt="TTD Kepsek" className="h-20 object-contain my-1" />
              ) : (
                <div className="h-24"></div> 
              )}
              <p className="font-black uppercase border-b border-slate-900 print:border-black pb-0.5 w-max mx-auto px-4 mb-1">
                {ttdConfig.kepsekName || "........................"}
              </p>
              <p className="font-bold text-xs">NIP. {ttdConfig.kepsekNip || "........................"}</p>
            </div>

            {/* KANAN: ADMIN / TATA USAHA */}
            <div className="text-center w-64 flex flex-col items-center">
              <p className="mb-2">Diterbitkan Pada: {new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}<br/>Bagian Administrasi Akademik</p>
              {ttdConfig.adminTtd ? (
                <img src={ttdConfig.adminTtd} alt="TTD Admin" className="h-20 object-contain my-1" />
              ) : (
                <div className="h-24"></div> 
              )}
              <p className="font-black uppercase border-b border-slate-900 print:border-black pb-0.5 w-max mx-auto px-4 mt-auto">
                {ttdConfig.adminName || "........................"}
              </p>
            </div>

          </div>

        </div>
      </div>
    );
  }

  return null;
}