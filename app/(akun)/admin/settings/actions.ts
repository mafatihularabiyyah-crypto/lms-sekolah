"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

// 1. AMBIL SEMUA DATA PENGATURAN
export async function getSettingsDataDB(userId: string) {
  try {
    // Ambil atau buat default pengaturan sekolah
    let school = await prisma.systemSettings.findUnique({ where: { id: "default" } });
    if (!school) {
      school = await prisma.systemSettings.create({ data: { id: "default", schoolName: "LMS Pesantren" } });
    }
    const admin = await prisma.user.findUnique({ where: { id: userId } });
    return { success: true, data: { school, admin } };
  } catch (error) {
    return { success: false, error: "Gagal memuat data." };
  }
}

// 2. UPDATE PROFIL INSTITUSI / SEKOLAH
// 2. UPDATE PROFIL INSTITUSI / SEKOLAH
export async function updateSchoolDB(data: { schoolName: string, schoolLogo: string }) {
  try {
    // Gunakan UPSERT agar jika data belum ada, ia akan membuatnya otomatis
    await prisma.systemSettings.upsert({
      where: { id: "default" },
      update: { 
        schoolName: data.schoolName, 
        schoolLogo: data.schoolLogo 
      },
      create: { 
        id: "default", 
        schoolName: data.schoolName, 
        schoolLogo: data.schoolLogo 
      }
    });
    
    revalidatePath("/", "layout"); 
    return { success: true };
  } catch (error) {
    console.error("Gagal simpan DB:", error); // Menangkap error jika gambar terlalu besar
    return { success: false, error: "Gagal menyimpan data sekolah ke database." };
  }
}

// 3. UPDATE PROFIL ADMIN (Nama & Foto)
export async function updateAdminProfileDB(userId: string, data: { name: string, email: string, image: string }) {
  try {
    // Cek apakah email sudah dipakai orang lain
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing && existing.id !== userId) return { success: false, error: "Email sudah digunakan akun lain!" };

    await prisma.user.update({
      where: { id: userId },
      data: { name: data.name, email: data.email, image: data.image }
    });
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal menyimpan profil admin." };
  }
}

// 4. UPDATE PASSWORD
export async function updatePasswordDB(userId: string, oldPass: string, newPass: string) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return { success: false, error: "User tidak ditemukan." };

    const isMatch = await bcrypt.compare(oldPass, user.password);
    if (!isMatch) return { success: false, error: "Password lama salah!" };

    const hashedNewPassword = await bcrypt.hash(newPass, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal mengubah password." };
  }
}