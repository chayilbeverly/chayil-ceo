/* ============================================
   灵感中心 — AI 每日选题
   ============================================ */

window.Modules = window.Modules || {};

// 种子选题数据
const INSPIRATION_SEED = [
  // 原有奢侈品/女性成长选题
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
  // 摆摊创业选题
  {
    title: '辞掉月薪2万的工作去摆摊，3个月后我后悔了吗？',
    direction: '摆摊创业 · 人生选择',
    reason: '反差叙事 + 打工人共鸣 + 创业好奇',
    platform: '抖音',
    suggestion: '开头亮出收入对比（上班vs摆摊），中间真实记录每天流水，结尾落到"赚钱之外我获得了什么"',
  },
  {
    title: '第一次出摊就卖爆！我的摆摊备货清单大公开',
    direction: '摆摊实战 · 新手攻略',
    reason: '实用价值极高 + 新手刚需 + 收藏率强',
    platform: '小红书',
    suggestion: '图文清单形式，按品类列出所有工具（炉具/包装/招牌/收款），每项标注价格和购买渠道',
  },
  {
    title: '摆摊第7天，今天遇到了让我想哭的客人',
    direction: '摆摊日常 · 真实故事',
    reason: '情绪共鸣 + 真实露脸 + 评论区互动强',
    platform: '抖音',
    suggestion: '记录每天摆摊的真实瞬间，好客人vs难缠客人，结尾抛出话题"你遇到过什么样的客人"',
  },
  {
    title: '10块钱一份的街头小吃，凭什么排队2小时？',
    direction: '摆摊定位 · 产品思维',
    reason: '反差制造好奇 + 商业思维 + 可复制经验',
    platform: '抖音',
    suggestion: '分析3个爆火摊位的共性：口味/定价/位置/招牌/服务，总结出新手可复制的公式',
  },
  // 心理成长选题
  {
    title: '摆摊治好了我的社交恐惧症',
    direction: '心理成长 · 自我突破',
    reason: '真实痛点 + 治愈叙事 + 引发共鸣',
    platform: '小红书',
    suggestion: '从"不敢和陌生人说话"到"主动招揽客人"的心路历程，给出3个可操作的心理练习',
  },
  {
    title: '一个人摆摊的第30天，我学会了和自己相处',
    direction: '心理成长 · 独处力量',
    reason: '孤独感共鸣 + 自我成长叙事 + 女性力量',
    platform: '小红书',
    suggestion: '记录独处的心境变化：从害怕孤单到享受独立，引用日记片段增强真实感',
  },
  {
    title: '摆摊让我明白：赚钱先要修心态',
    direction: '创业心态 · 心理建设',
    reason: '实用鸡汤 + 正能量 + 创业者刚需',
    platform: '抖音',
    suggestion: '分享3个心态转变：从怕丢脸到自信、从焦虑到专注、从和别人比到和自己比',
  },
  {
    title: '那些摆摊教会我的事：允许自己慢慢来',
    direction: '心理成长 · 自我接纳',
    reason: '反焦虑叙事 + 治愈系 + 女性情感共鸣',
    platform: '小红书',
    suggestion: '对比"别人家的摊"和"我家的摊"，落脚到每个节奏都是对的，不焦虑不攀比',
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
              <div class="card-sub" style="margin-top:4px">基于你的定位：奢侈品 · 摆摊创业 · 心理成长 · 女性力量 · 高级生活方式</div>
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
