import type { GameState } from '../types/game';
import { earnMoney, evaluateBid } from './mechanics';
import { mapGraph } from './winCondition';

export interface BotActionResult {
  updatedGameState: GameState;
  actionLogMessage: string;
}

export const runBotTurn = (gameState: GameState): BotActionResult | null => {
  const currentTurnIndex = gameState.currentTurnIndex;
  const botPlayer = gameState.players[currentTurnIndex];

  if (!botPlayer.isBot) {
    return null; // Not a bot's turn
  }

  // Deep clone to safely mutate
  const nextState = JSON.parse(JSON.stringify(gameState)) as GameState;
  const botNext = nextState.players[currentTurnIndex];
  let logMessage = '';

  // 1. Determine Action: 50% chance to earn money, 50% to buy/bid
  const actionChoice = Math.random() < 0.5 ? 'earn' : 'buy';

  if (actionChoice === 'earn' || (botNext.wallet.red === 0 && botNext.wallet.blue === 0)) {
    // Action A: Earn Money
    const drawn = earnMoney(nextState.secretValues.x, nextState.secretValues.y);
    botNext.wallet.red += drawn.red;
    botNext.wallet.blue += drawn.blue;
    logMessage = `${botNext.name} 选择了赚钱，获得了 ${drawn.red}红 ${drawn.blue}蓝。`;
  } else {
    // Action B: Buy/Bid

    // Find adjacent nodes to already owned nodes, or start node if no nodes owned
    const ownedNodes = Object.keys(nextState.territories).filter(id => nextState.territories[id].ownerId === botNext.id);
    let targetCandidates: string[] = [];

    if (ownedNodes.length === 0) {
      targetCandidates = ['start']; // Default to start if nothing is owned
    } else {
      ownedNodes.forEach(ownedId => {
         const neighbors = mapGraph[ownedId] || [];
         neighbors.forEach(n => {
            if (nextState.territories[n].ownerId !== botNext.id && !nextState.territories[n].locked) {
                targetCandidates.push(n);
            }
         });
      });
    }

    // Filter to only consider unowned (cheapest)
    let bestCandidates = targetCandidates.filter(id => !nextState.territories[id].ownerId);

    // If no unowned neighbors, fallback to any valid neighbor (stealing)
    if (bestCandidates.length === 0) {
        bestCandidates = targetCandidates;
    }

    if (bestCandidates.length > 0) {
        // Pick random valid neighbor
        const targetId = bestCandidates[Math.floor(Math.random() * bestCandidates.length)];
        const territory = nextState.territories[targetId];

        // Randomly split available wallet
        const bidRed = Math.floor(Math.random() * (botNext.wallet.red + 1));
        const bidBlue = Math.floor(Math.random() * (botNext.wallet.blue + 1));

        // Attempt bid
        const bidResult = evaluateBid(
            bidRed,
            bidBlue,
            nextState.secretValues.x,
            nextState.secretValues.y,
            territory,
            botNext
        );

        if (bidResult.success) {
            // Deduct tokens
            botNext.wallet.red -= bidRed;
            botNext.wallet.blue -= bidBlue;

            // Refund previous owner
            if (bidResult.refund) {
                const prevOwnerIndex = nextState.players.findIndex(p => p.id === bidResult.refund!.toPlayerId);
                if (prevOwnerIndex !== -1) {
                    nextState.players[prevOwnerIndex].wallet.red += bidResult.refund!.red;
                    nextState.players[prevOwnerIndex].wallet.blue += bidResult.refund!.blue;
                }
            }

            // Update territory
            territory.ownerId = botNext.id;
            territory.stolenCount += 1;
            if (territory.stolenCount >= 3) {
                territory.locked = true;
            }
            territory.currentPrice = bidResult.newPrice!;
            territory.lastPaid = { red: bidRed, blue: bidBlue };

            logMessage = bidResult.message;
        } else {
            // Failed bid
            logMessage = bidResult.message;
        }
    } else {
        // No valid target, fallback to earn money
        const drawn = earnMoney(nextState.secretValues.x, nextState.secretValues.y);
        botNext.wallet.red += drawn.red;
        botNext.wallet.blue += drawn.blue;
        logMessage = `${botNext.name} 找不到领地，无奈选择了赚钱。获得了 ${drawn.red}红 ${drawn.blue}蓝。`;
    }
  }

  // Next Turn
  nextState.currentTurnIndex = (currentTurnIndex + 1) % nextState.players.length;

  return {
    updatedGameState: nextState,
    actionLogMessage: logMessage
  };
};