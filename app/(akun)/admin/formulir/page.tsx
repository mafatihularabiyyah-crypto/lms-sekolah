"use client";

import { useState } from "react";
import { 
  ListTodo, PlusCircle, Users, Type, AlignLeft, 
  CircleDot, CheckSquare, ChevronDown, Calendar, 
  Clock, Upload, Trash, ChevronUp, Send, Save 
} from "lucide-react";

type TabType = "daftar" | "buat" | "respon";
type KolomType = "teks_pendek" | "teks_panjang" | "radio" | "checkbox" | "dropdown" | "tanggal" | "waktu" | "file";

interface StrukturKolom {
  id: string;
  tipe: KolomType;
  label: string;
  wajib: boolean;
  opsi?: string[];
}

export default function ManajemenFormulirPage() {
  const [tabAktif, setTabAktif] = useState<TabType>("daftar");
  const [draftStruktur, setDraftStruktur] = useState<StrukturKolom[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // --- FUNGSI BUILDER FORMULIR ---
  const tambahKolom = (tipe: KolomType) => {
    const idUnik = 'kolom_' + Math.random().toString(36).substr(2, 9);
    let kolomBaru: StrukturKolom = { id: idUnik, tipe, label: "Pertanyaan Baru", wajib: true };
    
    if (["dropdown", "radio", "checkbox"].includes(tipe)) {
      kolomBaru.opsi = ["Opsi 1", "Opsi 2"];
    }
    
    setDraftStruktur([...draftStruktur, kolomBaru]);
  };

  const hapusKolom = (index: number) => {
    const dataBaru = [...draftStruktur];
    dataBaru.splice(index, 1);
    setDraftStruktur(dataBaru);
  };

  const pindahKolom = (index: number, arah: number) => {
    if (index + arah < 0 || index + arah >= draftStruktur.length) return;
    const dataBaru = [...draftStruktur];
    const temp = dataBaru[index];
    dataBaru[index] = dataBaru[index + arah];
    dataBaru[index + arah] = temp;
    setDraftStruktur(dataBaru);
  };

  const simpanFormulir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (draftStruktur.length === 0) return alert("Formulir belum memiliki pertanyaan!");
    
    setIsSaving(true);
    // TODO: Kirim data ke Server Action Prisma di sini
    console.log("Data siap disimpan ke DB:", draftStruktur);
    
    setTimeout(() => {
      alert("Formulir berhasil disimpan!");
      setIsSaving(false);
      setTabAktif("daftar");
    }, 1000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-black text-slate-800">Manajemen Formulir</h2>
        <p className="text-sm text-slate-500 font-medium mt-1">Buat form pendaftaran PPDB dan kelola data calon santri.</p>
      </div>

      {/* NAVIGASI TAB */}
      <div className="flex bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden text-sm font-bold">
        <button 
          onClick={() => setTabAktif("daftar")}
          className={`flex-1 py-4 flex items-center justify-center gap-2 transition-colors ${tabAktif === "daftar" ? "bg-indigo-50 text-indigo-600 border-b-4 border-indigo-600" : "text-slate-500 hover:bg-slate-50"}`}
        >
          <ListTodo size={18} /> Daftar Formulir
        </button>
        <button 
          onClick={() => setTabAktif("buat")}
          className={`flex-1 py-4 flex items-center justify-center gap-2 transition-colors ${tabAktif === "buat" ? "bg-indigo-50 text-indigo-600 border-b-4 border-indigo-600" : "text-slate-500 hover:bg-slate-50"}`}
        >
          <PlusCircle size={18} /> Buat Form Baru
        </button>
        <button 
          onClick={() => setTabAktif("respon")}
          className={`flex-1 py-4 flex items-center justify-center gap-2 transition-colors ${tabAktif === "respon" ? "bg-indigo-50 text-indigo-600 border-b-4 border-indigo-600" : "text-slate-500 hover:bg-slate-50"}`}
        >
          <Users size={18} /> Data Respon
        </button>
      </div>

      {/* KONTEN TAB: BUAT FORMULIR */}
      {tabAktif === "buat" && (
        <div className="flex flex-col lg:flex-row gap-6 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* AREA KANVAS (KIRI) */}
          <div className="flex-1 w-full bg-white border border-slate-200 rounded-[2rem] p-6 lg:p-10 shadow-sm relative z-10">
            <form onSubmit={simpanFormulir}>
              <div className="mb-8 border-b-4 border-indigo-500 pb-6 rounded-t-lg">
                <input type="text" placeholder="Judul Formulir" required className="w-full text-3xl font-black text-slate-900 bg-transparent outline-none mb-3 placeholder-slate-300"/>
                <textarea placeholder="Tuliskan instruksi pengisian form..." className="w-full text-sm font-medium text-slate-500 bg-transparent outline-none resize-none h-14" required></textarea>
              </div>

              <div className="space-y-4 min-h-[200px]">
                {draftStruktur.length === 0 ? (
                  <div className="p-10 border-2 border-dashed border-slate-300 rounded-3xl text-center text-slate-400 font-bold bg-slate-50/50">
                    Belum ada pertanyaan. Tambahkan dari menu di samping kanan.
                  </div>
                ) : (
                  draftStruktur.map((kolom, index) => (
                    <div key={kolom.id} className="bg-white p-5 lg:p-6 rounded-2xl border border-slate-200 shadow-sm relative group border-l-4 border-l-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100">
                      <div className="absolute -top-3 left-6 bg-indigo-100 text-indigo-700 px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest">{kolom.tipe.replace('_', ' ')}</div>
                      
                      <div className="mt-2">
                        <input 
                          type="text" 
                          value={kolom.label}
                          onChange={(e) => {
                            const dataBaru = [...draftStruktur];
                            dataBaru[index].label = e.target.value;
                            setDraftStruktur(dataBaru);
                          }}
                          placeholder="Ketik Pertanyaan di sini..." 
                          className="w-full text-lg font-black text-slate-800 bg-transparent outline-none pb-1 border-b border-transparent focus:border-indigo-500"
                        />
                        {/* Preview Input Dummy */}
                        <div className="mt-3 opacity-60 pointer-events-none">
                          {kolom.tipe === "teks_pendek" && <input type="text" placeholder="Jawaban Singkat..." className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm"/>}
                          {kolom.tipe === "teks_panjang" && <textarea placeholder="Jawaban Panjang..." className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm h-16"></textarea>}
                          {["radio", "checkbox", "dropdown"].includes(kolom.tipe) && (
                            <div className="text-sm font-bold text-indigo-600 bg-indigo-50 p-3 rounded-xl border border-indigo-100">Area Opsi Pilihan (Klik Simpan untuk melihat mode Edit Opsi)</div>
                          )}
                        </div>
                      </div>

                      {/* Tombol Aksi Pertanyaan */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center text-sm">
                        <div className="flex gap-2">
                          <button type="button" onClick={() => pindahKolom(index, -1)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><ChevronUp size={18}/></button>
                          <button type="button" onClick={() => pindahKolom(index, 1)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><ChevronDown size={18}/></button>
                        </div>
                        <button type="button" onClick={() => hapusKolom(index)} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100"><Trash size={16}/></button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-10 pt-6 border-t border-slate-100">
                <button type="submit" disabled={isSaving} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition shadow-md flex justify-center items-center gap-2">
                  {isSaving ? "Menyimpan..." : <><Send size={20}/> Simpan Formulir</>}
                </button>
              </div>
            </form>
          </div>

          {/* SIDEBAR TOOLBOX (KANAN) */}
          <div className="w-full lg:w-72 bg-white p-5 rounded-2xl shadow-sm border border-slate-200 sticky top-28 shrink-0">
            <h3 className="font-black text-slate-800 mb-4 text-sm uppercase tracking-widest flex items-center gap-2">Tambah Pertanyaan</h3>
            <div className="flex flex-col gap-2 text-xs font-bold text-slate-600">
              <button onClick={() => tambahKolom('teks_pendek')} className="p-3 border border-slate-200 rounded-xl hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-3 text-left"><Type size={18}/> Teks Singkat</button>
              <button onClick={() => tambahKolom('teks_panjang')} className="p-3 border border-slate-200 rounded-xl hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-3 text-left"><AlignLeft size={18}/> Paragraf</button>
              <button onClick={() => tambahKolom('radio')} className="p-3 border border-slate-200 rounded-xl hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-3 text-left"><CircleDot size={18}/> Pilihan Ganda</button>
              <button onClick={() => tambahKolom('tanggal')} className="p-3 border border-slate-200 rounded-xl hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-3 text-left"><Calendar size={18}/> Tanggal Lahir</button>
              <button onClick={() => tambahKolom('file')} className="p-3 border border-indigo-100 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 flex items-center gap-3 text-left"><Upload size={18}/> Upload Berkas</button>
            </div>
          </div>
        </div>
      )}

      {/* KONTEN TAB: DAFTAR & RESPON (Tahap Selanjutnya) */}
      {tabAktif === "daftar" && <div className="p-10 text-center text-slate-500 font-bold bg-white rounded-3xl border border-slate-200">Menunggu Data Formulir dari Database...</div>}
      {tabAktif === "respon" && <div className="p-10 text-center text-slate-500 font-bold bg-white rounded-3xl border border-slate-200">Tabel Respon & Fitur Jadikan Santri akan dirender di sini.</div>}
    </div>
  );
}