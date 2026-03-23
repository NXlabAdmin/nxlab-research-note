"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

async function getUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).id) {
    throw new Error("Unauthorized");
  }
  return (session.user as any).id as string;
}

export async function createSchedule(data: { title: string, date: Date, description?: string }) {
  const userId = await getUserId();
  
  const schedule = await prisma.schedule.create({
    data: {
      userId,
      title: data.title,
      date: data.date,
      description: data.description || null,
    },
  });

  revalidatePath("/");
  return schedule;
}

export async function getSchedules() {
  const userId = await getUserId();
  return prisma.schedule.findMany({
    where: { userId },
    orderBy: { date: "asc" },
  });
}

export async function deleteSchedule(id: string) {
  const userId = await getUserId();
  await prisma.schedule.delete({
    where: { id, userId },
  });
  revalidatePath("/");
}
