"use server";

import prisma from "@/lib/prisma";

export async function getDashboardDataDB() {
  try {
    // 1. Ambil Statistik Utama
    const totalSantri = await prisma.studentProfile.count({ where: { status: 'AKTIF' } });
    const totalGuru = await prisma.user.count({ where: { role: 'GURU' } });
    const totalKelas = await prisma.classRoom.count({ where: { isFinished: false } });
    const cbtLive = await prisma.cbtExam.count({ where: { isAktif: true } });

    // 2. Ambil Daftar Kelas untuk Filter Dropdown
    const daftarKelas = await prisma.classRoom.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    });

    // 3. Ambil Semua Nilai (Untuk dihitung rata-ratanya di Client)
    const semuaNilai = await prisma.classGrade.findMany({
      select: {
        classRoomId: true,
        tugas1: true, tugas2: true, tugas3: true,
        uts: true, uas: true, nilaiAkhir: true
      }
    });

    // 4. Ambil Ujian CBT yang sedang Live
    const ujianLive = await prisma.cbtExam.findMany({
      where: { isAktif: true },
      take: 3, // Ambil 3 teratas
      include: {
        _count: { select: { results: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 5. Ambil Riwayat Hasil Ujian Terbaru (Untuk Log Aktivitas)
    const aktivitasTerbaru = await prisma.cbtResult.findMany({
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