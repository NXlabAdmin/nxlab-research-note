"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useState, useRef, useEffect } from "react";
import { exportAllData } from "@/actions/export.actions";

function buildMarkdown(data: Awaited<ReturnType<typeof exportAllData>>): string {
  const { goals, steps, resources, schedules, goalConnections, stepConnections, nodeConnections } = data;
  const lines: string[] = [];
  const date = new Date().toISOString().slice(0, 10);

  lines.push(`# NXLab Research Map`);
  lines.push(`> Exported: ${date}\n`);

  if (goals.length > 0) {
    lines.push(`## Goals\n`);
    for (const goal of goals) {
      lines.push(`### ${goal.progress === 100 ? '✅' : '🎯'} ${goal.title} (${goal.progress}%)`);
      const goalSteps = steps.filter((s: any) => s.goalId === goal.id && !s.parentStepId);
      for (const step of goalSteps) {
        lines.push(`- ${step.isCompleted ? '☑' : '○'} **${step.title}**`);
        const subSteps = steps.filter((s: any) => s.parentStepId === step.id);
        for (const sub of subSteps) {
          lines.push(`  - ${sub.isCompleted ? '☑' : '○'} ${sub.title}`);
        }
        const stepRes = resources.filter((r: any) => r.stepId === step.id);
        for (const r of stepRes) {
          lines.push(`  - 📎 ${r.title}${r.url ? ` — ${r.url}` : ''}${r.memo ? ` _(${r.memo})_` : ''}`);
        }
      }
      const goalRes = resources.filter((r: any) => r.goalId === goal.id && !r.stepId);
      for (const r of goalRes) {
        lines.push(`- 📎 ${r.title}${r.url ? ` — ${r.url}` : ''}${r.memo ? ` _(${r.memo})_` : ''}`);
      }
      lines.push('');
    }
  }

  const freeRes = resources.filter((r: any) => !r.goalId && !r.stepId);
  if (freeRes.length > 0) {
    lines.push(`## 미연결 리소스\n`);
    for (const r of freeRes) {
      lines.push(`- 📎 ${r.title}${r.url ? ` — ${r.url}` : ''}${r.memo ? ` _(${r.memo})_` : ''}`);
    }
    lines.push('');
  }

  if (schedules.length > 0) {
    lines.push(`## 일정\n`);
    for (const s of schedules) {
      const d = new Date(s.date).toLocaleDateString('ko-KR');
      lines.push(`- **${d}** ${s.title}${s.description ? ` — ${s.description}` : ''}`);
    }
    lines.push('');
  }

  const allConns: string[] = [];
  for (const c of goalConnections) {
    allConns.push(`- Goal "${(c as any).source.title}" ↔ Goal "${(c as any).target.title}"`);
  }
  for (const c of stepConnections) {
    allConns.push(`- Step "${(c as any).step.title}" → Goal "${(c as any).goal.title}"`);
  }
  for (const c of nodeConnections) {
    allConns.push(`- ${(c as any).sourceNodeType} [${(c as any).sourceNodeId}] ↔ ${(c as any).targetNodeType} [${(c as any).targetNodeId}]`);
  }
  if (allConns.length > 0) {
    lines.push(`## 연결 관계\n`);
    lines.push(...allConns);
  }

  return lines.join('\n');
}

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function LoginButton() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const [exporting, setExporting] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  if (status === "loading") return null;

  if (!session) {
    return (
      <button
        onClick={() => signIn("google")}
        style={{
          padding: '8px 16px',
          borderRadius: 8,
          background: '#3b82f6',
          color: '#fff',
          fontWeight: 600,
          fontSize: '0.9rem',
          border: 'none',
        }}
      >
        Google로 로그인
      </button>
    );
  }

  const handleExport = async (format: 'md' | 'json') => {
    setExporting(true);
    setOpen(false);
    try {
      const data = await exportAllData();
      const date = new Date().toISOString().slice(0, 10);
      if (format === 'md') {
        downloadFile(buildMarkdown(data), `nxlab-research-${date}.md`, 'text/markdown');
      } else {
        downloadFile(JSON.stringify(data, null, 2), `nxlab-research-${date}.json`, 'application/json');
      }
    } catch (e) {
      console.error(e);
      alert('내보내기 중 오류가 발생했습니다.');
    } finally {
      setExporting(false);
    }
  };

  const name = session.user?.name ?? '';
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  const firstName = name.split(' ')[0];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid #334155',
          borderRadius: 24,
          padding: '5px 12px 5px 5px',
          cursor: 'pointer',
          color: '#f8fafc',
        }}
      >
        {session.user?.image ? (
          <img
            src={session.user.image}
            alt={name}
            style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            width: 30, height: 30, borderRadius: '50%',
            background: '#3b82f6', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.75rem', fontWeight: 700,
          }}>
            {initials}
          </div>
        )}
        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{firstName}</span>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          right: 0,
          top: 'calc(100% + 8px)',
          background: '#1e293b',
          border: '1px solid #334155',
          borderRadius: 10,
          padding: 6,
          minWidth: 140,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          zIndex: 50,
        }}>
          <div style={{ padding: '6px 10px', color: '#94a3b8', fontSize: '0.8rem', borderBottom: '1px solid #334155', marginBottom: 4 }}>
            {name}
          </div>
          <button
            onClick={() => { setShowGuide(true); setOpen(false); }}
            style={{
              width: '100%', textAlign: 'left',
              padding: '8px 10px',
              borderRadius: 6,
              color: '#e2e8f0',
              fontSize: '0.9rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              borderBottom: '1px solid #334155',
              marginBottom: 4,
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#0f172a')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            사용방법
          </button>
          <div style={{ padding: '4px 10px 2px', color: '#64748b', fontSize: '0.72rem', marginTop: 2 }}>
            내보내기
          </div>
          <div style={{ display: 'flex', gap: 4, padding: '2px 10px 6px', borderBottom: '1px solid #334155', marginBottom: 4 }}>
            <button
              onClick={() => handleExport('md')}
              disabled={exporting}
              style={{
                flex: 1, textAlign: 'center',
                padding: '6px 0',
                borderRadius: 6,
                color: '#a78bfa',
                fontSize: '0.82rem',
                fontWeight: 600,
                background: 'rgba(167,139,250,0.08)',
                border: '1px solid rgba(167,139,250,0.25)',
                cursor: exporting ? 'wait' : 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(167,139,250,0.18)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(167,139,250,0.08)')}
            >
              .md
            </button>
            <button
              onClick={() => handleExport('json')}
              disabled={exporting}
              style={{
                flex: 1, textAlign: 'center',
                padding: '6px 0',
                borderRadius: 6,
                color: '#60a5fa',
                fontSize: '0.82rem',
                fontWeight: 600,
                background: 'rgba(96,165,250,0.08)',
                border: '1px solid rgba(96,165,250,0.25)',
                cursor: exporting ? 'wait' : 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(96,165,250,0.18)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(96,165,250,0.08)')}
            >
              .json
            </button>
          </div>
          <button
            onClick={() => { signOut(); setOpen(false); }}
            style={{
              width: '100%', textAlign: 'left',
              padding: '8px 10px',
              borderRadius: 6,
              color: '#ef4444',
              fontSize: '0.9rem',
              background: 'none',
              border: 'none',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = '#0f172a')}
            onMouseLeave={e => (e.currentTarget.style.background = 'none')}
          >
            로그아웃
          </button>
        </div>
      )}

      {showGuide && (
        <div
          onClick={() => setShowGuide(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 16,
              padding: '32px 36px',
              maxWidth: 560,
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              color: '#e2e8f0',
              boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setShowGuide(false)}
              style={{
                position: 'absolute', top: 16, right: 16,
                background: 'none', border: 'none',
                color: '#64748b', fontSize: '1.2rem', cursor: 'pointer',
              }}
            >✕</button>

            <h2 style={{ margin: '0 0 4px', fontSize: '1.4rem', color: '#f8fafc' }}>NXLab Research Note</h2>
            <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: '0.85rem' }}>생각의 구조를 시각화하는 AI 연동 마인드맵</p>

            <section style={{ marginBottom: 24 }}>
              <h3 style={{ color: '#a78bfa', fontSize: '0.95rem', marginBottom: 8 }}>이 서비스는 무엇인가요?</h3>
              <p style={{ fontSize: '0.875rem', lineHeight: 1.7, color: '#cbd5e1', margin: 0 }}>
                목표(Goal), 단계(Step), 리소스(Resource), 일정(Schedule)을 캔버스 위의 노드로 표현하고
                서로 연결해 나만의 연구·사고 지도를 만드는 도구입니다.
                작성한 구조를 Markdown 또는 JSON으로 내보내 GPT, Gemini, Claude 등 AI에게 전달하면
                AI가 전체 맥락을 이해한 상태로 더 깊은 대화를 나눌 수 있습니다.
              </p>
            </section>

            <section style={{ marginBottom: 24 }}>
              <h3 style={{ color: '#60a5fa', fontSize: '0.95rem', marginBottom: 12 }}>노드 종류</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { color: '#a78bfa', label: 'Goal (보라)', desc: '달성하고 싶은 목표. 캔버스의 중심 단위입니다.' },
                  { color: '#f472b6', label: 'Step (분홍)', desc: 'Goal을 이루기 위한 단계. 하위 Step을 중첩할 수 있습니다.' },
                  { color: '#60a5fa', label: 'Resource (파랑)', desc: '참고 링크, 메모, 자료. Goal 또는 Step에 연결합니다.' },
                  { color: '#10b981', label: 'Schedule (초록)', desc: '날짜가 있는 일정. 허브 노드 주변에 표시됩니다.' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, marginTop: 5, flexShrink: 0 }} />
                    <div style={{ fontSize: '0.85rem', lineHeight: 1.6, color: '#cbd5e1' }}>
                      <strong style={{ color: '#f1f5f9' }}>{item.label}</strong> — {item.desc}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section style={{ marginBottom: 24 }}>
              <h3 style={{ color: '#60a5fa', fontSize: '0.95rem', marginBottom: 12 }}>주요 사용법</h3>
              <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  '화면 하단 + 버튼으로 새 Goal을 추가합니다.',
                  '노드를 클릭하면 오른쪽 패널에서 Step·Resource 추가, 색상 변경, 삭제가 가능합니다.',
                  '노드의 핸들(흰 점)을 드래그해 다른 노드에 연결합니다. 모든 노드 간 연결이 가능합니다.',
                  '연결선을 클릭하면 연결 끊기 메뉴가 나타납니다.',
                  '허브 노드(중앙)를 클릭해 프로젝트 이름을 변경할 수 있습니다.',
                  '이름 버튼 → 내보내기로 현재 구조를 .md 또는 .json으로 다운로드합니다.',
                  '다운로드한 파일을 AI에게 첨부하면 전체 맥락을 공유할 수 있습니다.',
                ].map((text, i) => (
                  <li key={i} style={{ fontSize: '0.875rem', lineHeight: 1.65, color: '#cbd5e1' }}>{text}</li>
                ))}
              </ol>
            </section>

            <section>
              <h3 style={{ color: '#60a5fa', fontSize: '0.95rem', marginBottom: 8 }}>AI에게 파일을 줄 때 추천 프롬프트</h3>
              <div style={{ background: '#0f172a', borderRadius: 8, padding: '12px 14px', fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.7, fontFamily: 'monospace' }}>
                "첨부 파일은 내 연구 구조입니다. 이 맥락을 바탕으로 [질문]을 도와주세요."
              </div>
            </section>

            <button
              onClick={() => setShowGuide(false)}
              style={{
                marginTop: 28,
                width: '100%',
                padding: '10px',
                background: '#3b82f6',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
