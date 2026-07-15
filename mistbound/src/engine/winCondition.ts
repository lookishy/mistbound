import type { GameState, NodeId, PlayerId } from '../types/game';

// Define the static graph connections (adjacency list)
// Used to check if a continuous path exists from 'start' to 'end'
export const mapGraph: Record<NodeId, NodeId[]> = {
  'start': ['path1_a', 'path2_a', 'path3_a'],
  'path1_a': ['start', 'path1_b'],
  'path1_b': ['path1_a', 'hub_mid'],
  'path2_a': ['start', 'hub_mid'],
  'path3_a': ['start', 'path3_b'],
  'path3_b': ['path3_a', 'hub_central'],
  'hub_mid': ['path1_b', 'path2_a', 'path4_a', 'path5_a'],
  'path4_a': ['hub_mid', 'hub_late'],
  'path5_a': ['hub_mid', 'path5_b'],
  'path5_b': ['path5_a', 'hub_late'],
  'hub_central': ['path3_b', 'path6_a'],
  'path6_a': ['hub_central', 'hub_late'],
  'hub_late': ['path4_a', 'path5_b', 'path6_a', 'end'],
  'end': ['hub_late']
};

export const checkWinCondition = (gameState: GameState, playerId: PlayerId): boolean => {
  const ownedNodes = new Set<NodeId>();

  // Find all nodes owned by this player
  for (const [nodeId, territory] of Object.entries(gameState.territories)) {
    if (territory.ownerId === playerId) {
      ownedNodes.add(nodeId);
    }
  }

  // If they don't own start or end, they can't win
  if (!ownedNodes.has('start') || !ownedNodes.has('end')) {
    return false;
  }

  // Perform DFS/BFS to find a path from 'start' to 'end' using only owned nodes
  const visited = new Set<NodeId>();
  const stack: NodeId[] = ['start'];

  while (stack.length > 0) {
    const current = stack.pop()!;

    if (current === 'end') {
      return true; // Path found!
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

  return false;
};
