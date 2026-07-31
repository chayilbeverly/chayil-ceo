/* ============================================
   内容发现 v1 — 小红书/抖音 真实内容链接
   聚焦：便宜买包 · 买包纠结 · 找渠道 · 奢侈品鉴定
   点击直接跳转平台，可点赞/评论/收藏
   ============================================ */

window.Modules = window.Modules || {};

// 小红书搜索链接生成
function xhsSearch(keyword) {
  return 'https://www.xiaohongshu.com/search_result?keyword=' + encodeURIComponent(keyword) + '&source=web_search_result_notes';
}

// 抖音搜索链接生成
function dySearch(keyword) {
  return 'https://www.douyin.com/search/' + encodeURIComponent(keyword);
}

// 内容发现种子数据 — 每条对应一个真实平台搜索
const DISCOVERY_SEED = [
  // === 便宜买包 ===
  { topic: '便宜买包攻略', desc: '每天上千人在小红书问怎么便宜买到正品大牌包', keywords: ['便宜买包', '平价奢侈品', '白菜价包包'], platforms: ['xhs', 'douyin'], category: '便宜买包' },
  { topic: '平价大牌包推荐', desc: '预算有限也能背大牌，这些渠道你知道吗', keywords: ['平价大牌包', '低价奢侈品包', '便宜LV'], platforms: ['xhs', 'douyin'], category: '便宜买包' },
  { topic: '专柜vs代购差价', desc: '同一个包差几千块，到底该在哪买', keywords: ['专柜代购差价', '奢侈品哪里买便宜', '包包代购价格'], platforms: ['xhs', 'douyin'], category: '便宜买包' },
  { topic: '月薪5000买大牌', desc: '普通人怎么规划买第一只奢侈品包', keywords: ['月薪5000买奢侈品', '普通人买大牌包', '攒钱买包'], platforms: ['xhs', 'douyin'], category: '便宜买包' },

  // === 买包纠结 ===
  { topic: '买包选择困难症', desc: '每天都在纠结买哪只包的人太多了', keywords: ['买包纠结', '买包选择困难', '该买哪个包'], platforms: ['xhs', 'douyin'], category: '买包纠结' },
  { topic: '第一只大牌包怎么选', desc: '人生第一只奢侈品包，无数人都在问', keywords: ['第一只奢侈品包', '第一个大牌包推荐', '入门奢侈品包'], platforms: ['xhs', 'douyin'], category: '买包纠结' },
  { topic: '同预算买新还是买中古', desc: '5000块买全新Coach还是中古LV', keywords: ['买新包还是中古', '同预算买包', '中古vs全新'], platforms: ['xhs', 'douyin'], category: '买包纠结' },
  { topic: '买了后悔的包', desc: '那些买了就后悔的包，避坑必看', keywords: ['买了后悔的包', '奢侈品踩雷', '包包避坑'], platforms: ['xhs', 'douyin'], category: '买包纠结' },

  // === 找渠道 ===
  { topic: '靠谱买包渠道在哪找', desc: '找不到靠谱渠道？看看过来人怎么说', keywords: ['买包渠道', '奢侈品靠谱渠道', '去哪买奢侈品包'], platforms: ['xhs', 'douyin'], category: '找渠道' },
  { topic: '代购靠谱吗', desc: '代购水太深，怎么辨别靠谱代购', keywords: ['代购靠谱吗', '奢侈品代购避坑', '怎么找靠谱代购'], platforms: ['xhs', 'douyin'], category: '找渠道' },
  { topic: '中古店怎么选', desc: '中古包水很深，哪家店才靠谱', keywords: ['中古店推荐', '中古包去哪买', '靠谱中古店'], platforms: ['xhs', 'douyin'], category: '找渠道' },
  { topic: '闲鱼买包安全吗', desc: '闲鱼买奢侈品包到底靠不靠谱', keywords: ['闲鱼买包', '闲鱼奢侈品', '二手平台买包'], platforms: ['xhs', 'douyin'], category: '找渠道' },

  // === 奢侈品鉴定 ===
  { topic: '奢侈品真假鉴定', desc: '买包最怕买到假货，鉴定教程必看', keywords: ['奢侈品鉴定', '奢侈品真假辨别', 'LV鉴定'], platforms: ['xhs', 'douyin'], category: '奢侈品鉴定' },
  { topic: 'LV真假对比', desc: 'LV包包真假细节对比，一目了然', keywords: ['LV真假对比', 'LV鉴定细节', '路易威登真假'], platforms: ['xhs', 'douyin'], category: '奢侈品鉴定' },
  { topic: 'Chanel鉴定要点', desc: 'Chanel包包鉴定关键点大全', keywords: ['Chanel鉴定', '香奈儿真假辨别', 'CF鉴定'], platforms: ['xhs', 'douyin'], category: '奢侈品鉴定' },
  { topic: '买到假包怎么办', desc: '不小心买到假包，维权全攻略', keywords: ['买到假包怎么办', '假包维权', '奢侈品被骗'], platforms: ['xhs', 'douyin'], category: '奢侈品鉴定' },

  // === 中古/二手奢侈品 ===
  { topic: '中古包为什么这么火', desc: '越来越多人选择中古包，原因是什么', keywords: ['中古包', '中古包为什么火', '中古包优势'], platforms: ['xhs', 'douyin'], category: '中古二手' },
  { topic: '中古LV入手指南', desc: '中古LV最值得买的款式大盘点', keywords: ['中古LV', 'LV中古推荐', '二手LV包'], platforms: ['xhs', 'douyin'], category: '中古二手' },
  { topic: '二手奢侈品app推荐', desc: '哪些二手平台买奢侈品最靠谱', keywords: ['二手奢侈品app', '二手奢侈品平台', '奢侈品二手app推荐'], platforms: ['xhs', 'douyin'], category: '中古二手' },
  { topic: '保值率最高的包', desc: '哪些包买完还能升值，投资必看', keywords: ['保值包包', '奢侈品保值', '包包装值'], platforms: ['xhs', 'douyin'], category: '中古二手' },
];

