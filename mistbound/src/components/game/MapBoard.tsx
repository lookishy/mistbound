import React from 'react';
import type { GameState, NodeId } from '../../types/game';

interface MapBoardProps {
  gameState: GameState;
  onNodeClick: (nodeId: NodeId) => void;
}

// Map Node coordinates for SVG layout
const nodeLayout: Record<NodeId, { cx: number; cy: number }> = {
  'start': { cx: 50, cy: 300 },
  'path1_a': { cx: 200, cy: 150 },
  'path1_b': { cx: 350, cy: 150 },
  'path2_a': { cx: 250, cy: 300 },
  'path3_a': { cx: 200, cy: 450 },
  'path3_b': { cx: 350, cy: 450 },
  'hub_mid': { cx: 500, cy: 225 },
  'hub_central': { cx: 500, cy: 450 },
  'path4_a': { cx: 650, cy: 150 },
  'path5_a': { cx: 650, cy: 300 },
  'path5_b': { cx: 800, cy: 300 },
  'path6_a': { cx: 650, cy: 450 },
  'hub_late': { cx: 950, cy: 300 },
  'end': { cx: 1100, cy: 300 }
};

// Edges definition for rendering connections
const mapEdges = [
  ['start', 'path1_a'], ['start', 'path2_a'], ['start', 'path3_a'],
  ['path1_a', 'path1_b'], ['path1_b', 'hub_mid'],
  ['path2_a', 'hub_mid'],
  ['path3_a', 'path3_b'], ['path3_b', 'hub_central'],
  ['hub_mid', 'path4_a'], ['hub_mid', 'path5_a'],
  ['path4_a', 'hub_late'],
  ['path5_a', 'path5_b'], ['path5_b', 'hub_late'],
  ['hub_central', 'path6_a'], ['path6_a', 'hub_late'],
  ['hub_late', 'end']
];

// Helper to assign colors to players
const playerColors = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B']; // Red, Blue, Green, Yellow

export const MapBoard: React.FC<MapBoardProps> = ({ gameState, onNodeClick }) => {
  return (
    <div className="w-full h-full bg-gray-900 border-2 border-blue-900 rounded-lg shadow-[0_0_15px_rgba(30,58,138,0.5)] relative overflow-hidden">
      {/* Grid Background Effect */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoNTksIDEzMCwgMjQ2LCAwLjE1KSIvPjwvc3ZnPg==')] z-0"></div>

      <svg width="100%" height="100%" viewBox="0 0 1150 600" className="relative z-10">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Draw Edges */}
        {mapEdges.map(([from, to], i) => {
          const start = nodeLayout[from];
          const end = nodeLayout[to];
          return (
            <line
              key={i}
              x1={start.cx} y1={start.cy}
              x2={end.cx} y2={end.cy}
              stroke="rgba(59, 130, 246, 0.3)"
              strokeWidth="3"
              strokeDasharray="5,5"
            />
          );
        })}

        {/* Draw Nodes */}
        {Object.entries(gameState.territories).map(([id, territory]) => {
          const pos = nodeLayout[id];
          if (!pos) return null;

          let fillColor = 'rgba(75, 85, 99, 0.8)'; // Gray fog for unowned
          let strokeColor = '#4B5563';

          if (territory.ownerId) {
            const ownerIndex = gameState.players.findIndex(p => p.id === territory.ownerId);
            if (ownerIndex !== -1) {
              fillColor = playerColors[ownerIndex];
              strokeColor = fillColor;
            }
          }

          return (
            <g key={id} onClick={() => onNodeClick(id)} className="cursor-pointer transition-transform hover:scale-110">
              <circle
                cx={pos.cx}
                cy={pos.cy}
                r="25"
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth="2"
                filter="url(#glow)"
                className="transition-all duration-300"
              />
              <text
                x={pos.cx}
                y={pos.cy + 5}
                textAnchor="middle"
                fill="white"
                fontSize="14"
                fontWeight="bold"
                fontFamily="monospace"
              >
                ${territory.currentPrice}
              </text>
              <text
                x={pos.cx}
                y={pos.cy - 35}
                textAnchor="middle"
                fill="rgba(156, 163, 175, 0.8)"
                fontSize="12"
                fontFamily="monospace"
              >
                {id.toUpperCase()}
              </text>
              {territory.locked && (
                <text x={pos.cx} y={pos.cy + 40} textAnchor="middle" fill="#EF4444" fontSize="10">🔒 LOCK</text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
