"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function getInformasiSantriDB() {
  try {
    const session = await getServerSession();
    const user = await prisma.user.findUnique({ where: { email: session?.user?.email || "" } });
    if (!user || !user.tenantId) throw new Error("Akses ditolak");

    // Tarik hanya pengumuman yang aktif untuk sekolah ini
    const data = await prisma.pengumuman.findMany({
      where: { tenantId: user.tenantId, isActive: true },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data };
  } catch (error) {
    return { success: false, error: "Gagal memuat data." };
  }
}