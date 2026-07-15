import type { GameState, TokenCombo } from '../types/game';
import { db } from '../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { earnMoneyOptions, evaluateBid } from './mechanics';
import { runBotTurn } from './bot';
import { checkWinCondition } from './winCondition';
import { determineSpecialEvent, resolveSpecialEvent } from './events';

export const triggerSpecialEventResolution = async (roomId: string, currentState: GameState) => {
    if (currentState.status !== 'event' || !currentState.pendingEvent) return;

    const nextState = JSON.parse(JSON.stringify(currentState)) as GameState;

    // Resolve the actual logic of the event that was pending
    const resolveResult = resolveSpecialEvent(nextState, nextState.pendingEvent);

    nextState.territories = resolveResult.updatedTerritories;
    nextState.logs.push({
        id: Date.now().toString() + "_evt",
        timestamp: Date.now(),
        message: resolveResult.logMessage
    });

    if (resolveResult.gambleState) {
        nextState.gambleState = resolveResult.gambleState;
    }


    // Clear event overlay state, return to playing
    nextState.currentEvent = null;
    nextState.pendingEvent = null;
    nextState.status = 'playing';

    // Reset timer for the player whose turn it is now
    nextState.turnStartTime = Date.now();
    nextState.turnExtension = 'none';


    await updateDoc(doc(db, 'rooms', roomId), { gameState: nextState });

    // If it's a bot's turn and no gamble is active, trigger bot
    if (nextState.players[nextState.currentTurnIndex].isBot && !nextState.gambleState) {
        setTimeout(() => triggerBotTurn(roomId, nextState), 2000);
    }
}

export const submitGambleBet = async (roomId: string, currentState: GameState, playerId: string, betAmount: number) => {
    const nextState = JSON.parse(JSON.stringify(currentState)) as GameState;
    if (!nextState.gambleState || nextState.gambleState.phase !== 'betting') return;

    const player = nextState.players.find(p => p.id === playerId);
    if (!player) return;

    let remainingBet = betAmount;
    let actualBet = 0;
    while(remainingBet > 0 && (player.wallet.red > 0 || player.wallet.blue > 0)) {
        if (player.wallet.red > 0) {
            player.wallet.red -= 1;
        } else {
            player.wallet.blue -= 1;
        }
        remainingBet -= 1;
        actualBet += 1;
    }

    nextState.gambleState.bets[playerId] = actualBet;
    nextState.gambleState.pot += actualBet;

    nextState.players.filter(p => p.isBot).forEach(bot => {
        if (nextState.gambleState!.bets[bot.id] === undefined) {
            let botBet = Math.floor(Math.random() * Math.min(3, bot.wallet.red + bot.wallet.blue + 1));
            let bRemaining = botBet;
            let bActual = 0;
            while(bRemaining > 0 && (bot.wallet.red > 0 || bot.wallet.blue > 0)) {
                if (bot.wallet.red > 0) { bot.wallet.red -= 1; }
                else { bot.wallet.blue -= 1; }
                bRemaining -= 1;
                bActual += 1;
            }
            nextState.gambleState!.bets[bot.id] = bActual;
            nextState.gambleState!.pot += bActual;
        }
    });

    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, { gameState: nextState });

    const allBet = nextState.players.every(p => nextState.gambleState!.bets[p.id] !== undefined);
    if (allBet) {
        setTimeout(() => triggerGambleSpin(roomId, nextState), 1000);
    }
};

export const triggerGambleSpin = async (roomId: string, currentState: GameState) => {
    const nextState = JSON.parse(JSON.stringify(currentState)) as GameState;
    if (!nextState.gambleState) return;

    nextState.gambleState.phase = 'spinning';
    await updateDoc(doc(db, 'rooms', roomId), { gameState: nextState });

    setTimeout(async () => {
        const finalState = JSON.parse(JSON.stringify(nextState)) as GameState;
        const winnerIndex = Math.floor(Math.random() * finalState.players.length);
        const winner = finalState.players[winnerIndex];

        finalState.gambleState!.phase = 'resolved';
        finalState.gambleState!.winner = winner.id;

        const pot = finalState.gambleState!.pot;
        const half = Math.floor(pot / 2);
        winner.wallet.red += half;
        winner.wallet.blue += (pot - half);

        finalState.logs.push({
            id: Date.now().toString(),
            timestamp: Date.now(),
            message: `【赌局结算】${winner.name} 独揽大奖，获得 ${pot} 个资源！`
        });

        await updateDoc(doc(db, 'rooms', roomId), { gameState: finalState });

        setTimeout(async () => {
            const closedState = JSON.parse(JSON.stringify(finalState)) as GameState;
            closedState.gambleState = null;
            await updateDoc(doc(db, 'rooms', roomId), { gameState: closedState });

            if (closedState.status === 'playing' && closedState.players[closedState.currentTurnIndex].isBot) {
                setTimeout(() => triggerBotTurn(roomId, closedState), 2000);
            }
        }, 3000);

    }, 3000);
};

