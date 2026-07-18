import type { Territory, Player, TokenCombo } from '../types/game';

// Helper to generate a single valid combo based on B
// Action 1: Earn Money now generates TWO options

// Action 1: Earn Money now generates TWO options

export const earnMoneyOptions = (_x: number, _y: number, _z: number): [TokenCombo, TokenCombo] => {
  // Generates a random total amount of tokens (N) between 1 and 5
  const N = Math.floor(Math.random() * 5) + 1;

  // Generate a valid 3-token combo for N
  const getCombo = () => {
    const red = Math.floor(Math.random() * (N + 1));
    const blue = Math.floor(Math.random() * (N - red + 1));
    const green = N - red - blue;
    return { red, blue, green };
  };

  const combo1 = getCombo();
  let combo2 = getCombo();

  // Ensure options are distinct if N > 1
  if (N > 1) {
    let attempts = 0;
    while (
      attempts < 10 &&
      combo2.red === combo1.red &&
      combo2.blue === combo1.blue &&
      combo2.green === combo1.green
    ) {
      combo2 = getCombo();
      attempts++;
    }
  }

  return [combo1, combo2];
};

export interface BidResult {
  success: boolean;
  actualValue: number;
  message: string;
  refund?: { red: number; blue: number; green: number; toPlayerId: string };
  newPrice?: number;
}

// Action 2: Bid on Territory

export const evaluateBid = (
  bidRed: number,
  bidBlue: number,
  bidGreen: number,
  x: number,
  y: number,
  z: number,
  territory: Territory,
  player: Player
): BidResult => {
  if (territory.locked) {
    return { success: false, actualValue: 0, message: `防线【${territory.name}】已永久封锁，无法攻占。资金已安全退回！` };
  }

  if (player.wallet.red < bidRed || player.wallet.blue < bidBlue || player.wallet.green < bidGreen) {
    return { success: false, actualValue: 0, message: `资金不足，无法执行攻占。资金已安全退回！` };
  }

  if (territory.id === 'start' || territory.id === 'end') {
     return { success: false, actualValue: 0, message: `大本营（起点/终点）不可被攻占！资金已安全退回！` };
  }

  const P = bidRed * x + bidBlue * y + bidGreen * z;
  const V = territory.currentPrice;

  if (P >= V) {
    let refund = undefined;
    if (territory.ownerId && territory.ownerId !== player.id && territory.lastPaid) {
      refund = {
        red: territory.lastPaid.red,
        blue: territory.lastPaid.blue,
        green: territory.lastPaid.green,
        toPlayerId: territory.ownerId
      };
    }

    const newPrice = V * 2;

    return {
      success: true,
      actualValue: P,
      newPrice,
      refund,
      message: `[前线战报] ${player.name} 成功夺取【${territory.name}】，花费了 *红、*蓝、*绿晶`
    };
  } else {
    return {
      success: false,
      actualValue: P,
      message: `[前线战报] ${player.name} 对【${territory.name}】的攻势被击退，花费了 *红、*蓝、*绿晶`
    };
  }
};
