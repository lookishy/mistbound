import type { Territory, Player } from '../types/game';

// Action 1: Earn Money
// Based on the secret B = x + y, returns drawn tokens
export const earnMoney = (x: number, y: number): { red: number; blue: number } => {
  const B = x + y;
  let red = 0;
  let blue = 0;

  if (B <= 4) {
    // 大钱包库 (4~5 tokens)
    const combos = [
      { red: 3, blue: 2 },
      { red: 2, blue: 3 },
      { red: 4, blue: 0 },
      { red: 0, blue: 4 },
      { red: 5, blue: 0 },
      { red: 0, blue: 5 },
      { red: 4, blue: 1 },
      { red: 1, blue: 4 }
    ];
    const combo = combos[Math.floor(Math.random() * combos.length)];
    red = combo.red;
    blue = combo.blue;
  } else if (B >= 5 && B <= 7) {
    // 标准库 (2~3 tokens)
    const combos = [
      { red: 1, blue: 1 },
      { red: 2, blue: 1 },
      { red: 1, blue: 2 },
      { red: 2, blue: 0 },
      { red: 0, blue: 2 },
      { red: 3, blue: 0 },
      { red: 0, blue: 3 }
    ];
    const combo = combos[Math.floor(Math.random() * combos.length)];
    red = combo.red;
    blue = combo.blue;
  } else {
    // 紧缩库 (B >= 8) (1~2 tokens)
    const combos = [
      { red: 1, blue: 0 },
      { red: 0, blue: 1 },
      { red: 1, blue: 1 },
      { red: 2, blue: 0 },
      { red: 0, blue: 2 }
    ];
    const combo = combos[Math.floor(Math.random() * combos.length)];
    red = combo.red;
    blue = combo.blue;
  }

  return { red, blue };
};

export interface BidResult {
  success: boolean;
  actualValue: number;
  message: string;
  refund?: { red: number; blue: number; toPlayerId: string };
  newPrice?: number;
}

// Action 2: Bid on Territory
export const evaluateBid = (
  bidRed: number,
  bidBlue: number,
  x: number,
  y: number,
  territory: Territory,
  player: Player
): BidResult => {
  if (territory.locked) {
    return { success: false, actualValue: 0, message: `领地【${territory.id}】已永久锁定，无法购买。` };
  }

  if (player.wallet.red < bidRed || player.wallet.blue < bidBlue) {
    return { success: false, actualValue: 0, message: `资金不足，无法执行报价。` };
  }

  const P = bidRed * x + bidBlue * y;
  const V = territory.currentPrice;

  if (P >= V) {
    // Success
    let refund = undefined;
    if (territory.ownerId && territory.ownerId !== player.id && territory.lastPaid) {
      // It's a steal! Refund the previous owner
      refund = {
        red: territory.lastPaid.red,
        blue: territory.lastPaid.blue,
        toPlayerId: territory.ownerId
      };
    }

    const newPrice = V * 2;

    return {
      success: true,
      actualValue: P,
      newPrice,
      refund,
      message: `玩家 ${player.name} 成功拍下【${territory.id}】！(溢价不找零)`
    };
  } else {
    // Fail
    return {
      success: false,
      actualValue: P,
      message: `玩家 ${player.name} 对【${territory.id}】报价 ${bidRed}红${bidBlue}蓝。系统反馈：低了！`
    };
  }
};
