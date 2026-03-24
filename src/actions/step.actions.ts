"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

async function verifyGoalOwnership(goalId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).id) {
    throw new Error("Unauthorized");
  }
  const userId = (session.user as any).id as string;

  const goal = await prisma.goal.findUnique({
    where: { id: goalId, userId },
  });
  if (!goal) throw new Error("Goal not found or unauthorized");
  return goal;
}

async function updateGoalProgress(goalId: string) {
  const steps = await prisma.step.findMany({ where: { goalId, parentStepId: null } });
  if (steps.length === 0) return;

  const completed = steps.filter((s: any) => s.isCompleted).length;
  const progress = Math.round((completed / steps.length) * 100);

  await prisma.goal.update({
    where: { id: goalId },
    data: { progress },
  });
}

export async function createStep(goalId: string, title: string) {
  await verifyGoalOwnership(goalId);

  const lastStep = await prisma.step.findFirst({
    where: { goalId, parentStepId: null },
    orderBy: { order: "desc" },
  });
  const order = lastStep ? lastStep.order + 1 : 0;

  const step = await prisma.step.create({
    data: { goalId, title, order },
  });

  await updateGoalProgress(goalId);
  revalidatePath("/");
  return step;
}

export async function createSubStep(parentStepId: string, title: string) {
  const parentStep = await prisma.step.findUnique({ where: { id: parentStepId } });
  if (!parentStep) throw new Error("Parent step not found");

  await verifyGoalOwnership(parentStep.goalId);

  const lastSubStep = await prisma.step.findFirst({
    where: { parentStepId },
    orderBy: { order: "desc" },
  });
  const order = lastSubStep ? lastSubStep.order + 1 : 0;

  const step = await prisma.step.create({
    data: { goalId: parentStep.goalId, parentStepId, title, order },
  });

  revalidatePath("/");
  return step;
}

export async function toggleStepCompletion(stepId: string, isCompleted: boolean) {
  const step = await prisma.step.findUnique({ where: { id: stepId } });
  if (!step) throw new Error("Step not found");

  await verifyGoalOwnership(step.goalId);

  const updated = await prisma.step.update({
    where: { id: stepId },
    data: { isCompleted },
  });

  await updateGoalProgress(step.goalId);
  revalidatePath("/");
  return updated;
}

export async function deleteStep(stepId: string) {
  const step = await prisma.step.findUnique({ where: { id: stepId } });
  if (!step) throw new Error("Step not found");

  await verifyGoalOwnership(step.goalId);

  await prisma.step.delete({ where: { id: stepId } });

  await updateGoalProgress(step.goalId);
  revalidatePath("/");
}

export async function unlinkSubStep(stepId: string) {
  const step = await prisma.step.findUnique({ where: { id: stepId } });
  if (!step || !step.parentStepId) throw new Error("Step not found or not a sub-step");

  await verifyGoalOwnership(step.goalId);

  await prisma.step.update({
    where: { id: stepId },
    data: { parentStepId: null },
  });

  revalidatePath("/");
}
