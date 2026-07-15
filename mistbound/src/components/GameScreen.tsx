import React, { useState, useEffect } from 'react';
import type { GameState, NodeId, TokenCombo } from '../types/game';
import { MapBoard } from './game/MapBoard';
import { ActionFeed } from './game/ActionFeed';
import { PlayerList } from './game/PlayerList';
import { ControlPanel } from './game/ControlPanel';
import { DrawModal } from './game/modals/DrawModal';
import { EventOverlay } from './game/modals/EventOverlay';
import { GambleModal } from './game/modals/GambleModal';
import { BidModal } from './game/modals/BidModal';
import { RuleModal } from './game/modals/RuleModal'; // New Rule Modal
import { audio } from '../services/audio';
import { submitGambleBet, triggerGambleSpin, triggerSpecialEventResolution } from '../engine/executor';

interface GameScreenProps {
  roomId: string;
  gameState: GameState | null;
  currentUser: any;
  onActionComplete?: (actionType: 'earn_init' | 'earn_confirm' | 'bid', params?: { targetId?: string, red?: number, blue?: number, chosenCombo?: TokenCombo }) => void;
}

export const GameScreen: React.FC<GameScreenProps> = ({ roomId, gameState, currentUser, onActionComplete }) => {
  const [selectedNode, setSelectedNode] = useState<NodeId | null>(null);
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);

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
        if (isMyTurn && !gameState.gambleState?.active) audio.playTurnStart();
        setPrevTurn(gameState.currentTurnIndex);
    }
  }, [gameState.currentTurnIndex, isMyTurn, prevTurn, gameState.gambleState]);

  // Event Overlay Hook - 2 seconds auto-hide logic AND resolve event
  useEffect(() => {
    if (gameState.status === 'event' && gameState.currentEvent && gameState.currentEvent !== prevEvent) {
        audio.playEventTrigger();
        setPrevEvent(gameState.currentEvent);

        if (currentUser.uid === gameState.hostId || (gameState.players[0].id === currentUser.uid && !gameState.players.find(p => p.id === gameState.hostId)?.connected)) {
            const timer = setTimeout(async () => {
                await triggerSpecialEventResolution(roomId, gameState);
            }, 2000);
            return () => clearTimeout(timer);
        }
    } else if (gameState.status !== 'event') {
        setPrevEvent(null);
    }
  }, [gameState.status, gameState.currentEvent, prevEvent, roomId, currentUser.uid, gameState.hostId, gameState.players]);


  const handleEarnMoney = () => {
    if (!isMyTurn || !onActionComplete) return;
    onActionComplete('earn_init');
  };

  const handleDrawSelect = (combo: TokenCombo) => {
    if (!isMyTurn || !onActionComplete) return;
    audio.playDrawConfirm();
    onActionComplete('earn_confirm', { chosenCombo: combo });
  };

  const handleNodeClick = (nodeId: NodeId) => {
      setSelectedNode(nodeId);
      setIsBidModalOpen(true);
  };

  const handleBidConfirm = (red: number, blue: number) => {
    if (!isMyTurn || !selectedNode || !onActionComplete) return;
    audio.playBidSuccess();
    onActionComplete('bid', { targetId: selectedNode, red, blue });
    setIsBidModalOpen(false);
    setSelectedNode(null);
  };

  const handleGambleBet = async (amount: number) => {
      if (!myPlayer) return;
      await submitGambleBet(roomId, gameState, myPlayer.id, amount);
  };

  const handleGambleResolve = async () => {
      await triggerGambleSpin(roomId, gameState);
  };

  return (
    <div className="flex flex-col h-screen earth-bg p-4 gap-4 box-border relative">

      {gameState.status === 'event' && <EventOverlay eventTitle={gameState.currentEvent} />}

      {gameState.pendingDrawCards && isMyTurn && gameState.status !== 'event' && (
         <DrawModal options={gameState.pendingDrawCards} onSelect={handleDrawSelect} />
      )}

      {gameState.gambleState?.active && gameState.status !== 'event' && (
         <GambleModal
            gameState={gameState}
            myPlayerId={myPlayer.id}
            onBet={handleGambleBet}
            onResolve={handleGambleResolve}
         />
      )}

      {isBidModalOpen && selectedNode && isMyTurn && !gameState.gambleState?.active && !gameState.pendingDrawCards && gameState.status !== 'event' && (
         <BidModal
            territory={gameState.territories[selectedNode]}
            wallet={myPlayer.wallet}
            onConfirm={handleBidConfirm}
            onCancel={() => { setIsBidModalOpen(false); setSelectedNode(null); }}
         />
      )}

      {isRuleModalOpen && <RuleModal onClose={() => setIsRuleModalOpen(false)} />}

      {/* Top Header */}
      <div className="flex justify-between items-center text-gray-300 font-mono text-sm px-2">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-yellow-600 tracking-widest">雾境占拓 // MISTBOUND</h1>
          <span className="earth-panel px-2 py-1 rounded">状态: {gameState.status === 'playing' ? '激战中' : (gameState.status === 'event' ? '全局事件突发' : gameState.status)}</span>
          {gameState.winner && (
            <span className="bg-green-900/80 text-green-400 px-4 py-1 rounded border border-green-500 animate-pulse font-bold">
              最终胜利者: {gameState.players.find(p => p.id === gameState.winner)?.name}
            </span>
          )}

          <button
            onClick={() => setIsRuleModalOpen(true)}
            className="bg-yellow-800/80 hover:bg-yellow-600 text-yellow-100 px-3 py-1 rounded border border-yellow-600 font-bold transition-all shadow-[0_0_5px_rgba(218,165,32,0.5)] flex items-center gap-1"
          >
             <span>❓</span> 规则
          </button>
        </div>
        {gameState.currentEvent && gameState.status !== 'event' && (
          <div className="bg-red-900/80 text-red-400 px-4 py-1 rounded border border-red-500 animate-pulse font-bold text-lg">
            上期战报: {gameState.currentEvent}
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
          <MapBoard gameState={gameState} onNodeClick={handleNodeClick} />
        </div>

        {/* Right Column: Control Panel */}
        <div className="w-64 flex-shrink-0">
          <ControlPanel
            currentPlayer={myPlayer || null}
            isMyTurn={isMyTurn}
            onEarnMoney={handleEarnMoney}
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