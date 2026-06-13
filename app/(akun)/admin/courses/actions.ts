"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

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
  
  return { tenantId: user.tenantId, userId: user.id };
}

// ==========================================
// 1. AMBIL SEMUA DATA KELAS (Khusus Sekolah Ini)
// ==========================================
export async function getClassesDB() {
  try {
    const { tenantId } = await getAuthContext();

    const classes = await prisma.classRoom.findMany({
      where: { tenantId: tenantId }, // Filter khusus sekolah yang sedang login
      include: { _count: { select: { students: true } } },
      orderBy: { name: 'asc' }
    });

    // Mapping: Mengubah format database baru agar bisa dibaca UI lama
    const data = classes.map(c => ({
      id: c.id,
      nama: c.name,
      waliKelas: c.pengajar || "Belum Ditentukan",
      kapasitas: c.kapasitas, 
      waGroupLink: c.waGroupLink || "",
      jumlahSiswa: c._count.students,
    }));

    return { success: true, data };
  } catch (error) {
    return { success: false, error: "Gagal mengambil data kelas." };
  }
}

// ==========================================
// 2. SIMPAN / EDIT DATA KELAS
// ==========================================
export async function saveClassDB(data: any, editingId?: string) {
  try {
    const { tenantId } = await getAuthContext();

    const payload = {
      name: data.nama || data.name,
      pengajar: data.waliKelas || data.pengajar || "Belum Ditentukan",
      kapasitas: parseInt(data.kapasitas) || 30,
      waGroupLink: data.waGroupLink || null,
      program: data.program || null,
      jadwal: data.jadwal || null,
      zoomLink: data.zoomLink || null,
      kkm: data.kkm ? parseInt(data.kkm) : 75,
      tenantId: tenantId, // WAJIB DIISI agar tidak error Argument `tenant` is missing
    };

    if (editingId) {
      // Pastikan kelas yang diedit benar-benar milik sekolah ini
      const existingClass = await prisma.classRoom.findUnique({ where: { id: editingId } });
      if (!existingClass || existingClass.tenantId !== tenantId) {
        throw new Error("Kelas tidak ditemukan atau akses ditolak.");
      }

      await prisma.classRoom.update({
        where: { id: editingId },
        data: payload
      });
    } else {
      await prisma.classRoom.create({
        data: payload
      });
    }
    
    revalidatePath("/admin/courses"); 
    return { success: true };
  } catch (error: any) {
    console.error("DEBUG ERROR PRISMA:", error);
    return { success: false, error: "Gagal menyimpan: " + error.message };
  }
}

// ==========================================
// 3. HAPUS KELAS SATUAN
// ==========================================
export async function deleteClassDB(id: string) {
  try {
    const { tenantId } = await getAuthContext();
    
    // Pagar keamanan
    const existingClass = await prisma.classRoom.findUnique({ where: { id } });
    if (!existingClass || existingClass.tenantId !== tenantId) throw new Error("Akses ditolak.");

    await prisma.classRoom.delete({ where: { id } });
    revalidatePath("/admin/courses");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal menghapus kelas." };
  }
}

// ==========================================
// 4. HAPUS KELAS MASSAL
// ==========================================
export async function deleteClassMassalDB(ids: string[]) {
  try {
    const { tenantId } = await getAuthContext();

    // Hapus hanya jika id ada di dalam list DAN milik tenant ini
    await prisma.classRoom.deleteMany({ 
      where: { 
        id: { in: ids },
        tenantId: tenantId 
      } 
    });
    
    revalidatePath("/admin/courses");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal menghapus kelas massal." };
  }
}

// ==========================================
// 5. PLOTTING SANTRI KE KELAS
// ==========================================

// Mengambil daftar siswa yang BISA dimasukkan ke kelas (Hanya santri dari sekolah yang sama)
export async function getStudentsForPlottingDB(classId: string) {
  try {
    const { tenantId } = await getAuthContext();

    const students = await prisma.user.findMany({
      where: { 
        role: "SANTRI",
        tenantId: tenantId // Filter agar tidak menarik santri sekolah lain
      },
      include: {
        studentProfile: {
          include: { classes: { select: { id: true } } }
        }
      },
      orderBy: { name: 'asc' }
    });

    const data = students.map(u => ({
      id: u.studentProfile?.id || "",
      nama: u.name,
      nis: u.studentProfile?.nis || "-",
      isEnrolled: u.studentProfile?.classes.some(c => c.id === classId) || false
    })).filter(s => s.id !== "");

    return { success: true, data };
  } catch (error) {
    return { success: false, error: "Gagal mengambil data santri." };
  }
}

// Menghubungkan (Connect) atau Memutuskan (Disconnect) santri dari kelas
export async function updateClassEnrollmentDB(classId: string, studentProfileIds: string[]) {
  try {
    const { tenantId } = await getAuthContext();

    const existingClass = await prisma.classRoom.findUnique({ where: { id: classId } });
    if (!existingClass || existingClass.tenantId !== tenantId) throw new Error("Akses ditolak.");

    // 1. Kosongkan dulu semua santri di kelas ini (Reset)
    await prisma.classRoom.update({
      where: { id: classId },
      data: { students: { set: [] } } 
    });

    // 2. Masukkan ulang santri-santri yang terpilih
    if (studentProfileIds.length > 0) {
      await prisma.classRoom.update({
        where: { id: classId },
        data: {
          students: {
            connect: studentProfileIds.map(id => ({ id }))
          }
        }
      });
    }

    revalidatePath("/admin/courses");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal memperbarui data peserta kelas." };
  }
}