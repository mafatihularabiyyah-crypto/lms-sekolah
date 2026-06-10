import prisma from "@/lib/prisma";
import FormClient from "./FormClient";

export default async function PendaftaranPage({ params }: { params: { id: string } }) {
  // 1. Cari formulir di database berdasarkan ID dari URL
  const form = await prisma.formulir.findUnique({
    where: { id: params.id }
  });

  // 2. Jika tidak ada, atau form di-nonaktifkan oleh admin
  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-2xl font-black text-slate-400">Formulir Tidak Ditemukan.</p>
      </div>
    );
  }

  if (!form.isAktif) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
        <div>
          <h1 className="text-3xl font-black text-slate-800 mb-2">Formulir Telah Ditutup</h1>
          <p className="text-slate-500 font-medium">Panitia sudah tidak menerima respon untuk formulir ini.</p>
        </div>
      </div>
    );
  }

  // 3. Jika aman, tampilkan kanvas formulirnya
  return <FormClient formulir={form} />;
}