/* ============================================
   爆款雷达 v4 — 奢侈品包包垂直领域
   已清除所有摆摊内容，聚焦买包/奢侈品
   ============================================ */

window.Modules = window.Modules || {};

const RADAR_SEED = [
  {
    title: '月薪5000也能背大牌！平价买包攻略大公开',
    platform: 'douyin', views: 2800000, likes: 196000, comments: 18500, saves: 89000,
    reasons: ['收入与消费的反差引发好奇', '实用攻略内容收藏率极高', '评论区大量"求渠道""求链接"互动'],
    emotionPoint: '希望感 + "我也可以"的心理',
    structure: '收入开篇 \u2192 预算规划 \u2192 3个平价渠道 \u2192 避坑提醒 \u2192 互动收尾',
    myAdaptation: '',
    recreate: {
      title: '卖了4年奢侈品，我告诉你月薪5000怎么买大牌包',
      hook: '别被专柜价格吓退，我做了4年奢侈品，今天告诉你3个渠道，同样的包能省一半',
      structure: '\u2460 开头亮出差价对比 \u2192 \u2461 3个靠谱渠道逐一分析 \u2192 \u2462 每个渠道适合什么人 \u2192 \u2463 避坑3条铁律',
      shot: '真人口播 + 手机录屏价格对比 + 实物展示，自然光，清晰为主',
    },
  },
  {
    title: '第一只奢侈品包怎么选？LV/Chanel/Gucci新手指南',
    platform: 'xhs', views: 1500000, likes: 128000, comments: 9800, saves: 156000,
    reasons: ['新手刚需内容，搜索量巨大', '品牌对比引发讨论', '图文形式收藏率爆表'],
    emotionPoint: '选择焦虑 + 对"第一只"的仪式感',
    structure: '预算分层 \u2192 品牌特点 \u2192 经典款推荐 \u2192 搭配建议 \u2192 互动收尾',
    myAdaptation: '',
    recreate: {
      title: '做了4年奢侈品，我建议你的第一只大牌包选这几款',
      hook: '很多人问我第一只奢侈品包买什么，我接触过上万只包，今天给你最实在的建议',
      structure: '\u2460 按预算分3档 \u2192 \u2461 每档推荐2-3款 \u2192 \u2462 为什么推荐这几款 \u2192 \u2463 评论区告诉我你的预算',
      shot: '图文合集 + 实物试背 + 价格标注，干净背景，高级感排版',
    },
  },
  {
    title: '代购水有多深？3分钟教你辨别靠谱代购',
    platform: 'douyin', views: 3200000, likes: 245000, comments: 22000, saves: 134000,
    reasons: ['行业揭秘类内容天然吸引流量', '实用避坑内容收藏率极高', '评论区大量真实经历分享'],
    emotionPoint: '安全感需求 + 怕被骗的焦虑',
    structure: '痛点开篇 \u2192 假代购3个特征 \u2192 靠谱代购5个标准 \u2192 验货流程 \u2192 互动收尾',
    myAdaptation: '',
    recreate: {
      title: '做了4年奢侈品，教你3秒辨别靠谱代购',
      hook: '代购水有多深？我见过太多人花几万块买到假货，今天把我的辨别方法全告诉你',
      structure: '\u2460 假代购3个特征 \u2192 \u2461 靠谱代购5个标准 \u2192 \u2462 验货3步法 \u2192 \u2463 评论区说说你的经历',
      shot: '真人口播 + 手机录屏案例 + 实物对比，节奏明快',
    },
  },
  {
    title: '中古包为什么越来越火？看完你就懂了',
    platform: 'xhs', views: 980000, likes: 76000, comments: 6200, saves: 112000,
    reasons: ['中古趋势话题自带流量', '性价比叙事引发共鸣', '环保/反消费主义标签扩大传播'],
    emotionPoint: '认同感 + "聪明消费"的自豪',
    structure: '现象开篇 \u2192 中古vs专柜对比 \u2192 3个核心优势 \u2192 入门建议 \u2192 互动收尾',
    myAdaptation: '',
    recreate: {
      title: '卖了4年中古包，我告诉你为什么聪明人都在买中古',
      hook: '同样的包，中古比专柜便宜一半，但90%的人不敢买，今天我把真相告诉你',
      structure: '\u2460 中古包价格优势对比 \u2192 \u2461 3个核心优势 \u2192 \u2462 新手怎么入门 \u2192 \u2463 给姐妹3条建议',
      shot: '实物展示 + 价格对比 + 中古店探店画面，暖色调，复古感',
    },
  },
  {
    title: 'LV Neverfull真假对比：细节决定一切',
    platform: 'douyin', views: 4500000, likes: 312000, comments: 28500, saves: 198000,
    reasons: ['LV最热门款鉴定需求巨大', '真假对比视觉冲击力强', '实用内容收藏率极高'],
    emotionPoint: '安全感 + 怕吃亏的心理',
    structure: '真假并排展示 \u2192 5个关键细节逐一对比 \u2192 总结口诀 \u2192 互动收尾',
    myAdaptation: '',
    recreate: {
      title: '做了4年奢侈品，LV Neverfull真假我一眼就能看出来',
      hook: 'Neverfull是LV最火的包，也是假货最多的，今天教你5个细节，以后再也不怕买到假的',
      structure: '\u2460 真假并排展示 \u2192 \u2461 5个关键细节对比 \u2192 \u2462 一句口诀总结 \u2192 \u2463 评论区发图我帮你看',
      shot: '特写镜头 + 真假对比 + 手势标注，高清微距，专业感',
    },
  },
];

