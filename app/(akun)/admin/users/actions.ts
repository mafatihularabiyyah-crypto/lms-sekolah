// app/(akun)/admin/users/actions.ts
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcrypt";
import { Gender } from "@prisma/client";

// 1. Ambil Data Guru
export async function getGuruDB() {
  try {
    const users = await prisma.user.findMany({
      where: { role: "GURU" },
      include: { teacherProfile: true }, // Asumsi ada relasi teacherProfile
      orderBy: { name: 'asc' }
    });

    const data = users.map(u => ({
      id: u.id,
      nip: u.teacherProfile?.nip || "-",
      nama: u.name,
      jk: u.teacherProfile?.gender === "LAKI_LAKI" ? "L" : "P",
      mapel: u.teacherProfile?.subject || "-",
      telepon: u.teacherProfile?.phone || "-",
      alamat: u.teacherProfile?.address || "-",
      status: u.teacherProfile?.status || "Aktif",
      email: u.email,
    }));

    return { success: true, data };
  } catch (error) {
    return { success: false, error: "Gagal mengambil data guru dari database" };
  }
}

// 2. Hapus Data
export async function deleteGuruDB(id: string) {
  try {
    await prisma.user.delete({ where: { id } });
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal menghapus data" };
  }
}

export async function deleteGuruMassalDB(ids: string[]) {
  try {
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal menghapus data massal" };
  }
}

// 3. Simpan / Update Data Guru
export async function saveGuruDB(data: any, editingId?: string): Promise<{success: boolean, error?: string}> {
  try {
    let tenant = await prisma.tenant.findFirst();
    if (!tenant) tenant = await prisma.tenant.create({ data: { name: "Pesantren Pusat" } });

    const genderVal = data.jk === "L" ? Gender.LAKI_LAKI : Gender.PEREMPUAN;
    
    // PERBAIKAN 1: Logika Auto Generate Email jika kosong
    const finalEmail = data.email && data.email.trim() !== "" 
      ? data.email 
      : `guru.${data.nip || Math.floor(Math.random() * 9999)}@pesantren.sch.id`;

    if (editingId) {
      await prisma.user.update({
        where: { id: editingId },
        data: {
          name: data.nama,
          email: finalEmail,
          teacherProfile: {
            upsert: {
              create: { nip: data.nip, gender: genderVal, subject: data.mapel, phone: data.telepon, address: data.alamat, status: data.status },
              update: { nip: data.nip, gender: genderVal, subject: data.mapel, phone: data.telepon, address: data.alamat, status: data.status }
            }
          }
        }
      });
    } else {
      const hashedPassword = await bcrypt.hash(data.password || "guru123", 10);
      await prisma.user.create({
        data: {
          name: data.nama,
          email: finalEmail,
          password: hashedPassword,
          role: "GURU",
          tenantId: tenant.id,
          teacherProfile: {
            create: {
              nip: data.nip,
              gender: genderVal,
              subject: data.mapel,
              phone: data.telepon,
              address: data.alamat,
              status: data.status
            }
          }
        }
      });
    }
    
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    // Akan mencetak error warna merah di terminal VS Code Anda jika gagal
    console.error("GAGAL SIMPAN GURU:", error); 
    return { success: false, error: "Gagal menyimpan data! Email atau NIP mungkin sudah digunakan oleh pengguna lain." };
  }
}

// 4. Update Password Khusus
export async function updateAksesGuruDB(id: string, email: string, pass: string): Promise<{success: boolean, error?: string}> {
  try {
    const hashedPassword = await bcrypt.hash(pass, 10);
    await prisma.user.update({ where: { id }, data: { email, password: hashedPassword } });
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal memperbarui akses login." };
  }
}

// 5. Import Massal
export async function importGuruMassalDB(data: any[]): Promise<{success: boolean, pesan?: string, error?: string}> {
  try {
    let tenant = await prisma.tenant.findFirst();
    if (!tenant) tenant = await prisma.tenant.create({ data: { name: "Pesantren Pusat" } });

    await prisma.$transaction(async (tx) => {
      for (const row of data) {
        const hashedPassword = await bcrypt.hash(row.Password || "guru123", 10);
        const genderVal = row.JK?.toUpperCase() === "P" ? Gender.PEREMPUAN : Gender.LAKI_LAKI;

        const newUser = await tx.user.create({
          data: {
            name: row.Nama || "Tanpa Nama",
            email: row.Email || `${row.NIP}@sekolah.com`,
            password: hashedPassword,
            role: "GURU",
            tenantId: tenant.id,
          }
        });

        await tx.teacherProfile.create({
          data: {
            userId: newUser.id,
            nip: row.NIP || Math.random().toString().slice(2, 8),
            gender: genderVal,
            subject: row.Mapel || "-",
            phone: row.NoHP || "-",
            address: row.Alamat || "-",
            status: row.Status || "Aktif",
          }
        });
      }
    });

    revalidatePath("/admin/users");
    return { success: true, pesan: `${data.length} guru berhasil diimpor.` };
  } catch (error) {
    return { success: false, error: "Gagal impor guru." };
  }
}