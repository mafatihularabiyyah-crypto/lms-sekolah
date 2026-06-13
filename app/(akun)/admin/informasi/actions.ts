"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

export async function getPengumumanAdminDB() {
  try {
    const session = await getServerSession();
    const user = await prisma.user.findUnique({ where: { email: session?.user?.email || "" } });
    if (!user || !user.tenantId) throw new Error("Akses ditolak");

    const data = await prisma.pengumuman.findMany({
      where: { tenantId: user.tenantId },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: "Gagal memuat data." };
  }
}

export async function simpanPengumumanDB(data: any, id?: string) {
  try {
    const session = await getServerSession();
    const user = await prisma.user.findUnique({ where: { email: session?.user?.email || "" } });
    if (!user || !user.tenantId) throw new Error("Akses ditolak");

    if (id) {
      await prisma.pengumuman.update({
        where: { id },
        data: { 
          judul: data.judul, 
          konten: data.konten, 
          kategori: data.kategori, 
          imageUrl: data.imageUrl, 
          actionLink: data.actionLink, // <--- TAMBAH INI
          isActive: data.isActive 
        }
      });
    } else {
      await prisma.pengumuman.create({
        data: { 
          ...data, 
          tenantId: user.tenantId 
        }
      });
    }
    revalidatePath("/admin/informasi");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal menyimpan pengumuman." };
  }
}

export async function hapusPengumumanDB(id: string) {
  try {
    await prisma.pengumuman.delete({ where: { id } });
    revalidatePath("/admin/informasi");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}