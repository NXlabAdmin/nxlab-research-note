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

export async function updateNodeColor(type: string, id: string, color: string) {
  const userId = await getUserId();
  
  // A generic way to update color based on type
  if (type === 'goalNode' || type === 'Goal') {
    await prisma.goal.updateMany({ where: { id, userId }, data: { color } });
  } else if (type === 'stepNode' || type === 'Step') {
    const step = await prisma.step.findUnique({ where: { id } });
    if (!step) return;
    const goal = await prisma.goal.findUnique({ where: { id: step.goalId, userId } });
    if (!goal) return;
    await prisma.step.update({ where: { id }, data: { color } });
  } else if (type === 'resourceNode' || type === 'Resource') {
    await prisma.resource.updateMany({ where: { id, userId }, data: { color } });
  } else if (type === 'scheduleNode' || type === 'Schedule') {
    await prisma.schedule.updateMany({ where: { id, userId }, data: { color } });
  }
  
  revalidatePath("/");
}
