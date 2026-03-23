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

export async function createGoalConnection(sourceId: string, targetId: string) {
  const userId = await getUserId();

  const sourceGoal = await prisma.goal.findUnique({ where: { id: sourceId, userId } });
  const targetGoal = await prisma.goal.findUnique({ where: { id: targetId, userId } });

  if (!sourceGoal || !targetGoal) {
    throw new Error("Cannot connect goals you do not own.");
  }

  const connection = await prisma.goalConnection.create({
    data: { sourceId, targetId }
  });

  revalidatePath("/");
  return connection;
}

export async function deleteGoalConnection(id: string) {
  const userId = await getUserId();

  const conn = await prisma.goalConnection.findUnique({
    where: { id },
    include: { source: true }
  });

  if (!conn || conn.source.userId !== userId) {
    throw new Error("Unauthorized");
  }

  await prisma.goalConnection.delete({ where: { id } });
  revalidatePath("/");
}

export async function getGoalConnections() {
  const userId = await getUserId();
  return prisma.goalConnection.findMany({
    where: { source: { userId } }
  });
}

export async function createStepConnection(stepId: string, goalId: string) {
  const userId = await getUserId();

  const step = await prisma.step.findUnique({
    where: { id: stepId },
    include: { goal: true },
  });
  if (!step || step.goal.userId !== userId) {
    throw new Error("Step not found or unauthorized.");
  }

  const goal = await prisma.goal.findUnique({ where: { id: goalId, userId } });
  if (!goal) {
    throw new Error("Goal not found or unauthorized.");
  }

  const connection = await (prisma as any).stepConnection.create({
    data: { stepId, goalId }
  });

  revalidatePath("/");
  return connection;
}

export async function deleteStepConnection(id: string) {
  const userId = await getUserId();

  const conn = await (prisma as any).stepConnection.findUnique({
    where: { id },
    include: { step: { include: { goal: true } } }
  });

  if (!conn || conn.step.goal.userId !== userId) {
    throw new Error("Unauthorized");
  }

  await (prisma as any).stepConnection.delete({ where: { id } });
  revalidatePath("/");
}

export async function getStepConnections() {
  const userId = await getUserId();
  return (prisma as any).stepConnection.findMany({
    where: { step: { goal: { userId } } }
  });
}
