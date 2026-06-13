"use client";

import { 
  Award, Download, Share2, Medal, 
  ShieldCheck, Lock, Star, ExternalLink, 
  CheckCircle2, Clock
} from "lucide-react";

// --- DATA DUMMY ---
// Nantinya bisa Anda hubungkan dengan Prisma setelah tabel Sertifikat dibuat.
const earnedCertificates = [
  {
    id: "cert_01",
    title: "Syahadah Fiqih Muamalah Lanjutan",
    issuer: "Pesantren Tarbiyah Tech",
    date: "15 Juni 2026",
    grade: "Mumtaz (A+)",
    credentialId: "TRB-2026-FM-0092",
    skills: ["Fiqih Ekonomi", "Hukum Kontrak Islam", "Kepatuhan Syariah"],
    color: "from-amber-400 to-orange-500"
  },
  {
    id: "cert_02",
    title: "Ijazah Tahsin & Tajwid Al-Qur'an",
    issuer: "Pesantren Tarbiyah Tech",
    date: "10 Januari 2026",
    grade: "Jayyid Jiddan (A)",
    credentialId: "TRB-2026-TQ-0184",
    skills: ["Makharijul Huruf", "Hukum Tajwid", "Gharib Al-Qur'an"],
    color: "from-emerald-400 to-teal-600"
  }
];

const lockedCertificates = [
  {
    id: "lock_01",
    title: "Syahadah Tafsir Tematik",
    progress: 85,
    requirement: "Selesaikan Ujian Akhir Tafsir Juz 30"
  },
  {
    id: "lock_02",
    title: "Sertifikasi Bahasa Arab Dasar",
    progress: 40,
    requirement: "Selesaikan Modul Percakapan & Nahwu Shorof"
  }
];

