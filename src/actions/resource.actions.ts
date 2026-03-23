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

export async function createResource(data: { title: string, url?: string, memo?: string, goalId?: string, stepId?: string }) {
  const userId = await getUserId();

  if (data.goalId) {
    const goal = await prisma.goal.findUnique({ where: { id: data.goalId, userId }});
    if (!goal) throw new Error("Goal not found");
  }

  if (data.stepId) {
    const step = await prisma.step.findUnique({
      where: { id: data.stepId },
      include: { goal: true },
    });
    if (!step || step.goal.userId !== userId) throw new Error("Step not found");
  }

  const resource = await prisma.resource.create({
    data: {
      userId,
      title: data.title,
      url: data.url || null,
      memo: data.memo || null,
      goalId: data.goalId || null,
      stepId: data.stepId || null,
    },
    include: { goal: true, step: true }
  });

  revalidatePath("/");
  return resource;
}

export async function getResources() {
  const userId = await getUserId();
  return prisma.resource.findMany({
    where: { userId },
    include: { goal: true, step: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteResource(id: string) {
  const userId = await getUserId();
  await prisma.resource.delete({
    where: { id, userId },
  });
  revalidatePath("/");
}
