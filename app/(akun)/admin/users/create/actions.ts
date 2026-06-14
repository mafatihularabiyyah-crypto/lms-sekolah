"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcrypt";

export async function createStudent(formData: FormData) {
  // 1. Ambil data Akun Login (User)
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  
  // 2. Ambil data Profil Akademik
  const nis = formData.get("nis") as string;
  const parentName = formData.get("parentName") as string;
  const parentPhone = formData.get("parentPhone") as string;
  const enrollYear = parseInt(formData.get("enrollYear") as string);
  const address = formData.get("address") as string;

  // Pastikan Tenant (Pesantren) default tersedia
  let tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    tenant = await prisma.tenant.create({ data: { name: "Pesantren Pusat" } });
  }

  // Enkripsi password
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // TRANSAKSI DATABASE: Simpan Akun dan Profil secara bersamaan!
    await prisma.$transaction(async (tx: any) => {
      // Step A: Buat akun otentikasi
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "SANTRI",
          tenantId: tenant.id,
        },
      });

      // Step B: Buat profil santri dan hubungkan dengan ID akun di atas
      await tx.studentProfile.create({
        data: {
          nis,
          parentName: parentName || null,
          parentPhone: parentPhone || null,
          enrollYear,
          address: address || null,
          userId: newUser.id, // Ini kunci relasinya!
        },
      });
    });
  } catch (error) {
    console.error("Gagal menyimpan data:", error);
    throw new Error("Gagal menyimpan data santri. Pastikan NIS atau Email belum digunakan.");
  }

  // Jika sukses, refresh tabel dan kembali ke direktori
  revalidatePath("/admin/students");
  redirect("/admin/students");
}