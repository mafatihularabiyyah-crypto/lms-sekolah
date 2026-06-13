"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

export async function getKeuanganSantriDB() {
  const session = await getServerSession();
  const user = await prisma.user.findUnique({ where: { email: session?.user?.email || "" }, include: { studentProfile: true } });
  
  if (!user || !user.studentProfile) return { success: false, data: [] };

  const tagihan = await prisma.tagihan.findMany({
    where: { studentId: user.studentProfile.id },
    include: { classRoom: { select: { name: true } } },
    orderBy: { createdAt: 'desc' }
  });
  return { success: true, data: tagihan };
}

export async function konfirmasiPembayaranDB(id: string) {
  try {
    await prisma.tagihan.update({ where: { id }, data: { status: "MENUNGGU_KONFIRMASI" } });
    revalidatePath("/siswa/keuangan");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function getDonasiSantriDB() {
  const session = await getServerSession();
  const user = await prisma.user.findUnique({ where: { email: session?.user?.email || "" } });
  if (!user || !user.tenantId) return { success: false, data: null };

  const setting = await prisma.paymentSetting.findUnique({ where: { tenantId: user.tenantId } });
  return { success: true, data: setting };
}