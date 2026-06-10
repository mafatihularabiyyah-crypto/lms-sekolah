"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";

// ------------------------------------------------------------------
// FUNGSI HELPER: Mengambil ID Sekolah (Tenant) dari User yang Login
// ------------------------------------------------------------------
async function getTenantId() {
  const session = await getServerSession();
  if (!session?.user?.email) throw new Error("Akses ditolak. Silakan login kembali.");
  
  const user = await prisma.user.findUnique({ 
    where: { email: session.user.email } 
  });
  
  if (!user?.tenantId) throw new Error("Akun ini belum diikat ke instansi/sekolah manapun.");
  
  return user.tenantId; // Ini adalah "mySchoolId"
}

// ------------------------------------------------------------------
// 1. AMBIL DAFTAR SISWA (Hanya dari sekolah yang sama)
// ------------------------------------------------------------------
export async function getStudentsForRaporDB() {
  try {
    const mySchoolId = await getTenantId();

    const students = await prisma.studentProfile.findMany({
      // PAGAR PEMBATAS: Hanya ambil siswa dari sekolah Admin ini
      where: { tenantId: mySchoolId }, 
      include: { user: true },
      orderBy: { user: { name: 'asc' } }
    });
    return { success: true, data: students };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ------------------------------------------------------------------
// 2. AMBIL TRANSKRIP SISWA & PENGATURAN TTD (Khusus sekolah ini)
// ------------------------------------------------------------------
export async function getStudentTranscriptDB(studentProfileId: string, userId: string) {
  try {
    const mySchoolId = await getTenantId();

    const profile = await prisma.studentProfile.findUnique({
      where: { id: studentProfileId },
      include: { user: true }
    });

    // Keamanan Ganda: Pastikan siswa ini benar-benar murid dari sekolah Admin tersebut
    if (!profile || profile.tenantId !== mySchoolId) {
        throw new Error("Data siswa tidak ditemukan atau bukan berasal dari institusi Anda.");
    }

    // Tarik nilai dari kelas-kelas yang ada di sekolah ini saja
    const grades = await prisma.classGrade.findMany({
      where: { 
        studentId: studentProfileId, 
        classRoom: { tenantId: mySchoolId } // Pagar pembatas kelas
      }, 
      include: { classRoom: true },
      orderBy: { classRoom: { name: 'asc' } }
    });

    // Tarik Tanda Tangan / Pengaturan KHUSUS untuk sekolah ini
    const settings = await prisma.systemSettings.findUnique({
      where: { tenantId: mySchoolId } 
    });

    return { success: true, data: { profile, grades, settings } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ------------------------------------------------------------------
// 3. SIMPAN PENGATURAN TTD (Disimpan ke loker sekolah masing-masing)
// ------------------------------------------------------------------
export async function saveTtdConfigDB(data: {
  adminName: string;
  adminTtd: string;
  kepsekName: string;
  kepsekNip: string;
  kepsekTtd: string;
}) {
  try {
    const mySchoolId = await getTenantId();

    // Gunakan 'upsert' berdasarkan tenantId, BUKAN id 'default' lagi
    await prisma.systemSettings.upsert({
      where: { tenantId: mySchoolId },
      update: {
        adminName: data.adminName,
        adminTtd: data.adminTtd,
        kepsekName: data.kepsekName,
        kepsekNip: data.kepsekNip,
        kepsekTtd: data.kepsekTtd,
      },
      create: {
        // Jika belum ada pengaturan, buatkan baru dengan menempelkan tenantId
        tenantId: mySchoolId, 
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