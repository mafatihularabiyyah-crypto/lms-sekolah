"use client";

import React, { useState, useEffect } from "react";
import { BookOpen, Download, Loader2, FileText, Tag, MessageCircle } from "lucide-react";
import { getBukuSantriDB } from "./actions";

export default function BukuSantriPage() {
  const [bukuList, setBukuList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    const res = await getBukuSantriDB();
    if (res.success) setBukuList(res.data);
    setIsLoading(false);
  };

  const formatRupiah = (angka: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(angka);

  if (isLoading) return (
    <div className="py-32 flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
      <p className="text-slate-500 font-bold animate-pulse">Membuka perpustakaan digital...</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 md:p-10 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="relative z-10">
          <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 mb-3 inline-flex items-center gap-1.5">
            <BookOpen size={12}/> Media Belajar & Buku
          </span>
          <h1 className="text-3xl font-black mb-1">Katalog Buku & Modul</h1>
          <p className="text-blue-100 text-sm max-w-md">Unduh materi digital secara instan, atau pesan langsung buku cetak fisik resmi yayasan via WhatsApp Admin.</p>
        </div>
      </div>

      {bukuList.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-16 text-center shadow-sm">
          <FileText className="mx-auto text-slate-300 mb-4" size={48} />
          <h3 className="text-xl font-black text-slate-800">Katalog Masih Kosong</h3>
          <p className="text-slate-500 text-sm mt-1">Belum ada buku atau modul belajar yang diterbitkan oleh Admin saat ini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {bukuList.map((buku) => {
            const hasDiskon = buku.potonganHarga > 0;
            const hargaAkhir = buku.hargaNormal - (buku.potonganHarga || 0);
            const isFree = buku.hargaNormal === 0;

            // Generate Pesan WA Otomatis untuk Buku Cetak
            const pesanWa = `Assalamu'alaikum Admin, saya ingin memesan buku fisik berjudul *${buku.judul}*. Mohon informasi cara pemesanan dan pengirimannya.`;
            const waLink = `https://wa.me/${buku.nomorWa}?text=${encodeURIComponent(pesanWa)}`;

            return (
              <div key={buku.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col group hover:border-blue-200 hover:shadow-md transition-all duration-300">
                
                <div className="bg-slate-100 aspect-[3/4] relative overflow-hidden flex items-center justify-center border-b border-slate-50 shrink-0">
                  {buku.coverUrl ? (
                    <img src={buku.coverUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={buku.judul} />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                      <BookOpen size={40} className="mb-2 opacity-40" />
                      <span className="text-xs font-bold uppercase tracking-widest">No Cover</span>
                    </div>
                  )}

                  {hasDiskon && !isFree && (
                    <span className="absolute top-4 left-4 bg-rose-500 text-white font-black text-[9px] px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm flex items-center gap-1 animate-pulse">
                      <Tag size={10}/> Diskon {formatRupiah(buku.potonganHarga)}
                    </span>
                  )}

                  <span className={`absolute top-4 right-4 text-white font-black text-[9px] px-2.5 py-1 rounded-md uppercase tracking-wider shadow-sm ${buku.isFisik ? 'bg-amber-500' : 'bg-blue-600'}`}>
                     {buku.isFisik ? 'BUKU CETAK' : 'DIGITAL PDF'}
                  </span>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="font-black text-slate-800 text-base leading-snug line-clamp-2 mb-1 group-hover:text-blue-600 transition-colors">
                    {buku.judul}
                  </h3>
                  
                  <div className="mb-4 flex items-baseline gap-2 flex-wrap">
                    {isFree ? (
                      <span className="text-emerald-600 font-black text-sm uppercase bg-emerald-50 px-2.5 py-0.5 rounded-lg tracking-wider border border-emerald-100">Gratis</span>
                    ) : (
                      <>
                        <span className="text-slate-900 font-black text-lg">{formatRupiah(hargaAkhir)}</span>
                        {hasDiskon && <span className="text-slate-400 font-bold text-xs line-through">{formatRupiah(buku.hargaNormal)}</span>}
                      </>
                    )}
                  </div>

                  <p className="text-slate-500 text-xs font-medium leading-relaxed line-clamp-3 mb-6 bg-slate-50 p-3 rounded-xl border border-slate-100 flex-1">
                    {buku.deskripsi || "Tidak ada deskripsi."}
                  </p>

                  <div className="mt-auto">
                    {buku.isFisik ? (
                      <a href={waLink} target="_blank" rel="noreferrer" className="w-full py-3 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-700 shadow-md shadow-emerald-100 transition-all cursor-pointer">
                        <MessageCircle size={16} /> Beli Via WhatsApp
                      </a>
                    ) : (
                      <a href={buku.fileUrl} target="_blank" rel="noreferrer" className="w-full py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 shadow-md shadow-slate-100 transition-all cursor-pointer">
                        <Download size={14} /> Unduh Materi PDF
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}