'use client';

import React, { useState, useEffect } from 'react';

interface SidePanelProps {
  selectedNode: any;
  onClose: () => void;
  onHubRename?: (name: string) => void;
}

const btnStyle = (bg: string): React.CSSProperties => ({
  flex: 1, padding: '8px', background: bg, color: '#fff',
  border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '13px'
});

export function SidePanel({ selectedNode, onClose, onHubRename }: SidePanelProps) {
  const [hubInput, setHubInput] = useState('');
  const [dueInput, setDueInput] = useState('');

  useEffect(() => {
    if (selectedNode?.id === 'hub-main') {
      setHubInput(selectedNode.data.label ?? 'NXLab');
    }
    const raw = selectedNode?.data?.rawData;
    if (raw) {
      setDueInput(raw.dueDate ? new Date(raw.dueDate).toISOString().slice(0, 10) : '');
    }
  }, [selectedNode]);

  if (!selectedNode) return null;

  const { data, type } = selectedNode;
  const raw = data.rawData;
  const isHub = selectedNode.id === 'hub-main';
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#a78bfa', '#0f172a'];

  return (
    <div style={{
      position: 'absolute',
      right: 20,
      top: 20,
      width: 320,
      maxHeight: 'calc(100vh - 40px)',
      overflowY: 'auto',
      backgroundColor: 'rgba(30, 41, 59, 0.95)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      padding: '24px',
      color: '#fff',
      zIndex: 10,
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, textTransform: 'capitalize', color: '#94a3b8' }}>{type.replace('Node', '')} Details</h3>
        <button onClick={onClose} style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
      </div>

      <h2 style={{ fontSize: '1.5rem', marginBottom: 8, borderBottom: '1px solid #334155', paddingBottom: 12 }}>{data.label}</h2>

      {isHub && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ color: '#94a3b8', fontSize: '12px' }}>허브 이름</label>
          <input
            value={hubInput}
            onChange={e => setHubInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { onHubRename?.(hubInput); onClose(); }
            }}
            style={{
              background: '#0f172a',
              border: '1px solid #334155',
              borderRadius: 6,
              padding: '8px 10px',
              color: '#f8fafc',
              fontSize: '0.95rem',
              outline: 'none',
            }}
          />
          <button
            onClick={() => { onHubRename?.(hubInput); onClose(); }}
            style={{
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '8px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            저장
          </button>
        </div>
      )}

      {raw?.id && <div style={{ marginBottom: 16, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {COLORS.map(c => (
          <button
            key={c}
            title={c}
            onClick={async () => {
              const { updateNodeColor } = await import('@/actions/node.actions');
              await updateNodeColor(type, raw.id, c);
            }}
            style={{
              width: 20, height: 20, borderRadius: '50%', backgroundColor: c,
              border: `2px solid ${raw.color === c ? '#fff' : 'transparent'}`,
              cursor: 'pointer', outline: 'none'
            }}
          />
        ))}
      </div>}

      {raw?.id && <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {type === 'goalNode' && (
          <>
            <div><strong>Progress:</strong> {data.progress}%</div>
            <div><strong>Created:</strong> {new Date(raw.createdAt).toLocaleDateString()}</div>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: 4 }}>목표 완료일</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="date"
                  value={dueInput}
                  onChange={e => setDueInput(e.target.value)}
                  style={{
                    flex: 1, background: '#0f172a', border: '1px solid #334155',
                    borderRadius: 6, padding: '6px 8px', color: '#f8fafc',
                    fontSize: '0.875rem', outline: 'none',
                  }}
                />
                <button
                  onClick={async () => {
                    const { updateGoalDueDate } = await import('@/actions/goal.actions');
                    await updateGoalDueDate(raw.id, dueInput || null);
                  }}
                  style={btnStyle('#3b82f6')}
                >저장</button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button onClick={async () => {
                const title = prompt('새로운 스텝 이름을 입력하세요:');
                if (title) {
                  const { createStep } = await import('@/actions/step.actions');
                  await createStep(raw.id, title);
                }
              }} style={btnStyle('#3b82f6')}>+ Step</button>

              <button onClick={async () => {
                const title = prompt('새로운 리소스 이름을 입력하세요:');
                if (title) {
                  const url = prompt('URL이 있다면 입력하세요 (선택):');
                  const { createResource } = await import('@/actions/resource.actions');
                  await createResource({ goalId: raw.id, title, url: url || undefined });
                }
              }} style={btnStyle('#10b981')}>+ Resource</button>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={async () => {
                const { completeGoal } = await import('@/actions/goal.actions');
                await completeGoal(raw.id);
                onClose();
              }} style={btnStyle('#eab308')}>Complete Goal</button>

              <button onClick={async () => {
                if (confirm('정말로 이 목표를 삭제하시겠습니까? 관련 데이터가 모두 삭제됩니다.')) {
                  const { deleteGoal } = await import('@/actions/goal.actions');
                  await deleteGoal(raw.id);
                  onClose();
                }
              }} style={btnStyle('#ef4444')}>Delete Goal</button>
            </div>
          </>
        )}

        {type === 'stepNode' && (
          <>
            <div><strong>Status:</strong> {raw.isCompleted ? '✅ Completed' : '⏳ Pending'}</div>
            <div><strong>Created:</strong> {new Date(raw.createdAt).toLocaleDateString()}</div>
            {raw.parentStepId && <div style={{ color: '#94a3b8', fontSize: '12px' }}>서브스텝</div>}
            <div>
              <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: 4 }}>스텝 완료일</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="date"
                  value={dueInput}
                  onChange={e => setDueInput(e.target.value)}
                  style={{
                    flex: 1, background: '#0f172a', border: '1px solid #334155',
                    borderRadius: 6, padding: '6px 8px', color: '#f8fafc',
                    fontSize: '0.875rem', outline: 'none',
                  }}
                />
                <button
                  onClick={async () => {
                    const { updateStepDueDate } = await import('@/actions/step.actions');
                    await updateStepDueDate(raw.id, dueInput || null);
                  }}
                  style={btnStyle('#3b82f6')}
                >저장</button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button onClick={async () => {
                const title = prompt('새로운 서브 스텝 이름을 입력하세요:');
                if (title) {
                  const { createSubStep } = await import('@/actions/step.actions');
                  await createSubStep(raw.id, title);
                }
              }} style={btnStyle('#3b82f6')}>+ Next Step</button>

              <button onClick={async () => {
                const title = prompt('새로운 리소스 이름을 입력하세요:');
                if (title) {
                  const url = prompt('URL이 있다면 입력하세요 (선택):');
                  const { createResource } = await import('@/actions/resource.actions');
                  await createResource({ stepId: raw.id, title, url: url || undefined });
                }
              }} style={btnStyle('#10b981')}>+ Resource</button>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={async () => {
                const { toggleStepCompletion } = await import('@/actions/step.actions');
                await toggleStepCompletion(raw.id, !raw.isCompleted);
                onClose();
              }} style={btnStyle(raw.isCompleted ? '#f59e0b' : '#eab308')}>
                {raw.isCompleted ? 'Mark Pending' : 'Complete'}
              </button>

              <button onClick={async () => {
                if (confirm('이 스텝을 삭제하시겠습니까?')) {
                  const { deleteStep } = await import('@/actions/step.actions');
                  await deleteStep(raw.id);
                  onClose();
                }
              }} style={btnStyle('#ef4444')}>Delete</button>
            </div>
          </>
        )}

        {type === 'resourceNode' && (
          <>
            {raw.url && <div><strong>URL:</strong> <a href={raw.url} target="_blank" rel="noreferrer" style={{ color: '#60a5fa' }}>{raw.url}</a></div>}
            {raw.memo && <div><strong>Memo:</strong> <p style={{ background: '#0f172a', padding: 8, borderRadius: 4, marginTop: 4 }}>{raw.memo}</p></div>}
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <button onClick={async () => {
                if (confirm('이 리소스를 삭제하시겠습니까?')) {
                  const { deleteResource } = await import('@/actions/resource.actions');
                  await deleteResource(raw.id);
                  onClose();
                }
              }} style={btnStyle('#ef4444')}>Delete</button>
            </div>
          </>
        )}

        {type === 'scheduleNode' && (
          <>
            <div><strong>Date:</strong> {new Date(raw.date).toLocaleDateString()}</div>
            {raw.description && <div><strong>Desc:</strong> <p style={{ background: '#0f172a', padding: 8, borderRadius: 4, marginTop: 4 }}>{raw.description}</p></div>}
          </>
        )}
      </div>}
    </div>
  );
}
