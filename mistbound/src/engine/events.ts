import type { GameState, SpecialEvent, Territory, GambleState } from '../types/game';

export const handleSpecialEvent = (gameState: GameState): { updatedTerritories: Record<string, Territory>, event: SpecialEvent, logMessage: string, gambleState?: GambleState } | null => {
  if (gameState.roundCount % 4 !== 0 || gameState.roundCount === 0) {
    return null; // Not an event round
  }

  const events: SpecialEvent[] = ['通货膨胀', '经济萧条', '地下赌局', '地产泡沫破裂'];
  const event = events[Math.floor(Math.random() * events.length)];
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

  return { updatedTerritories, event, logMessage, gambleState };
};