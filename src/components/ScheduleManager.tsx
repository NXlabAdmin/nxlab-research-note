"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { createSchedule, deleteSchedule } from "@/actions/schedule.actions";
import styles from "./ScheduleManager.module.css";

function calculateDDay(dateStr: string | Date) {
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "D-Day";
  if (diffDays > 0) return `D-${diffDays}`;
  return `D+${Math.abs(diffDays)}`;
}

export function ScheduleManager({ initialSchedules }: { initialSchedules: any[] }) {
  const { data: session } = useSession();
  const [schedules, setSchedules] = useState(initialSchedules);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!session) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const schedule = await createSchedule({ 
        title, 
        date: new Date(date), 
        description: description.trim() || undefined 
      });
      const newSchedules = [...schedules, schedule].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      setSchedules(newSchedules);
      setTitle("");
      setDate("");
      setDescription("");
    } catch (error) {
      console.error(error);
      alert("일정 추가 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("일정을 삭제하시겠습니까?")) return;
    try {
      await deleteSchedule(id);
      setSchedules(schedules.filter(s => s.id !== id));
    } catch (e) {
      console.error(e);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className={styles.container}>
      <h2>학회 일정 및 데드라인</h2>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <input
            required
            type="text"
            className={styles.input}
            placeholder="학회명 또는 제출 기한 (예: CVPR 2027 본논문 제출)"
            value={title}
            onChange={e => setTitle(e.target.value)}
            disabled={isSubmitting}
          />
          <input
            required
            type="date"
            className={styles.dateInput}
            value={date}
            onChange={e => setDate(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        <textarea
          className={styles.textarea}
          placeholder="상세 설명 (선택)"
          value={description}
          onChange={e => setDescription(e.target.value)}
          disabled={isSubmitting}
          rows={2}
        />
        <button type="submit" disabled={isSubmitting || !title.trim() || !date} className={styles.submitBtn}>
          일정 추가
        </button>
      </form>

      <div className={styles.list}>
        {schedules.length === 0 ? (
          <p className={styles.empty}>등록된 일정이 없습니다.</p>
        ) : (
          schedules.map(schedule => {
            const dDayStr = calculateDDay(schedule.date);
            const isPast = dDayStr.startsWith("D+");
            const isToday = dDayStr === "D-Day";
            const dateStr = new Date(schedule.date).toLocaleDateString();

            return (
              <div key={schedule.id} className={`${styles.card} ${isPast ? styles.past : ""}`}>
                <div className={styles.cardInfo}>
                  <div className={styles.cardHeader}>
                    <span className={`${styles.dday} ${isToday ? styles.today : ""} ${isPast ? styles.pastDday : ""}`}>
                      {dDayStr}
                    </span>
                    <h4>{schedule.title}</h4>
                  </div>
                  <span className={styles.dateText}>{dateStr}</span>
                  {schedule.description && (
                     <p className={styles.description}>{schedule.description}</p>
                  )}
                </div>
                <button onClick={() => handleDelete(schedule.id)} className={styles.deleteBtn}>✕</button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
