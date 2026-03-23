import React, { FC } from 'react';
import { Handle, Position } from '@xyflow/react';

interface BaseNodeProps {
  data: any;
  size?: number;
  color?: string;
  glow?: boolean;
}

export const BaseNode: FC<BaseNodeProps> = ({ data, size = 60, color = '#3b82f6', glow = true }) => {
  const finalColor = data.rawData?.color || color;
  
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: finalColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: size < 80 ? '0.65rem' : '0.85rem',
        fontWeight: 'bold',
        textAlign: 'center',
        padding: '8px',
        boxShadow: glow ? `0 0 20px ${finalColor}88, 0 0 40px ${finalColor}44` : 'none',
        border: `2px solid ${finalColor}`,
        position: 'relative',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
      }}
      title={data.label}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#fff', width: 8, height: 8, border: 'none' }} />
      <div style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
      }}>
        {data.label}
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#fff', width: 8, height: 8, border: 'none' }} />
    </div>
  );
};

export const GoalNode = ({ data }: any) => {
  const isCompleted = data.rawData?.progress === 100;
  const overriddenData = isCompleted ? { ...data, rawData: { ...data.rawData, color: '#9ca3af' } } : data;
  return <BaseNode data={overriddenData} size={100} color="#a78bfa" glow={!isCompleted} />;
};
export const ResourceNode = ({ data }: any) => <BaseNode data={data} size={60} color="#60a5fa" glow={true} />;
export const ScheduleNode = ({ data }: any) => <BaseNode data={data} size={70} color="#10b981" glow={false} />;
export const StepNode = ({ data }: any) => {
  const isCompleted = data.rawData?.isCompleted;
  const overriddenData = isCompleted ? { ...data, rawData: { ...data.rawData, color: '#9ca3af' } } : data;
  return <BaseNode data={overriddenData} size={50} color="#f472b6" glow={false} />;
};
