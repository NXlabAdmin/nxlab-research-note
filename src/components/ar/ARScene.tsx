'use client';

import React, { useRef, useState, useMemo } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { Text, Billboard, Sphere, Line } from '@react-three/drei';
import { createXRStore, XR, XROrigin } from '@react-three/xr';
import * as THREE from 'three';

// ─── XR Store (singleton) ────────────────────────────────────────────────────
export const xrStore = createXRStore();

// ─── Types ───────────────────────────────────────────────────────────────────
interface GoalData {
  id: string;
  title: string;
  progress: number;
  color: string | null;
  steps: StepData[];
}

interface StepData {
  id: string;
  title: string;
  isCompleted: boolean;
  color: string | null;
  parentStepId: string | null;
}

interface NodeInfo {
  type: 'goal' | 'step';
  data: GoalData | StepData;
}

// ─── GoalNode ────────────────────────────────────────────────────────────────
function GoalNode({
  goal,
  position,
  onSelect,
}: {
  goal: GoalData;
  position: THREE.Vector3;
  onSelect: (info: NodeInfo) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);
  const baseColor = goal.color ?? '#a78bfa';
  const isCompleted = goal.progress === 100;
  const color = isCompleted ? '#9ca3af' : baseColor;

  useFrame((_, delta) => {
    meshRef.current.rotation.y += delta * 0.4;
  });

  return (
    <group position={position}>
      <Sphere
        ref={meshRef}
        args={[0.12, 32, 32]}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onPointerDown={() => onSelect({ type: 'goal', data: goal })}
      >
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.8 : 0.4}
          roughness={0.2}
          metalness={0.6}
        />
      </Sphere>
      <Billboard follow>
        <Text
          position={[0, 0.18, 0]}
          fontSize={0.06}
          color="#ffffff"
          anchorX="center"
          anchorY="bottom"
          maxWidth={0.6}
          outlineWidth={0.004}
          outlineColor="#000000"
        >
          {goal.title}
        </Text>
        {goal.progress > 0 && (
          <Text
            position={[0, 0.12, 0]}
            fontSize={0.04}
            color="#94a3b8"
            anchorX="center"
            anchorY="bottom"
          >
            {goal.progress}%
          </Text>
        )}
      </Billboard>
    </group>
  );
}

// ─── StepNode ────────────────────────────────────────────────────────────────
function StepNode({
  step,
  position,
  onSelect,
}: {
  step: StepData;
  position: THREE.Vector3;
  onSelect: (info: NodeInfo) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const color = step.isCompleted ? '#9ca3af' : (step.color ?? '#f472b6');

  return (
    <group position={position}>
      <Sphere
        args={[0.055, 16, 16]}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onPointerDown={() => onSelect({ type: 'step', data: step })}
      >
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.7 : 0.25}
          roughness={0.3}
          metalness={0.4}
        />
      </Sphere>
      <Billboard follow>
        <Text
          position={[0, 0.1, 0]}
          fontSize={0.045}
          color={step.isCompleted ? '#6b7280' : '#e2e8f0'}
          anchorX="center"
          anchorY="bottom"
          maxWidth={0.5}
          outlineWidth={0.003}
          outlineColor="#000000"
        >
          {step.isCompleted ? `☑ ${step.title}` : `○ ${step.title}`}
        </Text>
      </Billboard>
    </group>
  );
}

// ─── GoalGroup: one goal + its steps orbiting ────────────────────────────────
function GoalGroup({
  goal,
  goalPosition,
  onSelect,
}: {
  goal: GoalData;
  goalPosition: THREE.Vector3;
  onSelect: (info: NodeInfo) => void;
}) {
  const topSteps = goal.steps.filter(s => !s.parentStepId);
  const STEP_ORBIT = 0.35;

  const stepPositions = useMemo<THREE.Vector3[]>(() =>
    topSteps.map((_, i) => {
      const angle = (i / Math.max(topSteps.length, 1)) * Math.PI * 2;
      return new THREE.Vector3(
        goalPosition.x + STEP_ORBIT * Math.cos(angle),
        goalPosition.y,
        goalPosition.z + STEP_ORBIT * Math.sin(angle),
      );
    }),
  [topSteps, goalPosition]);

  return (
    <group>
      <GoalNode goal={goal} position={goalPosition} onSelect={onSelect} />
      {topSteps.map((step, i) => (
        <group key={step.id}>
          <Line
            points={[goalPosition, stepPositions[i]]}
            color="rgba(255,255,255,0.15)"
            lineWidth={1}
          />
          <StepNode step={step} position={stepPositions[i]} onSelect={onSelect} />
        </group>
      ))}
    </group>
  );
}

