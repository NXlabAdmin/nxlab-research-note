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

export async function createGoal(title: string) {
  const userId = await getUserId();
  const goal = await prisma.goal.create({
    data: {
      userId,
      title,
    },
  });
  revalidatePath("/");
  return goal;
}

export async function getGoals() {
  const userId = await getUserId();
  return prisma.goal.findMany({
    where: { userId },
    include: { steps: { orderBy: { order: 'asc' } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateGoalTitle(id: string, title: string) {
  const userId = await getUserId();
  const goal = await prisma.goal.updateMany({
    where: { id, userId }, // Ensure user owns the goal
    data: { title },
  });
  revalidatePath("/");
  return goal;
}

export async function deleteGoal(id: string) {
  const userId = await getUserId();
  await prisma.goal.deleteMany({
    where: { id, userId },
  });
  revalidatePath("/");
}

export async function updateGoalDueDate(id: string, dueDate: string | null) {
  const userId = await getUserId();
  await prisma.goal.updateMany({
    where: { id, userId },
    data: { dueDate: dueDate ? new Date(dueDate) : null },
  });
  revalidatePath("/");
}

export async function completeGoal(id: string) {
  const userId = await getUserId();
  await prisma.goal.updateMany({
    where: { id, userId },
    data: { progress: 100 },
  });
  revalidatePath("/");
}
