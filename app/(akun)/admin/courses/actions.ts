// app/(akun)/admin/courses/actions.ts
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getClassesDB() {
  try {
    const classes = await prisma.classRoom.findMany({
      include: { _count: { select: { students: true } } },
      orderBy: { name: 'asc' }
    });

    // Mapping: Mengubah format database baru agar bisa dibaca UI lama
    const data = classes.map(c => ({
      id: c.id,
      nama: c.name,
      waliKelas: c.pengajar || "Belum Ditentukan",
      kapasitas: c.kapasitas, // Angka statis agar persenan UI lama tidak error
      waGroupLink: c.waGroupLink || "",
      jumlahSiswa: c._count.students,
    }));

    return { success: true, data };
  } catch (error) {
    return { success: false, error: "Gagal mengambil data kelas." };
  }
}

export async function saveClassDB(data: any, editingId?: string) {
  try {
    const payload = {
      name: data.nama || data.name,
      pengajar: data.waliKelas || data.pengajar || "Belum Ditentukan",
      kapasitas: parseInt(data.kapasitas) || 30, // Memaksa input menjadi angka
      waGroupLink: data.waGroupLink || null,
      program: data.program || null,
      jadwal: data.jadwal || null,
      zoomLink: data.zoomLink || null,
      kkm: data.kkm ? parseInt(data.kkm) : 75,
    };

    if (editingId) {
      // Menjalankan perintah update ke database
      const result = await prisma.classRoom.update({
        where: { id: editingId },
        data: payload
      });
      console.log("Hasil Update Database:", result); // Cek log di terminal VS Code
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

export async function deleteClassDB(id: string) {
  try {
    await prisma.classRoom.delete({ where: { id } });
    revalidatePath("/admin/courses");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal menghapus kelas." };
  }
}

export async function deleteClassMassalDB(ids: string[]) {
  try {
    await prisma.classRoom.deleteMany({ where: { id: { in: ids } } });
    revalidatePath("/admin/courses");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal menghapus kelas massal." };
  }
}

// ==========================================
// FITUR BARU: PLOTTING SANTRI KE KELAS
// ==========================================

// Mengambil daftar siswa yang BISA dimasukkan ke kelas
export async function getStudentsForPlottingDB(classId: string) {
  try {
    const students = await prisma.user.findMany({
      where: { role: "SANTRI" },
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
      // Cek apakah siswa ini sudah ada di kelas tersebut
      isEnrolled: u.studentProfile?.classes.some(c => c.id === classId) || false
    })).filter(s => s.id !== ""); // Hanya ambil yang punya profil santri

    return { success: true, data };
  } catch (error) {
    return { success: false, error: "Gagal mengambil data santri." };
  }
}

// Menghubungkan (Connect) atau Memutuskan (Disconnect) santri dari kelas
export async function updateClassEnrollmentDB(classId: string, studentProfileIds: string[]) {
  try {
    // 1. Kosongkan dulu semua santri di kelas ini (Reset)
    await prisma.classRoom.update({
      where: { id: classId },
      data: { students: { set: [] } } // Set array kosong untuk memutuskan semua relasi
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