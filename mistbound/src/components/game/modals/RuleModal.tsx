import React from 'react';

interface RuleModalProps {
  onClose: () => void;
}

export const RuleModal: React.FC<RuleModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="earth-panel p-8 rounded-xl border border-[#5C4033] max-w-2xl w-full relative shadow-[0_0_30px_rgba(0,0,0,0.8)]">

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl font-bold"
        >
          ✕
        </button>

        <h2 className="text-3xl font-black text-yellow-500 mb-6 border-b border-[#5C4033] pb-2 text-center">作战守则</h2>

        <div className="space-y-6 text-gray-300 leading-relaxed max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-[#5C4033] pr-2">
            <section>
                <h3 className="text-xl font-bold text-white mb-2">1. 战役目标</h3>
                <p>在此绝密战区，你的目标是建立一条从【大本营(起)】到【敌军之冠(终)】的连续防线连通图。率先贯通战线者即可夺取最终胜利。</p>
            </section>

            <section>
                <h3 className="text-xl font-bold text-white mb-2">2. 军备补给（红晶与蓝晶）</h3>
                <p>回合内，若不执行攻占，可点击【呼叫后勤补给】。你将从两套随机物资中任选其一。红蓝晶矿的隐秘市价随战局波动，切勿让敌军洞悉你的底牌。</p>
            </section>

            <section>
                <h3 className="text-xl font-bold text-white mb-2">3. 攻占与掠夺防线</h3>
                <p>在大地图点击目标节点发起攻占。若投入的红蓝晶隐性总价值 <span className="text-yellow-400 font-bold">大于等于该领地标价</span>，攻占成功。此时领地标价将翻倍！</p>
                <p className="text-red-400 mt-1">注意：一旦成功掠夺他人领地，原驻军将获得【全额撤退补偿】（退回原先投入的晶矿）。同一防线最多易手3次，第3次后将陷入永久封锁。</p>
            </section>

            <section>
                <h3 className="text-xl font-bold text-yellow-500 mb-2">4. 战争风暴（突发事件）</h3>
                <p>每经历 4 轮交火，必发全局事件：</p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                <li><span className="text-red-400 font-bold">通货膨胀：</span>所有无主之地标价 +2</li>
                <li><span className="text-green-400 font-bold">经济萧条：</span>所有无主之地标价 -2</li>
                <li><span className="text-purple-400 font-bold">地下赌局：</span>全员强行下注（最多2个晶矿），轮盘指针独揽奖池！</li>
                <li><span className="text-yellow-600 font-bold">防线崩溃：</span>所有已被占领防线的翻倍溢价被抹除，强行恢复初始底价！</li>
                </ul>
            </section>
        </div>

        <div className="mt-8 text-center">
            <button
                onClick={onClose}
                className="bg-[#5C4033] hover:bg-[#8B5A2B] text-white font-bold py-2 px-8 rounded transition-all"
            >
                明白，长官！
            </button>
        </div>

      </div>
    </div>
  );
};