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

export function MindMapCanvas({ goals, resources, schedules, steps, goalConnections, stepConnections, nodeConnections }: { goals: any[], resources: any[], schedules: any[], steps: any[], goalConnections: any[], stepConnections: any[], nodeConnections: any[] }) {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [edgeMenu, setEdgeMenu] = useState<{ edgeId: string; x: number; y: number } | null>(null);
  const [hiddenEdges, setHiddenEdges] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const saved = localStorage.getItem('nxlab-hidden-edges');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  const [hubName, setHubName] = useState<string>(() => {
    if (typeof window === 'undefined') return 'NXLab';
    return localStorage.getItem('nxlab-hub-name') ?? 'NXLab';
  });

  const handleHubRename = (name: string) => {
    const trimmed = name.trim() || 'NXLab';
    setHubName(trimmed);
    localStorage.setItem('nxlab-hub-name', trimmed);
  };

  const hideEdge = (edgeId: string) => {
    setHiddenEdges(prev => {
      const next = new Set(prev).add(edgeId);
      localStorage.setItem('nxlab-hidden-edges', JSON.stringify([...next]));
      return next;
    });
  };

  useEffect(() => {
    const layout = generateConstellationLayout(goals, resources, schedules, steps, goalConnections, stepConnections, nodeConnections, hubName);
    setNodes(layout.nodes);
    setEdges(layout.edges.map(e => ({ ...e, interactionWidth: 20 })));
  }, [goals, resources, schedules, steps, goalConnections, stepConnections, nodeConnections, hubName]);

  const onNodesChange = (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds));
  const onEdgesChange = (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds));

  const getNodeDbId = (node: Node): string | null => {
    if (node.id === 'hub-main') return 'main';
    return (node.data?.rawData as any)?.id ?? null;
  };

  const getNodeTypeStr = (node: Node): string => {
    if (node.id === 'hub-main') return 'hub';
    return (node.type ?? '').replace('Node', '');
  };

  const onConnect = async (params: Connection) => {
    const sourceNode = nodes.find(n => n.id === params.source);
    const targetNode = nodes.find(n => n.id === params.target);
    if (!sourceNode || !targetNode) return;

    const sId = getNodeDbId(sourceNode);
    const tId = getNodeDbId(targetNode);
    if (!sId || !tId) return;

    const sType = sourceNode.type ?? '';
    const tType = targetNode.type ?? '';
    const isHub = (n: Node) => n.id === 'hub-main';

    try {
      if (sType === 'goalNode' && tType === 'goalNode' && !isHub(sourceNode) && !isHub(targetNode)) {
        const { createGoalConnection } = await import('@/actions/connection.actions');
        await createGoalConnection(sId, tId);
      } else if (
        ((sType === 'stepNode' && tType === 'goalNode') || (sType === 'goalNode' && tType === 'stepNode')) &&
        !isHub(sourceNode) && !isHub(targetNode)
      ) {
        const stepId = sType === 'stepNode' ? sId : tId;
        const goalId = sType === 'goalNode' ? sId : tId;
        const { createStepConnection } = await import('@/actions/connection.actions');
        await createStepConnection(stepId, goalId);
      } else {
        const { createNodeConnection } = await import('@/actions/connection.actions');
        await createNodeConnection(sId, getNodeTypeStr(sourceNode), tId, getNodeTypeStr(targetNode));
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
    setEdgeMenu(null);
  };

  const onEdgeClick = (event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation();
    setEdgeMenu({ edgeId: edge.id, x: event.clientX, y: event.clientY });
  };

  const handleDeleteEdge = async () => {
    if (!edgeMenu) return;
    const { edgeId } = edgeMenu;
    setEdgeMenu(null);
    try {
      if (edgeId.startsWith('conn-')) {
        const id = edgeId.replace('conn-', '');
        const { deleteGoalConnection } = await import('@/actions/connection.actions');
        await deleteGoalConnection(id);
        return;
      }
      if (edgeId.startsWith('stepconn-')) {
        const id = edgeId.replace('stepconn-', '');
        const { deleteStepConnection } = await import('@/actions/connection.actions');
        await deleteStepConnection(id);
        return;
      }
      if (edgeId.startsWith('nodeconn-')) {
        const id = edgeId.replace('nodeconn-', '');
        const { deleteNodeConnection } = await import('@/actions/connection.actions');
        await deleteNodeConnection(id);
        return;
      }
      // Structural edges (e- prefix)
      if (edgeId.startsWith('e-')) {
        const parts = edgeId.split('-');
        const parentType = parts[1];
        const childType = parts[parts.length - 2];
        const targetId = parts[parts.length - 1];

        // goal→resource or step→resource: unlink resource from parent
        if (childType === 'resource' && (parentType === 'goal' || parentType === 'step')) {
          const { unlinkResource } = await import('@/actions/resource.actions');
          await unlinkResource(targetId);
          return;
        }
        // step→substep: detach sub-step from parent step
        if (childType === 'step' && parentType === 'step') {
          const { unlinkSubStep } = await import('@/actions/step.actions');
          await unlinkSubStep(targetId);
          return;
        }
        // goal→step or hub→*: visually hide (DB relationship is required, can't null)
        hideEdge(edgeId);
      }
    } catch (e) {
      console.error(e);
      alert('연결 삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <div style={{ width: '100%', height: 'calc(100vh - 90px)', position: 'relative', backgroundColor: '#0f172a' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges.filter(e => !hiddenEdges.has(e.id))}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
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

      <SidePanel selectedNode={selectedNode} onClose={() => setSelectedNode(null)} onHubRename={handleHubRename} />

      {edgeMenu && (
        <div
          style={{
            position: 'fixed',
            top: edgeMenu.y,
            left: edgeMenu.x,
            zIndex: 1000,
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            padding: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            minWidth: '130px',
          }}
        >
          <button
            onClick={handleDeleteEdge}
            style={{
              background: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 'bold',
              textAlign: 'left',
            }}
          >
            연결 끊기
          </button>
          <button
            onClick={() => setEdgeMenu(null)}
            style={{
              background: 'transparent',
              color: '#94a3b8',
              border: 'none',
              borderRadius: '6px',
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: '12px',
              textAlign: 'left',
            }}
          >
            취소
          </button>
        </div>
      )}
    </div>
  );
}
