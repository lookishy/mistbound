import type { GameState } from '../types/game';
import { earnMoneyOptions, evaluateBid } from './mechanics';
import { mapGraph } from './winCondition';

export interface BotActionResult {
  updatedGameState: GameState;
  actionLogMessage: string;
  isBid?: boolean;
  buyerId?: string;
  targetName?: string;
  cost?: any;
}

export const runBotTurn = (gameState: GameState): BotActionResult | null => {
  const currentTurnIndex = gameState.currentTurnIndex;
  const botPlayer = gameState.players[currentTurnIndex];

  if (!botPlayer.isBot) {
    return null;
  }


  const nextState = JSON.parse(JSON.stringify(gameState)) as GameState;
  const botNext = nextState.players[currentTurnIndex];
  let logMessage = '';

  // 1. Find targets
  const ownedNodes = Object.keys(nextState.territories).filter(id => nextState.territories[id].ownerId === botNext.id);
  let targetCandidates: string[] = [];

  if (ownedNodes.length === 0) {
    targetCandidates = mapGraph['start'].filter(n => n !== 'end' && !nextState.territories[n].locked);
  } else {
    ownedNodes.forEach(ownedId => {
       const neighbors = mapGraph[ownedId] || [];
       neighbors.forEach(n => {
          if (nextState.territories[n].ownerId !== botNext.id && !nextState.territories[n].locked && n !== 'start' && n !== 'end') {
              targetCandidates.push(n);
          }
       });
    });
  }

  let bestCandidates = targetCandidates.filter(id => !nextState.territories[id].ownerId);
  if (bestCandidates.length === 0) {
      bestCandidates = targetCandidates;
  }

  // 2. Assess if we can buy any of the targets
  let targetToBuy: string | null = null;
  let optimalBidRed = 0;
  let optimalBidBlue = 0;
  let optimalBidGreen = 0;
  let bidCostObj = undefined;

  for (const targetId of bestCandidates) {
      const territory = nextState.territories[targetId];
      const V = territory.currentPrice;

      const x = nextState.secretValues.x;
      const y = nextState.secretValues.y;
      const z = nextState.secretValues.z;

      let maxP = botNext.wallet.red * x + botNext.wallet.blue * y + botNext.wallet.green * z;
      if (maxP >= V && botNext.wallet.red >= 1 && botNext.wallet.blue >= 1 && botNext.wallet.green >= 1) {
          // Find minimal combination that includes at least 1 of each color
          for (let r = 1; r <= botNext.wallet.red; r++) {
              for (let b = 1; b <= botNext.wallet.blue; b++) {
                  for (let g = 1; g <= botNext.wallet.green; g++) {
                      if (r * x + b * y + g * z >= V) {
                          targetToBuy = targetId;
                          optimalBidRed = r;
                          optimalBidBlue = b;
                          optimalBidGreen = g;
                          break;
                      }
                  }
                  if (targetToBuy) break;
              }
              if (targetToBuy) break;
          }
      }
      if (targetToBuy) break;
  }

  let isBidSuccess = false;

  if (targetToBuy) {
      // Action B: Buy/Bid
      const territory = nextState.territories[targetToBuy];
      const bidResult = evaluateBid(optimalBidRed, optimalBidBlue, optimalBidGreen, nextState.secretValues.x, nextState.secretValues.y, nextState.secretValues.z, territory, botNext);

      if (bidResult.success) {
          botNext.wallet.red -= optimalBidRed;
          botNext.wallet.blue -= optimalBidBlue;
          botNext.wallet.green -= optimalBidGreen;

          if (bidResult.refund) {
              const prevOwnerIndex = nextState.players.findIndex(p => p.id === bidResult.refund!.toPlayerId);
              if (prevOwnerIndex !== -1) {
                  nextState.players[prevOwnerIndex].wallet.red += bidResult.refund!.red;
                  nextState.players[prevOwnerIndex].wallet.blue += bidResult.refund!.blue;
                  nextState.players[prevOwnerIndex].wallet.green += bidResult.refund!.green;
              }
          }


          territory.ownerId = botNext.id;
          territory.stolenCount += 1;
          territory.ownerHistory = territory.ownerHistory || [];
          territory.ownerHistory.push(botNext.id);

          const maxStolen = nextState.players.length <= 4 ? 3 : 6;
          if (territory.stolenCount >= maxStolen) {
              territory.locked = true;
          }
          territory.currentPrice = bidResult.newPrice!;

          territory.lastPaid = { red: optimalBidRed, blue: optimalBidBlue, green: optimalBidGreen };

          logMessage = bidResult.message;
          isBidSuccess = true;
          bidCostObj = { red: optimalBidRed, blue: optimalBidBlue, green: optimalBidGreen };
      }
  } else {
      // Action A: Earn Money - Bot auto-selects one of the options
      const options = earnMoneyOptions(nextState.secretValues.x, nextState.secretValues.y, nextState.secretValues.z);
      const chosen = options[Math.floor(Math.random() * options.length)];
      botNext.wallet.red += chosen.red;
      botNext.wallet.blue += chosen.blue;
      botNext.wallet.green += chosen.green;
      logMessage = `${botNext.name} 选择了补给，获得了 ${chosen.red}红 ${chosen.blue}蓝 ${chosen.green}绿。`;
  }

  nextState.spyUsed = false;

  nextState.currentTurnIndex = (currentTurnIndex + 1) % nextState.players.length;

  // Need to append the structured log message to bot's logs before returning.
  // Actually bot logs are pushed in executor.ts, so we don't need to push here but wait, the caller pushes `botResult.actionLogMessage`.
  // To keep structured logs for bots, we should let the caller do it, but the caller doesn't have isBid etc.
  // Wait, I will just return an ActionLog object from bot.ts and modify executor.ts to push it properly.
  // Ah, let's look at `executor.ts`: `nextState.logs.push({ id: Date.now().toString(), timestamp: Date.now(), message: botResult.actionLogMessage });`
  // I need to return more info from `runBotTurn`.
  return {
    updatedGameState: nextState,
    actionLogMessage: logMessage,
    isBid: isBidSuccess,
    buyerId: botNext.name,
    targetName: targetToBuy ? nextState.territories[targetToBuy].name : undefined,
    cost: bidCostObj
  } as any;
};