import React, { useState } from 'react';
import type { GameState, NodeId } from '../types/game';
import { MapBoard } from './game/MapBoard';
import { ActionFeed } from './game/ActionFeed';
import { PlayerList } from './game/PlayerList';
import { ControlPanel } from './game/ControlPanel';

interface GameScreenProps {
  gameState: GameState | null;
  currentUser: any;
  onActionComplete?: (actionType: 'earn' | 'bid', bidParams?: { targetId: string, red: number, blue: number }) => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({ gameState, currentUser, onActionComplete }) => {
  const [selectedNode, setSelectedNode] = useState<NodeId | null>(null);

  if (!gameState) {
    return <div className="text-white">Loading...</div>;
  }

  const myPlayerIndex = gameState.players.findIndex((p: any) => p.id === currentUser.uid);
  const myPlayer = gameState.players[myPlayerIndex];
  const isMyTurn = gameState.currentTurnIndex === myPlayerIndex && gameState.status === 'playing';

  const handleEarnMoney = () => {
    if (!isMyTurn || !onActionComplete) return;
    onActionComplete('earn');
  };

  const handleBid = (red: number, blue: number) => {
    if (!isMyTurn || !selectedNode || !onActionComplete) return;
    onActionComplete('bid', { targetId: selectedNode, red, blue });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-950 p-4 gap-4 box-border">
      {/* Top Header */}
      <div className="flex justify-between items-center text-gray-300 font-mono text-sm px-2">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-blue-400 tracking-widest">MISTBOUND // 雾境占拓</h1>
          <span className="bg-gray-800 px-2 py-1 rounded border border-gray-700">STATUS: {gameState.status.toUpperCase()}</span>
          {gameState.winner && (
            <span className="bg-green-900/50 text-green-400 px-2 py-1 rounded border border-green-500 animate-pulse font-bold">
              WINNER: {gameState.players.find(p => p.id === gameState.winner)?.name}
            </span>
          )}
        </div>
        {gameState.currentEvent && (
          <div className="bg-red-900/50 text-red-400 px-4 py-1 rounded border border-red-500 animate-pulse font-bold">
            EVENT: {gameState.currentEvent}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left Column: Action Feed */}
        <div className="w-64 flex-shrink-0">
          <ActionFeed logs={gameState.logs} />
        </div>

        {/* Center: Map Board */}
        <div className="flex-1 min-w-0">
          <MapBoard gameState={gameState} onNodeClick={setSelectedNode} />
        </div>

        {/* Right Column: Control Panel */}
        <div className="w-72 flex-shrink-0">
          <ControlPanel
            currentPlayer={myPlayer || null}
            isMyTurn={isMyTurn}
            selectedTerritory={selectedNode ? gameState.territories[selectedNode] : null}
            onEarnMoney={handleEarnMoney}
            onBid={handleBid}
          />
        </div>
      </div>

      {/* Bottom Area: Players List */}
      <div className="h-40 flex-shrink-0 bg-gray-900 border border-blue-900 rounded">
        <PlayerList players={gameState.players} currentTurnIndex={gameState.currentTurnIndex} />
      </div>
    </div>
  );
};
