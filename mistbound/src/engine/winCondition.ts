import type { GameState, NodeId, PlayerId } from '../types/game';

// Define the static graph connections (adjacency list) matching the new complex edges
export const mapGraph: Record<NodeId, NodeId[]> = {
  'start': ['path1_a', 'path2_a', 'path3_a'],
  'path1_a': ['start', 'path1_b'],
  'path1_b': ['path1_a', 'hub_mid', 'path4_a'],
  'path2_a': ['start', 'hub_mid', 'path3_b'],
  'path3_a': ['start', 'path3_b'],
  'path3_b': ['path3_a', 'path2_a', 'hub_central'],
  'hub_mid': ['path1_b', 'path2_a', 'path4_a', 'path5_a', 'hub_central'],
  'path4_a': ['path1_b', 'hub_mid', 'hub_late', 'path5_b'],
  'path5_a': ['hub_mid', 'path5_b'],
  'path5_b': ['path4_a', 'path5_a', 'path6_a', 'hub_late'],
  'hub_central': ['path3_b', 'hub_mid', 'path6_a'],
  'path6_a': ['hub_central', 'path5_b', 'hub_late'],
  'hub_late': ['path4_a', 'path5_b', 'path6_a', 'end'],
  'end': ['hub_late']
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
