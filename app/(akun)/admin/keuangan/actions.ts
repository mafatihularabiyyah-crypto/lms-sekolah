"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

export async function getKelasAktifKeuanganDB() {
  const session = await getServerSession();
  const user = await prisma.user.findUnique({ where: { email: session?.user?.email || "" } });
  if (!user || !user.tenantId) return { success: false, data: [] };

  const kelas = await prisma.classRoom.findMany({
    where: { tenantId: user.tenantId, isFinished: false },
    include: { 
      students: { include: { user: true } } // MENGAMBIL NAMA ASLI SANTRI
    }
  });
  return { success: true, data: kelas };
}

export async function getTagihanAdminDB() {
  const session = await getServerSession();
  const user = await prisma.user.findUnique({ where: { email: session?.user?.email || "" } });
  if (!user || !user.tenantId) return { success: false, data: [] };

  const tagihan = await prisma.tagihan.findMany({
    where: { tenantId: user.tenantId },
    include: {
      student: { include: { user: true } },
      classRoom: true
    },
    orderBy: { createdAt: 'desc' }
  });
  return { success: true, data: tagihan };
}

export async function generateTagihanDB(data: { tipe: string; judul: string; classRoomId: string; nominals: { studentId: string; nominal: number }[] }) {
  try {
    const session = await getServerSession();
    const user = await prisma.user.findUnique({ where: { email: session?.user?.email || "" } });
    if (!user || !user.tenantId) throw new Error("Akses ditolak");

    const tagihanData = data.nominals.map(n => ({
      tipe: data.tipe, judul: data.judul, nominal: n.nominal,
      studentId: n.studentId, classRoomId: data.classRoomId, tenantId: user.tenantId!
    }));

    await prisma.tagihan.createMany({ data: tagihanData });
    revalidatePath("/admin/keuangan");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal membuat tagihan." };
  }
}

export async function updateStatusTagihanDB(id: string, status: string) {
  await prisma.tagihan.update({ where: { id }, data: { status } });
  revalidatePath("/admin/keuangan");
  return { success: true };
}

export async function hapusTagihanDB(id: string) {
  await prisma.tagihan.delete({ where: { id } });
  revalidatePath("/admin/keuangan");
  return { success: true };
}

export async function getDonasiSettingDB() {
  const session = await getServerSession();
  const user = await prisma.user.findUnique({ where: { email: session?.user?.email || "" } });
  if (!user || !user.tenantId) return { success: false, data: null };
  const setting = await prisma.paymentSetting.findUnique({ where: { tenantId: user.tenantId } });
  return { success: true, data: setting };
}

export async function saveDonasiSettingDB(data: any) {
  const session = await getServerSession();
  const user = await prisma.user.findUnique({ where: { email: session?.user?.email || "" } });
  if (!user || !user.tenantId) return { success: false };

  await prisma.paymentSetting.upsert({
    where: { tenantId: user.tenantId },
    update: data, create: { ...data, tenantId: user.tenantId }
  });
  return { success: true };
}

// Tambahkan fungsi ini di bagian paling bawah file actions.ts Admin

export async function editTagihanDB(id: string, data: { judul: string; nominal: number }) {
  try {
    await prisma.tagihan.update({
      where: { id },
      data: { judul: data.judul, nominal: data.nominal }
    });
    revalidatePath("/admin/keuangan");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal mengedit tagihan." };
  }
}