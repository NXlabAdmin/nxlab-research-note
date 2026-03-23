import styles from "./page.module.css";
import { LoginButton } from "@/components/LoginButton";
import { AddGoalForm } from "@/components/AddGoalForm";
import { MindMapCanvas } from "@/components/canvas/MindMapCanvas";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getGoals } from "@/actions/goal.actions";
import { getResources } from "@/actions/resource.actions";
import { getSchedules } from "@/actions/schedule.actions";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const session = await getServerSession(authOptions);
  let goals: any[] = [];
  let resources: any[] = [];
  let schedules: any[] = [];
  let steps: any[] = [];
  let goalConnections: any[] = [];
  let stepConnections: any[] = [];

  if (session?.user) {
    const userId = (session.user as any).id;
    try {
      goals = await getGoals();
      resources = await getResources();
      schedules = await getSchedules();
      steps = await prisma.step.findMany({ where: { goal: { userId } } });
      goalConnections = await (prisma as any).goalConnection.findMany({ where: { source: { userId } } });
      stepConnections = await (prisma as any).stepConnection.findMany({ where: { step: { goal: { userId } } } });
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="page-wrapper">
      <header className={styles.header}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>Noodle</h1>
          <LoginButton />
        </div>
      </header>

      <main style={{ width: '100%', height: 'calc(100vh - 64px)', position: 'relative' }}>
        <MindMapCanvas
          goals={goals}
          resources={resources}
          schedules={schedules}
          steps={steps}
          goalConnections={goalConnections}
          stepConnections={stepConnections}
        />
        {session?.user && <AddGoalForm />}
      </main>
    </div>
  );
}
