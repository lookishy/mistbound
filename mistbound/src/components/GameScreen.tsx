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
import { submitGambleBet, triggerGambleSpin, triggerSpecialEventResolution, extendTurnTime, checkTurnTimeout } from '../engine/executor';

interface GameScreenProps {
  roomId: string;
  gameState: GameState | null;
  currentUser: any;
  onActionComplete?: (actionType: 'earn_init' | 'earn_confirm' | 'bid', params?: { targetId?: string, red?: number, blue?: number, chosenCombo?: TokenCombo }) => void;
}


const ExtensionModal = ({ onConfirm }: { onConfirm: () => void }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="earth-panel p-8 rounded-xl border border-yellow-600 max-w-sm w-full relative shadow-[0_0_30px_rgba(218,165,32,0.8)] text-center">
        <h2 className="text-2xl font-black text-yellow-500 mb-4">需要更多思考时间吗？</h2>
        <p className="text-gray-300 mb-6 text-sm">指挥部正在等待你的决策。15秒无响应将视为通讯中断。</p>
        <button
          onClick={onConfirm}
          className="bg-yellow-700 hover:bg-yellow-600 text-white font-bold py-3 px-8 rounded-lg transition-all w-full border border-yellow-500"
        >
          确认 (延长30秒)
        </button>
      </div>
    </div>
);



const WinModal = ({ winnerName, onReturn, secretX, secretY }: { winnerName: string, onReturn: () => void, secretX: number, secretY: number }) => (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="earth-panel p-12 rounded-2xl border-4 border-yellow-600 max-w-2xl w-full relative shadow-[0_0_80px_rgba(218,165,32,0.8)] text-center animate-[pulse_3s_ease-in-out_infinite]">
        <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-300 mb-6 drop-shadow-[0_0_10px_rgba(255,215,0,0.8)]">
          战线贯通，雾境主宰！
        </h2>

        <div className="text-3xl font-bold text-white mb-8">
          最终胜利者：<span className="text-yellow-400">{winnerName}</span>
        </div>

        <div className="bg-black/50 border border-[#5C4033] p-6 rounded-lg mb-10">
           <h3 className="text-xl font-bold text-red-400 mb-4">本局终极谜底揭晓</h3>
           <div className="flex justify-center gap-12 text-2xl font-bold">
              <div className="text-red-500">红晶真实价值 = {secretX}</div>
              <div className="text-blue-500">蓝晶真实价值 = {secretY}</div>
           </div>
        </div>

        <button
          onClick={onReturn}
          className="bg-yellow-700 hover:bg-yellow-600 text-white font-bold py-4 px-12 rounded-lg transition-all border-2 border-yellow-500 text-xl shadow-[0_0_20px_rgba(218,165,32,0.5)]"
        >
          返回游戏大厅
        </button>
      </div>
    </div>
);

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
            }, 3000);
            return () => clearTimeout(timer);
        }
    } else if (gameState.status !== 'event') {
        setPrevEvent(null);
    }
  }, [gameState.status, gameState.currentEvent, prevEvent, roomId, currentUser.uid, gameState.hostId, gameState.players]);



  // Timeout check loop
  useEffect(() => {
    if (gameState.status !== 'playing' || !currentUser) return;

    // Host checks timeouts
    const interval = setInterval(() => {
      checkTurnTimeout(roomId, gameState, currentUser.uid);
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, roomId, currentUser]);

  const handleExtensionConfirm = () => {
      extendTurnTime(roomId, gameState, currentUser.uid);
  };

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


      {gameState.status === 'finished' && gameState.winner && (
          <WinModal
            winnerName={gameState.players.find(p => p.id === gameState.winner)?.name || '未知玩家'}
            secretX={gameState.secretValues.x}
            secretY={gameState.secretValues.y}
            onReturn={() => window.location.reload()}
          />
      )}



      {gameState.turnExtension === 'pending' && isMyTurn && (
          <ExtensionModal onConfirm={handleExtensionConfirm} />
      )}


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
      <div className="h-28 flex-shrink-0 earth-panel rounded">
        <PlayerList players={gameState.players} currentTurnIndex={gameState.currentTurnIndex} />
      </div>
    </div>
  );
};