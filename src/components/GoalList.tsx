"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { createGoal } from "@/actions/goal.actions";
import { GoalItem } from "./GoalItem";
import styles from "./GoalList.module.css";

export function GoalList({ initialGoals }: { initialGoals: any[] }) {
  const { data: session } = useSession();
  const [goals, setGoals] = useState(initialGoals);
  const [newGoalTitle, setNewGoalTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!session) {
    return <p className={styles.loginPrompt}>로그인하여 연구 목표를 설정하세요.</p>;
  }

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const goal = await createGoal(newGoalTitle);
      setGoals([{ ...goal, steps: [] }, ...goals]);
      setNewGoalTitle("");
    } catch (error) {
      console.error(error);
      alert("목표 생성 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoalDeleted = (id: string) => {
    setGoals(goals.filter(g => g.id !== id));
  };

  return (
    <div className={styles.goalContainer}>
      <div className={styles.header}>
        <h2>나의 연구 목표</h2>
      </div>

      <form onSubmit={handleCreateGoal} className={styles.addForm}>
        <input
          type="text"
          value={newGoalTitle}
          onChange={(e) => setNewGoalTitle(e.target.value)}
          placeholder="새로운 연구 목표를 입력하세요 (예: AAA 학회 논문 제출)"
          disabled={isSubmitting}
          className={styles.input}
        />
        <button type="submit" disabled={isSubmitting || !newGoalTitle.trim()} className={styles.addBtn}>
          목표 추가
        </button>
      </form>

      <div className={styles.list}>
        {goals.length === 0 ? (
          <p className={styles.empty}>등록된 목표가 없습니다. 첫 목표를 세워보세요!</p>
        ) : (
          goals.map(goal => (
            <GoalItem
              key={goal.id}
              initialGoal={goal}
              onDeleted={() => handleGoalDeleted(goal.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
