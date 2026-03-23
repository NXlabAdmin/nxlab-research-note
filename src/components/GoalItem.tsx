"use client";

import { useState } from "react";
import { updateGoalTitle, deleteGoal } from "@/actions/goal.actions";
import { createStep, toggleStepCompletion, deleteStep } from "@/actions/step.actions";
import styles from "./GoalItem.module.css";

export function GoalItem({ initialGoal, onDeleted }: { initialGoal: any, onDeleted: () => void }) {
  const [goal, setGoal] = useState(initialGoal);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(goal.title);
  const [newStepTitle, setNewStepTitle] = useState("");
  const [isPending, setIsPending] = useState(false);

  const handleUpdateTitle = async () => {
    if (!editTitle.trim() || editTitle === goal.title) {
      setIsEditing(false);
      return;
    }
    setIsPending(true);
    try {
      const updated = await updateGoalTitle(goal.id, editTitle);
      setGoal({ ...goal, title: updated.title });
      setIsEditing(false);
    } catch (e) {
      console.error(e);
      alert("제목 수정 중 오류가 발생했습니다.");
    } finally {
      setIsPending(false);
    }
  };

  const handleDeleteGoal = async () => {
    if (!confirm("정말 이 목표를 삭제하시겠습니까? 관련 스텝과 자료도 모두 삭제됩니다.")) return;
    setIsPending(true);
    try {
      await deleteGoal(goal.id);
      onDeleted();
    } catch (e) {
      console.error(e);
      alert("삭제 중 오류가 발생했습니다.");
      setIsPending(false);
    }
  };

  const handleAddStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStepTitle.trim()) return;
    setIsPending(true);
    try {
      const step = await createStep(goal.id, newStepTitle);
      const newSteps = [...goal.steps, step];
      const completed = newSteps.filter(s => s.isCompleted).length;
      const progress = Math.round((completed / newSteps.length) * 100);
      setGoal({ ...goal, steps: newSteps, progress });
      setNewStepTitle("");
    } catch (e) {
      console.error(e);
      alert("스텝 추가 중 오류가 발생했습니다.");
    } finally {
      setIsPending(false);
    }
  };

  const handleToggleStep = async (stepId: string, isCompleted: boolean) => {
    setIsPending(true);
    try {
      const updatedStep = await toggleStepCompletion(stepId, isCompleted);
      const newSteps = goal.steps.map((s: any) => s.id === stepId ? updatedStep : s);
      const completedCount = newSteps.filter((s: any) => s.isCompleted).length;
      const progress = Math.round((completedCount / newSteps.length) * 100);
      setGoal({ ...goal, steps: newSteps, progress });
    } catch (e) {
      console.error(e);
      alert("업데이트 중 오류가 발생했습니다.");
    } finally {
      setIsPending(false);
    }
  };

  const handleDeleteStep = async (stepId: string) => {
    if (!confirm("스텝을 삭제하시겠습니까?")) return;
    setIsPending(true);
    try {
      await deleteStep(stepId);
      const newSteps = goal.steps.filter((s: any) => s.id !== stepId);
      const completedCount = newSteps.filter((s: any) => s.isCompleted).length;
      const progress = newSteps.length > 0 ? Math.round((completedCount / newSteps.length) * 100) : 0;
      setGoal({ ...goal, steps: newSteps, progress });
    } catch (e) {
      console.error(e);
      alert("삭제 중 오류가 발생했습니다.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        {isEditing ? (
          <input
            autoFocus
            className={styles.editInput}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleUpdateTitle}
            onKeyDown={(e) => e.key === "Enter" && handleUpdateTitle()}
            disabled={isPending}
          />
        ) : (
          <h3 onClick={() => setIsEditing(true)} title="클릭하여 수정">{goal.title}</h3>
        )}
        <button onClick={handleDeleteGoal} className={styles.deleteBtn} disabled={isPending}>
          삭제
        </button>
      </div>

      <div className={styles.progressSection}>
        <div className={styles.progressHeader}>
          <span>진척도</span>
          <span>{goal.progress}%</span>
        </div>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${goal.progress}%` }}></div>
        </div>
      </div>

      <div className={styles.stepsSection}>
        <form onSubmit={handleAddStep} className={styles.stepForm}>
          <input
            type="text"
            className={styles.stepInput}
            placeholder="새로운 세부 실행 계획(스텝) 추가..."
            value={newStepTitle}
            onChange={(e) => setNewStepTitle(e.target.value)}
            disabled={isPending}
          />
          <button type="submit" className={styles.addStepBtn} disabled={isPending || !newStepTitle.trim()}>
            + 스텝 추가
          </button>
        </form>

        <ul className={styles.stepList}>
          {goal.steps.map((step: any) => (
            <li key={step.id} className={`${styles.stepItem} ${step.isCompleted ? styles.completed : ""}`}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={step.isCompleted}
                  onChange={(e) => handleToggleStep(step.id, e.target.checked)}
                  disabled={isPending}
                />
                <span className={styles.stepTitle}>{step.title}</span>
              </label>
              <button 
                className={styles.deleteStepBtn} 
                onClick={() => handleDeleteStep(step.id)}
                disabled={isPending}
              >
                ✕
              </button>
            </li>
          ))}
          {goal.steps.length === 0 && (
            <li className={styles.emptyStep}>추가된 스텝이 없습니다.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
