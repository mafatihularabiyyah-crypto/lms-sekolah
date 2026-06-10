"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

// 1. AMBIL SEMUA ADMIN SEKOLAH BESERTA DATA INSTANSI
export async function getSchoolAdminsDB() {
  try {
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      include: {
        tenant: true // Mengambil data nama instansi/sekolah dari relasi database
      },
      orderBy: { name: 'asc' }
    });
    return { success: true, data: admins };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 2. TAMBAH ADMIN & INSTANSI BARU
export async function createSchoolAdminDB(data: any) {
  try {
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return { success: false, error: "Email sudah terdaftar!" };

    const hashedPassword = await bcrypt.hash(data.password, 10);

    await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: "ADMIN",
        isActive: true,
        tenant: {
          create: {
            name: data.schoolName
          }
        }
      }
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 3. EDIT ADMIN & NAMA INSTANSI
export async function updateSchoolAdminDB(id: string, data: any) {
  try {
    const updateData: any = {
      name: data.name,
      email: data.email,
    };
    
    if (data.password && data.password.trim() !== "") {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    if (data.schoolName) {
      updateData.tenant = {
        update: {
          name: data.schoolName
        }
      };
    }

    await prisma.user.update({
      where: { id },
      data: updateData
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 4. TOGGLE LISENSI
export async function toggleLicenseDB(id: string, currentStatus: boolean) {
  try {
    await prisma.user.update({
      where: { id },
      data: { isActive: !currentStatus }
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// 5. HAPUS KLIEN SEKOLAH
export async function deleteSchoolAdminDB(id: string) {
  try {
    await prisma.user.delete({ where: { id } });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}