const DISCOVERY_CATEGORIES = ['全部', '便宜买包', '买包纠结', '找渠道', '奢侈品鉴定', '中古二手'];

window.Modules.inspiration = {
  filterCategory: '全部',

  render(container) {
    const filtered = this.filterList(DISCOVERY_SEED);

    container.innerHTML = `
      <div class="view">
        <div class="board-col" style="margin-bottom:20px;background:linear-gradient(135deg,var(--gold-glow),transparent);border-color:var(--gold-glow)">
          <div class="board-col-head" style="border:none;margin-bottom:0;padding-bottom:0">
            <div>
              <div class="board-col-title"><span class="dot" style="background:var(--gold)"></span> 内容发现 · 小红书 & 抖音</div>
              <div class="card-sub" style="margin-top:4px">每天真实用户在问的买包话题 · 点击直接打开内容 · 可点赞/评论/收藏</div>
            </div>
            <button class="btn btn-gold btn-sm" onclick="Modules.inspiration.shuffle()">\u21bb 换一批</button>
          </div>
        </div>

        <div class="cat-filter-wrap">
          <div class="cat-filters" id="catFilters">
            ${DISCOVERY_CATEGORIES.map(c => `
              <span class="cat-tag ${this.filterCategory === c ? 'active' : ''}" onclick="Modules.inspiration.setCategory('${c}')">${c}</span>
            `).join('')}
          </div>
          <div style="font-size:12px;color:var(--ink-500);display:flex;align-items:center;gap:6px">
            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--green)"></span>
            来源为平台真实用户内容，非营销号
          </div>
        </div>

        <div class="discovery-grid" id="discoveryGrid"></div>
      </div>
    `;

    this.renderCards(filtered);
  },

  setCategory(cat) {
    this.filterCategory = cat;
    const container = document.getElementById('viewContainer');
    this.render(container);
  },

  filterList(list) {
    if (this.filterCategory === '全部') return list;
    return list.filter(t => t.category === this.filterCategory);
  },

  renderCards(list) {
    const grid = document.getElementById('discoveryGrid');
    if (!grid) return;
    if (!list.length) { grid.innerHTML = UI.empty('该分类下暂无内容', '\u2726'); return; }

    grid.innerHTML = list.map((t, i) => {
      const catColor = this.getCategoryColor(t.category);
      const platformLinks = t.platforms.map(p => {
        const isXhs = p === 'xhs';
        const pName = isXhs ? '小红书' : '抖音';
        const pIcon = isXhs ? '\ud83d\udcdd' : '\ud83c\udfa5';
        const pClass = isXhs ? 'p-xhs' : 'p-dy';
        // 用第一个关键词做搜索
        const url = isXhs ? xhsSearch(t.keywords[0]) : dySearch(t.keywords[0]);
        return `
          <a href="${url}" target="_blank" rel="noopener noreferrer" class="platform-link ${pClass}" onclick="Modules.inspiration.trackClick('${UI.esc(t.topic)}','${pName}')">
            <span class="platform-icon">${pIcon}</span>
            <span class="platform-name">${pName}</span>
            <span class="platform-action">\u2192 打开看内容</span>
          </a>
        `;
      }).join('');

      // 额外搜索关键词
      const extraKeywords = t.keywords.slice(1).map(k => `
        <a href="${xhsSearch(k)}" target="_blank" rel="noopener noreferrer" class="keyword-chip" onclick="Modules.inspiration.trackClick('${UI.esc(k)}','小红书')">${UI.esc(k)}</a>
      `).join('') + t.keywords.slice(1).map(k => `
        <a href="${dySearch(k)}" target="_blank" rel="noopener noreferrer" class="keyword-chip dy" onclick="Modules.inspiration.trackClick('${UI.esc(k)}','抖音')">${UI.esc(k)} \u00b7 抖音</a>
      `).join('');

      return `
      <div class="discovery-card">
        <div class="discovery-card-top">
          <span class="disc-cat-tag" style="background:${catColor.bg};color:${catColor.fg}">${UI.esc(t.category)}</span>
          <span class="disc-source-badge">\u2713 真实用户内容</span>
        </div>
        <div class="disc-title">${UI.esc(t.topic)}</div>
        <div class="disc-desc">${UI.esc(t.desc)}</div>
        <div class="disc-platforms">
          ${platformLinks}
        </div>
        <div class="disc-keywords">
          <span class="disc-kw-label">\u641c\u7d22\u5173\u952e\u8bcd\uff1a</span>
          ${extraKeywords}
        </div>
        <div class="disc-foot">
          <span class="disc-tip">\ud83d\udc4b \u70b9\u51fb\u540e\u5728\u5e73\u53f0\u5185\u70b9\u8d5e\u3001\u8bc4\u8bba\u3001\u6536\u85cf</span>
        </div>
      </div>`;
    }).join('');
  },

  getCategoryColor(cat) {
    const map = {
      '便宜买包': { bg: 'rgba(184,147,88,0.12)', fg: 'var(--gold-deep)' },
      '买包纠结': { bg: 'rgba(192,139,126,0.12)', fg: '#A0524A' },
      '找渠道': { bg: 'rgba(91,140,106,0.12)', fg: 'var(--green)' },
      '奢侈品鉴定': { bg: 'rgba(184,84,80,0.10)', fg: 'var(--red)' },
      '中古二手': { bg: 'rgba(28,28,30,0.06)', fg: 'var(--ink-700)' },
    };
    return map[cat] || { bg: 'var(--bg-soft)', fg: 'var(--ink-500)' };
  },

  trackClick(topic, platform) {
    // 记录用户点击行为（仅本地统计）
    try {
      const key = 'chayil_discovery_clicks';
      const clicks = JSON.parse(localStorage.getItem(key) || '[]');
      clicks.push({ topic, platform, time: new Date().toISOString() });
      // 只保留最近50条
      if (clicks.length > 50) clicks.splice(0, clicks.length - 50);
      localStorage.setItem(key, JSON.stringify(clicks));
    } catch (e) {}
  },

  shuffle() {
    // 随机打乱顺序展示
    const grid = document.getElementById('discoveryGrid');
    if (!grid) return;
    const shuffled = [...DISCOVERY_SEED].sort(() => Math.random() - 0.5);
    const filtered = this.filterCategory === '全部' ? shuffled : shuffled.filter(t => t.category === this.filterCategory);
    this.renderCards(filtered);
    UI.toast('已刷新内容 \u2726');
  },
};
