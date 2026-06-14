// app/(akun)/admin/materials/actions.ts
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getClassesForMaterialsDB() {
  try {
    const classes = await prisma.classRoom.findMany({
      include: { _count: { select: { materials: true, students: true } } },
      orderBy: { name: 'asc' }
    });
    return { success: true, data: classes };
  } catch (error) {
    return { success: false, error: "Gagal mengambil daftar kelas." };
  }
}

export async function getClassMaterialsDB(classId: string) {
  try {
    const classData = await prisma.classRoom.findUnique({
      where: { id: classId },
      include: {
        materials: { orderBy: [{ order: 'asc' }, { createdAt: 'desc' }] }
      }
    });
    return { success: true, data: classData };
  } catch (error) {
    return { success: false, error: "Gagal mengambil data materi." };
  }
}

export async function toggleClassStatusDB(classId: string, isFinished: boolean) {
  try {
    await prisma.classRoom.update({ where: { id: classId }, data: { isFinished } });
    revalidatePath("/admin/materials");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal merubah status kelas." };
  }
}

export async function updateMaterialOrderDB(orderedIds: string[]) {
  try {
    await prisma.$transaction(
      orderedIds.map((id, index) => prisma.learningMaterial.update({ where: { id }, data: { order: index } }))
    );
    revalidatePath("/admin/materials");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal menyimpan urutan." };
  }
}

export async function updateClassLinksDB(classId: string, zoomLink: string, waLink: string) {
  try {
    await prisma.classRoom.update({ where: { id: classId }, data: { zoomLink: zoomLink, waGroupLink: waLink } });
    revalidatePath("/admin/materials");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal menyimpan link." };
  }
}

export async function saveMaterialDB(classId: string, data: any, editingId?: string) {
  try {
    if (editingId) {
      await prisma.learningMaterial.update({
        where: { id: editingId },
        data: { title: data.title, description: data.description, youtubeLink: data.youtubeLink, fileUrl: data.fileUrl }
      });
    } else {
      await prisma.learningMaterial.create({
        data: { classRoomId: classId, title: data.title, description: data.description, youtubeLink: data.youtubeLink, fileUrl: data.fileUrl, order: 0 }
      });
    }
    revalidatePath("/admin/materials");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal menyimpan materi." };
  }
}

export async function togglePublishDB(id: string, isPublished: boolean) {
  try {
    await prisma.learningMaterial.update({ where: { id }, data: { isPublished } });
    revalidatePath("/admin/materials");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal mengubah status." };
  }
}

export async function deleteMaterialDB(id: string) {
  try {
    await prisma.learningMaterial.delete({ where: { id } });
    revalidatePath("/admin/materials");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal menghapus materi." };
  }
}

export async function copyMaterialsDB(targetClassId: string, materialIdsToCopy: string[]) {
  try {
    const materials = await prisma.learningMaterial.findMany({ where: { id: { in: materialIdsToCopy } } });
    const newMaterials = materials.map((m: any, idx: number) => ({
      classRoomId: targetClassId,
      title: m.title + " (Copy)",
      description: m.description,
      youtubeLink: m.youtubeLink,
      fileUrl: m.fileUrl, // Menyalin link file juga
      isPublished: false,
      order: idx
    }));
    await prisma.learningMaterial.createMany({ data: newMaterials });
    revalidatePath("/admin/materials");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Gagal menyalin materi." };
  }
}