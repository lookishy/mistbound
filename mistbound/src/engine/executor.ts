import type { GameState, TokenCombo } from '../types/game';
import { db } from '../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { earnMoneyOptions, evaluateBid } from './mechanics';
import { runBotTurn } from './bot';
import { checkWinCondition } from './winCondition';
import { handleSpecialEvent } from './events';

export const submitGambleBet = async (roomId: string, currentState: GameState, playerId: string, betAmount: number) => {
    const nextState = JSON.parse(JSON.stringify(currentState)) as GameState;
    if (!nextState.gambleState || nextState.gambleState.phase !== 'betting') return;

    const player = nextState.players.find(p => p.id === playerId);
    if (!player) return;

    // Deduct bet from player (randomly taking from red or blue, favoring red if available)
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

    // Auto-bet for bots if not already done
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

    // Check if everyone has bet
    const allBet = nextState.players.every(p => nextState.gambleState!.bets[p.id] !== undefined);
    if (allBet) {
        // Automatically transition to spinning
        setTimeout(() => triggerGambleSpin(roomId, nextState), 1000);
    }
};

export const triggerGambleSpin = async (roomId: string, currentState: GameState) => {
    const nextState = JSON.parse(JSON.stringify(currentState)) as GameState;
    if (!nextState.gambleState) return;

    nextState.gambleState.phase = 'spinning';
    await updateDoc(doc(db, 'rooms', roomId), { gameState: nextState });

    // Wait 3 seconds for spin animation, then resolve
    setTimeout(async () => {
        const finalState = JSON.parse(JSON.stringify(nextState)) as GameState;

        // Pick winner uniformly among all players
        const winnerIndex = Math.floor(Math.random() * finalState.players.length);
        const winner = finalState.players[winnerIndex];

        finalState.gambleState!.phase = 'resolved';
        finalState.gambleState!.winner = winner.id;

        // Give pot to winner (all as red for simplicity, or split. Let's split evenly)
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

        // Wait 3 seconds showing winner, then close modal and resume game
        setTimeout(async () => {
            const closedState = JSON.parse(JSON.stringify(finalState)) as GameState;
            closedState.gambleState = null; // close modal
            await updateDoc(doc(db, 'rooms', roomId), { gameState: closedState });

            // Resume bot if it's bot's turn
            if (closedState.status === 'playing' && closedState.players[closedState.currentTurnIndex].isBot) {
                setTimeout(() => triggerBotTurn(roomId, closedState), 2000);
            }
        }, 3000);

    }, 3000);
};

export const triggerBotTurn = async (roomId: string, currentState: GameState) => {
    let nextState = JSON.parse(JSON.stringify(currentState)) as GameState;
    if (nextState.gambleState) return; // Prevent bot turn if gamble is active

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
                const eventResult = handleSpecialEvent(nextState);
                if (eventResult) {
                    nextState.territories = eventResult.updatedTerritories;
                    nextState.currentEvent = eventResult.event;
                    if (eventResult.gambleState) {
                        nextState.gambleState = eventResult.gambleState;
                    }
                    nextState.logs.push({
                        id: Date.now().toString() + "_evt",
                        timestamp: Date.now(),
                        message: eventResult.logMessage
                    });
                } else {
                    nextState.currentEvent = null;
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
            // FIX: Removed deduction on failed bid
            logMessage = bidResult.message;
        }
    }

    if (checkWinCondition(nextState, player.id)) {
        nextState.status = 'finished';
        nextState.winner = player.id;
        logMessage += `【前线急报】${player.name} 成功贯通战线，夺取最终胜利！`;
    } else {
        nextState.currentTurnIndex = (currentTurnIndex + 1) % nextState.players.length;
        if (nextState.currentTurnIndex === 0) {
            nextState.roundCount += 1;
            const eventResult = handleSpecialEvent(nextState);
            if (eventResult) {
                nextState.territories = eventResult.updatedTerritories;
                nextState.currentEvent = eventResult.event;
                if (eventResult.gambleState) {
                    nextState.gambleState = eventResult.gambleState;
                }
                nextState.logs.push({
                    id: Date.now().toString() + "_evt",
                    timestamp: Date.now(),
                    message: eventResult.logMessage
                });
            } else {
                nextState.currentEvent = null;
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