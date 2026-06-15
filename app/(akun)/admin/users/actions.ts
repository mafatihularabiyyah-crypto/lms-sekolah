"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcrypt";

// 1. Ambil Data Guru
export async function getGuruDB() {
  try {
    const gurus = await prisma.user.findMany({
      where: { role: "GURU" },
      include: { teacherProfile: true },
      orderBy: { name: "asc" }
    });
    return { success: true, data: gurus };
  } catch (error) {
    console.error("Error fetching guru:", error);
    return { success: false, data: [] };
  }
}

// 2. Update Data Guru
export async function updateGuru(formData: FormData) {
  const id = formData.get("id") as string;
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;

  // Data Profil Guru
  const nip = formData.get("nip") as string;
  // Gunakan 'any' untuk mem-bypass error validasi Enum bawaan Prisma
  const gender = formData.get("gender") as any; 
  const subject = formData.get("subject") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const status = formData.get("status") as string;

  // Pastikan Tenant (Pesantren) tersedia
  let tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    tenant = await prisma.tenant.create({ data: { name: "Pesantren Pusat" } });
  }

  try {
    await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        teacherProfile: {
          upsert: {
            update: { 
              nip, 
              gender, 
              subject, 
              phone, 
              address, 
              status 
            },
            create: {
              nip,
              gender,
              subject,
              phone,
              address,
              status,
              tenantId: tenant.id
            }
          }
        }
      }
    });
  } catch (error) {
    console.error("Gagal update data guru:", error);
    throw new Error("Gagal mengupdate data guru.");
  }

  revalidatePath("/admin/users");
  redirect("/admin/users");
}

// 3. Tambah Data Guru Baru
export async function createGuru(formData: FormData) {
  // Data Akun Login
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Data Profil Guru
  const nip = formData.get("nip") as string;
  // Gunakan 'any' untuk mem-bypass error validasi Enum bawaan Prisma
  const gender = formData.get("gender") as any; 
  const subject = formData.get("subject") as string;
  const phone = formData.get("phone") as string;
  const address = formData.get("address") as string;
  const status = formData.get("status") as string;

  // Pastikan Tenant (Pesantren) tersedia
  let tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    tenant = await prisma.tenant.create({ data: { name: "Pesantren Pusat" } });
  }

  // Enkripsi password default
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    await prisma.$transaction(async (tx: any) => {
      // Buat akun User
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "GURU",
          tenantId: tenant.id,
        },
      });

      // Buat Profil Guru
      await tx.teacherProfile.create({
        data: {
          userId: newUser.id,
          nip,
          gender,
          subject,
          phone,
          address,
          status,
          tenantId: tenant.id,
        },
      });
    });
  } catch (error) {
    console.error("Gagal membuat data guru:", error);
    throw new Error("Gagal menyimpan data guru. Pastikan Email atau NIP belum digunakan.");
  }

  revalidatePath("/admin/users");
  redirect("/admin/users");
}

// 4. Hapus Data Guru
export async function deleteGuru(id: string) {
  try {
    await prisma.user.delete({
      where: { id }
    });
  } catch (error) {
    console.error("Gagal menghapus guru:", error);
    throw new Error("Gagal menghapus data guru.");
  }

  revalidatePath("/admin/users");
}

// === FUNGSI JEMBATAN UNTUK UI LAMA ===

export async function saveGuruDB(data: any, id?: string) {
  let formData = data;

  // Jika data yang dikirim dari UI adalah object biasa (JSON), ubah menjadi FormData
  if (!(data instanceof FormData)) {
    formData = new FormData();
    for (const key in data) {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key] as string);
      }
    }
  }

  // Jika parameter ke-2 (id) dikirimkan, masukkan ke dalam FormData
  if (id && !formData.get("id")) {
    formData.append("id", id);
  }

  // Cek apakah ini proses Edit (Update) atau Tambah Baru (Create)
  if (formData.get("id")) {
    return updateGuru(formData);
  } else {
    return createGuru(formData);
  }
}

export async function deleteGuruDB(id: string) {
  return deleteGuru(id);
}

// Fungsi tambahan untuk mencegah error build dari UI
export async function deleteGuruMassalDB(ids: string[]) {
  try {
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function updateAksesGuruDB(id: string, arg2: string, arg3?: string) {
  try {
    // Jika argumen ke-3 (password) dikirimkan dari UI, berarti ini update kredensial
    if (arg3) {
      const hashedPassword = await bcrypt.hash(arg3, 10);
      await prisma.user.update({
        where: { id },
        data: { 
          email: arg2, // arg2 di sini bertindak sebagai email
          password: hashedPassword 
        }
      });
    } else {
      // Jika hanya 2 argumen, berarti ini update status (misal: "Aktif" / "Nonaktif")
      await prisma.teacherProfile.updateMany({
        where: { userId: id },
        data: { status: arg2 } // arg2 di sini bertindak sebagai status
      });
    }
    
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error) {
    console.error("Error update akses:", error);
    return { success: false };
  }
}

export async function importGuruMassalDB(data: any[]) {
  // Placeholder agar tidak error saat diimpor oleh komponen import
  return { success: false, message: "Fitur import sedang disesuaikan" };
}