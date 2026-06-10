"use server";

import prisma from "@/lib/prisma";

export async function submitCbtResultDB(data: {
  examId: string;
  namaPeserta: string;
  emailPeserta: string;
  nilai: number;
  detailJawaban: any;
}) {
  try {
    await prisma.cbtResult.create({
      data: {
        examId: data.examId,
        namaPeserta: data.namaPeserta,
        emailPeserta: data.emailPeserta, // Diambil otomatis nanti
        nilai: data.nilai,
        detailJawaban: data.detailJawaban,
      }
    });
    return { success: true };
  } catch (error: any) {
    console.error("Gagal menyimpan nilai ke DB:", error);
    return { success: false, error: error.message };
  }
}