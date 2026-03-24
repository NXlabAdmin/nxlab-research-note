"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function exportAllData() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).id) throw new Error("Unauthorized");
  const userId = (session.user as any).id as string;

  const [goals, steps, resources, schedules, goalConnections, stepConnections, nodeConnections] =
    await Promise.all([
      prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
      prisma.step.findMany({ where: { goal: { userId } }, orderBy: { order: "asc" } }),
      prisma.resource.findMany({ where: { userId }, orderBy: { createdAt: "asc" } }),
      prisma.schedule.findMany({ where: { userId }, orderBy: { date: "asc" } }),
      prisma.goalConnection.findMany({ where: { source: { userId } }, include: { source: true, target: true } }),
      (prisma as any).stepConnection.findMany({ where: { step: { goal: { userId } } }, include: { step: true, goal: true } }),
      (prisma as any).nodeConnection.findMany({ where: { userId } }),
    ]);

  return { goals, steps, resources, schedules, goalConnections, stepConnections, nodeConnections };
}
