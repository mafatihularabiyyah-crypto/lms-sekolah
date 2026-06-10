// app/(akun)/admin/students/actions.ts
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcrypt";
import { Gender, StudentStatus } from "@prisma/client";

export async function getSiswaDB(adminEmail: string) {
  try {
    const users = await prisma.user.findMany({
      where: { role: "SANTRI" },
      include: { studentProfile: true },
      orderBy: { name: 'asc' }
    });

    const data = users.map(u => ({
      id: u.id,
      nis: u.studentProfile?.nis || "",
      nama: u.name,
      jk: u.studentProfile?.gender === "LAKI_LAKI" ? "L" : "P",
      kelas: u.studentProfile?.enrollYear?.toString() || "-",
      ortu: u.studentProfile?.parentName || "-",
      telepon: u.studentProfile?.parentPhone || "-",
      alamat: u.studentProfile?.address || "-",
      // Kita gunakan birthPlace sebagai penyimpan data "Kesibukan" sementara
      kesibukan: u.studentProfile?.birthPlace || "Santri Reguler", 
      status: u.studentProfile?.status === "AKTIF" ? "Aktif" : u.studentProfile?.status === "LULUS" ? "Lulus" : "Mutasi",
      email: u.email,
    }));

    return { success: true, data };
  } catch (error) {
    return { success: false, error: "Gagal mengambil data dari database" };
  }
}

export async function deleteSiswaDB(id: string) {
  try {
    await prisma.user.delete({ where: { id } });
    revalidatePath("/admin/students");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal menghapus data" };
  }
}

export async function deleteSiswaMassalDB(ids: string[]) {
  try {
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
    revalidatePath("/admin/students");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal menghapus data massal" };
  }
}

// Fitur Baru: Luluskan Massal
export async function luluskanSiswaMassalDB(ids: string[]) {
  try {
    await prisma.studentProfile.updateMany({
      where: { userId: { in: ids } },
      data: { status: StudentStatus.LULUS }
    });
    revalidatePath("/admin/students");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal meluluskan siswa" };
  }
}

export async function saveSiswaDB(data: any, editingId?: string): Promise<{success: boolean, error?: string}> {
  try {
    let tenant = await prisma.tenant.findFirst();
    if (!tenant) tenant = await prisma.tenant.create({ data: { name: "Pesantren Pusat" } });

    const genderVal = data.jk === "L" ? Gender.LAKI_LAKI : Gender.PEREMPUAN;
    const statusVal = data.status === "Aktif" ? StudentStatus.AKTIF : data.status === "Lulus" ? StudentStatus.LULUS : StudentStatus.KELUAR;
    const enrollYearVal = parseInt(data.kelas) || new Date().getFullYear();

    if (editingId) {
      await prisma.user.update({
        where: { id: editingId },
        data: {
          name: data.nama,
          email: data.email,
          studentProfile: {
            update: {
              nis: data.nis,
              gender: genderVal,
              enrollYear: enrollYearVal,
              parentName: data.ortu,
              parentPhone: data.telepon,
              address: data.alamat,
              birthPlace: data.kesibukan, // Menyimpan kesibukan
              status: statusVal
            }
          }
        }
      });
    } else {
      const hashedPassword = await bcrypt.hash(data.password || "santri123", 10);
      await prisma.user.create({
        data: {
          name: data.nama,
          email: data.email,
          password: hashedPassword,
          role: "SANTRI",
          tenantId: tenant.id,
          studentProfile: {
            create: {
              nis: data.nis,
              gender: genderVal,
              enrollYear: enrollYearVal,
              parentName: data.ortu,
              parentPhone: data.telepon,
              address: data.alamat,
              birthPlace: data.kesibukan, // Menyimpan kesibukan
              status: statusVal
            }
          }
        }
      });
    }
    
    revalidatePath("/admin/students");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal menyimpan data." };
  }
}

export async function updateAksesSiswaDB(id: string, email: string, pass: string): Promise<{success: boolean, error?: string}> {
  try {
    const hashedPassword = await bcrypt.hash(pass, 10);
    await prisma.user.update({ where: { id }, data: { email, password: hashedPassword } });
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal memperbarui akses login." };
  }
}

export async function importSiswaMassalDB(data: any[]): Promise<{success: boolean, pesan?: string, error?: string}> {
  try {
    let tenant = await prisma.tenant.findFirst();
    if (!tenant) tenant = await prisma.tenant.create({ data: { name: "Pesantren Pusat" } });

    await prisma.$transaction(async (tx) => {
      for (const row of data) {
        const hashedPassword = await bcrypt.hash(row.Password || "santri123", 10);
        const genderVal = row.JK?.toUpperCase() === "P" ? Gender.PEREMPUAN : Gender.LAKI_LAKI;
        const statusVal = row.Status?.toUpperCase() === "LULUS" ? StudentStatus.LULUS : StudentStatus.AKTIF;
        const enrollYearVal = parseInt(row.Kelas) || new Date().getFullYear();

        const newUser = await tx.user.create({
          data: {
            name: row.Nama || "Tanpa Nama",
            email: row.Email || `${row.NIS}@sekolah.com`,
            password: hashedPassword,
            role: "SANTRI",
            tenantId: tenant.id,
          }
        });

        await tx.studentProfile.create({
          data: {
            userId: newUser.id,
            nis: row.NIS || Math.random().toString().slice(2, 8),
            gender: genderVal,
            enrollYear: enrollYearVal,
            parentName: row.NamaWali || "-",
            parentPhone: row.NoHP || "-",
            address: row.Alamat || "-",
            birthPlace: "Santri Reguler",
            status: statusVal,
          }
        });
      }
    });

    revalidatePath("/admin/students");
    return { success: true, pesan: `${data.length} siswa berhasil diimpor.` };
  } catch (error) {
    return { success: false, error: "Gagal impor." };
  }
}