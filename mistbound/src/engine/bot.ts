import type { GameState } from '../types/game';
import { earnMoneyOptions, evaluateBid } from './mechanics';
import { mapGraph } from './winCondition';

export interface BotActionResult {
  updatedGameState: GameState;
  actionLogMessage: string;
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

  for (const targetId of bestCandidates) {
      const territory = nextState.territories[targetId];
      const V = territory.currentPrice;

      // We know x,y are bounded 1-5. Bot needs to guess or just try combinations it can afford.
      // Bot assumes average value of 3 for x and y to make a safe bet, or just uses its actual knowledge if it has any (it doesn't, so it guesses).
      // A more robust way: Bot tries to fulfill V assuming x=1, y=1 (worst case) to guarantee buy if it has enough.
      // Or it just uses what it has and hopes it works.

      // Let's make the bot "smart" by checking if its max possible contribution is >= V.
      // Bot secret values are in nextState.secretValues (which bot theoretically shouldn't know, but we use it here to make it perfectly rational)
      const x = nextState.secretValues.x;
      const y = nextState.secretValues.y;

      let maxP = botNext.wallet.red * x + botNext.wallet.blue * y;
      if (maxP >= V) {
          // Find minimal combination
          for (let r = 0; r <= botNext.wallet.red; r++) {
              for (let b = 0; b <= botNext.wallet.blue; b++) {
                  if (r === 0 && b === 0) continue;
                  if (r * x + b * y >= V) {
                      targetToBuy = targetId;
                      optimalBidRed = r;
                      optimalBidBlue = b;
                      break;
                  }
              }
              if (targetToBuy) break;
          }
      }
      if (targetToBuy) break;
  }

  if (targetToBuy) {
      // Action B: Buy/Bid
      const territory = nextState.territories[targetToBuy];
      const bidResult = evaluateBid(optimalBidRed, optimalBidBlue, nextState.secretValues.x, nextState.secretValues.y, territory, botNext);

      if (bidResult.success) {
          botNext.wallet.red -= optimalBidRed;
          botNext.wallet.blue -= optimalBidBlue;

          if (bidResult.refund) {
              const prevOwnerIndex = nextState.players.findIndex(p => p.id === bidResult.refund!.toPlayerId);
              if (prevOwnerIndex !== -1) {
                  nextState.players[prevOwnerIndex].wallet.red += bidResult.refund!.red;
                  nextState.players[prevOwnerIndex].wallet.blue += bidResult.refund!.blue;
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

          territory.lastPaid = { red: optimalBidRed, blue: optimalBidBlue };

          logMessage = bidResult.message;
      }
  } else {
      // Action A: Earn Money - Bot auto-selects one of the options
      const options = earnMoneyOptions(nextState.secretValues.x, nextState.secretValues.y);
      const chosen = options[Math.floor(Math.random() * options.length)];
      botNext.wallet.red += chosen.red;
      botNext.wallet.blue += chosen.blue;
      logMessage = `${botNext.name} 选择了补给，获得了 ${chosen.red}红 ${chosen.blue}蓝。`;
  }

  nextState.currentTurnIndex = (currentTurnIndex + 1) % nextState.players.length;

  return {
    updatedGameState: nextState,
    actionLogMessage: logMessage
  };
};