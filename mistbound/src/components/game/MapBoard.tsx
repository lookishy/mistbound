import React from 'react';
import type { GameState, NodeId } from '../../types/game';

interface MapBoardProps {
  gameState: GameState;
  onNodeClick: (nodeId: NodeId) => void;
}

const nodeLayout: Record<NodeId, { cx: number; cy: number }> = {
  'start': { cx: 80, cy: 300 },
  'path1_a': { cx: 250, cy: 120 },
  'path1_b': { cx: 450, cy: 120 },
  'path2_a': { cx: 280, cy: 300 },
  'path3_a': { cx: 250, cy: 480 },
  'path3_b': { cx: 450, cy: 480 },
  'hub_mid': { cx: 550, cy: 250 },
  'hub_central': { cx: 550, cy: 480 },
  'path4_a': { cx: 700, cy: 150 },
  'path5_a': { cx: 700, cy: 300 },
  'path5_b': { cx: 850, cy: 300 },
  'path6_a': { cx: 700, cy: 450 },
  'hub_late': { cx: 950, cy: 300 },
  'end': { cx: 1080, cy: 300 }
};

// More complex cross-connections
const mapEdges = [
  ['start', 'path1_a'], ['start', 'path2_a'], ['start', 'path3_a'],
  ['path1_a', 'path1_b'], ['path1_b', 'hub_mid'], ['path1_b', 'path4_a'],
  ['path2_a', 'hub_mid'], ['path2_a', 'path3_b'],
  ['path3_a', 'path3_b'], ['path3_b', 'hub_central'],
  ['hub_mid', 'path4_a'], ['hub_mid', 'path5_a'], ['hub_mid', 'hub_central'],
  ['path4_a', 'hub_late'], ['path4_a', 'path5_b'],
  ['path5_a', 'path5_b'], ['path5_b', 'hub_late'],
  ['hub_central', 'path6_a'], ['path6_a', 'hub_late'], ['path6_a', 'path5_b'],
  ['hub_late', 'end']
];

const playerColors = ['#8B0000', '#00008B', '#006400', '#DAA520']; // Dark Red, Dark Blue, Dark Green, Goldenrod

export const MapBoard: React.FC<MapBoardProps> = ({ gameState, onNodeClick }) => {
  return (
    <div className="w-full h-full earth-panel earth-bg rounded-lg relative overflow-hidden flex items-center justify-center">

      {/* Dynamic War Fog Filter Layer */}
      <div className="absolute inset-0 z-0 opacity-40 mix-blend-overlay pointer-events-none">
        <svg width="100%" height="100%">
          <filter id="fog">
            <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="3" result="noise" />
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 0.9 0 0 0  0 0.8 0 0 0  0 0 0 0.4 0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#fog)" />
        </svg>
      </div>

      <svg width="100%" height="100%" viewBox="0 0 1150 600" className="relative z-10 drop-shadow-xl">
        <defs>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Draw Edges */}
        {mapEdges.map(([from, to], i) => {
          const start = nodeLayout[from];
          const end = nodeLayout[to];
          return (
            <line
              key={`edge-${i}`}
              x1={start.cx} y1={start.cy}
              x2={end.cx} y2={end.cy}
              stroke="rgba(92, 64, 51, 0.6)"
              strokeWidth="4"
              strokeDasharray="8,4"
            />
          );
        })}

        {/* Draw Nodes */}
        {Object.entries(gameState.territories).map(([id, territory]) => {
          const pos = nodeLayout[id];
          if (!pos) return null;

          let fillColor = '#3E2723'; // Dark earthy dirt for unowned
          let strokeColor = '#5C4033';
          let glowEnabled = false;

          if (territory.ownerId) {
            const ownerIndex = gameState.players.findIndex(p => p.id === territory.ownerId);
            if (ownerIndex !== -1) {
              fillColor = playerColors[ownerIndex];
              strokeColor = '#FFF';
              glowEnabled = true;
            }
          }

          const isBase = id === 'start' || id === 'end';

          return (
            <g
              key={id}
              onClick={() => onNodeClick(id)}
              className="cursor-pointer group"
              style={{ transformOrigin: `${pos.cx}px ${pos.cy}px` }}
            >
              {/* Scale wrapping to prevent layout jitter on hover */}
              <g className="transition-transform duration-200 ease-in-out group-hover:-translate-y-1">
                <circle
                  cx={pos.cx}
                  cy={pos.cy}
                  r={isBase ? "35" : "28"}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth="3"
                  filter={glowEnabled ? "url(#glow)" : undefined}
                />

                {/* Node Name */}
                <text
                  x={pos.cx}
                  y={pos.cy - (isBase ? 45 : 38)}
                  textAnchor="middle"
                  fill="#E8E0D5"
                  fontSize="14"
                  fontWeight="bold"
                  className="drop-shadow-md"
                >
                  {territory.name}
                </text>

                {/* Price (if not base) */}
                {!isBase && (
                  <text
                    x={pos.cx}
                    y={pos.cy + 5}
                    textAnchor="middle"
                    fill="#FFF"
                    fontSize="16"
                    fontWeight="900"
                  >
                    ${territory.currentPrice}
                  </text>
                )}

                {/* Lock Status */}
                {territory.locked && (
                  <text x={pos.cx} y={pos.cy + 45} textAnchor="middle" fill="#FF4500" fontSize="12" fontWeight="bold">
                    [永久占领]
                  </text>
                )}
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
};