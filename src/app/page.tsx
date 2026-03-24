import { LoginButton } from "@/components/LoginButton";
import { AddGoalForm } from "@/components/AddGoalForm";
import { ARSceneWrapper } from "@/components/ar/ARSceneWrapper";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getGoals } from "@/actions/goal.actions";
import styles from "./page.module.css";

export default async function Home() {
  const session = await getServerSession(authOptions);
  let goals: any[] = [];

  if (session?.user) {
    try {
      goals = await getGoals();
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="page-wrapper">
      <header className={styles.header}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>Noodle AR</h1>
          <LoginButton />
        </div>
      </header>

      <main style={{ width: '100%', height: 'calc(100vh - 64px)', position: 'relative' }}>
        {session?.user ? (
          <>
            <ARSceneWrapper goals={goals} />
            <AddGoalForm />
          </>
        ) : (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', height: '100%', gap: 16, color: '#94a3b8',
          }}>
            <div style={{ fontSize: 48, color: '#a78bfa' }}>◈</div>
            <p style={{ fontSize: 16 }}>로그인하고 AR 마인드맵을 시작하세요</p>
          </div>
        )}
      </main>
    </div>
  );
}
