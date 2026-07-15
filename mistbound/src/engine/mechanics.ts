import type { Territory, Player, TokenCombo } from '../types/game';

// Helper to generate a single valid combo based on B
// Action 1: Earn Money now generates TWO options

// Action 1: Earn Money now generates TWO options
export const earnMoneyOptions = (x: number, y: number): [TokenCombo, TokenCombo] => {
  const B = x + y;

  if (B <= 4) {
      // Big pool: 4-5 tokens. Complementary options.
      const pool = [
          [{ red: 4, blue: 0 }, { red: 1, blue: 3 }],
          [{ red: 0, blue: 4 }, { red: 3, blue: 1 }],
          [{ red: 3, blue: 2 }, { red: 2, blue: 3 }],
          [{ red: 2, blue: 2 }, { red: 4, blue: 1 }],
          [{ red: 1, blue: 4 }, { red: 5, blue: 0 }]
      ];
      return pool[Math.floor(Math.random() * pool.length)] as [TokenCombo, TokenCombo];
  } else if (B >= 5 && B <= 7) {
      // Standard pool: 2-3 tokens. Complementary options.
      const pool = [
          [{ red: 2, blue: 0 }, { red: 0, blue: 3 }],
          [{ red: 0, blue: 2 }, { red: 3, blue: 0 }],
          [{ red: 1, blue: 2 }, { red: 2, blue: 1 }],
          [{ red: 2, blue: 0 }, { red: 1, blue: 1 }],
          [{ red: 1, blue: 1 }, { red: 0, blue: 2 }]
      ];
      return pool[Math.floor(Math.random() * pool.length)] as [TokenCombo, TokenCombo];
  } else {
      // Tight pool: 1-2 tokens. Complementary options.
      const pool = [
          [{ red: 2, blue: 0 }, { red: 0, blue: 2 }],
          [{ red: 1, blue: 0 }, { red: 0, blue: 1 }],
          [{ red: 1, blue: 0 }, { red: 1, blue: 1 }],
          [{ red: 0, blue: 1 }, { red: 1, blue: 1 }]
      ];
      return pool[Math.floor(Math.random() * pool.length)] as [TokenCombo, TokenCombo];
  }
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
    return { success: false, actualValue: 0, message: `防线【${territory.name}】已永久封锁，无法攻占。资金已安全退回！` };
  }

  if (player.wallet.red < bidRed || player.wallet.blue < bidBlue) {
    return { success: false, actualValue: 0, message: `资金不足，无法执行攻占。资金已安全退回！` };
  }

  // Cannot buy START or END
  if (territory.id === 'start' || territory.id === 'end') {
     return { success: false, actualValue: 0, message: `大本营（起点/终点）不可被攻占！资金已安全退回！` };
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
      message: `${player.name} 成功夺取【${territory.name}】！(溢价部分化作战争损耗，不予找零)`
    };
  } else {
    // UPDATED FAIL MESSAGE
    return {
      success: false,
      actualValue: P,
      message: `资金不足！${player.name} 对【${territory.name}】的攻势被击退。投入的 ${bidRed}红${bidBlue}蓝 代币已安全退回指挥部！`
    };
  }
};