"use server";

import prisma from "@/lib/prisma";

export async function submitResponFormulirDB(formulirId: string, dataRespon: any) {
  try {
    await prisma.responFormulir.create({
      data: {
        formulirId: formulirId,
        dataRespon: dataRespon, // Menyimpan format JSON
        isDiterima: false,      // Status bawaan: Belum jadi santri
      }
    });
    return { success: true };
  } catch (error) {
    console.error("Gagal menyimpan respon:", error);
    return { success: false, error: "Gagal mengirimkan formulir. Silakan coba lagi." };
  }
}