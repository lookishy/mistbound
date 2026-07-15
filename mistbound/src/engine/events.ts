import type { GameState, SpecialEvent, Territory, GambleState } from '../types/game';


// Phase 1: Determine what event will happen (Triggers the UI overlay)
export const determineSpecialEvent = (gameState: GameState): SpecialEvent => {
  // SPECIAL EVENTS DISABLED TEMPORARILY FOR TESTING
  return null;

  if (gameState.roundCount % 4 !== 0 || gameState.roundCount === 0) {
    return null;
  }
  const events: SpecialEvent[] = ['通货膨胀', '经济萧条', '地下赌局', '地产泡沫破裂'];
  return events[Math.floor(Math.random() * events.length)];
};

// Phase 2: Resolve the actual logic of the event (Called automatically after overlay finishes)
export const resolveSpecialEvent = (gameState: GameState, event: SpecialEvent): { updatedTerritories: Record<string, Territory>, logMessage: string, gambleState?: GambleState } => {
  let logMessage = '';
  let gambleState: GambleState | undefined;
  const updatedTerritories = JSON.parse(JSON.stringify(gameState.territories)) as Record<string, Territory>;

  switch (event) {
    case '通货膨胀':
      logMessage = '【战争通报】通货膨胀爆发，所有中立区防线升级，攻占成本 +2！';
      for (const key in updatedTerritories) {
        if (!updatedTerritories[key].ownerId && updatedTerritories[key].baseValue > 0) {
          updatedTerritories[key].currentPrice += 2;
        }
      }
      break;

    case '经济萧条':
      logMessage = '【战争通报】战时萧条，所有中立区防线脆弱，攻占成本 -2！';
      for (const key in updatedTerritories) {
        if (!updatedTerritories[key].ownerId && updatedTerritories[key].baseValue > 0) {
          updatedTerritories[key].currentPrice = Math.max(1, updatedTerritories[key].currentPrice - 2);
        }
      }
      break;

    case '地下赌局':
      logMessage = '【战争通报】命运轮盘启动！各方势力开始押注资源！';
      gambleState = {
        active: true,
        bets: {},
        pot: 0,
        winner: null,
        phase: 'betting'
      };
      break;

    case '地产泡沫破裂':
      logMessage = '【最高警报】防线崩溃！！所有已占领要塞溢价清零，退回基础成本！';
      for (const key in updatedTerritories) {
        if (updatedTerritories[key].ownerId && updatedTerritories[key].baseValue > 0) {
          updatedTerritories[key].currentPrice = updatedTerritories[key].baseValue;
        }
      }
      break;
  }

  return { updatedTerritories, logMessage, gambleState };
};