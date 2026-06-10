import prisma from "@/lib/prisma";
import ClientUjian from "./ClientUjian";

export default async function HalamanUjian({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const params = await searchParams;
  const idUjian = params.id;

  if (!idUjian) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <h1 className="text-2xl font-black text-rose-600">Akses Ditolak</h1>
        <p className="text-slate-500 font-medium">Link ujian tidak valid.</p>
      </div>
    );
  }

  // Cari Ujian di Database
  const dataUjian = await prisma.cbtExam.findUnique({
    where: { id: idUjian },
  });

  // CARI PENGATURAN SEKOLAH (NAMA & LOGO) DARI DATABASE
  const pengaturan = await prisma.systemSettings.findUnique({
    where: { id: "default" }
  });

  if (!dataUjian) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <h1 className="text-2xl font-black text-slate-800">404 - Ujian Tidak Ditemukan</h1>
      </div>
    );
  }

  if (!dataUjian.isAktif) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <h1 className="text-2xl font-black text-slate-800">Sesi Ujian Ditutup</h1>
      </div>
    );
  }

  // Kirim data ujian DAN pengaturan sekolah ke Client
  return <ClientUjian ujian={dataUjian} pengaturan={pengaturan} />;
}