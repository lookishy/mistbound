import React from 'react';
import type { GameState, NodeId } from '../../types/game';

interface MapBoardProps {
  gameState: GameState;
  onNodeClick: (nodeId: NodeId) => void;
}


const nodeLayout: Record<NodeId, { cx: number; cy: number }> = {
  'start': { cx: 80, cy: 300 },

  // Front Line
  'node_f1': { cx: 220, cy: 150 },
  'node_f2': { cx: 220, cy: 250 },
  'node_f3': { cx: 220, cy: 350 },
  'node_f4': { cx: 220, cy: 450 },

  // Mid Line 1
  'node_m1': { cx: 400, cy: 100 },
  'node_m2': { cx: 400, cy: 200 },
  'node_m3': { cx: 400, cy: 300 },
  'node_m4': { cx: 400, cy: 400 },
  'node_m5': { cx: 400, cy: 500 },

  // Mid Line 2
  'node_m6': { cx: 620, cy: 150 },
  'node_m7': { cx: 620, cy: 250 },
  'node_m8': { cx: 620, cy: 350 },
  'node_m9': { cx: 620, cy: 450 },

  // Back Line
  'node_b1': { cx: 850, cy: 100 },
  'node_b2': { cx: 850, cy: 200 },
  'node_b3': { cx: 850, cy: 300 },
  'node_b4': { cx: 850, cy: 400 },
  'node_b5': { cx: 850, cy: 500 },

  'end': { cx: 1080, cy: 300 }
};

// Expanded Edges
const mapEdges = [
  ['start', 'node_f1'], ['start', 'node_f2'], ['start', 'node_f3'], ['start', 'node_f4'],

  ['node_f1', 'node_f2'], ['node_f1', 'node_m1'], ['node_f1', 'node_m2'],
  ['node_f2', 'node_f3'], ['node_f2', 'node_m2'], ['node_f2', 'node_m3'],
  ['node_f3', 'node_f4'], ['node_f3', 'node_m3'], ['node_f3', 'node_m4'],
  ['node_f4', 'node_m4'], ['node_f4', 'node_m5'],

  ['node_m1', 'node_m2'], ['node_m1', 'node_m6'],
  ['node_m2', 'node_m3'], ['node_m2', 'node_m6'], ['node_m2', 'node_m7'],
  ['node_m3', 'node_m4'], ['node_m3', 'node_m7'], ['node_m3', 'node_m8'],
  ['node_m4', 'node_m5'], ['node_m4', 'node_m8'], ['node_m4', 'node_m9'],
  ['node_m5', 'node_m9'],

  ['node_m6', 'node_m7'], ['node_m6', 'node_b1'], ['node_m6', 'node_b2'],
  ['node_m7', 'node_m8'], ['node_m7', 'node_b2'], ['node_m7', 'node_b3'],
  ['node_m8', 'node_m9'], ['node_m8', 'node_b3'], ['node_m8', 'node_b4'],
  ['node_m9', 'node_b4'], ['node_m9', 'node_b5'],

  ['node_b1', 'node_b2'], ['node_b1', 'end'],
  ['node_b2', 'node_b3'], ['node_b2', 'end'],
  ['node_b3', 'node_b4'], ['node_b3', 'end'],
  ['node_b4', 'node_b5'], ['node_b4', 'end'],
  ['node_b5', 'end']
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