export default function SertifikatSantri() {

  const handleShare = (title: string) => {
    alert(`Tautan untuk sertifikat "${title}" berhasil disalin! Anda bisa membagikannya ke LinkedIn atau media sosial lainnya.`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 font-sans pb-12">
      
      {/* 1. HERO BANNER: ACHIEVEMENT SHOWCASE */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>
        
        <div className="relative z-10 md:w-1/2 space-y-6">
          <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 px-4 py-2 rounded-full">
            <Award size={16} className="text-amber-400" />
            <span className="text-xs font-black uppercase tracking-widest text-amber-300">Pencapaian Akademik</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white leading-tight">
            Koleksi Syahadah <br /> & Sertifikat Anda.
          </h1>
          <p className="text-slate-400 font-medium text-sm leading-relaxed max-w-md">
            Bukti dedikasi dan kerja keras Anda dalam menuntut ilmu. Unduh, simpan, dan bagikan pencapaian Anda kepada dunia.
          </p>
          <div className="flex items-center gap-6 pt-4">
            <div>
              <p className="text-3xl font-black text-white">{earnedCertificates.length}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Sertifikat Diraih</p>
            </div>
            <div className="w-px h-10 bg-slate-700"></div>
            <div>
              <p className="text-3xl font-black text-white">{lockedCertificates.length}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Dalam Proses</p>
            </div>
          </div>
        </div>

        {/* 3D Certificate Preview Illusion */}
        <div className="relative z-10 md:w-1/2 flex justify-center w-full">
          <div className="relative w-full max-w-md aspect-[4/3] bg-gradient-to-br from-slate-100 to-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] rotate-2 hover:rotate-0 transition-transform duration-500 border-8 border-white p-6 flex flex-col items-center justify-center text-center group">
            <div className="absolute inset-0 border border-slate-200 m-2 rounded-xl pointer-events-none"></div>
            <Medal size={48} className="text-amber-500 mb-4 drop-shadow-md group-hover:scale-110 transition-transform duration-500" />
            <h3 className="font-serif text-2xl font-bold text-slate-800 mb-1 leading-tight">Syahadah Kelulusan</h3>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-black mb-4">Pesantren Tarbiyah Tech</p>
            <div className="w-16 h-0.5 bg-amber-400 mb-4"></div>
            <div className="w-3/4 h-2 bg-slate-100 rounded-full mb-2"></div>
            <div className="w-1/2 h-2 bg-slate-100 rounded-full"></div>
            
            {/* Hologram Badge */}
            <div className="absolute bottom-6 right-6 w-12 h-12 bg-gradient-to-br from-amber-300 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
               <ShieldCheck size={20} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. DAFTAR SERTIFIKAT DIMILIKI */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <CheckCircle2 className="text-emerald-500" size={24} />
          <h2 className="text-xl font-black text-slate-800">Telah Diraih</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {earnedCertificates.map((cert) => (
            <div key={cert.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden flex flex-col group hover:border-amber-200 transition-colors">
              
              {/* Card Header (Visual) */}
              <div className={`h-24 bg-gradient-to-r ${cert.color} p-6 relative flex items-center justify-between`}>
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <ShieldCheck size={40} className="text-white/20 absolute -bottom-4 -right-2 transform rotate-12" />
                <div className="relative z-10 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-white text-[10px] font-black uppercase tracking-widest border border-white/30">
                  Resmi Terverifikasi
                </div>
                <div className="relative z-10 text-white font-black text-lg">
                  {cert.grade}
                </div>
              </div>

              {/* Card Body */}
              <div className="p-6 md:p-8 flex-1 flex flex-col">
                <h3 className="text-xl font-black text-slate-800 leading-tight mb-2 group-hover:text-amber-600 transition-colors">{cert.title}</h3>
                <p className="text-xs font-bold text-slate-400 mb-6 flex items-center gap-1.5">
                  <Star size={14} className="text-amber-400 fill-amber-400"/> Diberikan pada {cert.date}
                </p>

                <div className="space-y-4 mb-8">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Penerbit</p>
                    <p className="text-sm font-bold text-slate-700">{cert.issuer}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ID Kredensial</p>
                    <p className="text-sm font-bold text-slate-700 font-mono bg-slate-50 px-2 py-1 rounded-md w-fit border border-slate-100">{cert.credentialId}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Keahlian (Skills)</p>
                    <div className="flex flex-wrap gap-2">
                      {cert.skills.map((skill, idx) => (
                        <span key={idx} className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg text-[10px] font-bold">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-auto pt-6 border-t border-slate-100 flex items-center gap-3">
                  <button className="flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl text-xs font-bold shadow-md transition-colors">
                    <Download size={16} /> Unduh PDF
                  </button>
                  <button 
                    onClick={() => handleShare(cert.title)}
                    className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 py-3 rounded-xl text-xs font-bold shadow-sm transition-colors"
                  >
                    <Share2 size={16} /> Bagikan
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. SERTIFIKAT TERKUNCI (MOTIVASI) */}
      <div className="pt-8">
        <div className="flex items-center gap-3 mb-6">
          <Lock className="text-slate-400" size={24} />
          <h2 className="text-xl font-black text-slate-800">Sedang Dalam Proses</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {lockedCertificates.map((locked) => (
            <div key={locked.id} className="bg-slate-50 rounded-[2rem] border border-slate-200 border-dashed p-6 flex items-center gap-6 group hover:border-indigo-300 transition-colors">
              <div className="w-16 h-16 bg-white rounded-2xl border border-slate-200 flex items-center justify-center text-slate-300 shrink-0 group-hover:text-indigo-400 group-hover:shadow-sm transition-all">
                <Award size={28} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-black text-slate-700 mb-1">{locked.title}</h3>
                <p className="text-xs font-medium text-slate-500 mb-3 flex items-center gap-1">
                  <ExternalLink size={12}/> Syarat: {locked.requirement}
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-400 rounded-full group-hover:bg-indigo-500 transition-colors" style={{ width: `${locked.progress}%` }}></div>
                  </div>
                  <span className="text-[10px] font-black text-slate-500 w-8">{locked.progress}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}