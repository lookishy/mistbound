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

  const actionChoice = Math.random() < 0.5 ? 'earn' : 'buy';

  if (actionChoice === 'earn' || (botNext.wallet.red === 0 && botNext.wallet.blue === 0)) {
    // Action A: Earn Money - Bot auto-selects one of the options
    const options = earnMoneyOptions(nextState.secretValues.x, nextState.secretValues.y);
    const chosen = options[Math.floor(Math.random() * options.length)];
    botNext.wallet.red += chosen.red;
    botNext.wallet.blue += chosen.blue;
    logMessage = `${botNext.name} 选择了补给，获得了 ${chosen.red}红 ${chosen.blue}蓝。`;
  } else {
    // Action B: Buy/Bid
    const ownedNodes = Object.keys(nextState.territories).filter(id => nextState.territories[id].ownerId === botNext.id);
    let targetCandidates: string[] = [];

    if (ownedNodes.length === 0) {
      // Look for unowned nodes connected to start
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

    if (bestCandidates.length > 0) {
        const targetId = bestCandidates[Math.floor(Math.random() * bestCandidates.length)];
        const territory = nextState.territories[targetId];

        const bidRed = Math.floor(Math.random() * (botNext.wallet.red + 1));
        const bidBlue = Math.floor(Math.random() * (botNext.wallet.blue + 1));

        const bidResult = evaluateBid(bidRed, bidBlue, nextState.secretValues.x, nextState.secretValues.y, territory, botNext);

        if (bidResult.success) {
            botNext.wallet.red -= bidRed;
            botNext.wallet.blue -= bidBlue;

            if (bidResult.refund) {
                const prevOwnerIndex = nextState.players.findIndex(p => p.id === bidResult.refund!.toPlayerId);
                if (prevOwnerIndex !== -1) {
                    nextState.players[prevOwnerIndex].wallet.red += bidResult.refund!.red;
                    nextState.players[prevOwnerIndex].wallet.blue += bidResult.refund!.blue;
                }
            }

            territory.ownerId = botNext.id;
            territory.stolenCount += 1;
            if (territory.stolenCount >= 3) {
                territory.locked = true;
            }
            territory.currentPrice = bidResult.newPrice!;
            territory.lastPaid = { red: bidRed, blue: bidBlue };

            logMessage = bidResult.message;
        } else {
            logMessage = bidResult.message;
        }
    } else {
        const options = earnMoneyOptions(nextState.secretValues.x, nextState.secretValues.y);
        const chosen = options[0];
        botNext.wallet.red += chosen.red;
        botNext.wallet.blue += chosen.blue;
        logMessage = `${botNext.name} 找不到前线目标，选择补给获得 ${chosen.red}红 ${chosen.blue}蓝。`;
    }
  }

  nextState.currentTurnIndex = (currentTurnIndex + 1) % nextState.players.length;

  return {
    updatedGameState: nextState,
    actionLogMessage: logMessage
  };
};