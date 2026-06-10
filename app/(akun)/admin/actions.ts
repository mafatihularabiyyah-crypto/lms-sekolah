"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth"; // Modul untuk mengecek siapa yang login

export async function getDashboardDataDB() {
  try {
    // 1. IDENTIFIKASI SIAPA YANG SEDANG LOGIN
    const session = await getServerSession();
    if (!session?.user?.email) {
        return { success: false, error: "Akses ditolak. Tidak ada sesi login aktif." };
    }

    // 2. CARI TAHU DIA DARI SEKOLAH MANA (Ambil tenantId-nya)
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!currentUser || !currentUser.tenantId) {
      return { success: false, error: "Akun ini belum diikat ke instansi/sekolah manapun." };
    }

    // Ini adalah Kunci Gembok Sekolah Admin tersebut!
    const mySchoolId = currentUser.tenantId;

    // 3. TERAPKAN FILTER 'mySchoolId' KE SEMUA QUERY DATABASE
    // Perhatikan penambahan `tenantId: mySchoolId` di setiap fungsi 'where'

    const totalSantri = await prisma.user.count({ 
      where: { role: 'SANTRI', tenantId: mySchoolId } 
    });
    
    const totalGuru = await prisma.user.count({ 
      where: { role: 'GURU', tenantId: mySchoolId } 
    });
    
    const totalKelas = await prisma.classRoom.count({ 
      where: { isFinished: false, tenantId: mySchoolId } 
    });
    
    const cbtLive = await prisma.cbtExam.count({ 
      where: { isAktif: true, tenantId: mySchoolId } 
    });

    const daftarKelas = await prisma.classRoom.findMany({
      where: { tenantId: mySchoolId },
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    });

    const semuaNilai = await prisma.classGrade.findMany({
      // Mengambil nilai hanya dari kelas yang berada di sekolah ini
      where: { classRoom: { tenantId: mySchoolId } }, 
      select: {
        classRoomId: true, tugas1: true, tugas2: true, tugas3: true,
        uts: true, uas: true, nilaiAkhir: true
      }
    });

    const ujianLive = await prisma.cbtExam.findMany({
      where: { isAktif: true, tenantId: mySchoolId },
      take: 3,
      include: { _count: { select: { results: true } } },
      orderBy: { createdAt: 'desc' }
    });

    const aktivitasTerbaru = await prisma.cbtResult.findMany({
      // Mengambil hasil ujian dari ujian milik sekolah ini
      where: { exam: { tenantId: mySchoolId } },
      take: 4,
      include: { exam: { select: { judul: true } } },
      orderBy: { createdAt: 'desc' }
    });

    return { 
      success: true, 
      data: { totalSantri, totalGuru, totalKelas, cbtLive, daftarKelas, semuaNilai, ujianLive, aktivitasTerbaru } 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}