'use client';

import React, { useState, useEffect } from 'react';
import {
  ReactFlow,
  Panel,
  useReactFlow,
  useViewport,
  Background,
  applyNodeChanges,
  applyEdgeChanges,
  NodeChange,
  EdgeChange,
  Node,
  Edge,
  Connection,
  BackgroundVariant
} from '@xyflow/react';

function ZoomSlider() {
  const { fitView, zoomTo } = useReactFlow();
  const { zoom } = useViewport();

  return (
    <Panel position="bottom-right" style={{ 
      display: 'flex', alignItems: 'center', gap: '12px', 
      background: 'rgba(30, 41, 59, 0.9)', padding: '10px 16px', 
      borderRadius: '8px', border: '1px solid #334155', color: '#fff',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
      marginBottom: '20px', marginRight: '20px'
    }}>
      <span style={{ fontSize: '13px', color: '#94a3b8', width: '36px', textAlign: 'right', fontWeight: 'bold' }}>
        {Math.round(zoom * 100)}%
      </span>
      <input 
        type="range" 
        min={0.1} 
        max={4} 
        step={0.05} 
        value={zoom} 
        onChange={(e) => zoomTo(Number(e.target.value))} 
        style={{ width: '100px', cursor: 'pointer', accentColor: '#3b82f6' }}
      />
      <button 
        onClick={() => fitView({ duration: 800 })} 
        title="Fit View" 
        style={{ 
          background: '#3b82f6', color: '#fff', border: 'none', cursor: 'pointer',
          borderRadius: '4px', padding: '4px 8px', fontSize: '11px', fontWeight: 'bold',
          outline: 'none'
        }}
      >
        FIT
      </button>
    </Panel>
  );
}
import '@xyflow/react/dist/style.css';

import { GoalNode, ResourceNode, ScheduleNode, StepNode } from './CustomNodes';
import { generateConstellationLayout } from '@/utils/layoutUtils';
import { SidePanel } from './SidePanel';

const nodeTypes = {
  goalNode: GoalNode,
  resourceNode: ResourceNode,
  scheduleNode: ScheduleNode,
  stepNode: StepNode,
};

export function MindMapCanvas({ goals, resources, schedules, steps, goalConnections, stepConnections }: { goals: any[], resources: any[], schedules: any[], steps: any[], goalConnections: any[], stepConnections: any[] }) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  useEffect(() => {
    const layout = generateConstellationLayout(goals, resources, schedules, steps, goalConnections, stepConnections);
    setNodes(layout.nodes);
    setEdges(layout.edges);
  }, [goals, resources, schedules, steps, goalConnections, stepConnections]);

  const onNodesChange = (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds));
  const onEdgesChange = (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds));

  const onConnect = async (params: Connection) => {
    const sourceNode = nodes.find(n => n.id === params.source);
    const targetNode = nodes.find(n => n.id === params.target);

    try {
      if (sourceNode?.type === 'goalNode' && targetNode?.type === 'goalNode') {
        const sId = (sourceNode.data.rawData as any).id;
        const tId = (targetNode.data.rawData as any).id;
        const { createGoalConnection } = await import('@/actions/connection.actions');
        await createGoalConnection(sId, tId);
      } else if (sourceNode?.type === 'stepNode' && targetNode?.type === 'goalNode') {
        const stepId = (sourceNode.data.rawData as any).id;
        const goalId = (targetNode.data.rawData as any).id;
        const { createStepConnection } = await import('@/actions/connection.actions');
        await createStepConnection(stepId, goalId);
      } else if (sourceNode?.type === 'goalNode' && targetNode?.type === 'stepNode') {
        const stepId = (targetNode.data.rawData as any).id;
        const goalId = (sourceNode.data.rawData as any).id;
        const { createStepConnection } = await import('@/actions/connection.actions');
        await createStepConnection(stepId, goalId);
      } else {
        alert("목표(Goal) 간 연결 또는 스텝(Step)과 목표(Goal) 간 연결만 지원합니다.");
      }
    } catch(e) {
      console.error(e);
      alert("연결 중 오류가 발생했습니다.");
    }
  };

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  };

  const onPaneClick = () => {
    setSelectedNode(null);
  };

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 90px)', position: 'relative', backgroundColor: '#0f172a' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={4}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#334155" variant={BackgroundVariant.Dots} gap={24} size={2} />
        <ZoomSlider />
      </ReactFlow>

      <SidePanel selectedNode={selectedNode} onClose={() => setSelectedNode(null)} />
    </div>
  );
}
