'use client';

import dynamic from 'next/dynamic';
import type { ARSceneProps } from './ARScene';

const ARScene = dynamic<ARSceneProps>(
  () => import('./ARScene').then(m => m.ARScene),
  {
    ssr: false,
    loading: () => (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100%', color: '#94a3b8', fontSize: 14,
      }}>
        AR 씬 로딩 중...
      </div>
    ),
  }
);

export function ARSceneWrapper({ goals }: { goals: any[] }) {
  return <ARScene goals={goals} />;
}