// ─── MindMap3D: full scene content ───────────────────────────────────────────
function MindMap3D({
  goals,
  onSelect,
}: {
  goals: GoalData[];
  onSelect: (info: NodeInfo) => void;
}) {
  const RADIUS = 1.4;
  const Y_OFFSET = -0.3; // slightly below eye level

  const goalPositions = useMemo<THREE.Vector3[]>(() =>
    goals.map((_, i) => {
      const angle = (i / Math.max(goals.length, 1)) * Math.PI * 2;
      return new THREE.Vector3(
        RADIUS * Math.cos(angle),
        Y_OFFSET,
        RADIUS * Math.sin(angle) - 1.5, // place in front of user
      );
    }),
  [goals]);

  return (
    <>
      <ambientLight intensity={0.6} />
      <pointLight position={[0, 2, 0]} intensity={1.2} color="#ffffff" />
      {goals.map((goal, i) => (
        <GoalGroup
          key={goal.id}
          goal={goal}
          goalPosition={goalPositions[i]}
          onSelect={onSelect}
        />
      ))}
    </>
  );
}

// ─── InfoPanel: selected node detail (rendered as DOM overlay) ───────────────
function InfoPanel({
  info,
  onClose,
}: {
  info: NodeInfo | null;
  onClose: () => void;
}) {
  if (!info) return null;

  const isGoal = info.type === 'goal';
  const d = info.data as any;

  return (
    <div style={{
      position: 'fixed',
      bottom: 32,
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(15, 23, 42, 0.92)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(255,255,255,0.15)',
      borderRadius: 16,
      padding: '20px 28px',
      color: '#f8fafc',
      zIndex: 100,
      minWidth: 280,
      maxWidth: 360,
      boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
            {isGoal ? 'Goal' : 'Step'}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{d.title}</div>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 18, padding: 0 }}
        >
          ✕
        </button>
      </div>

      {isGoal && (
        <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
          <div style={{ flex: 1, background: '#1e293b', borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>Progress</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#a78bfa' }}>{d.progress}%</div>
          </div>
          <div style={{ flex: 1, background: '#1e293b', borderRadius: 8, padding: '10px 14px' }}>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>Steps</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#60a5fa' }}>
              {d.steps?.filter((s: StepData) => s.isCompleted).length ?? 0}/{d.steps?.length ?? 0}
            </div>
          </div>
        </div>
      )}

      {!isGoal && (
        <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{
            padding: '4px 10px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 600,
            background: d.isCompleted ? '#14532d' : '#1e3a5f',
            color: d.isCompleted ? '#4ade80' : '#60a5fa',
          }}>
            {d.isCompleted ? '✅ Completed' : '⏳ Pending'}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── ARScene: main export ────────────────────────────────────────────────────
export interface ARSceneProps { goals: GoalData[] }

export function ARScene({ goals }: ARSceneProps) {
  const [selectedInfo, setSelectedInfo] = useState<NodeInfo | null>(null);
  const [arStarted, setArStarted] = useState(false);

  return (
    <div style={{ width: '100%', height: '100vh', background: '#0f172a', position: 'relative' }}>
      {/* AR Start button overlay */}
      {!arStarted && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          zIndex: 10, gap: 16,
        }}>
          <div style={{ color: '#a78bfa', fontSize: 48 }}>◈</div>
          <h2 style={{ color: '#f8fafc', margin: 0, fontWeight: 700 }}>NXLab Research Note AR</h2>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: 14, textAlign: 'center', maxWidth: 260 }}>
            Xreal Air2 Ultra + Galaxy S23<br />Nebula 브라우저에서 실행하세요
          </p>
          <button
            onClick={() => { xrStore.enterAR(); setArStarted(true); }}
            style={{
              marginTop: 8,
              padding: '14px 32px',
              background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 0 24px rgba(124,58,237,0.5)',
            }}
          >
            AR 시작
          </button>
          <button
            onClick={() => setArStarted(true)}
            style={{
              padding: '10px 24px',
              background: 'rgba(255,255,255,0.08)',
              color: '#94a3b8',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 10,
              fontSize: 14,
              cursor: 'pointer',
            }}
          >
            3D 미리보기
          </button>
        </div>
      )}

      <Canvas
        camera={{ position: [0, 0, 0], fov: 75, near: 0.01, far: 100 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: arStarted ? 'transparent' : '#0f172a' }}
      >
        <XR store={xrStore}>
          <XROrigin position={[0, 0, 0]} />
          <MindMap3D goals={goals} onSelect={setSelectedInfo} />
        </XR>
      </Canvas>

      <InfoPanel info={selectedInfo} onClose={() => setSelectedInfo(null)} />
    </div>
  );
}

export default ARScene;
