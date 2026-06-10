"use server";

import prisma from "@/lib/prisma";

export async function getStudentsForRaporDB() {
  try {
    const students = await prisma.studentProfile.findMany({
      include: { user: true },
      orderBy: { user: { name: 'asc' } }
    });
    return { success: true, data: students };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getStudentTranscriptDB(studentProfileId: string, userId: string) {
  try {
    const profile = await prisma.studentProfile.findUnique({
      where: { id: studentProfileId },
      include: { user: true }
    });

    if (!profile) throw new Error("Siswa tidak ditemukan.");

    // Tarik nilai berdasarkan studentId (Relasi ke ClassGrade)
    const grades = await prisma.classGrade.findMany({
      where: { studentId: studentProfileId }, // Pastikan ini ID profile
      include: { classRoom: true },
      orderBy: { classRoom: { name: 'asc' } }
    });

    const settings = await prisma.systemSettings.findUnique({
      where: { id: "default" }
    });

    return { success: true, data: { profile, grades, settings } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Fungsi untuk menyimpan pengaturan TTD ke Database
export async function saveTtdConfigDB(data: {
  adminName: string;
  adminTtd: string;
  kepsekName: string;
  kepsekNip: string;
  kepsekTtd: string;
}) {
  try {
    await prisma.systemSettings.upsert({
      where: { id: "default" },
      update: {
        adminName: data.adminName,
        adminTtd: data.adminTtd,
        kepsekName: data.kepsekName,
        kepsekNip: data.kepsekNip,
        kepsekTtd: data.kepsekTtd,
      },
      create: {
        id: "default",
        adminName: data.adminName,
        adminTtd: data.adminTtd,
        kepsekName: data.kepsekName,
        kepsekNip: data.kepsekNip,
        kepsekTtd: data.kepsekTtd,
      }
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error saving TTD:", error);
    return { success: false, error: error.message };
  }
}