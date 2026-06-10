// app/(akun)/admin/cbt/actions.ts
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// === CBT EXAM (Manajemen Ujian) ===
export async function getCbtExamsDB() {
  try {
    const exams = await prisma.cbtExam.findMany({
      include: { _count: { select: { results: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: exams };
  } catch (error) {
    return { success: false, error: "Gagal mengambil daftar CBT" };
  }
}

export async function saveCbtExamDB(data: any, editingId?: string) {
  try {
    if (editingId) {
      await prisma.cbtExam.update({ where: { id: editingId }, data });
    } else {
      await prisma.cbtExam.create({ data });
    }
    revalidatePath("/admin/cbt");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteCbtExamDB(id: string) {
  try {
    await prisma.cbtExam.delete({ where: { id } });
    revalidatePath("/admin/cbt");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal menghapus CBT" };
  }
}

export async function toggleCbtStatusDB(id: string, isAktif: boolean) {
  try {
    await prisma.cbtExam.update({ where: { id }, data: { isAktif } });
    revalidatePath("/admin/cbt");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal mengubah status CBT" };
  }
}

// === CBT RESULTS (Manajemen Nilai Peserta) ===
export async function getCbtResultsDB(examId: string) {
  try {
    const results = await prisma.cbtResult.findMany({
      where: { examId },
      orderBy: { nilai: 'desc' }
    });
    return { success: true, data: results };
  } catch (error) {
    return { success: false, error: "Gagal mengambil data nilai" };
  }
}

export async function updateCbtScoreDB(id: string, nilai: number) {
  try {
    await prisma.cbtResult.update({ where: { id }, data: { nilai } });
    revalidatePath("/admin/cbt");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal mengupdate nilai" };
  }
}

export async function deleteCbtResultDB(id: string) {
  try {
    await prisma.cbtResult.delete({ where: { id } });
    revalidatePath("/admin/cbt");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal menghapus nilai peserta" };
  }
}

// === UTILS ===
export async function getClassesForCbtDB() {
  try {
    const classes = await prisma.classRoom.findMany({ select: { name: true }, orderBy: { name: 'asc' }});
    return { success: true, data: classes.map(c => c.name) };
  } catch (error) {
    return { success: false, data: [] };
  }
}

// FUNGSI BARU: SINKRONISASI KE RAPOR
export async function syncCbtToGradeDB(examId: string, namaKelas: string, targetColumn: string) {
  try {
    // 1. Ambil data hasil ujian
    const results = await prisma.cbtResult.findMany({ where: { examId } });
    
    // 2. Cari ID Kelas berdasarkan namanya
    const classRoom = await prisma.classRoom.findUnique({ where: { name: namaKelas } });
    if (!classRoom) return { success: false, error: "Kelas tidak ditemukan di sistem." };

    // 3. Masukkan nilai ke tabel ClassGrade untuk setiap peserta
    let successCount = 0;
    for (const res of results) {
       // Cocokkan nama peserta dengan data user/student
       const studentProfile = await prisma.studentProfile.findFirst({
          where: {
             user: {
                OR: [
                  { email: res.emailPeserta },
                  { name: { contains: res.namaPeserta, mode: 'insensitive' } }
                ]
             }
          }
       });

       if (studentProfile) {
          // Masukkan atau update nilai di kolom yang dipilih (contoh: tugas1, uts, uas)
          await prisma.classGrade.upsert({
             where: {
                classRoomId_studentId: {
                   classRoomId: classRoom.id,
                   studentId: studentProfile.id
                }
             },
             create: {
                classRoomId: classRoom.id,
                studentId: studentProfile.id,
                [targetColumn]: res.nilai
             },
             update: {
                [targetColumn]: res.nilai
             }
          });
          successCount++;
       }
    }
    return { success: true, count: successCount };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}