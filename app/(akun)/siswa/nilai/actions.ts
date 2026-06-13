"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function getRaporSantriDB() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) throw new Error("Akses ditolak. Silakan login kembali.");

    // 1. Tarik Data User & Profil Santri
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { studentProfile: true }
    });

    if (!user || !user.tenantId || !user.studentProfile) {
      throw new Error("Akun tidak valid atau bukan santri.");
    }

    // 2. Tarik Data Rapor (ClassGrade) milik santri ini
    const rawGrades = await prisma.classGrade.findMany({
      where: {
        studentId: user.studentProfile.id,
      },
      include: {
        classRoom: {
          select: {
            name: true,
            pengajar: true,
            kkm: true,
            weights: true
          }
        }
      },
      orderBy: {
        classRoom: { name: 'asc' }
      }
    });

    // 3. Format Data untuk UI
    const formattedGrades = rawGrades.map((g: any) => {
      // Ambil KKM dari kelas, default 75 jika tidak ada
      let kkm = g.classRoom?.kkm || 75;
      try {
        if (g.classRoom?.weights) {
          const w = typeof g.classRoom.weights === 'string' ? JSON.parse(g.classRoom.weights) : g.classRoom.weights;
          if (w.kkm) kkm = w.kkm;
        }
      } catch (e) {}

      return {
        id: g.id,
        classRoomId: g.classRoomId,
        namaKelas: g.classRoom?.name || "Kelas Tidak Diketahui",
        pengajar: g.classRoom?.pengajar || "-",
        kkm: kkm,
        tugas1: g.tugas1 || 0,
        tugas2: g.tugas2 || 0,
        tugas3: g.tugas3 || 0,
        uts: g.uts || 0,
        uas: g.uas || 0,
        nilaiAkhir: g.nilaiAkhir || 0,
        certLink: g.certLink || null,
        isLulus: (g.nilaiAkhir || 0) >= kkm
      };
    });

    return { 
      success: true, 
      data: formattedGrades,
      studentName: user.name,
      // 👇 PERBAIKAN: Mengganti .wa menjadi .parentPhone
      studentWa: user.studentProfile?.parentPhone || "-" 
    };

  } catch (error: any) {
    console.error("Rapor Santri Error:", error.message);
    return { success: false, error: "Gagal memuat data rapor." };
  }
}