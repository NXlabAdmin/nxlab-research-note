"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { createResource, deleteResource } from "@/actions/resource.actions";
import styles from "./ResourceOrganizer.module.css";

export function ResourceOrganizer({ initialResources, goals }: { initialResources: any[], goals: any[] }) {
  const { data: session } = useSession();
  const [resources, setResources] = useState(initialResources);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [memo, setMemo] = useState("");
  const [goalId, setGoalId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!session) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const resource = await createResource({ 
        title, 
        url: url.trim() || undefined, 
        memo: memo.trim() || undefined, 
        goalId: goalId || undefined 
      });
      setResources([resource, ...resources]);
      setTitle("");
      setUrl("");
      setMemo("");
      setGoalId("");
    } catch (error) {
      console.error(error);
      alert("자료 추가 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 이 자료를 삭제하시겠습니까?")) return;
    try {
      await deleteResource(id);
      setResources(resources.filter(r => r.id !== id));
    } catch (e) {
      console.error(e);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className={styles.container}>
      <h2>외부 자료 정리</h2>
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          required
          className={styles.input}
          placeholder="자료 제목 (예: 관련 논문, 참고 사이트)"
          value={title}
          onChange={e => setTitle(e.target.value)}
          disabled={isSubmitting}
        />
        <input
          type="url"
          className={styles.input}
          placeholder="URL 링크 (선택)"
          value={url}
          onChange={e => setUrl(e.target.value)}
          disabled={isSubmitting}
        />
        <textarea
          className={styles.textarea}
          placeholder="메모 (선택)"
          value={memo}
          onChange={e => setMemo(e.target.value)}
          disabled={isSubmitting}
          rows={2}
        />
        <select
          className={styles.select}
          value={goalId}
          onChange={e => setGoalId(e.target.value)}
          disabled={isSubmitting}
        >
          <option value="">-- 관련 목표 선택 (선택) --</option>
          {goals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
        </select>
        <button type="submit" disabled={isSubmitting || !title.trim()} className={styles.submitBtn}>
          자료 저장
        </button>
      </form>

      <div className={styles.list}>
        {resources.length === 0 ? (
          <p className={styles.empty}>저장된 외부 자료가 없습니다.</p>
        ) : (
          resources.map(resource => (
            <div key={resource.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <h4>{resource.title}</h4>
                <button onClick={() => handleDelete(resource.id)} className={styles.deleteBtn}>✕</button>
              </div>
              
              {resource.goal && (
                <span className={styles.tag}>[목표: {resource.goal.title}]</span>
              )}

              {resource.url && (
                <a href={resource.url} target="_blank" rel="noopener noreferrer" className={styles.link}>
                  🔗 {resource.url}
                </a>
              )}

              {resource.memo && (
                <p className={styles.memo}>{resource.memo}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