export const triggerBotTurn = async (roomId: string, currentState: GameState) => {
    let nextState = JSON.parse(JSON.stringify(currentState)) as GameState;
    if (nextState.gambleState || nextState.status !== 'playing') return;

    const botResult = runBotTurn(nextState);

    if (botResult) {
        nextState = botResult.updatedGameState;
        nextState.logs.push({
            id: Date.now().toString(),
            timestamp: Date.now(),
            message: botResult.actionLogMessage
        });

        const botPlayer = currentState.players[currentState.currentTurnIndex];
        if (checkWinCondition(nextState, botPlayer.id)) {
            nextState.status = 'finished';
            nextState.winner = botPlayer.id;
            nextState.logs.push({
                id: Date.now().toString() + "_win",
                timestamp: Date.now(),
                message: `【前线急报】${botPlayer.name} 成功贯通战线，夺取最终胜利！`
            });
        } else {
            if (nextState.currentTurnIndex === 0) {
                nextState.roundCount += 1;
                const upcomingEvent = determineSpecialEvent(nextState);
                if (upcomingEvent) {
                    nextState.status = 'event';
                    nextState.currentEvent = upcomingEvent;
                    nextState.pendingEvent = upcomingEvent;
                    // Note: We don't resolve logic here anymore. We wait for client to call triggerSpecialEventResolution.
                }
            }
        }

        const roomRef = doc(db, 'rooms', roomId);
        await updateDoc(roomRef, { gameState: nextState });

        if (nextState.status === 'playing' && nextState.players[nextState.currentTurnIndex].isBot && !nextState.gambleState) {
             setTimeout(() => triggerBotTurn(roomId, nextState), 2000);
        }
    }
};

export const executePlayerAction = async (
    roomId: string,
    currentState: GameState,
    actionType: 'earn_init' | 'earn_confirm' | 'bid',
    params?: { targetId?: string, red?: number, blue?: number, chosenCombo?: TokenCombo }
) => {
    const nextState = JSON.parse(JSON.stringify(currentState)) as GameState;
    if (nextState.status !== 'playing') return;

    const currentTurnIndex = nextState.currentTurnIndex;
    const player = nextState.players[currentTurnIndex];
    let logMessage = '';

    if (actionType === 'earn_init') {
        const options = earnMoneyOptions(nextState.secretValues.x, nextState.secretValues.y);
        nextState.pendingDrawCards = options;
        const roomRef = doc(db, 'rooms', roomId);
        await updateDoc(roomRef, { gameState: nextState });
        return;
    }

    if (actionType === 'earn_confirm' && params?.chosenCombo) {
        player.wallet.red += params.chosenCombo.red;
        player.wallet.blue += params.chosenCombo.blue;
        nextState.pendingDrawCards = null;
        logMessage = `${player.name} 选择了补给：获得 ${params.chosenCombo.red}红 ${params.chosenCombo.blue}蓝。`;
    }

    if (actionType === 'bid' && params?.targetId !== undefined && params?.red !== undefined && params?.blue !== undefined) {
        const target = nextState.territories[params.targetId];
        const bidResult = evaluateBid(
            params.red,
            params.blue,
            nextState.secretValues.x,
            nextState.secretValues.y,
            target,
            player
        );

        if (bidResult.success) {
            player.wallet.red -= params.red;
            player.wallet.blue -= params.blue;

            if (bidResult.refund) {
                const prevOwnerIndex = nextState.players.findIndex(p => p.id === bidResult.refund!.toPlayerId);
                if (prevOwnerIndex !== -1) {
                    nextState.players[prevOwnerIndex].wallet.red += bidResult.refund!.red;
                    nextState.players[prevOwnerIndex].wallet.blue += bidResult.refund!.blue;
                }
            }

            target.ownerId = player.id;
            target.stolenCount += 1;
            if (target.stolenCount >= 3) {
                target.locked = true;
            }
            target.currentPrice = bidResult.newPrice!;
            target.lastPaid = { red: params.red, blue: params.blue };

            logMessage = bidResult.message;
        } else {
            logMessage = bidResult.message;
        }
    }

    if (checkWinCondition(nextState, player.id)) {
        nextState.status = 'finished';
        nextState.winner = player.id;
        logMessage += `【前线急报】${player.name} 成功贯通战线，夺取最终胜利！`;
    } else {
        nextState.currentTurnIndex = (currentTurnIndex + 1) % nextState.players.length;
        nextState.turnStartTime = Date.now();
        nextState.turnExtension = 'none';
        if (nextState.currentTurnIndex === 0) {
            nextState.roundCount += 1;
            const upcomingEvent = determineSpecialEvent(nextState);
            if (upcomingEvent) {
                nextState.status = 'event';
                nextState.currentEvent = upcomingEvent;
                nextState.pendingEvent = upcomingEvent;
            }
        }
    }

    nextState.logs.push({
        id: Date.now().toString(),
        timestamp: Date.now(),
        message: logMessage
    });

    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, { gameState: nextState });

    if (nextState.status === 'playing' && nextState.players[nextState.currentTurnIndex].isBot && !nextState.gambleState) {
        setTimeout(() => triggerBotTurn(roomId, nextState), 2000);
    }
};



