'use client';

import React, { useState } from 'react';

export function AddGoalForm() {
  const [open, setOpen] = useState(false);
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
      setOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* 플로팅 + 버튼 */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          bottom: 88,
          left: 24,
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: '#3b82f6',
          color: '#fff',
          fontSize: '1.6rem',
          lineHeight: 1,
          border: 'none',
          cursor: 'pointer',
          zIndex: 20,
          boxShadow: '0 4px 16px rgba(59,130,246,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
        }}
        title="새 연구 목표 추가"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14m-7-7h14" />
        </svg>
      </button>

      {/* 모달 오버레이 */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 20px',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 16,
              padding: '28px 24px',
              width: '100%',
              maxWidth: 400,
              boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
            }}
          >
            <h2 style={{ color: '#f8fafc', marginBottom: 20, fontSize: '1.2rem' }}>
              새 연구 목표 추가
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                autoFocus
                placeholder="목표를 입력하세요..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                style={{
                  background: '#0f172a',
                  border: '1px solid #475569',
                  borderRadius: 8,
                  color: '#fff',
                  outline: 'none',
                  padding: '12px 14px',
                  fontSize: '1rem',
                  width: '100%',
                }}
              />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 8,
                    background: 'transparent',
                    color: '#94a3b8',
                    border: '1px solid #334155',
                    fontSize: '0.95rem',
                  }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={!title.trim() || isSubmitting}
                  style={{
                    padding: '10px 20px',
                    borderRadius: 8,
                    background: '#3b82f6',
                    color: '#fff',
                    border: 'none',
                    fontWeight: 'bold',
                    fontSize: '0.95rem',
                    opacity: !title.trim() || isSubmitting ? 0.5 : 1,
                  }}
                >
                  추가
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
