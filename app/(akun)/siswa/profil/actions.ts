"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs"; // Pastikan Anda sudah menginstall bcryptjs

export async function getProfilSantriDB() {
  const session = await getServerSession();
  if (!session?.user?.email) return { success: false, data: null };

  // Ambil data User beserta relasi StudentProfile-nya
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { studentProfile: true }
  });

  if (!user) return { success: false, data: null };

  return {
    success: true,
    data: {
      id: user.id,
      nama: user.name,
      email: user.email,
      image: user.image || "",
      nis: user.studentProfile?.nis || "-",
      jk: user.studentProfile?.gender || "-",
      angkatan: user.studentProfile?.enrollYear || "-",
      status: user.studentProfile?.status || "AKTIF",
      wali: user.studentProfile?.parentName || "-",
      teleponWali: user.studentProfile?.parentPhone || "",
      alamat: user.studentProfile?.address || "",
    }
  };
}

export async function updateProfilSantriDB(data: { teleponWali: string, alamat: string, image?: string }) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) throw new Error("Akses ditolak");

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) throw new Error("User tidak ditemukan");

    // 1. Update Foto Profil di tabel User (Jika ada)
    if (data.image) {
      await prisma.user.update({
        where: { id: user.id },
        data: { image: data.image }
      });
    }

    // 2. Update Data Kontak di tabel StudentProfile
    await prisma.studentProfile.update({
      where: { userId: user.id },
      data: {
        parentPhone: data.teleponWali,
        address: data.alamat
      }
    });

    revalidatePath("/siswa/profil");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal menyimpan perubahan profil." };
  }
}

export async function updatePasswordSantriDB(oldPass: string, newPass: string) {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) throw new Error("Akses ditolak");

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) throw new Error("User tidak ditemukan");

    // Verifikasi password lama
    const isMatch = await bcrypt.compare(oldPass, user.password);
    if (!isMatch) return { success: false, error: "Kata sandi saat ini salah!" };

    // Hash password baru
    const hashedNewPass = await bcrypt.hash(newPass, 10);

    // Simpan ke database
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedNewPass }
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal memperbarui kata sandi." };
  }
}