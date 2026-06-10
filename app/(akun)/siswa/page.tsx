// app/(akun)/santri/page.tsx
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { BookOpen, GraduationCap, Clock, FileText, CheckCircle2 } from "lucide-react";

export default async function DashboardSantri() {
  // 1. Ambil sesi login santri
  const session = await getServerSession();
  if (!session?.user?.email) redirect("/login");

  // 2. Tarik data profil santri & sinkronisasi dengan kelasnya
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      studentProfile: {
        include: {
          classes: {
            include: {
              materials: { orderBy: { createdAt: 'desc' }, take: 4 }, // Ambil 4 materi terbaru
              grades: { where: { studentId: (session.user as any).id } },
            }
          }
        }
      }
    }
  });

  if (!user || user.role !== "SANTRI") redirect("/login");
  
  const profil = user.studentProfile;
  const kelasku = profil?.classes || [];

  // 3. Kalkulasi Statistik Ringkas
  const totalKelas = kelasku.length;
  let totalMateri = 0;
  
  // Mengumpulkan materi terbaru dari semua kelas
  const materiTerbaru = kelasku.flatMap(k => 
    k.materials.map(m => ({ ...m, namaKelas: k.name }))
  ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 5);

  return (
    <div className="max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Sambutan */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-8 text-white shadow-xl shadow-emerald-600/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-black mb-2">Ahlan wa Sahlan, {user.name}!</h1>
          <p className="text-emerald-100 font-medium">Semoga hari ini penuh berkah. Jangan lupa untuk mengecek materi terbaru Anda.</p>
          
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="bg-black/20 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Status: {profil?.status || "Aktif"}
            </span>
            <span className="bg-black/20 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-bold">
              NIS: {profil?.nis || "Belum diatur"}
            </span>
          </div>
        </div>
      </div>

      {/* Widget Statistik Ringkas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Kelas Aktif</p>
            <h3 className="text-2xl font-black text-slate-800">{totalKelas} Kelas</h3>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
            <GraduationCap size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Rata-rata Nilai</p>
            <h3 className="text-2xl font-black text-slate-800">Cek Rapor</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tugas Selesai</p>
            <h3 className="text-2xl font-black text-slate-800">Real-time</h3>
          </div>
        </div>
      </div>

      {/* Area Bawah: Materi Terbaru & Jadwal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Kolom 1: Materi Terbaru */}
        <div className="bg-white rounded-3xl p-7 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <FileText className="text-emerald-500" size={20} /> Materi Terbaru
            </h2>
          </div>
          
          <div className="space-y-4">
            {materiTerbaru.length === 0 ? (
              <p className="text-sm text-slate-500 italic text-center py-6 bg-slate-50 rounded-xl">Belum ada materi baru dari Ustadz/Ustadzah.</p>
            ) : (
              materiTerbaru.map((materi) => (
                <div key={materi.id} className="flex gap-4 p-4 rounded-2xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100 group">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800 mb-1">{materi.title}</h4>
                    <p className="text-[11px] font-bold text-emerald-600 mb-1">{materi.namaKelas}</p>
                    <p className="text-xs text-slate-500 line-clamp-1">{materi.description}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Kolom 2: Info Kelas */}
        <div className="bg-white rounded-3xl p-7 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <Clock className="text-blue-500" size={20} /> Kelas Saya
            </h2>
          </div>

          <div className="space-y-3">
            {kelasku.length === 0 ? (
              <p className="text-sm text-slate-500 italic text-center py-6 bg-slate-50 rounded-xl">Anda belum didaftarkan ke kelas manapun.</p>
            ) : (
              kelasku.map((kelas) => (
                <div key={kelas.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{kelas.name}</h4>
                    <p className="text-[11px] text-slate-500 font-medium mt-0.5">Pengajar: {kelas.pengajar || "-"}</p>
                  </div>
                  <span className="px-3 py-1 bg-white border border-slate-200 text-slate-600 text-[10px] font-bold rounded-lg shadow-sm">
                    {kelas.jadwal || "Sesuai Jadwal"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}