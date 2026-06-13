"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

async function getTenantId() {
  const session = await getServerSession();
  if (!session?.user?.email) return null;
  const user = await prisma.user.findUnique({ 
    where: { email: session.user.email }, 
    select: { tenantId: true }
  });
  return user?.tenantId || null;
}

export async function getBukuAdminDB() {
  const tenantId = await getTenantId();
  if (!tenantId) return { success: false, data: [] };

  const books = await prisma.buku.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" }
  });

  return { success: true, data: books };
}

export async function simpanBukuDB(data: { 
  id?: string; 
  judul: string; 
  deskripsi: string; 
  coverUrl: string; 
  isFisik: boolean;
  fileUrl: string; 
  nomorWa: string;
  hargaNormal: number; 
  potonganHarga: number; 
}) {
  try {
    const tenantId = await getTenantId();
    if (!tenantId) throw new Error("Akses ditolak");

    if (data.id) {
      await prisma.buku.update({
        where: { id: data.id },
        data: {
          judul: data.judul,
          deskripsi: data.deskripsi,
          coverUrl: data.coverUrl,
          isFisik: data.isFisik,
          fileUrl: data.isFisik ? null : data.fileUrl,
          nomorWa: data.isFisik ? data.nomorWa : null,
          hargaNormal: data.hargaNormal,
          potonganHarga: data.potonganHarga,
        }
      });
    } else {
      await prisma.buku.create({
        data: {
          judul: data.judul,
          deskripsi: data.deskripsi,
          coverUrl: data.coverUrl,
          isFisik: data.isFisik,
          fileUrl: data.isFisik ? null : data.fileUrl,
          nomorWa: data.isFisik ? data.nomorWa : null,
          hargaNormal: data.hargaNormal,
          potonganHarga: data.potonganHarga,
          tenantId: tenantId
        }
      });
    }

    revalidatePath("/admin/buku");
    revalidatePath("/siswa/buku");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal menyimpan buku." };
  }
}

export async function hapusBukuDB(id: string) {
  try {
    await prisma.buku.delete({ where: { id } });
    revalidatePath("/admin/buku");
    revalidatePath("/siswa/buku");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal menghapus buku." };
  }
}