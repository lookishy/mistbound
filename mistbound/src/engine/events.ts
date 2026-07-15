import type { GameState, SpecialEvent, Territory } from '../types/game';

export const handleSpecialEvent = (gameState: GameState): { updatedTerritories: Record<string, Territory>, event: SpecialEvent, logMessage: string } | null => {
  if (gameState.roundCount % 4 !== 0 || gameState.roundCount === 0) {
    return null; // Not an event round
  }

  const events: SpecialEvent[] = ['通货膨胀', '经济萧条', '地下赌局', '地产泡沫破裂'];
  const event = events[Math.floor(Math.random() * events.length)];
  let logMessage = '';

  // Copy territories to mutate safely
  const updatedTerritories = JSON.parse(JSON.stringify(gameState.territories)) as Record<string, Territory>;

  switch (event) {
    case '通货膨胀':
      logMessage = '【全局事件：通货膨胀】所有未购买的土地价格临时 +2 分！';
      for (const key in updatedTerritories) {
        if (!updatedTerritories[key].ownerId) {
          updatedTerritories[key].currentPrice += 2;
        }
      }
      break;

    case '经济萧条':
      logMessage = '【全局事件：经济萧条】所有未购买的土地价格临时 -2 分！(最低不低于1分)';
      for (const key in updatedTerritories) {
        if (!updatedTerritories[key].ownerId) {
          updatedTerritories[key].currentPrice = Math.max(1, updatedTerritories[key].currentPrice - 2);
        }
      }
      break;

    case '地下赌局':
      logMessage = '【全局事件：地下赌局】即将开启抽签。(需UI额外配合实现)';
      // Complex interactive event, simplified logic for now
      break;

    case '地产泡沫破裂':
      logMessage = '【全局大事件：地产泡沫破裂！！】全场所有已被占领的领地溢价瞬间清零，恢复初始原价！';
      for (const key in updatedTerritories) {
        if (updatedTerritories[key].ownerId) {
          updatedTerritories[key].currentPrice = updatedTerritories[key].baseValue;
        }
      }
      break;
  }

  return { updatedTerritories, event, logMessage };
};