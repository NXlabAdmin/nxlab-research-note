"use server";

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

async function getUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user || !(session.user as any).id) throw new Error("Unauthorized");
  return (session.user as any).id as string;
}

// ──────────────────────────────────────────────
// JSON Import
// Supports two formats:
//  1. Simplified (AI-generated):
//     { goals: [{ title, color?, steps: [{ title, subSteps: [{title}|string], resources: [{title,url?,memo?}] }], resources: [...] }],
//       schedules: [{title, date, description?}], resources: [{title,url?,memo?}] }
//  2. Full export format (flat arrays with id fields)
// ──────────────────────────────────────────────
export async function importFromJson(jsonString: string) {
  const userId = await getUserId();
  let data: any;
  try {
    data = JSON.parse(jsonString);
  } catch {
    throw new Error("유효하지 않은 JSON 형식입니다.");
  }

  const isExportFormat = Array.isArray(data.steps);

  if (isExportFormat) {
    await importExportFormat(userId, data);
  } else {
    await importSimplifiedFormat(userId, data);
  }

  revalidatePath("/");
}

async function importSimplifiedFormat(userId: string, data: any) {
  for (const goalData of (data.goals ?? [])) {
    const goal = await prisma.goal.create({
      data: { userId, title: goalData.title, color: goalData.color ?? null },
    });

    let stepOrder = 0;
    for (const stepData of (goalData.steps ?? [])) {
      const step = await prisma.step.create({
        data: { goalId: goal.id, title: stepData.title, order: stepOrder++ },
      });

      let subOrder = 0;
      for (const sub of (stepData.subSteps ?? [])) {
        const title = typeof sub === 'string' ? sub : sub.title;
        await prisma.step.create({
          data: { goalId: goal.id, parentStepId: step.id, title, order: subOrder++ },
        });
      }

      for (const res of (stepData.resources ?? [])) {
        await prisma.resource.create({
          data: { userId, goalId: goal.id, stepId: step.id, title: res.title, url: res.url ?? null, memo: res.memo ?? null },
        });
      }
    }

    for (const res of (goalData.resources ?? [])) {
      await prisma.resource.create({
        data: { userId, goalId: goal.id, title: res.title, url: res.url ?? null, memo: res.memo ?? null },
      });
    }
  }

  for (const res of (data.resources ?? [])) {
    await prisma.resource.create({
      data: { userId, title: res.title, url: res.url ?? null, memo: res.memo ?? null },
    });
  }

  for (const sch of (data.schedules ?? [])) {
    if (!sch.title || !sch.date) continue;
    await prisma.schedule.create({
      data: { userId, title: sch.title, date: new Date(sch.date), description: sch.description ?? null },
    });
  }
}

async function importExportFormat(userId: string, data: any) {
  // Map old IDs → new IDs
  const goalIdMap = new Map<string, string>();
  const stepIdMap = new Map<string, string>();

  for (const g of (data.goals ?? [])) {
    const goal = await prisma.goal.create({
      data: { userId, title: g.title, color: g.color ?? null, progress: g.progress ?? 0 },
    });
    goalIdMap.set(g.id, goal.id);
  }

  // Top-level steps first
  const topSteps = (data.steps ?? []).filter((s: any) => !s.parentStepId);
  const subSteps = (data.steps ?? []).filter((s: any) => s.parentStepId);

  for (const s of topSteps) {
    const newGoalId = goalIdMap.get(s.goalId);
    if (!newGoalId) continue;
    const step = await prisma.step.create({
      data: { goalId: newGoalId, title: s.title, order: s.order ?? 0, isCompleted: s.isCompleted ?? false },
    });
    stepIdMap.set(s.id, step.id);
  }

  for (const s of subSteps) {
    const newGoalId = goalIdMap.get(s.goalId);
    const newParentId = stepIdMap.get(s.parentStepId);
    if (!newGoalId) continue;
    const step = await prisma.step.create({
      data: { goalId: newGoalId, parentStepId: newParentId ?? null, title: s.title, order: s.order ?? 0, isCompleted: s.isCompleted ?? false },
    });
    stepIdMap.set(s.id, step.id);
  }

  for (const r of (data.resources ?? [])) {
    await prisma.resource.create({
      data: {
        userId,
        title: r.title,
        url: r.url ?? null,
        memo: r.memo ?? null,
        goalId: r.goalId ? (goalIdMap.get(r.goalId) ?? null) : null,
        stepId: r.stepId ? (stepIdMap.get(r.stepId) ?? null) : null,
      },
    });
  }

  for (const sch of (data.schedules ?? [])) {
    if (!sch.title || !sch.date) continue;
    await prisma.schedule.create({
      data: { userId, title: sch.title, date: new Date(sch.date), description: sch.description ?? null },
    });
  }
}

// ──────────────────────────────────────────────
// MD Import — parses the Noodle export format
// ──────────────────────────────────────────────
export async function importFromMarkdown(mdString: string) {
  const userId = await getUserId();
  const lines = mdString.split('\n');

  let currentGoalId: string | null = null;
  let currentStepId: string | null = null;
  let stepOrder = 0;
  let subOrder = 0;

  for (const raw of lines) {
    const line = raw.trimEnd();

    // ### Goal line: ### 🎯 Title (30%) or ### ✅ Title (100%)
    const goalMatch = line.match(/^###\s+(?:🎯|✅)\s+(.+?)\s*(?:\(\d+%\))?$/);
    if (goalMatch) {
      const goal = await prisma.goal.create({ data: { userId, title: goalMatch[1].trim() } });
      currentGoalId = goal.id;
      currentStepId = null;
      stepOrder = 0;
      continue;
    }

    if (!currentGoalId) continue;

    // - ○/☑ **Step Title**
    const stepMatch = line.match(/^-\s+(?:☑|○)\s+\*\*(.+?)\*\*$/);
    if (stepMatch) {
      const step = await prisma.step.create({
        data: { goalId: currentGoalId, title: stepMatch[1].trim(), order: stepOrder++, isCompleted: line.includes('☑') },
      });
      currentStepId = step.id;
      subOrder = 0;
      continue;
    }

    // 2-space sub-step: "  - ☑/○ Title"
    const subMatch = line.match(/^\s{2}-\s+(?:☑|○)\s+(?!\*\*)(.+)$/);
    if (subMatch && currentStepId) {
      await prisma.step.create({
        data: { goalId: currentGoalId, parentStepId: currentStepId, title: subMatch[1].trim(), order: subOrder++, isCompleted: line.includes('☑') },
      });
      continue;
    }

    // Resource under step: "  - 📎 Title — url"
    const stepResMatch = line.match(/^\s{2}-\s+📎\s+(.+?)(?:\s+—\s+(\S+))?(?:\s+_\((.+)\)_)?$/);
    if (stepResMatch && currentStepId) {
      await prisma.resource.create({
        data: { userId, goalId: currentGoalId, stepId: currentStepId, title: stepResMatch[1].trim(), url: stepResMatch[2] ?? null, memo: stepResMatch[3] ?? null },
      });
      continue;
    }

    // Resource under goal: "- 📎 Title — url"
    const goalResMatch = line.match(/^-\s+📎\s+(.+?)(?:\s+—\s+(\S+))?(?:\s+_\((.+)\)_)?$/);
    if (goalResMatch) {
      await prisma.resource.create({
        data: { userId, goalId: currentGoalId, title: goalResMatch[1].trim(), url: goalResMatch[2] ?? null, memo: goalResMatch[3] ?? null },
      });
    }
  }

  revalidatePath("/");
}
