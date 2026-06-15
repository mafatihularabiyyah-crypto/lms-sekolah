import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { 
  BookOpen, GraduationCap, FileText, 
  Sparkles, TrendingUp, ChevronRight, Calendar, User
} from "lucide-react";

export default async function DashboardSantri() {
  const session = await getServerSession();
  if (!session?.user?.email) redirect("/login");
  const userId = (session.user as any).id;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      studentProfile: {
        include: {
          classes: {
            include: {
              materials: { orderBy: { createdAt: 'desc' }, take: 4 },
              grades: { where: { studentId: userId } },
            }
          }
        }
      }
    }
  });

  if (!user || user.role !== "SANTRI") redirect("/login");
  
  const profil = user.studentProfile;
  const kelasku = profil?.classes || [];

  const totalKelas = kelasku.length;
  const materiTerbaru = kelasku.flatMap((k: any) => 
    k.materials.map((m: any) => ({ ...m, namaKelas: k.name }))
  ).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 4);

  let totalNilai = 0;
  let jumlahNilai = 0;
  kelasku.forEach((k: any) => {
    k.grades.forEach((g: any) => {
      totalNilai += g.nilaiAkhir || 0;
      jumlahNilai++;
    });
  });
  const rataRata = jumlahNilai > 0 ? Math.round(totalNilai / jumlahNilai) : 0;
  const today = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 font-sans pb-10">
      
      {/* HEADER: Ultra Clean Welcome Card */}
      <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-slate-50 to-transparent rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 border border-slate-100 text-xs font-bold uppercase tracking-widest text-slate-500">
            <Calendar size={14} /> {today}
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Halo, {user.name.split(' ')[0]} <Sparkles className="text-indigo-400" size={32} />
          </h1>
          <p className="text-slate-500 text-lg max-w-xl leading-relaxed">
            Selamat datang kembali di portal belajar Anda. Lanjutkan progres luar biasa Anda hari ini.
          </p>
        </div>

        {/* Minimalist Profile Widget */}
        <div className="relative z-10 flex items-center gap-5 p-6 bg-slate-50 rounded-3xl border border-slate-100 min-w-[280px]">
           <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-indigo-600">
              <User size={28} />
           </div>
           <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Status Akademik</p>
              <div className="flex items-center gap-2">
                 <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span></span>
                 <p className="font-bold text-slate-800">{profil?.status || "Aktif"}</p>
              </div>
              <p className="text-xs font-medium text-slate-500 mt-1">NIS: {profil?.nis || "-"}</p>
           </div>
        </div>
      </div>

      {/* QUICK STATS: Modern Borderless Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col items-start hover:-translate-y-1 transition-transform duration-300">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
            <BookOpen size={20} strokeWidth={2.5} />
          </div>
          <h3 className="text-4xl font-black text-slate-900 mb-1">{totalKelas}</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Kelas Aktif</p>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col items-start hover:-translate-y-1 transition-transform duration-300">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6">
            <GraduationCap size={22} strokeWidth={2.5} />
          </div>
          <div className="flex items-end gap-3 mb-1">
            <h3 className="text-4xl font-black text-slate-900">{rataRata}</h3>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg mb-1 flex items-center gap-1">
              <TrendingUp size={12}/> Top 10%
            </span>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Rata-rata Nilai</p>
        </div>

        {/* Wide Progress Card */}
        <div className="md:col-span-2 bg-white p-6 md:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 flex flex-col justify-center">
           <div className="flex justify-between items-end mb-4">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Target Pembelajaran</p>
                <h3 className="text-xl font-bold text-slate-800">Progres Semester Genap</h3>
              </div>
              <span className="text-3xl font-black text-indigo-600">85%</span>
           </div>
           <div className="w-full h-3 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
              <div className="h-full bg-indigo-500 rounded-full w-[85%] relative"></div>
           </div>
        </div>
      </div>

      {/* FEED & CLASSES SECTION */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
        
        {/* Kolom Kiri: Feed Pembelajaran (Lebar 3/5) */}
        <div className="xl:col-span-3 bg-white rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-slate-900">Aktivitas Terbaru</h2>
            <button className="text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-1">
              Lihat Semua <ChevronRight size={14}/>
            </button>
          </div>
          
          <div className="space-y-6">
            {materiTerbaru.length === 0 ? (
              <p className="text-sm text-slate-400 font-medium text-center py-8">Belum ada aktivitas baru.</p>
            ) : (
              materiTerbaru.map((materi) => (
                <div key={materi.id} className="group flex gap-5 p-4 -mx-4 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer">
                  <div className="w-12 h-12 bg-slate-50 border border-slate-100 text-slate-400 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-white group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all shadow-sm">
                    <FileText size={20} />
                  </div>
                  <div className="flex-1 border-b border-slate-100 pb-5 group-last:border-0">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-base font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">{materi.title}</h4>
                      <span className="text-[10px] font-bold text-slate-400">
                        {new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(materi.createdAt)}
                      </span>
                    </div>
                    <span className="inline-block text-[10px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100/50 mb-2">
                      {materi.namaKelas}
                    </span>
                    <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{materi.description || "Silakan cek materi ini."}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Kolom Kanan: Daftar Kelas (Lebar 2/5) */}
        <div className="xl:col-span-2 bg-slate-900 rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.08)] text-white relative overflow-hidden flex flex-col">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          
          <h2 className="text-xl font-black text-white mb-8 relative z-10">Daftar Kelasku</h2>

          <div className="space-y-4 flex-1 relative z-10">
            {kelasku.length === 0 ? (
              <p className="text-sm text-slate-400 font-medium">Anda belum terdaftar di kelas manapun.</p>
            ) : (
              kelasku.map((kelas) => (
                <div key={kelas.id} className="flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors cursor-pointer group">
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">{kelas.name}</h4>
                    <p className="text-xs text-slate-400">Ust. {kelas.pengajar || "-"}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-indigo-500 transition-colors">
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-white" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}