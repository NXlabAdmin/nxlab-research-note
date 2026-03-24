import { Node, Edge } from '@xyflow/react';

const GOAL_NODE_WIDTH = 120;
const ORBIT_RADIUS = 250;
const SUB_ORBIT_RADIUS = 150;

export function generateConstellationLayout(
  goals: any[],
  resources: any[],
  schedules: any[],
  steps: any[],
  goalConnections: any[] = [],
  stepConnections: any[] = [],
  nodeConnections: any[] = [],
  hubName: string = 'NXLab'
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Goal-to-goal custom connections (gold)
  goalConnections.forEach(conn => {
    edges.push({
      id: `conn-${conn.id}`,
      source: `goal-${conn.sourceId}`,
      target: `goal-${conn.targetId}`,
      type: 'straight',
      style: { stroke: '#fbbf24', strokeWidth: 2 }
    });
  });

  // Generic node connections (teal)
  nodeConnections.forEach(conn => {
    edges.push({
      id: `nodeconn-${conn.id}`,
      source: `${conn.sourceNodeType}-${conn.sourceNodeId}`,
      target: `${conn.targetNodeType}-${conn.targetNodeId}`,
      type: 'straight',
      style: { stroke: '#22d3ee', strokeWidth: 2, strokeDasharray: '5 3' }
    });
  });

  // Step-to-goal connections (orange dashed)
  stepConnections.forEach(conn => {
    edges.push({
      id: `stepconn-${conn.id}`,
      source: `step-${conn.stepId}`,
      target: `goal-${conn.goalId}`,
      type: 'straight',
      style: { stroke: '#fb923c', strokeWidth: 2, strokeDasharray: '6 3' }
    });
  });

  // Central Hub Node
  nodes.push({
    id: 'hub-main',
    type: 'goalNode',
    position: { x: 0, y: 0 },
    data: { label: hubName, progress: 100, rawData: { createdAt: new Date() } },
  });

  const HUB_RADIUS = goals.length > 5 ? 800 + (goals.length * 50) : 600;

  // Top-level steps (no parentStepId)
  const topLevelSteps = steps.filter(s => !s.parentStepId);
  // Sub-steps (have parentStepId)
  const subSteps = steps.filter(s => s.parentStepId);

  goals.forEach((goal, i) => {
    const goalAngle = (i / goals.length) * 2 * Math.PI;
    const goalX = HUB_RADIUS * Math.cos(goalAngle);
    const goalY = HUB_RADIUS * Math.sin(goalAngle);

    nodes.push({
      id: `goal-${goal.id}`,
      type: 'goalNode',
      position: { x: goalX, y: goalY },
      data: { label: goal.title, progress: goal.progress, rawData: goal },
    });

    // Direct children: top-level steps + goal-linked resources
    const childResources = resources.filter(r => r.goalId === goal.id && !r.stepId);
    const childSteps = topLevelSteps.filter(s => s.goalId === goal.id);
    const orbitItems = [...childResources, ...childSteps];

    orbitItems.forEach((item, j) => {
      const angle = (j / orbitItems.length) * 2 * Math.PI;
      const x = goalX + GOAL_NODE_WIDTH / 2 + ORBIT_RADIUS * Math.cos(angle);
      const y = goalY + GOAL_NODE_WIDTH / 2 + ORBIT_RADIUS * Math.sin(angle);

      const isResource = 'url' in item && !('isCompleted' in item);
      const idPrefix = isResource ? 'resource' : 'step';

      nodes.push({
        id: `${idPrefix}-${item.id}`,
        type: isResource ? 'resourceNode' : 'stepNode',
        position: { x, y },
        data: { label: item.title, rawData: item },
      });

      edges.push({
        id: `e-goal-${goal.id}-${idPrefix}-${item.id}`,
        source: `goal-${goal.id}`,
        target: `${idPrefix}-${item.id}`,
        type: 'straight',
        style: { stroke: 'rgba(255, 255, 255, 0.2)', strokeWidth: 1 },
      });

      // Sub-items orbiting each step
      if (!isResource) {
        const stepSubSteps = subSteps.filter(ss => ss.parentStepId === item.id);
        const stepResources = resources.filter(r => r.stepId === item.id);
        const stepChildren = [...stepSubSteps, ...stepResources];

        stepChildren.forEach((child, k) => {
          const subAngle = (k / stepChildren.length) * 2 * Math.PI;
          const cx = x + SUB_ORBIT_RADIUS * Math.cos(subAngle);
          const cy = y + SUB_ORBIT_RADIUS * Math.sin(subAngle);

          const isSubResource = 'url' in child && !('isCompleted' in child);
          const subPrefix = isSubResource ? 'resource' : 'step';

          nodes.push({
            id: `${subPrefix}-${child.id}`,
            type: isSubResource ? 'resourceNode' : 'stepNode',
            position: { x: cx, y: cy },
            data: { label: child.title, rawData: child },
          });

          edges.push({
            id: `e-step-${item.id}-${subPrefix}-${child.id}`,
            source: `step-${item.id}`,
            target: `${subPrefix}-${child.id}`,
            type: 'straight',
            style: { stroke: 'rgba(244, 114, 182, 0.4)', strokeWidth: 1 },
          });
        });
      }
    });
  });

  // Schedules orbit hub
  schedules.forEach((sch, i) => {
    const angle = (i / schedules.length) * 2 * Math.PI;
    nodes.push({
      id: `schedule-${sch.id}`,
      type: 'scheduleNode',
      position: { x: 300 * Math.cos(angle), y: 300 * Math.sin(angle) },
      data: { label: sch.title, rawData: sch },
    });
    edges.push({
      id: `e-hub-schedule-${sch.id}`,
      source: 'hub-main',
      target: `schedule-${sch.id}`,
      type: 'straight',
      style: { stroke: 'rgba(255, 255, 255, 0.15)', strokeWidth: 1, strokeDasharray: '4 4' },
    });
  });

  // Unlinked resources (no goalId, no stepId)
  const unlinkedResources = resources.filter(r => !r.goalId && !r.stepId);
  unlinkedResources.forEach((res, i) => {
    const angle = (i / unlinkedResources.length) * 2 * Math.PI;
    nodes.push({
      id: `resource-${res.id}`,
      type: 'resourceNode',
      position: { x: 450 * Math.cos(angle), y: 450 * Math.sin(angle) },
      data: { label: res.title, rawData: res },
    });
    edges.push({
      id: `e-hub-resource-${res.id}`,
      source: 'hub-main',
      target: `resource-${res.id}`,
      type: 'straight',
      style: { stroke: 'rgba(255, 255, 255, 0.15)', strokeWidth: 1, strokeDasharray: '4 4' },
    });
  });

  return { nodes, edges };
}
