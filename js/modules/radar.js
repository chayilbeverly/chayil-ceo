/* ============================================
   爆款雷达 — 每日热点发现 + AI 二创方案
   ============================================ */

window.Modules = window.Modules || {};

const RADAR_SEED = [
  // 原有奢侈品爆款
  {
    title: '普通女生如何提升高级感？3个细节立刻不一样',
    platform: 'douyin',
    views: 1280000, likes: 89200, comments: 6800, saves: 12400,
    reasons: ['制造身份焦虑，触发"我也想变高级"的心理', '满足女性成长与审美提升需求', '评论区争议强，"高级感"定义引发讨论', '实用细节可落地，收藏率极高'],
    recreate: {
      title: '卖了4年奢侈品，我发现真正高级的女生都有这5个习惯',
      hook: '做了4年奢侈品，接触过上千个高消费女生，我发现真正高级的人，反而最简单',
      structure: '① 开头3秒抛出反常识观点 → ② 3个真实客户故事(消费观/穿搭/谈吐) → ③ 总结5个习惯 → ④ 引导关注获取完整清单',
      shot: '真人口播 + 门店空镜穿插，自然光，低饱和度调色，配轻爵士BGM',
    },
  },
  // 摆摊爆款
  {
    title: '90后女生摆摊月入5万：一碗面养活一家人',
    platform: 'douyin',
    views: 4500000, likes: 320000, comments: 28500, saves: 89000,
    reasons: ['真实摆摊故事引发共鸣，收入数字制造反差', '女性独立创业话题自带流量', '评论区大量"求带""求配方"互动', '可复制的创业模式，收藏率极高'],
    recreate: {
      title: '辞掉工作摆摊第30天，我的真实收入公开',
      hook: '很多人问我摆摊到底赚不赚钱，今天我打开手机，给你们看30天的完整流水',
      structure: '① 开头亮出30天收入截图 → ② 分解成本和利润 → ③ 3个新手必踩的坑 → ④ 结尾给想摆摊的人3条建议',
      shot: '实拍出摊画面 + 手机录屏流水 + 口播，自然光线，真实不加滤镜',
    },
  },
  {
    title: '全网最全摆摊选址攻略：这5个位置千万别去',
    platform: 'xhs',
    views: 2800000, likes: 186000, comments: 15600, saves: 142000,
    reasons: ['实用刚需内容，每个想摆摊的人都必须看', '"千万别去"反向标题制造紧迫感', '信息密度高，收藏率爆表', '评论区自然变成交流广场，持续引流'],
    recreate: {
      title: '摆摊3个月踩过的坑：选址篇——好位置和差位置差10倍收入',
      hook: '同样的食物，位置差一条街，一天少赚2000块，我用真实对比告诉你',
      structure: '① 开篇展示两个位置的收入对比 → ② 5类坑位详解（死胡同/学校寒暑假/城管区等） → ③ 3步选址法 → ④ 留言区互动"你在哪个城市"',
      shot: '实拍地图标注 + 现场对比视频 + 手机画线标注，信息图风格',
    },
  },
  // 心理成长爆款
  {
    title: '摆摊后我才发现：真正治愈我的不是赚钱',
    platform: 'xhs',
    views: 3600000, likes: 267000, comments: 32000, saves: 95000,
    reasons: ['反套路叙事——大家都在说赚钱，你说治愈', '情绪价值拉满，女性用户强烈共鸣', '真实细腻的文案引爆评论区共情', '从摆摊话题切入心理成长，跨圈传播'],
    recreate: {
      title: '一个人摆摊的第45天，我治好了自己的精神内耗',
      hook: '以前每天晚上焦虑到2点睡不着，现在收摊倒头就睡，不是因为累，而是我找到了比赚钱更重要的东西',
      structure: '① 摆摊前的精神内耗状态 → ② 摆摊后3个心理变化（不再过度思考/接纳不完美/活在当下） → ③ 写给自己的一封信 → ④ 邀请评论区分享心理成长故事',
      shot: '傍晚收摊镜头 + 日记手写特写 + 城市夜景延时，暖色调，轻钢琴BGM',
    },
  },
  {
    title: '32岁裸辞摆摊：我终于不再用别人的标准活',
    platform: 'douyin',
    views: 5200000, likes: 410000, comments: 38000, saves: 67000,
    reasons: ['年龄焦虑+裸辞+摆摊三重话题叠加', '对抗社会时钟的反叛叙事引发强烈共鸣', '"活出自己"价值观触动大量女性用户', '评论区变成大型树洞，互动量爆炸'],
    recreate: {
      title: '30岁后，我用一辆小推车换回了自己的人生',
      hook: '30岁生日那天，我没有吹蜡烛，我递了辞职信。2个月后，我在夜市推着小车，笑得比上班5年加起来都多',
      structure: '① 30岁危机时刻的独白 → ② 摆摊2个月的生活对比（收入/心态/人际关系） → ③ 给同样迷茫的姐妹3句话 → ④ "如果你也在纠结，评论区聊聊"',
      shot: '自我叙事风格，穿插摆摊画面和独处镜头，柔光+手写体字幕，情感饱满',
    },
  },
];