export const checkTurnTimeout = async (roomId: string, currentState: GameState, hostId: string) => {
    // Only host performs timeout checks
    if (currentState.hostId !== hostId) return;
    if (currentState.status !== 'playing') return;

    let modified = false;
    const nextState = JSON.parse(JSON.stringify(currentState)) as GameState;
    const now = Date.now();
    const currentTurnPlayer = nextState.players[nextState.currentTurnIndex];

    if (currentTurnPlayer.isBot || !currentTurnPlayer.connected) return;

    // 120s base time, +30s if extended. (But popup happens when base is exhausted)
    const timeElapsed = now - nextState.turnStartTime;

    if (nextState.turnExtension === 'none' && timeElapsed > 120000) {
        // Base time exhausted, popup extension
        nextState.turnExtension = 'pending';
        nextState.turnExtensionTime = now;
        modified = true;
    } else if (nextState.turnExtension === 'pending') {
        // Wait 15s for response
        const extensionElapsed = now - nextState.turnExtensionTime;
        if (extensionElapsed > 15000) {
            // Player did not respond, disconnect them
            currentTurnPlayer.connected = false;
            currentTurnPlayer.isBot = true;
            currentTurnPlayer.name = `${currentTurnPlayer.name} (脱机接管)`;

            nextState.logs.push({
                id: Date.now().toString() + "_" + currentTurnPlayer.id,
                timestamp: Date.now(),
                message: `【通讯中断】${currentTurnPlayer.name} 失去连接，AI 僚机已接管其防区！`
            });

            nextState.pendingDrawCards = null;
            modified = true;
        }
    } else if (nextState.turnExtension === 'granted') {
         // Additional 30s elapsed? -> force skip turn
         const extensionElapsed = now - nextState.turnExtensionTime;
         if (extensionElapsed > 30000) {
              // Time's up entirely, skip turn but keep connected
              nextState.logs.push({
                  id: Date.now().toString() + "_skip",
                  timestamp: Date.now(),
                  message: `【指挥延误】${currentTurnPlayer.name} 思考超时，错失本轮战机！`
              });

              nextState.pendingDrawCards = null;
              nextState.currentTurnIndex = (nextState.currentTurnIndex + 1) % nextState.players.length;
              if (nextState.currentTurnIndex === 0) {
                  nextState.roundCount += 1;
                  const upcomingEvent = determineSpecialEvent(nextState);
                  if (upcomingEvent) {
                      nextState.status = 'event';
                      nextState.currentEvent = upcomingEvent;
                      nextState.pendingEvent = upcomingEvent;
                  }
              }
              nextState.turnStartTime = Date.now();
              nextState.turnExtension = 'none';
              modified = true;
         }
    }

    if (modified) {
        await updateDoc(doc(db, 'rooms', roomId), { gameState: nextState });

        // If it was their turn, trigger bot turn or if it just advanced to a bot
        if (nextState.status === 'playing' && nextState.players[nextState.currentTurnIndex].isBot && !nextState.gambleState) {
            setTimeout(() => triggerBotTurn(roomId, nextState), 2000);
        }
    }
};

export const extendTurnTime = async (roomId: string, currentState: GameState, playerId: string) => {
    if (currentState.players[currentState.currentTurnIndex].id !== playerId) return;
    if (currentState.turnExtension !== 'pending') return;

    const nextState = JSON.parse(JSON.stringify(currentState)) as GameState;
    nextState.turnExtension = 'granted';
    nextState.turnExtensionTime = Date.now();

    await updateDoc(doc(db, 'rooms', roomId), { gameState: nextState });
}
