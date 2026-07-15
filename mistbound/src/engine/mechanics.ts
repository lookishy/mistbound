import type { Territory, Player, TokenCombo } from '../types/game';

// Helper to generate a single valid combo based on B
// Action 1: Earn Money now generates TWO options

// Action 1: Earn Money now generates TWO options

export const earnMoneyOptions = (_x: number, _y: number): [TokenCombo, TokenCombo] => {
  // Generates a random total amount of tokens (N) between 1 and 5
  const N = Math.floor(Math.random() * 5) + 1;

  // Generate two options where red + blue = N, but red1 != red2
  const red1 = Math.floor(Math.random() * (N + 1));
  const blue1 = N - red1;

  let red2 = Math.floor(Math.random() * (N + 1));
  while (red2 === red1) {
      red2 = Math.floor(Math.random() * (N + 1));
  }
  const blue2 = N - red2;

  return [
      { red: red1, blue: blue1 },
      { red: red2, blue: blue2 }
  ];
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
      message: `[前线战报] ${player.name} 对【${territory.name}】发起攻势，投入了 ${bidRed} 红晶、${bidBlue} 蓝晶！战线贯通，成功夺取领地！`
    };
  } else {
    return {
      success: false,
      actualValue: P,
      message: `[前线战报] ${player.name} 对【${territory.name}】发起攻势，投入了 ${bidRed} 红晶、${bidBlue} 蓝晶！资产不足，攻势被击退，代币已安全退回钱包！`
    };
  }
};
