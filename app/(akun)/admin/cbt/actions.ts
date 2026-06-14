"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";

// ==========================================
// FUNGSI HELPER: Keamanan Multi-Tenant
// ==========================================
async function getAuthContext() {
  const session = await getServerSession();
  if (!session?.user?.email) throw new Error("Akses ditolak. Silakan login kembali.");
  
  const user = await prisma.user.findUnique({ 
    where: { email: session.user.email } 
  });
  
  if (!user || !user.tenantId) throw new Error("Akun ini belum diikat ke instansi/sekolah manapun.");
  
  return { tenantId: user.tenantId };
}

// ==========================================
// CBT EXAM (Manajemen Ujian)
// ==========================================
export async function getCbtExamsDB() {
  try {
    const { tenantId } = await getAuthContext();
    const exams = await prisma.cbtExam.findMany({
      where: { tenantId: tenantId },
      include: { _count: { select: { results: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: exams };
  } catch (error) {
    return { success: false, error: "Gagal mengambil daftar CBT" };
  }
}

export async function saveCbtExamDB(data: any, id?: string) {
  try {
    const { tenantId } = await getAuthContext();

    // SUSUNAN PAYLOAD LENGKAP: Semua data dari UI ditangkap di sini!
    const payload = {
      judul: data.judul || data.title || data.namaUjian,
      deskripsi: data.deskripsi || null,       // <--- Instruksi ditangkap di sini
      coverImage: data.coverImage || null,
      token: data.token || null,               // <--- Token ditangkap di sini
      durasi: parseInt(data.durasi) || 60,
      kkm: parseInt(data.kkm) || 75,
      acakSoal: data.acakSoal || false,
      antiCheat: data.antiCheat || false,
      butuhToken: data.butuhToken || false,
      deadline: data.deadline || null,
      namaKelas: data.namaKelas || null,
      dataSoal: data.dataSoal || "[]", 
      tenantId: tenantId, 
    };

    if (id) {
      // Verifikasi kepemilikan data sebelum update
      const existingExam = await prisma.cbtExam.findUnique({ where: { id } });
      if (!existingExam || existingExam.tenantId !== tenantId) throw new Error("Akses ditolak.");

      await prisma.cbtExam.update({
        where: { id: id },
        data: payload
      });
    } else {
      await prisma.cbtExam.create({
        data: payload
      });
    }

    revalidatePath("/admin/cbt");
    return { success: true };
  } catch (error: any) {
    console.error("DEBUG CBT ERROR:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteCbtExamDB(id: string) {
  try {
    const { tenantId } = await getAuthContext();
    const existingExam = await prisma.cbtExam.findUnique({ where: { id } });
    if (!existingExam || existingExam.tenantId !== tenantId) throw new Error("Akses ditolak.");

    await prisma.cbtExam.delete({ where: { id } });
    revalidatePath("/admin/cbt");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal menghapus CBT" };
  }
}

export async function toggleCbtStatusDB(id: string, isAktif: boolean) {
  try {
    const { tenantId } = await getAuthContext();
    const existingExam = await prisma.cbtExam.findUnique({ where: { id } });
    if (!existingExam || existingExam.tenantId !== tenantId) throw new Error("Akses ditolak.");

    await prisma.cbtExam.update({ where: { id }, data: { isAktif } });
    revalidatePath("/admin/cbt");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal mengubah status CBT" };
  }
}

// ==========================================
// CBT RESULTS (Manajemen Nilai Peserta)
// ==========================================
export async function getCbtResultsDB(examId: string) {
  try {
    // Validasi bahwa exam ini milik tenant yang sedang login
    const { tenantId } = await getAuthContext();
    const exam = await prisma.cbtExam.findUnique({ where: { id: examId } });
    if (!exam || exam.tenantId !== tenantId) throw new Error("Akses ditolak.");

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

// ==========================================
// UTILS & SINKRONISASI RAPOR
// ==========================================
export async function getClassesForCbtDB() {
  try {
    const { tenantId } = await getAuthContext();
    const classes = await prisma.classRoom.findMany({ 
      where: { tenantId: tenantId },
      select: { name: true }, 
      orderBy: { name: 'asc' }
    });
    return { success: true, data: classes.map((c: any) => c.name) };
  } catch (error) {
    return { success: false, data: [] };
  }
}

export async function syncCbtToGradeDB(examId: string, namaKelas: string, targetColumn: string) {
  try {
    const { tenantId } = await getAuthContext();
    
    // 1. Validasi Exam
    const exam = await prisma.cbtExam.findUnique({ where: { id: examId } });
    if (!exam || exam.tenantId !== tenantId) return { success: false, error: "Ujian tidak valid." };

    // 2. Ambil data hasil ujian
    const results = await prisma.cbtResult.findMany({ where: { examId } });
    
    // 3. Cari ID Kelas (Perbaikan variabel namaKelas)
    const classRoom = await prisma.classRoom.findFirst({ 
      where: { name: namaKelas, tenantId: tenantId } 
    });
    if (!classRoom) return { success: false, error: "Kelas tidak ditemukan di sistem." };

    // 4. Masukkan nilai ke tabel ClassGrade untuk setiap peserta
    let successCount = 0;
    for (const res of results) {
       const studentProfile = await prisma.studentProfile.findFirst({
          where: {
             user: {
                tenantId: tenantId, // Keamanan ganda
                OR: [
                  { email: res.emailPeserta },
                  { name: { contains: res.namaPeserta, mode: 'insensitive' } }
                ]
             }
          }
       });

       if (studentProfile) {
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