window.Modules.radar = {
  render(container) {
    let d = Store.get();
    if (!d.radar || !d.radar.length) {
      Store.update(data => { data.radar = RADAR_SEED.map(s => ({ id: Store.uid(), ...s, date: Store.todayStr() })); });
      d = Store.get();
    }

    const list = d.radar;

    container.innerHTML = `
      <div class="view">
        <div class="board-col" style="margin-bottom:24px;background:linear-gradient(135deg,var(--gold-glow),transparent);border-color:var(--gold-glow)">
          <div class="board-col-head" style="border:none;margin-bottom:0;padding-bottom:0">
            <div>
              <div class="board-col-title"><span class="dot" style="background:var(--red)"></span> 今日爆款雷达</div>
              <div class="card-sub" style="margin-top:4px">筛选：摆摊创业 · 心理成长 · 奢侈品 · 女性 · 情绪价值 — 已过滤娱乐八卦/低俗/无关热点</div>
            </div>
            <button class="btn btn-gold btn-sm" onclick="Modules.radar.refresh()">◎ 刷新雷达</button>
          </div>
        </div>
        <div class="radar-list" id="radarList"></div>
      </div>
    `;

    this.renderList(list);
  },

  renderList(list) {
    const el = document.getElementById('radarList');
    if (!el) return;
    if (!list.length) { el.innerHTML = UI.empty('今日暂无匹配爆款', '◎'); return; }

    const colors = ['#8A6E3F', '#B85450', '#5B8C6A'];
    el.innerHTML = list.map((v, i) => {
      const isDouyin = v.platform === 'douyin';
      const pName = isDouyin ? '抖音' : '小红书';
      const bg = colors[i % colors.length];
      return `
      <div class="radar-card">
        <div class="radar-top">
          <div class="radar-thumb" style="background:linear-gradient(135deg,${bg},${bg}99)">${pName[0]}</div>
          <div class="radar-info">
            <div class="radar-title">${UI.esc(v.title)}</div>
            <span class="radar-platform-tag ${v.platform}">${pName}</span>
            <span class="radar-platform-tag" style="background:var(--gold-glow);color:var(--gold-deep)">${v.date || Store.todayStr()}</span>
            <div class="radar-stats">
              <div class="radar-stat"><b>${UI.fmtNum(v.views)}</b>播放</div>
              <div class="radar-stat"><b>${UI.fmtNum(v.likes)}</b>点赞</div>
              <div class="radar-stat"><b>${UI.fmtNum(v.comments)}</b>评论</div>
              <div class="radar-stat"><b>${UI.fmtNum(v.saves)}</b>收藏</div>
            </div>
          </div>
        </div>
        <div class="radar-analysis">
          <div class="radar-analysis-label">为什么爆？</div>
          <ul class="radar-reasons">
            ${v.reasons.map(r => `<li>${UI.esc(r)}</li>`).join('')}
          </ul>
        </div>
        <div class="radar-recreate">
          <div class="recreate-label">✦ AI 二创方案 · 我的版本</div>
          <div class="recreate-block">
            <div class="recreate-key">改编标题</div>
            <div class="recreate-val title">${UI.esc(v.recreate.title)}</div>
          </div>
          <div class="recreate-block">
            <div class="recreate-key">开头 3 秒</div>
            <div class="recreate-val">${UI.esc(v.recreate.hook)}</div>
          </div>
          <div class="recreate-block">
            <div class="recreate-key">内容结构</div>
            <div class="recreate-val">${UI.esc(v.recreate.structure)}</div>
          </div>
          <div class="recreate-block" style="margin-bottom:0">
            <div class="recreate-key">拍摄建议</div>
            <div class="recreate-val">${UI.esc(v.recreate.shot)}</div>
          </div>
        </div>
      </div>`;
    }).join('');
  },

  refresh() {
    Store.update(data => {
      const shuffled = [...RADAR_SEED].sort(() => Math.random() - 0.5);
      data.radar = shuffled.map(s => ({ id: Store.uid(), ...s, date: Store.todayStr() }));
    });
    this.renderList(Store.get().radar);
    UI.toast('雷达已刷新 ◎');
  },
};
