import type { GameState, NodeId, PlayerId } from '../types/game';

// Define the static graph connections (adjacency list) matching the new complex edges

// Expanded Graph Topology
export const mapGraph: Record<NodeId, NodeId[]> = {
  'start': ['node_f1', 'node_f2', 'node_f3', 'node_f4'],

  'node_f1': ['start', 'node_f2', 'node_m1', 'node_m2'],
  'node_f2': ['start', 'node_f1', 'node_f3', 'node_m2', 'node_m3'],
  'node_f3': ['start', 'node_f2', 'node_f4', 'node_m3', 'node_m4'],
  'node_f4': ['start', 'node_f3', 'node_m4', 'node_m5'],

  'node_m1': ['node_f1', 'node_m2', 'node_m6'],
  'node_m2': ['node_f1', 'node_f2', 'node_m1', 'node_m3', 'node_m6', 'node_m7'],
  'node_m3': ['node_f2', 'node_f3', 'node_m2', 'node_m4', 'node_m7', 'node_m8'],
  'node_m4': ['node_f3', 'node_f4', 'node_m3', 'node_m5', 'node_m8', 'node_m9'],
  'node_m5': ['node_f4', 'node_m4', 'node_m9'],

  'node_m6': ['node_m1', 'node_m2', 'node_m7', 'node_b1', 'node_b2'],
  'node_m7': ['node_m2', 'node_m3', 'node_m6', 'node_m8', 'node_b2', 'node_b3'],
  'node_m8': ['node_m3', 'node_m4', 'node_m7', 'node_m9', 'node_b3', 'node_b4'],
  'node_m9': ['node_m4', 'node_m5', 'node_m8', 'node_b4', 'node_b5'],

  'node_b1': ['node_m6', 'node_b2', 'end'],
  'node_b2': ['node_m6', 'node_m7', 'node_b1', 'node_b3', 'end'],
  'node_b3': ['node_m7', 'node_m8', 'node_b2', 'node_b4', 'end'],
  'node_b4': ['node_m8', 'node_m9', 'node_b3', 'node_b5', 'end'],
  'node_b5': ['node_m9', 'node_b4', 'end'],

  'end': ['node_b1', 'node_b2', 'node_b3', 'node_b4', 'node_b5']
};

export const checkWinCondition = (gameState: GameState, playerId: PlayerId): boolean => {
  const ownedNodes = new Set<NodeId>();

  for (const [nodeId, territory] of Object.entries(gameState.territories)) {
    if (territory.ownerId === playerId) {
      ownedNodes.add(nodeId);
    }
  }


  // Start and End nodes cannot be owned by players directly, so we check if player owns nodes connected to start and end.
  const startNeighbors = mapGraph['start'] || [];
  const endNeighbors = mapGraph['end'] || [];

  const hasStartConnection = startNeighbors.some(n => ownedNodes.has(n));
  const hasEndConnection = endNeighbors.some(n => ownedNodes.has(n));

  if (!hasStartConnection || !hasEndConnection) {
    return false;
  }

  const visited = new Set<NodeId>();
  const stack: NodeId[] = [...startNeighbors.filter(n => ownedNodes.has(n))];

  while (stack.length > 0) {
    const current = stack.pop()!;

    if (endNeighbors.includes(current)) {
      return true;
    }

    if (!visited.has(current)) {
      visited.add(current);

      const neighbors = mapGraph[current] || [];
      for (const neighbor of neighbors) {
        if (ownedNodes.has(neighbor) && !visited.has(neighbor)) {
          stack.push(neighbor);
        }
      }
    }
  }

;
  return false;
};
