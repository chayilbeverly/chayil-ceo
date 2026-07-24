/* ============================================
   爆款雷达 — 每日热点发现 + AI 二创方案
   ============================================ */

window.Modules = window.Modules || {};

const RADAR_SEED = [
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
  {
    title: '我的第一只LV包｜中古vs专柜真实对比',
    platform: 'xhs',
    views: 860000, likes: 52300, comments: 3200, saves: 28700,
    reasons: ['对比结构制造好奇，中古vs专柜天然有争议', '实用价值极高，决策前必看', '小红书收藏机制放大传播', '评论区自然带出"在哪买中古"的需求'],
    recreate: {
      title: '从业4年告诉你：中古包到底值不值得买？',
      hook: '每天帮人挑包验包，中古和专柜的区别，我用一组真实数据告诉你',
      structure: '① 开头3秒亮出两只有争议的同款对比 → ② 价格/成色/保值率三维度对比 → ③ 3类人适合买中古 → ④ 结尾引导私信咨询',
      shot: '俯拍桌面平铺对比，暖色调，手部出镜，文字标签清晰标注关键信息',
    },
  },
  {
    title: '月薪3万女生的包柜公开｜不靠男人也能精致',
    platform: 'xhs',
    views: 2100000, likes: 156000, comments: 12400, saves: 31000,
    reasons: ['独立女性人设引发强烈认同', '"不靠男人"触发情绪价值与价值观共鸣', '包柜公开满足窥探欲与向往心理', '评论区两极分化推高热度'],
    recreate: {
      title: '4年卖出上千只包，我见过最独立的女生都在买什么',
      hook: '卖了4年奢侈品，我见过各种女生，真正独立的，消费逻辑完全不一样',
      structure: '① 开头3秒反差"独立≠贵" → ② 3个客户画像(预算不同选择不同) → ③ 独立女生的3个消费观 → ④ 落脚到自我成长',
      shot: '门店实景拍摄，客户故事用B-roll，口播自然，避免炫富感',
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
              <div class="card-sub" style="margin-top:4px">筛选：奢侈品 · 女性 · 成长 · 审美 · 创业 · 情绪价值 — 已过滤娱乐八卦/低俗/无关热点</div>
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
