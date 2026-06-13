"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Megaphone, Calendar, Newspaper, Tag, Info, Loader2, ArrowRight, X, Clock, ExternalLink } from "lucide-react";
import { getInformasiSantriDB } from "./actions";

export default function MadingSantriPage() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("SEMUA");
  const [selectedPost, setSelectedPost] = useState<any | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const res = await getInformasiSantriDB();
      if (res.success) setData(res.data || []);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const filteredData = activeFilter === "SEMUA" ? data : data.filter(d => d.kategori === activeFilter);
  
  // Mencari Artikel "Featured" (Terbaru & Memiliki Gambar)
  const featuredPost = activeFilter === "SEMUA" ? data.find(d => d.imageUrl) : null;
  // Sisa artikel yang bukan featured
  const gridData = featuredPost ? filteredData.filter(d => d.id !== featuredPost.id) : filteredData;

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col justify-center items-center">
        <Loader2 className="animate-spin text-indigo-600 mb-4" size={48}/>
        <p className="text-slate-500 font-bold animate-pulse">Menyiapkan Mading Digital...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-24 animate-in fade-in duration-700">
      
      {/* FILTER PILLS STICKY-LIKE */}
      <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 flex gap-3 overflow-x-auto custom-scrollbar">
        {['SEMUA', 'BERITA', 'PROMO', 'KAJIAN', 'INFO'].map(kategori => {
          const isActive = activeFilter === kategori;
          let Icon = Info;
          if(kategori === 'BERITA') Icon = Newspaper;
          if(kategori === 'PROMO') Icon = Tag;
          if(kategori === 'KAJIAN') Icon = Calendar;
          
          return (
            <button 
              key={kategori} onClick={() => setActiveFilter(kategori)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all cursor-pointer ${
                isActive ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700'
              }`}
            >
              {kategori !== 'SEMUA' && <Icon size={14}/>} {kategori === 'SEMUA' ? '🌟 For You' : kategori}
            </button>
          );
        })}
      </div>

      {/* FEATURED POST HERO (Hanya muncul di tab SEMUA jika ada gambar) */}
      {featuredPost && activeFilter === "SEMUA" && (
        <div 
          onClick={() => setSelectedPost(featuredPost)}
          className="relative h-[400px] md:h-[500px] rounded-[2.5rem] overflow-hidden shadow-2xl cursor-pointer group flex items-end p-6 md:p-12"
        >
          <img src={featuredPost.imageUrl} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Featured"/>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent"></div>
          
          <div className="relative z-10 w-full max-w-3xl animate-in slide-in-from-bottom-10 duration-700">
            <span className="bg-rose-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm mb-4 inline-block">
              🔥 Sorotan Utama
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-4 group-hover:text-indigo-200 transition-colors">
              {featuredPost.judul}
            </h1>
            <p className="text-slate-300 text-sm line-clamp-2 md:line-clamp-3 mb-6 font-medium">
              {featuredPost.konten}
            </p>
            <div className="flex items-center gap-4">
              <button className="bg-white text-slate-900 px-6 py-3 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-indigo-50 transition-colors">
                Baca Selengkapnya <ArrowRight size={16}/>
              </button>
              {featuredPost.actionLink && (
                <a 
                  href={featuredPost.actionLink.startsWith('http') ? featuredPost.actionLink : `https://${featuredPost.actionLink}`} 
                  target="_blank" rel="noreferrer"
                  onClick={(e) => e.stopPropagation()} // Cegah klik tembus ke pembukaan modal
                  className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-xs font-black flex items-center gap-2 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/30"
                >
                  Daftar / Kunjungi Link <ExternalLink size={16}/>
                </a>
              )}

              <span className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-2 md:mt-0">
                <Clock size={14}/> {new Date(featuredPost.createdAt).toLocaleDateString('id-ID', {day:'numeric', month:'short'})}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* GRID MADING SISA */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {gridData.length === 0 && !featuredPost ? (
          <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border border-slate-100 shadow-sm">
            <Megaphone size={48} className="text-slate-200 mx-auto mb-4" />
            <h3 className="text-xl font-black text-slate-800 mb-2">Belum Ada Informasi</h3>
            <p className="text-slate-500 font-medium">Coba cek kembali nanti atau ubah filter kategori Anda.</p>
          </div>
        ) : (
          gridData.map((item) => (
            <div 
              key={item.id} 
              onClick={() => setSelectedPost(item)}
              className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 flex flex-col cursor-pointer group"
            >
              {item.imageUrl && (
                <div className="h-52 bg-slate-100 relative overflow-hidden">
                  <img src={item.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" alt="Poster"/>
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
                  <span className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-slate-800 text-[9px] font-black uppercase tracking-widest shadow-sm">
                    {item.kategori}
                  </span>
                </div>
              )}
              <div className="p-6 md:p-8 flex-1 flex flex-col">
                {!item.imageUrl && (
                  <span className="inline-block w-max mb-4 bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">
                    {item.kategori}
                  </span>
                )}
                <h3 className="text-xl font-black text-slate-800 mb-3 leading-snug group-hover:text-indigo-600 transition-colors">{item.judul}</h3>
                <p className="text-xs text-slate-500 line-clamp-3 mb-6 flex-1 leading-relaxed">{item.konten}</p>
                <div className="flex items-center justify-between border-t border-slate-50 pt-4 mt-auto">
                  <span className="text-[11px] font-bold text-slate-400">
                    {new Date(item.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <ArrowRight size={14}/>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ================= MODAL BACA SELENGKAPNYA ================= */}
      {selectedPost && createPortal(
        <div className="fixed inset-0 z-[255] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
          
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-[2rem] shadow-2xl flex flex-col overflow-hidden relative animate-in zoom-in-95 duration-300">
            {/* Header Modal Sticky */}
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-white/90 backdrop-blur z-10 sticky top-0">
               <div className="flex items-center gap-3">
                 <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">
                    {selectedPost.kategori}
                 </span>
               </div>
               <button onClick={() => setSelectedPost(null)} className="w-10 h-10 bg-slate-100 text-slate-500 hover:bg-rose-500 hover:text-white rounded-full flex items-center justify-center transition-colors cursor-pointer">
                 <X size={20}/>
               </button>
            </div>

            {/* Isi Konten Scrollable */}
            <div className="overflow-y-auto custom-scrollbar p-6 md:p-10 text-slate-800">
               <h2 className="text-2xl md:text-4xl font-black leading-tight mb-4">{selectedPost.judul}</h2>
               <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-8 pb-8 border-b border-slate-100">
                 <Clock size={16}/> Dipublikasikan: {new Date(selectedPost.createdAt).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
               </div>
               
               {selectedPost.imageUrl && (
                 <div className="mb-8 rounded-3xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50">
                    <img src={selectedPost.imageUrl} className="w-full h-auto max-h-[500px] object-contain" alt="Poster Detail"/>
                 </div>
               )}

               <div className="text-sm md:text-base leading-loose whitespace-pre-wrap font-medium text-slate-600">
                 {selectedPost.konten}
               </div>
               {selectedPost.actionLink && (
                 <div className="mt-8 pt-8 border-t border-slate-100 flex justify-center md:justify-start">
                   <a 
                     href={selectedPost.actionLink.startsWith('http') ? selectedPost.actionLink : `https://${selectedPost.actionLink}`} 
                     target="_blank" rel="noreferrer"
                     className="w-full md:w-auto text-center bg-indigo-600 text-white px-8 py-4 rounded-2xl text-sm font-black flex justify-center items-center gap-3 hover:bg-indigo-700 hover:-translate-y-1 transition-all shadow-xl shadow-indigo-600/20"
                   >
                     Mulai Pendaftaran Sekarang <ExternalLink size={20}/>
                   </a>
                 </div>
               )}
            </div>
          </div>

        </div>,
        document.body
      )}

    </div>
  );
}