window.Modules.radar = {
  render(container) {
    let d = Store.get();
    if (!d.radar || !d.radar.length) {
      Store.update(data => {
        data.radar = RADAR_SEED.map(s => ({
          id: Store.uid(), ...s, date: Store.todayStr(),
          bookmarked: false, emotionPoint: s.emotionPoint || '',
          structure: s.structure || '', myAdaptation: s.myAdaptation || ''
        }));
      });
      d = Store.get();
    }

    const list = d.radar;
    const bookmarked = list.filter(r => r.bookmarked);

    container.innerHTML = `
      <div class="view">
        <div class="board-col" style="margin-bottom:20px;background:linear-gradient(135deg,var(--gold-glow),transparent);border-color:var(--gold-glow)">
          <div class="board-col-head" style="border:none;margin-bottom:0;padding-bottom:0">
            <div>
              <div class="board-col-title"><span class="dot" style="background:var(--red)"></span> 今日爆款雷达</div>
              <div class="card-sub" style="margin-top:4px">聚焦：奢侈品包包 \u00b7 买包攻略 \u00b7 中古鉴定 \u00b7 渠道避坑</div>
            </div>
            <div style="display:flex;gap:8px">
              ${bookmarked.length ? `<button class="btn btn-ghost btn-sm" onclick="Modules.radar.showBookmarked()">\u2605 收藏 (${bookmarked.length})</button>` : ''}
              <button class="btn btn-gold btn-sm" onclick="Modules.radar.refresh()">\u25ce 刷新雷达</button>
            </div>
          </div>
        </div>
        <div class="radar-list" id="radarList"></div>
      </div>
    `;

    this.renderList(list);
  },

  showBookmarked() {
    const list = Store.get().radar.filter(r => r.bookmarked);
    const el = document.getElementById('radarList');
    if (!el) return;
    if (!list.length) { el.innerHTML = UI.empty('暂无收藏的爆款', '\u2605'); return; }
    this.renderList(list);
  },

  renderList(list) {
    const el = document.getElementById('radarList');
    if (!el) return;
    if (!list.length) { el.innerHTML = UI.empty('今日暂无匹配爆款', '\u25ce'); return; }

    const colors = ['#8A6E3F', '#B85450', '#5B8C6A'];
    el.innerHTML = list.map((v, i) => {
      const isDouyin = v.platform === 'douyin';
      const pName = isDouyin ? '抖音' : '小红书';
      const bg = colors[i % colors.length];
      const isBookmarked = v.bookmarked;
      return `
      <div class="radar-card">
        <div class="radar-top">
          <div class="radar-thumb" style="background:linear-gradient(135deg,${bg},${bg}99)">${pName[0]}</div>
          <div class="radar-info">
            <div class="radar-title">${UI.esc(v.title)}</div>
            <span class="radar-platform-tag ${v.platform}">${pName}</span>
            <span class="radar-platform-tag" style="background:var(--gold-glow);color:var(--gold-deep)">${v.date || Store.todayStr()}</span>
            <button class="bookmark-btn ${isBookmarked ? 'active' : ''}" onclick="Modules.radar.toggleBookmark('${v.id}')" title="收藏">
              ${isBookmarked ? '\u2605 已收藏' : '\u2606 收藏'}
            </button>
            <div class="radar-stats">
              <div class="radar-stat"><b>${UI.fmtNum(v.views)}</b>播放</div>
              <div class="radar-stat"><b>${UI.fmtNum(v.likes)}</b>点赞</div>
              <div class="radar-stat"><b>${UI.fmtNum(v.comments)}</b>评论</div>
              <div class="radar-stat"><b>${UI.fmtNum(v.saves)}</b>收藏</div>
            </div>
          </div>
        </div>

        <div class="radar-ai-breakdown">
          <div class="ai-breakdown-label">\u2726 AI 拆解模板</div>
          <div class="ai-breakdown-grid">
            <div class="ai-bd-item">
              <div class="ai-bd-key">为什么爆</div>
              <div class="ai-bd-val">${(v.reasons || []).map(r => UI.esc(r)).join('\uff1b')}</div>
            </div>
            <div class="ai-bd-item">
              <div class="ai-bd-key">情绪点</div>
              <div class="ai-bd-val">${UI.esc(v.emotionPoint || '未分析')}</div>
            </div>
            <div class="ai-bd-item">
              <div class="ai-bd-key">内容结构</div>
              <div class="ai-bd-val">${UI.esc(v.structure || '未分析')}</div>
            </div>
            <div class="ai-bd-item">
              <div class="ai-bd-key">我的改编</div>
              <div class="ai-bd-val">
                <input type="text" class="form-input" style="font-size:12px;padding:6px 10px"
                  placeholder="写下你的改编思路\u2026"
                  value="${UI.esc(v.myAdaptation || '')}"
                  onchange="Modules.radar.saveAdaptation('${v.id}', this.value)">
              </div>
            </div>
          </div>
        </div>

        <div class="radar-recreate">
          <div class="recreate-label">\u2726 AI 二创方案 \u00b7 我的版本</div>
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

  toggleBookmark(id) {
    Store.update(d => {
      const item = d.radar.find(r => r.id === id);
      if (item) item.bookmarked = !item.bookmarked;
    });
    const container = document.getElementById('viewContainer');
    this.render(container);
    UI.toast('已切换收藏状态');
  },

  saveAdaptation(id, value) {
    Store.updateItem('radar', id, { myAdaptation: value });
    UI.toast('改编思路已保存');
  },

  refresh() {
    Store.update(data => {
      const shuffled = [...RADAR_SEED].sort(() => Math.random() - 0.5);
      data.radar = shuffled.map(s => ({
        id: Store.uid(), ...s, date: Store.todayStr(),
        bookmarked: false, emotionPoint: s.emotionPoint || '',
        structure: s.structure || '', myAdaptation: s.myAdaptation || ''
      }));
    });
    this.renderList(Store.get().radar);
    UI.toast('雷达已刷新 \u25ce');
  },
};
