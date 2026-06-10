"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth"; // Wajib diimpor untuk autentikasi

// ------------------------------------------------------------------
// FUNGSI HELPER: Keamanan & Identifikasi Sekolah (Tenant)
// ------------------------------------------------------------------
async function getAuthContext() {
  const session = await getServerSession();
  if (!session?.user?.email) throw new Error("Akses ditolak. Silakan login kembali.");
  
  const user = await prisma.user.findUnique({ 
    where: { email: session.user.email } 
  });
  
  if (!user || !user.tenantId) throw new Error("Akun ini belum diikat ke instansi/sekolah manapun.");
  
  return { userId: user.id, tenantId: user.tenantId, user };
}

// ------------------------------------------------------------------
// 1. AMBIL SEMUA DATA PENGATURAN (Sesuai Sekolah Admin)
// ------------------------------------------------------------------
export async function getSettingsDataDB() {
  try {
    const { tenantId, user: admin } = await getAuthContext();

    // Cari pengaturan khusus untuk sekolah ini
    let school = await prisma.systemSettings.findUnique({ 
      where: { tenantId: tenantId } 
    });

    // Jika belum ada, buatkan otomatis untuk sekolah ini
    if (!school) {
      school = await prisma.systemSettings.create({ 
        data: { 
          tenantId: tenantId, 
          schoolName: "LMS Pesantren" 
        } 
      });
    }

    return { success: true, data: { school, admin } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ------------------------------------------------------------------
// 2. UPDATE PROFIL INSTITUSI / SEKOLAH (Mode Cepat)
// ------------------------------------------------------------------
export async function updateSchoolDB(data: { schoolName: string, schoolLogo: string }) {
  try {
    const { tenantId } = await getAuthContext();

    await prisma.systemSettings.upsert({
      where: { tenantId: tenantId },
      update: { 
        schoolName: data.schoolName, 
        schoolLogo: data.schoolLogo 
      },
      create: { 
        tenantId: tenantId, 
        schoolName: data.schoolName, 
        schoolLogo: data.schoolLogo 
      }
    });
    
    revalidatePath("/", "layout"); 
    return { success: true };
  } catch (error: any) {
    console.error("Gagal simpan profil institusi:", error);
    return { success: false, error: "Gagal menyimpan data sekolah ke database. Gambar mungkin terlalu besar." };
  }
}

// ------------------------------------------------------------------
// 3. UPDATE PROFIL ADMIN (Nama & Foto)
// ------------------------------------------------------------------
export async function updateAdminProfileDB(data: { name: string, email: string, image: string }) {
  try {
    const { userId } = await getAuthContext();

    // Cek apakah email sudah dipakai orang lain di seluruh sistem
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing && existing.id !== userId) {
      return { success: false, error: "Email sudah digunakan akun lain!" };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { name: data.name, email: data.email, image: data.image }
    });
    
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Gagal menyimpan profil admin." };
  }
}

// ------------------------------------------------------------------
// 4. UPDATE KATA SANDI ADMIN
// ------------------------------------------------------------------
export async function updatePasswordDB(oldPass: string, newPass: string) {
  try {
    const { userId, user } = await getAuthContext();

    const isMatch = await bcrypt.compare(oldPass, user.password);
    if (!isMatch) return { success: false, error: "Password lama salah!" };

    const hashedNewPassword = await bcrypt.hash(newPass, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    return { success: true };
  } catch (error: any) {
    return { success: false, error: "Gagal mengubah password." };
  }
}

// ------------------------------------------------------------------
// 5. UPDATE PENGATURAN SISTEM LENGKAP (Tanda Tangan dll)
// ------------------------------------------------------------------
export async function saveSystemSettingsDB(formData: {
  schoolName: string;
  schoolLogo: string | null;
  adminName: string;
  adminTtd: string | null;
  kepsekName: string;
  kepsekNip: string;
  kepsekTtd: string | null;
}) {
  try {
    const { tenantId } = await getAuthContext();

    await prisma.systemSettings.upsert({
      where: { tenantId: tenantId },
      update: {
        schoolName: formData.schoolName,
        schoolLogo: formData.schoolLogo, 
        adminName: formData.adminName,
        adminTtd: formData.adminTtd,
        kepsekName: formData.kepsekName,
        kepsekNip: formData.kepsekNip,
        kepsekTtd: formData.kepsekTtd,
      },
      create: {
        tenantId: tenantId,
        schoolName: formData.schoolName,
        schoolLogo: formData.schoolLogo,
        adminName: formData.adminName,
        adminTtd: formData.adminTtd,
        kepsekName: formData.kepsekName,
        kepsekNip: formData.kepsekNip,
        kepsekTtd: formData.kepsekTtd,
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error("Gagal menyimpan pengaturan sistem lengkap:", error);
    return { success: false, error: "Gagal menyimpan. Jika menggunakan gambar, pastikan ukurannya tidak terlalu besar." };
  }
}