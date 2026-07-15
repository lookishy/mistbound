import type { GameState } from '../types/game';
import { db } from '../services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { earnMoney, evaluateBid } from './mechanics';
import { runBotTurn } from './bot';
import { checkWinCondition } from './winCondition';
import { handleSpecialEvent } from './events';

// Execute a player action and save to Firebase
export const executePlayerAction = async (roomId: string, currentState: GameState, actionType: 'earn' | 'bid', bidParams?: { targetId: string, red: number, blue: number }) => {
    const nextState = JSON.parse(JSON.stringify(currentState)) as GameState;
    const currentTurnIndex = nextState.currentTurnIndex;
    const player = nextState.players[currentTurnIndex];
    let logMessage = '';

    if (actionType === 'earn') {
        const drawn = earnMoney(nextState.secretValues.x, nextState.secretValues.y);
        player.wallet.red += drawn.red;
        player.wallet.blue += drawn.blue;
        logMessage = `${player.name} 选择了赚钱，获得了 ${drawn.red}红 ${drawn.blue}蓝。`;
    } else if (actionType === 'bid' && bidParams) {
        const target = nextState.territories[bidParams.targetId];
        const bidResult = evaluateBid(
            bidParams.red,
            bidParams.blue,
            nextState.secretValues.x,
            nextState.secretValues.y,
            target,
            player
        );

        if (bidResult.success) {
            player.wallet.red -= bidParams.red;
            player.wallet.blue -= bidParams.blue;

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
            target.lastPaid = { red: bidParams.red, blue: bidParams.blue };

            logMessage = bidResult.message;
        } else {
            // Failed bid
            player.wallet.red -= bidParams.red;
            player.wallet.blue -= bidParams.blue;
            logMessage = bidResult.message;
        }
    }

    // 1. Check Win Condition
    if (checkWinCondition(nextState, player.id)) {
        nextState.status = 'finished';
        nextState.winner = player.id;
        logMessage += ` 游戏结束！${player.name} 成功连通了起点与终点！`;
    } else {
        // 2. Next Turn
        nextState.currentTurnIndex = (currentTurnIndex + 1) % nextState.players.length;

        // 3. Increment round count if turn looped to 0
        if (nextState.currentTurnIndex === 0) {
            nextState.roundCount += 1;
            // 4. Handle Special Events
            const eventResult = handleSpecialEvent(nextState);
            if (eventResult) {
                nextState.territories = eventResult.updatedTerritories;
                nextState.currentEvent = eventResult.event;

                // Add event log directly to logs array
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

    // 5. Append player action log
    nextState.logs.push({
        id: Date.now().toString(),
        timestamp: Date.now(),
        message: logMessage
    });

    // Save to Firebase
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, {
        gameState: nextState
    });

    // 6. Check if next turn is a Bot, if so execute Bot turn after a slight delay
    if (nextState.status === 'playing' && nextState.players[nextState.currentTurnIndex].isBot) {
        setTimeout(() => triggerBotTurn(roomId, nextState), 2000);
    }
};

const triggerBotTurn = async (roomId: string, currentState: GameState) => {
    let nextState = JSON.parse(JSON.stringify(currentState)) as GameState;
    const botResult = runBotTurn(nextState);

    if (botResult) {
        nextState = botResult.updatedGameState;
        nextState.logs.push({
            id: Date.now().toString(),
            timestamp: Date.now(),
            message: botResult.actionLogMessage
        });

        // Loop check: Win condition for Bot
        const botPlayer = currentState.players[currentState.currentTurnIndex];
        if (checkWinCondition(nextState, botPlayer.id)) {
            nextState.status = 'finished';
            nextState.winner = botPlayer.id;
            nextState.logs.push({
                id: Date.now().toString() + "_win",
                timestamp: Date.now(),
                message: ` 游戏结束！${botPlayer.name} 成功连通了起点与终点！`
            });
        } else {
            // Loop check: Round and events
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
        await updateDoc(roomRef, {
            gameState: nextState
        });

        // Cascade bot turns if multiple bots are in a row
        if (nextState.status === 'playing' && nextState.players[nextState.currentTurnIndex].isBot) {
             setTimeout(() => triggerBotTurn(roomId, nextState), 2000);
        }
    }
};