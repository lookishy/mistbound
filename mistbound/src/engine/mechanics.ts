import type { Territory, Player, TokenCombo } from '../types/game';

// Helper to generate a single valid combo based on B
const generateSingleCombo = (B: number): TokenCombo => {
  if (B <= 4) {
    const combos = [
      { red: 3, blue: 2 }, { red: 2, blue: 3 }, { red: 4, blue: 0 },
      { red: 0, blue: 4 }, { red: 5, blue: 0 }, { red: 0, blue: 5 },
      { red: 4, blue: 1 }, { red: 1, blue: 4 }
    ];
    return combos[Math.floor(Math.random() * combos.length)];
  } else if (B >= 5 && B <= 7) {
    const combos = [
      { red: 1, blue: 1 }, { red: 2, blue: 1 }, { red: 1, blue: 2 },
      { red: 2, blue: 0 }, { red: 0, blue: 2 }, { red: 3, blue: 0 },
      { red: 0, blue: 3 }
    ];
    return combos[Math.floor(Math.random() * combos.length)];
  } else {
    const combos = [
      { red: 1, blue: 0 }, { red: 0, blue: 1 }, { red: 1, blue: 1 },
      { red: 2, blue: 0 }, { red: 0, blue: 2 }
    ];
    return combos[Math.floor(Math.random() * combos.length)];
  }
};

// Action 1: Earn Money now generates TWO options
export const earnMoneyOptions = (x: number, y: number): [TokenCombo, TokenCombo] => {
  const B = x + y;
  const combo1 = generateSingleCombo(B);
  let combo2 = generateSingleCombo(B);

  // Try to make them different if possible
  let attempts = 0;
  while (combo1.red === combo2.red && combo1.blue === combo2.blue && attempts < 5) {
      combo2 = generateSingleCombo(B);
      attempts++;
  }

  return [combo1, combo2];
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
    return { success: false, actualValue: 0, message: `领地【${territory.name}】已永久锁定，无法购买。` };
  }

  if (player.wallet.red < bidRed || player.wallet.blue < bidBlue) {
    return { success: false, actualValue: 0, message: `资金不足，无法执行报价。` };
  }

  // Cannot buy START or END
  if (territory.id === 'start' || territory.id === 'end') {
     return { success: false, actualValue: 0, message: `大本营（起点/终点）不可被购买！` };
  }

  const P = bidRed * x + bidBlue * y;
  const V = territory.currentPrice;

  if (P >= V) {
    let refund = undefined;
    if (territory.ownerId && territory.ownerId !== player.id && territory.lastPaid) {
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
      message: `${player.name} 成功夺取【${territory.name}】！(溢价不找零)`
    };
  } else {
    return {
      success: false,
      actualValue: P,
      message: `${player.name} 对【${territory.name}】投入 ${bidRed}红${bidBlue}蓝... 被无情拒绝了！(金额太低)`
    };
  }
};