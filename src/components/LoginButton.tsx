"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useState, useRef, useEffect } from "react";

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
    </div>
  );
}
