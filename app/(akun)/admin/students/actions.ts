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
      status: s.status || "AKTIF",
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
        tenantId: tenantId 
      },
      select: { userId: true }
    });

    const userIds = profiles.map((p: any) => p.userId);

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
      data: { status: "LULUS" } 
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
// 7. IMPORT SISWA MASSAL (CSV) DENGAN LAPORAN
// ------------------------------------------------------------------
export async function importSiswaMassalDB(dataArray: any[]) {
  try {
    const { tenantId } = await getAuthContext();
    
    let sukses = 0;
    let dilewati = 0;

    for (const data of dataArray) {
      // 1. Ambil data dengan aman (Kebal huruf besar/kecil)
      const nis = data.NIS || data.nis || data.Nis || data["NIS "];
      const nama = data.NamaLengkap || data.Nama || data.nama || data.name;

      if (!nis || !nama) {
        dilewati++;
        continue; // Lewati jika NIS atau Nama kosong
      }

      const strNis = nis.toString().trim();
      const autoEmail = data.Email || data.email || `santri.${strNis}@sekolah.id`;
      
      // 2. Cek apakah Email atau NIS sudah terdaftar
      const existingUser = await prisma.user.findUnique({ where: { email: autoEmail } });
      const existingNis = await prisma.studentProfile.findFirst({ where: { tenantId, nis: strNis } });
      
      // Jika sudah ada, lewati agar tidak error
      if (existingUser || existingNis) {
        dilewati++;
        continue;
      }

      // 3. Persiapan Data
      const defaultPassword = data.Password || data.password || strNis;
      const hashedPassword = await bcrypt.hash(defaultPassword.toString(), 10);
      
      const genderRaw = data.JK || data.jk || data.Gender || "L";
      const genderEnum = genderRaw.toUpperCase().startsWith("L") ? "LAKI_LAKI" : "PEREMPUAN";
      
      const enrollYearInt = parseInt(data.Kelas || data.kelas) || new Date().getFullYear();
      
      const statusRaw = data.Status || data.status || "AKTIF";
      const statusEnum = statusRaw.toUpperCase();

      // 4. Simpan ke Database
      await prisma.$transaction(async (tx: any) => {
        const newUser = await tx.user.create({
          data: {
            email: autoEmail,
            name: nama,
            password: hashedPassword,
            role: "SANTRI",
            tenantId: tenantId,
          }
        });

        await tx.studentProfile.create({
          data: {
            userId: newUser.id,
            tenantId: tenantId,
            nis: strNis,
            gender: genderEnum,
            enrollYear: enrollYearInt,
            status: statusEnum, 
            parentName: data.NamaWali || data.namawali || null,
            parentPhone: data.NoHP || data.nohp || data.telepon ? String(data.NoHP || data.nohp || data.telepon) : null,
            address: data.Alamat || data.alamat || null,
          }
        });
      });
      
      sukses++; // Hitung data yang berhasil masuk
    }

    revalidatePath("/admin/students");
    
    // Kembalikan pesan yang jelas ke tampilan depan
    return { 
      success: true, 
      message: `Selesai! ${sukses} santri berhasil ditambahkan. ${dilewati} data dilewati karena duplikat atau format tidak lengkap.` 
    };
  } catch (error: any) {
    console.error("Gagal import massal:", error);
    return { success: false, error: "Terjadi kesalahan saat import data: " + error.message };
  }
}