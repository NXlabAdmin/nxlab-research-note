'use client';

import React, { useState } from 'react';

export function AddGoalForm() {
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const { createGoal } = await import('@/actions/goal.actions');
      await createGoal(title);
      setTitle('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <input
        placeholder="새 연구 목표 입력..."
        value={title}
        onChange={e => setTitle(e.target.value)}
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid #475569',
          borderRadius: 6,
          color: '#fff',
          outline: 'none',
          padding: '6px 12px',
          fontSize: '0.9rem',
          width: 220,
        }}
      />
      <button
        disabled={!title.trim() || isSubmitting}
        type="submit"
        style={{
          background: '#3b82f6',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          padding: '6px 14px',
          cursor: 'pointer',
          fontWeight: 'bold',
          fontSize: '0.9rem',
          opacity: !title.trim() || isSubmitting ? 0.5 : 1,
        }}
      >
        추가
      </button>
    </form>
  );
}
