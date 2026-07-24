/* ============================================
   灵感中心 — AI 每日选题
   ============================================ */

window.Modules = window.Modules || {};

// 种子选题数据
const INSPIRATION_SEED = [
  {
    title: '为什么越来越多女生开始迷恋中古包？',
    direction: '消费观变化 · 可持续时尚',
    reason: '身份认同 + 情绪价值 + 反消费主义浪潮',
    platform: '小红书',
    suggestion: '加入真实客户案例，对比中古与专柜价的差距，结尾抛出"你的第一只中古包是什么"',
  },
  {
    title: '卖了4年奢侈品，我发现真正高级的女生都有一个共同点',
    direction: '女性成长 · 审美提升',
    reason: '制造身份认同 + 满足成长渴望',
    platform: '抖音',
    suggestion: '开头3秒制造好奇："卖了4年奢侈品，我发现一个秘密"，中间用3个客户故事佐证',
  },
  {
    title: '月薪1万和月薪10万的女生，包柜有什么区别？',
    direction: '消费观 · 女性成长',
    reason: '对比制造冲突 + 身份焦虑 + 评论区争议强',
    platform: '小红书',
    suggestion: '用真实客户包柜对比图，避免直接炫富，落脚到"选择背后的逻辑"',
  },
  {
    title: '第一只奢侈品包包该怎么选？从业者的真心话',
    direction: '奢侈品入门 · 决策指南',
    reason: '实用价值高 + 利他心理 + 收藏意愿强',
    platform: '小红书',
    suggestion: '结构化输出3条原则，配真实成交案例，结尾引导私信咨询',
  },
  {
    title: '那些买Chanel的女生，后来都怎么样了？',
    direction: '女性成长 · 消费反思',
    reason: '故事感 + 情绪共鸣 + 留悬念',
    platform: '抖音',
    suggestion: '讲3个真实客户故事，不同结局，最后落到"包包是工具，不是答案"',
  },
  {
    title: '奢侈品从业者的日常：你不知道的选货真相',
    direction: '创业日常 · 行业揭秘',
    reason: '猎奇心理 + 信任建立 + 专业人设',
    platform: '抖音',
    suggestion: '展示选货、验货全过程，突出专业与诚信，引导关注建立信任',
  },
];

window.Modules.inspiration = {
  render(container) {
    let d = Store.get();
    if (!d.inspirations || !d.inspirations.length) {
      Store.update(data => { data.inspirations = INSPIRATION_SEED.map(s => ({ id: Store.uid(), ...s, date: Store.todayStr() })); });
      d = Store.get();
    }

    const list = d.inspirations;

    container.innerHTML = `
      <div class="view">
        <div class="board-col" style="margin-bottom:24px;background:linear-gradient(135deg,var(--gold-glow),transparent);border-color:var(--gold-glow)">
          <div class="board-col-head" style="border:none;margin-bottom:0;padding-bottom:0">
            <div>
              <div class="board-col-title"><span class="dot" style="background:var(--gold)"></span> AI 每日选题</div>
              <div class="card-sub" style="margin-top:4px">基于你的定位：奢侈品 · 女性成长 · 高级生活方式 · 创业 · 审美提升</div>
            </div>
            <button class="btn btn-gold btn-sm" onclick="Modules.inspiration.regenerate()">✦ 重新生成</button>
          </div>
        </div>
        <div class="topic-grid" id="topicGrid"></div>
      </div>
    `;

    this.renderTopics(list);
  },

  renderTopics(list) {
    const grid = document.getElementById('topicGrid');
    if (!grid) return;
    grid.innerHTML = list.map((t, i) => `
      <div class="topic-card">
        <div class="topic-num">${String(i + 1).padStart(2, '0')}</div>
        <div class="topic-title">${UI.esc(t.title)}</div>
        <div class="topic-field">
          <div class="topic-field-label">内容方向</div>
          <div class="topic-field-value">${UI.esc(t.direction)}</div>
        </div>
        <div class="topic-field">
          <div class="topic-field-label">爆款原因</div>
          <div class="topic-field-value">${UI.esc(t.reason)}</div>
        </div>
        <div class="topic-field" style="display:flex;align-items:center;gap:8px">
          <div>
            <div class="topic-field-label">适合平台</div>
          </div>
          <span class="topic-platform">${UI.esc(t.platform)}</span>
        </div>
        <div class="topic-field">
          <div class="topic-field-label">改编建议</div>
          <div class="topic-field-value">${UI.esc(t.suggestion)}</div>
        </div>
      </div>
    `).join('');
  },

  regenerate() {
    Store.update(data => {
      const shuffled = [...INSPIRATION_SEED].sort(() => Math.random() - 0.5);
      data.inspirations = shuffled.map(s => ({ id: Store.uid(), ...s, date: Store.todayStr() }));
    });
    this.renderTopics(Store.get().inspirations);
    UI.toast('已重新生成今日选题 ✦');
  },
};
