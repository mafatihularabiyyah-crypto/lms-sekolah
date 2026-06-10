"use client";

import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { submitResponFormulirDB } from "./actions";

export default function FormClient({ formulir }: { formulir: any }) {
  const [jawaban, setJawaban] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Parse struktur JSON dari database
  const struktur = typeof formulir.struktur === "string" 
    ? JSON.parse(formulir.struktur) 
    : formulir.struktur || [];

  const handleInput = (idKolom: string, nilai: any) => {
    setJawaban((prev) => ({ ...prev, [idKolom]: nilai }));
  };

  const handleCheckbox = (idKolom: string, nilai: string, checked: boolean) => {
    setJawaban((prev) => {
      const opsiSaatIni = prev[idKolom] || [];
      if (checked) {
        return { ...prev, [idKolom]: [...opsiSaatIni, nilai] };
      } else {
        return { ...prev, [idKolom]: opsiSaatIni.filter((item: string) => item !== nilai) };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const res = await submitResponFormulirDB(formulir.id, jawaban);
    
    setIsSubmitting(false);
    if (res.success) {
      setIsSuccess(true);
    } else {
      alert(res.error);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white max-w-lg w-full rounded-[2rem] p-10 text-center shadow-xl border border-slate-100">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Pendaftaran Berhasil!</h2>
          <p className="text-slate-500 font-medium">Data Anda telah terekam di sistem kami. Silakan tunggu informasi selanjutnya dari panitia/admin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-indigo-50/30 py-10 px-4 sm:px-6">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
        
        {/* HEADER FORMULIR */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="h-3 bg-indigo-600 w-full"></div>
          <div className="p-8">
            <h1 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">{formulir.judul}</h1>
            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{formulir.deskripsi}</p>
          </div>
        </div>

        {/* PERTANYAAN (MAPPING DARI DATABASE) */}
        {struktur.map((kolom: any) => (
          <div key={kolom.id} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
            <label className="block text-base font-bold text-slate-800 mb-4">
              {kolom.label} {kolom.wajib && <span className="text-rose-500">*</span>}
            </label>

            {/* Teks Pendek */}
            {kolom.tipe === "teks_pendek" && (
              <input type="text" required={kolom.wajib} onChange={(e) => handleInput(kolom.id, e.target.value)} placeholder="Jawaban Anda" className="w-full sm:w-2/3 bg-transparent border-b border-slate-300 focus:border-indigo-600 outline-none pb-2 text-slate-700 transition-colors"/>
            )}

            {/* Paragraf / Teks Panjang */}
            {kolom.tipe === "teks_panjang" && (
              <textarea required={kolom.wajib} onChange={(e) => handleInput(kolom.id, e.target.value)} placeholder="Jawaban Anda" className="w-full bg-transparent border-b border-slate-300 focus:border-indigo-600 outline-none pb-2 text-slate-700 transition-colors h-10 resize-y"></textarea>
            )}

            {/* Pilihan Ganda (Radio) */}
            {kolom.tipe === "radio" && (
              <div className="space-y-3">
                {kolom.opsi?.map((opsi: string, i: number) => (
                  <label key={i} className="flex items-center gap-3 cursor-pointer group">
                    <input type="radio" name={kolom.id} required={kolom.wajib} value={opsi} onChange={(e) => handleInput(kolom.id, e.target.value)} className="w-5 h-5 text-indigo-600 border-slate-300 focus:ring-indigo-600 cursor-pointer"/>
                    <span className="text-slate-700 group-hover:text-slate-900">{opsi}</span>
                  </label>
                ))}
              </div>
            )}

            {/* Kotak Centang (Checkbox) */}
            {kolom.tipe === "checkbox" && (
              <div className="space-y-3">
                {kolom.opsi?.map((opsi: string, i: number) => (
                  <label key={i} className="flex items-center gap-3 cursor-pointer group">
                    <input type="checkbox" value={opsi} onChange={(e) => handleCheckbox(kolom.id, e.target.value, e.target.checked)} className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-600 cursor-pointer"/>
                    <span className="text-slate-700 group-hover:text-slate-900">{opsi}</span>
                  </label>
                ))}
              </div>
            )}

            {/* Dropdown */}
            {kolom.tipe === "dropdown" && (
              <select required={kolom.wajib} onChange={(e) => handleInput(kolom.id, e.target.value)} className="w-full sm:w-2/3 bg-slate-50 border border-slate-200 text-slate-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">-- Pilih --</option>
                {kolom.opsi?.map((opsi: string, i: number) => (
                  <option key={i} value={opsi}>{opsi}</option>
                ))}
              </select>
            )}

            {/* Tanggal */}
            {kolom.tipe === "tanggal" && (
              <input type="date" required={kolom.wajib} onChange={(e) => handleInput(kolom.id, e.target.value)} className="bg-slate-50 border border-slate-200 text-slate-700 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"/>
            )}

            {/* File (Menggunakan input teks url sementara) */}
            {kolom.tipe === "file" && (
              <input type="url" required={kolom.wajib} onChange={(e) => handleInput(kolom.id, e.target.value)} placeholder="Masukkan link file (Google Drive / Dropox / dll)" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"/>
            )}
          </div>
        ))}

        {/* TOMBOL SUBMIT */}
        <div className="flex justify-between items-center bg-transparent pt-4">
          <p className="text-xs text-slate-400 font-bold tracking-widest uppercase">LMS Pesantren</p>
          // Cari baris tombol submit dan ubah ikonnya menjadi <Send />
<button type="submit" disabled={isSubmitting} className="bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 flex items-center gap-2">
  {isSubmitting ? "Mengirim..." : <><Send size={20}/> Kirim Jawaban</>}
</button>
        </div>
      </form>
    </div>
  );
}