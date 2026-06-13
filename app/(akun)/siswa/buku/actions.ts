"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function getBukuSantriDB() {
  const session = await getServerSession();
  if (!session?.user?.email) return { success: false, data: [] };

  // Cari Tenant ID sekolah si santri berdasarkan email akunnya
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { tenantId: true }
  });

  if (!user?.tenantId) return { success: false, data: [] };

  // Tarik daftar buku yang hanya diinput oleh admin sekolah bersangkutan
  const daftarBuku = await prisma.buku.findMany({
    where: { tenantId: user.tenantId },
    orderBy: { createdAt: "desc" }
  });

  return { success: true, data: daftarBuku };
}