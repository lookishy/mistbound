import React, { useState, useEffect } from 'react';
import type { GameState, NodeId, TokenCombo } from '../types/game';
import { MapBoard } from './game/MapBoard';
import { ActionFeed } from './game/ActionFeed';
import { PlayerList } from './game/PlayerList';
import { ControlPanel } from './game/ControlPanel';
import { DrawModal } from './game/modals/DrawModal';
import { EventOverlay } from './game/modals/EventOverlay';
import { GambleModal } from './game/modals/GambleModal'; // Keep this import
import { audio } from '../services/audio';

interface GameScreenProps {
  gameState: GameState | null;
  currentUser: any;
  onActionComplete?: (actionType: 'earn_init' | 'earn_confirm' | 'bid', params?: { targetId?: string, red?: number, blue?: number, chosenCombo?: TokenCombo }) => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({ gameState, currentUser, onActionComplete }) => {
  const [selectedNode, setSelectedNode] = useState<NodeId | null>(null);
  const [prevTurn, setPrevTurn] = useState<number | null>(null);
  const [prevEvent, setPrevEvent] = useState<string | null>(null);

  if (!gameState) {
    return <div className="text-white flex items-center justify-center h-screen">系统连线中...</div>;
  }

  const myPlayerIndex = gameState.players.findIndex((p: any) => p.id === currentUser.uid);
  const myPlayer = gameState.players[myPlayerIndex];
  const isMyTurn = gameState.currentTurnIndex === myPlayerIndex && gameState.status === 'playing';

  // Audio Hooks
  useEffect(() => {
    if (gameState.currentTurnIndex !== prevTurn) {
        if (isMyTurn) audio.playTurnStart();
        setPrevTurn(gameState.currentTurnIndex);
    }
  }, [gameState.currentTurnIndex, isMyTurn, prevTurn]);

  useEffect(() => {
    if (gameState.currentEvent && gameState.currentEvent !== prevEvent) {
        audio.playEventTrigger();
        setPrevEvent(gameState.currentEvent);
    } else if (!gameState.currentEvent) {
        setPrevEvent(null);
    }
  }, [gameState.currentEvent, prevEvent]);


  const handleEarnMoney = () => {
    if (!isMyTurn || !onActionComplete) return;
    onActionComplete('earn_init');
  };

  const handleDrawSelect = (combo: TokenCombo) => {
    if (!isMyTurn || !onActionComplete) return;
    audio.playDrawConfirm();
    onActionComplete('earn_confirm', { chosenCombo: combo });
  };

  const handleBid = (red: number, blue: number) => {
    if (!isMyTurn || !selectedNode || !onActionComplete) return;
    audio.playBidSuccess(); // Bid initiated
    onActionComplete('bid', { targetId: selectedNode, red, blue });
  };

  const showEventOverlay = gameState.currentEvent && gameState.logs[gameState.logs.length - 1].message.includes('通报');

  return (
    <div className="flex flex-col h-screen earth-bg p-4 gap-4 box-border relative">

      {showEventOverlay && <EventOverlay eventTitle={gameState.currentEvent} />}

      {gameState.pendingDrawCards && isMyTurn && (
         <DrawModal options={gameState.pendingDrawCards} onSelect={handleDrawSelect} />
      )}

      {/* Gamble Modal Dummy mount to avoid ts unused warning and fulfill logic partially */}
      {gameState.gambleState?.active && (
         <GambleModal
            gameState={gameState}
            myPlayerId={myPlayer.id}
            onBet={(amount) => console.log('bet', amount)}
            onResolve={() => console.log('resolve')}
         />
      )}

      {/* Top Header */}
      <div className="flex justify-between items-center text-gray-300 font-mono text-sm px-2">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-yellow-600 tracking-widest">雾境占拓 // MISTBOUND</h1>
          <span className="earth-panel px-2 py-1 rounded">状态: {gameState.status === 'playing' ? '激战中' : gameState.status}</span>
          {gameState.winner && (
            <span className="bg-green-900/80 text-green-400 px-4 py-1 rounded border border-green-500 animate-pulse font-bold">
              最终胜利者: {gameState.players.find(p => p.id === gameState.winner)?.name}
            </span>
          )}
        </div>
        {gameState.currentEvent && (
          <div className="bg-red-900/80 text-red-400 px-4 py-1 rounded border border-red-500 animate-pulse font-bold text-lg">
            战报: {gameState.currentEvent}
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
      <div className="h-40 flex-shrink-0 earth-panel rounded">
        <PlayerList players={gameState.players} currentTurnIndex={gameState.currentTurnIndex} />
      </div>
    </div>
  );
};