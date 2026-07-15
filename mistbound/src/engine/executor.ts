import type { GameState, TokenCombo } from '../types/game';
import { db } from '../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { earnMoneyOptions, evaluateBid } from './mechanics';
import { runBotTurn } from './bot';
import { checkWinCondition } from './winCondition';
import { handleSpecialEvent } from './events';

export const triggerBotTurn = async (roomId: string, currentState: GameState) => {
    let nextState = JSON.parse(JSON.stringify(currentState)) as GameState;
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

        if (nextState.status === 'playing' && nextState.players[nextState.currentTurnIndex].isBot) {
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
        // Don't advance turn, wait for confirm
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
            player.wallet.red -= params.red;
            player.wallet.blue -= params.blue;
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

    if (nextState.status === 'playing' && nextState.players[nextState.currentTurnIndex].isBot) {
        setTimeout(() => triggerBotTurn(roomId, nextState), 2000);
    }
};