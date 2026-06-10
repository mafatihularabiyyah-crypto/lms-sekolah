// app/(akun)/admin/courses/actions.ts
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 1. AMBIL DAFTAR KELAS
export async function getClassesDB() {
  try {
    const classes = await prisma.classRoom.findMany({
      include: { _count: { select: { students: true } } },
      orderBy: { name: 'asc' }
    });

    const data = classes.map(c => ({
      id: c.id,
      nama: c.name,
      waliKelas: c.pengajar || "Belum Ditentukan",
      kapasitas: c.kapasitas || 30, // Mengambil kapasitas asli dari database
      waGroupLink: c.waGroupLink || "",
      jumlahSiswa: c._count.students,
    }));

    return { success: true, data };
  } catch (error) {
    return { success: false, error: "Gagal mengambil data kelas." };
  }
}

// 2. AMBIL DETAIL KELAS
export async function getClassDetailDB(classId: string) {
  try {
    const classData = await prisma.classRoom.findUnique({
      where: { id: classId },
      include: {
        students: { include: { user: true } },
        attendances: true,
        grades: true
      }
    });
    return { success: true, data: classData };
  } catch (error) {
    return { success: false, error: "Gagal memuat detail kelas." };
  }
}

// 3. SIMPAN PRESENSI
// 3. SIMPAN PRESENSI
export async function saveAttendancesDB(classId: string, attendances: any[]) {
  try {
    await prisma.$transaction(
      attendances.map(att => 
        prisma.classAttendance.upsert({
          where: { classRoomId_studentId: { classRoomId: classId, studentId: att.studentId } },
          update: { hadir: att.hadir, sakit: att.sakit, izin: att.izin, alpa: att.alpa },
          create: { classRoomId: classId, studentId: att.studentId, hadir: att.hadir, sakit: att.sakit, izin: att.izin, alpa: att.alpa }
        })
      )
    );
    // UBAH JALUR KE REPORT
    revalidatePath("/admin/report");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal menyimpan presensi." };
  }
}

// 4. SIMPAN BUKU NILAI & BOBOT
export async function saveGradebookDB(classId: string, grades: any[], weights: any) {
  try {
    await prisma.classRoom.update({
      where: { id: classId },
      data: { weights: weights }
    });

    await prisma.$transaction(
      grades.map(g => 
        prisma.classGrade.upsert({
          where: { classRoomId_studentId: { classRoomId: classId, studentId: g.studentId } },
          update: { tugas1: g.tugas1, tugas2: g.tugas2, tugas3: g.tugas3, tugas4: g.tugas4, tugas5: g.tugas5, uts: g.uts, uas: g.uas, nilaiAkhir: g.nilaiAkhir },
          create: { classRoomId: classId, studentId: g.studentId, tugas1: g.tugas1, tugas2: g.tugas2, tugas3: g.tugas3, tugas4: g.tugas4, tugas5: g.tugas5, uts: g.uts, uas: g.uas, nilaiAkhir: g.nilaiAkhir }
        })
      )
    );
    // UBAH JALUR KE REPORT
    revalidatePath("/admin/report");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal menyimpan buku nilai." };
  }
}

// 5. SIMPAN BACKGROUND SERTIFIKAT
export async function saveCertBackgroundDB(classId: string, base64Image: string) {
  try {
    await prisma.classRoom.update({
      where: { id: classId },
      data: { certBackground: base64Image }
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal mengunggah background." };
  }
}

// 6. AMBIL HASIL CBT UNTUK SINKRONISASI
export async function getCbtResultsForSyncDB(classId: string) {
  try {
    const classData = await prisma.classRoom.findUnique({ where: { id: classId }});
    if (!classData) return { success: false, data: [] };

    const cbtExams = await prisma.cbtExam.findMany({
      where: { namaKelas: { contains: classData.name } },
      include: { results: true }
    });
    return { success: true, data: cbtExams };
  } catch (error) {
    return { success: false, error: "Gagal memuat data CBT." };
  }
}

// 7. SIMPAN / UPDATE DATA KELAS (FUNGSI TUNGGAL)
export async function saveClassDB(data: any, editingId?: string) {
  try {
    const namaKelas = data.nama || data.name;
    const namaPengajar = data.waliKelas || data.pengajar || "Belum Ditentukan";
    const kapasitasKelas = data.kapasitas ? parseInt(data.kapasitas) : 30; 
    
    if (!namaKelas) return { success: false, error: "Nama kelas tidak boleh kosong!" };

    const payload = {
      name: namaKelas,
      pengajar: namaPengajar,
      kapasitas: kapasitasKelas,
      waGroupLink: data.waGroupLink || null,
      program: data.program || null,
      jadwal: data.jadwal || null,
      zoomLink: data.zoomLink || null,
      kkm: data.kkm ? parseInt(data.kkm) : 75,
    };

    if (editingId) {
      await prisma.classRoom.update({ where: { id: editingId }, data: payload });
    } else {
      await prisma.classRoom.create({ data: payload });
    }
    
    // UBAH JALUR KE REPORT AGAR PERUBAHAN KAPASITAS LANGSUNG TERLIHAT
    revalidatePath("/admin/report"); 
    return { success: true };
  } catch (error: any) {
    console.error("Database Error:", error.message);
    return { success: false, error: "Gagal menyimpan kelas." };
  }
}

// 8. HAPUS KELAS
export async function deleteClassDB(id: string) {
  try {
    await prisma.classRoom.delete({ where: { id } });
    revalidatePath("/admin/report");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal menghapus kelas." };
  }
}

// 9. AMBIL DATA SANTRI UNTUK PLOTTING & UPDATE ENROLLMENT
export async function getStudentsForPlottingDB(classId: string) {
  try {
    const students = await prisma.studentProfile.findMany({
      include: { user: true, classRooms: { where: { id: classId } } }
    });
    
    // Tambahkan (s: any) di sini untuk membungkam error strict type dari TypeScript
    const data = students.map((s: any) => ({
      id: s.id,
      nama: s.user?.name || "Tanpa Nama",
      nis: s.user?.email || "-", 
      isEnrolled: s.classRooms && s.classRooms.length > 0
    }));
    
    return { success: true, data };
  } catch (error) {
    return { success: false, error: "Gagal mengambil data santri." };
  }
}

export async function updateClassEnrollmentDB(classId: string, studentIds: string[]) {
  try {
    await prisma.classRoom.update({
      where: { id: classId },
      data: { students: { set: studentIds.map(id => ({ id })) } }
    });
    revalidatePath("/admin/courses");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal memperbarui data santri." };
  }
}

export async function deleteClassMassalDB(ids: string[]) {
  try {
    await prisma.classRoom.deleteMany({ where: { id: { in: ids } } });
    revalidatePath("/admin/courses");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal menghapus massal." };
  }
}