"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

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
// 1. AMBIL SEMUA DATA SISWA (Dilengkapi Mapping untuk Frontend)
// ------------------------------------------------------------------
export async function getSiswaDB() {
  try {
    const { tenantId } = await getAuthContext();

    const students = await prisma.studentProfile.findMany({
      where: { tenantId: tenantId },
      include: { user: true },
      orderBy: { createdAt: 'desc' }
    });

    // MAPPING DATA: Mengubah format Prisma agar sesuai dengan interface di page.tsx
    const mappedData = students.map((s: any) => ({
      id: s.id,
      nis: s.nis || "-",
      nama: s.user?.name || "-",
      email: s.user?.email || null,
      jk: s.gender === "LAKI_LAKI" ? "L" : "P",
      kelas: s.enrollYear ? s.enrollYear.toString() : "-",
      ortu: s.parentName || "-",
      telepon: s.parentPhone || "-",
      alamat: s.address || "-",
      status: s.status || "Aktif",
      kesibukan: s.kesibukan || "Santri Reguler",
    }));

    return { success: true, data: mappedData };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}


// ------------------------------------------------------------------
// 2. SIMPAN & EDIT DATA SISWA (Upsert Mode)
// ------------------------------------------------------------------
export async function saveSiswaDB(data: any) {
  try {
    const { tenantId } = await getAuthContext();
    const genderEnum = data.jk === "L" || data.jk === "LAKI_LAKI" ? "LAKI_LAKI" : "PEREMPUAN";
    const enrollYearInt = parseInt(data.kelas) || new Date().getFullYear();
    
    // Paksa status menjadi huruf kapital semua (AKTIF, LULUS, MUTASI)
    const statusEnum = data.status ? data.status.toUpperCase() : "AKTIF";

    // MODE EDIT
    if (data.id) {
      const existingProfile = await prisma.studentProfile.findUnique({ 
        where: { id: data.id }, include: { user: true }
      });
      
      if (!existingProfile || existingProfile.tenantId !== tenantId) {
        throw new Error("Siswa tidak ditemukan atau bukan milik sekolah Anda.");
      }

      // Validasi NIS jika diubah
      if (data.nis !== existingProfile.nis) {
        const cekNis = await prisma.studentProfile.findFirst({ where: { tenantId, nis: data.nis }});
        if (cekNis) return { success: false, error: "NIS tersebut sudah digunakan siswa lain." };
      }

      await prisma.$transaction(async (tx: any) => {
        // Update Profil
        await tx.studentProfile.update({
          where: { id: data.id },
          data: {
            nis: data.nis,
            gender: genderEnum,
            enrollYear: enrollYearInt,
            status: statusEnum,
            parentPhone: data.telepon || null,
            // Baris kesibukan DIHAPUS karena tidak ada di database schema
          }
        });
        // Update Nama User
        await tx.user.update({
          where: { id: existingProfile.userId },
          data: { name: data.nama || data.name }
        });
      });

    } 
    // MODE TAMBAH BARU (CREATE)
    else {
      // Auto-generate email jika kosong (gunakan nis@namasekolah.com)
      const autoEmail = data.email || `santri.${data.nis}@sekolah.id`;

      const existingUser = await prisma.user.findUnique({ where: { email: autoEmail } });
      if (existingUser) return { success: false, error: "Email sudah terdaftar!" };

      const existingNis = await prisma.studentProfile.findFirst({ where: { tenantId, nis: data.nis } });
      if (existingNis) return { success: false, error: "NIS sudah digunakan di sekolah ini!" };
      
      const defaultPassword = data.password || data.nis || "123456";
      const hashedPassword = await bcrypt.hash(defaultPassword.toString(), 10);

      await prisma.$transaction(async (tx: any) => {
        const newUser = await tx.user.create({
          data: {
            email: autoEmail,
            name: data.nama || data.name,
            password: hashedPassword,
            role: "SANTRI",
            tenantId: tenantId,
          }
        });

        await tx.studentProfile.create({
          data: {
            userId: newUser.id,
            tenantId: tenantId,
            nis: data.nis,
            gender: genderEnum,
            enrollYear: enrollYearInt,
            status: statusEnum,
            parentPhone: data.telepon || null,
            // Baris kesibukan DIHAPUS karena tidak ada di database schema
          }
        });
      });
    }

    revalidatePath("/admin/students");
    return { success: true };
  } catch (error: any) {
    console.error("Gagal simpan siswa:", error);
    return { success: false, error: "Terjadi kesalahan sistem: " + error.message };
  }
}

// ------------------------------------------------------------------
// 3. HAPUS SISWA SATUAN
// ------------------------------------------------------------------
export async function deleteSiswaDB(studentProfileId: string) {
  try {
    const { tenantId } = await getAuthContext();
    const profile = await prisma.studentProfile.findUnique({ where: { id: studentProfileId } });

    if (!profile || profile.tenantId !== tenantId) throw new Error("Akses ditolak.");

    // Hapus User (Otomatis Cascade hapus Profile)
    await prisma.user.delete({ where: { id: profile.userId } });

    revalidatePath("/admin/students");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ------------------------------------------------------------------
// 4. HAPUS SISWA MASSAL
// ------------------------------------------------------------------
export async function deleteSiswaMassalDB(studentProfileIds: string[]) {
  try {
    const { tenantId } = await getAuthContext();

    // Cari semua userId yang terikat pada profile tersebut
    const profiles = await prisma.studentProfile.findMany({
      where: { 
        id: { in: studentProfileIds },
        tenantId: tenantId // Validasi ganda
      },
      select: { userId: true }
    });

    const userIds = profiles.map(p => p.userId);

    // Hapus massal dari tabel User
    await prisma.user.deleteMany({
      where: { id: { in: userIds } }
    });

    revalidatePath("/admin/students");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ------------------------------------------------------------------
// 5. LULUSKAN SISWA MASSAL
// ------------------------------------------------------------------
export async function luluskanSiswaMassalDB(studentProfileIds: string[]) {
  try {
    const { tenantId } = await getAuthContext();

    await prisma.studentProfile.updateMany({
      where: { 
        id: { in: studentProfileIds },
        tenantId: tenantId 
      },
      data: { status: "LULUS" } // <--- UBAH MENJADI HURUF BESAR SEMUA
    });

    revalidatePath("/admin/students");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ------------------------------------------------------------------
// 6. UBAH AKSES LOGIN SISWA (Ganti Email / Password)
// ------------------------------------------------------------------
export async function updateAksesSiswaDB(studentProfileId: string, newEmail: string, newPassword?: string) {
  try {
    const { tenantId } = await getAuthContext();
    const profile = await prisma.studentProfile.findUnique({ where: { id: studentProfileId } });

    if (!profile || profile.tenantId !== tenantId) throw new Error("Akses ditolak.");

    // Cek apakah email baru sudah dipakai orang lain
    const cekEmail = await prisma.user.findUnique({ where: { email: newEmail } });
    if (cekEmail && cekEmail.id !== profile.userId) {
      return { success: false, error: "Alamat email tersebut sudah dipakai oleh pengguna lain." };
    }

    const updateData: any = { email: newEmail };
    
    // Jika kolom password diisi, update passwordnya
    if (newPassword && newPassword.trim().length >= 6) {
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    await prisma.user.update({
      where: { id: profile.userId },
      data: updateData
    });

    revalidatePath("/admin/students");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ------------------------------------------------------------------
// 7. IMPORT SISWA MASSAL (CSV)
// ------------------------------------------------------------------
export async function importSiswaMassalDB(dataArray: any[]) {
  try {
    const { tenantId } = await getAuthContext();

    // Gunakan loop karena kita harus melakukan hashing password per baris
    // dan membuat record di 2 tabel berbeda (User & Profile)
    for (const data of dataArray) {
      // Lewati jika data kosong atau tidak valid
      if (!data.NIS || !data.Nama) continue;

      const autoEmail = data.Email || `santri.${data.NIS}@sekolah.id`;
      const defaultPassword = data.Password || data.NIS.toString();
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      // 3. Persiapan Data (Konversi format agar sesuai schema Prisma)
    const genderEnum = data.jk === "L" || data.jk === "LAKI_LAKI" ? "LAKI_LAKI" : "PEREMPUAN";
    const enrollYearInt = parseInt(data.kelas) || new Date().getFullYear();
    
    // TAMBAHKAN BARIS INI: Paksa status menjadi huruf besar semua
    const statusEnum = data.status ? data.status.toUpperCase() : "AKTIF";

      // Cek duplikasi (lewati jika sudah ada)
      const existingUser = await prisma.user.findUnique({ where: { email: autoEmail } });
      const existingNis = await prisma.studentProfile.findFirst({ where: { tenantId, nis: data.NIS.toString() } });
      
      if (!existingUser && !existingNis) {
        await prisma.$transaction(async (tx: any) => {
          const newUser = await tx.user.create({
            data: {
              email: autoEmail,
              name: data.Nama,
              password: hashedPassword,
              role: "SANTRI",
              tenantId: tenantId,
            }
          });

          await tx.studentProfile.create({
            data: {
              userId: newUser.id,
              tenantId: tenantId,
              nis: data.NIS.toString(),
              gender: genderEnum,
              enrollYear: enrollYearInt,
              status: data.Status || "Aktif",
              parentName: data.NamaWali || null,
              parentPhone: data.NoHP || null,
              address: data.Alamat || null,
            }
          });
        });
      }
    }

    revalidatePath("/admin/students");
    return { success: true };
  } catch (error: any) {
    console.error("Gagal import massal:", error);
    return { success: false, error: "Terjadi kesalahan saat import data: " + error.message };
  }
}