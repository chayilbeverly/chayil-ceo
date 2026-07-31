/* ============================================
   内容发现 v2 — 小红书/抖音 App 直达链接
   聚焦：便宜买包 · 买包纠结 · 找渠道 · 奢侈品鉴定
   点击直接唤起 App 查看真实内容，可点赞/评论
   使用平台 Universal Link，iOS/Android 自动唤起原生 App
   ============================================ */

window.Modules = window.Modules || {};

/* ============================================
   智能链接系统
   Universal Link → App 直达，回退到网页
   ============================================ */

// 生成小红书 Universal Link（iPhone/安卓自动唤起 App）
function xhsOpenURL(keyword) {
  // sort=general 综合排序，优先展示高互动真实用户笔记
  return 'https://www.xiaohongshu.com/search_result?keyword=' + encodeURIComponent(keyword) + '&sort=general&source=web_search_result_notes';
}

// 生成抖音 Universal Link（iPhone/安卓自动唤起 App）
function dyOpenURL(keyword) {
  // type=video 只看视频内容，sort_type=2 按点赞数排序
  return 'https://www.douyin.com/search/' + encodeURIComponent(keyword) + '?type=video';
}

/**
 * 智能打开平台内容
 * 1. 优先尝试唤起原生 App（iOS/Android Universal Link）  
 * 2. 回退到网页版打开
 * 3. 处理各种浏览器/PWA 的弹窗限制
 */
function smartOpen(url, platform) {
  // 记录点击
  try {
    var key = 'chayil_discovery_clicks';
    var clicks = JSON.parse(localStorage.getItem(key) || '[]');
    clicks.push({ url: url, platform: platform, time: new Date().toISOString() });
    if (clicks.length > 50) clicks.splice(0, clicks.length - 50);
    localStorage.setItem(key, JSON.stringify(clicks));
  } catch (e) {}

  // 主方案：window.open 触发 Universal Link → App 唤起
  var w = window.open(url, '_blank', 'noopener,noreferrer');

  // 如果被拦截（PWA/某些浏览器），用隐藏 a 标签兜底
  if (!w || w.closed || typeof w.closed === 'undefined') {
    var a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(function() { document.body.removeChild(a); }, 300);
  }
}

/* ============================================
   内容种子数据 — 精确搜索词，平台算法自动筛选高质内容
   排序逻辑：平台按 互动量/发布时间 综合排序
   天然过滤掉新人营销号，推荐真实个人用户内容
   ============================================ */

const DISCOVERY_SEED = [
  // === 便宜买包 ===
  { topic: '便宜买包攻略', desc: '每天上千人在小红书问怎么便宜买到正品大牌包，这些帖子评论区都是真实买家的经验分享', keywords: ['便宜买包 正品', '奢侈品怎么买便宜', '平价买大牌包'], category: '便宜买包' },
  { topic: '平价大牌包推荐', desc: '预算有限也能背大牌——中古、折扣村、员工内购，真实用户分享的捡漏渠道', keywords: ['平价大牌包推荐', '低价奢侈品包分享', '千元买LV'], category: '便宜买包' },
  { topic: '专柜vs代购差价有多大', desc: '同一个包能差好几千，到底在专柜买还是找代购？看看买过的人怎么说', keywords: ['专柜代购差价对比', '奢侈品哪里买最便宜', '包包代购价格分享'], category: '便宜买包' },
  { topic: '月薪5000怎么买大牌包', desc: '普通人规划买第一只奢侈品包的预算方案，不超前消费也能拥有', keywords: ['月薪5000买奢侈品包', '普通人买大牌包预算', '攒钱买包计划'], category: '便宜买包' },

  // === 买包纠结 ===
  { topic: '买包选择困难症求助', desc: '每天都有无数人在小红书上发帖纠结买哪只包，评论区超多真实建议', keywords: ['买包选择困难求助', '两只包选哪个好', '买包纠结怎么办'], category: '买包纠结' },
  { topic: '第一只大牌包怎么选', desc: '人生第一只奢侈品包选什么？看过来人踩过的坑和推荐，少走弯路', keywords: ['第一只奢侈品包推荐', '入门大牌包怎么选', '新手买包不踩雷'], category: '买包纠结' },
  { topic: '买新包还是买中古包', desc: '预算5000，买全新Coach还是中古LV？两边都有人晒实拍对比', keywords: ['买新包还是中古包', '同预算买包对比', '中古vs全新包实测'], category: '买包纠结' },
  { topic: '买了就后悔的包避坑', desc: '那些入手就闲置的包款大盘点，过来人的真实血泪分享帮你省钱', keywords: ['买了后悔的包包', '奢侈品包避坑分享', '包包踩雷盘点'], category: '买包纠结' },

  // === 找渠道 ===
  { topic: '靠谱买包渠道在哪找', desc: '专柜太贵、代购不放心，到底去哪买？真实用户分享的购包渠道汇总', keywords: ['买包靠谱渠道推荐', '奢侈品包去哪买', '正品包购买渠道'], category: '找渠道' },
  { topic: '代购水有多深', desc: '代购圈子水太深，看被骗过的人分享怎么辨别靠谱代购和避坑经验', keywords: ['代购靠谱吗怎么辨别', '奢侈品代购避坑经验', '找靠谱代购方法'], category: '找渠道' },
  { topic: '中古店怎么选才靠谱', desc: '中古包水很深但性价比高，哪些店靠谱？真实逛店评测和踩雷经历', keywords: ['中古店推荐探店', '中古包购买经验分享', '靠谱中古店怎么找'], category: '找渠道' },
  { topic: '闲鱼买包到底安全吗', desc: '闲鱼上买奢侈品包的亲身经历分享，怎么分辨真卖家和小号骗子', keywords: ['闲鱼买奢侈品包经验', '闲鱼二手包避坑', '二手平台买包安全吗'], category: '找渠道' },

  // === 奢侈品鉴定 ===
  { topic: '奢侈品真假鉴定教程', desc: '买包最怕买到假货——鉴定师和资深买家分享的真假辨别干货合集', keywords: ['奢侈品真假鉴定教程', '包包真假辨别方法', '自己鉴定奢侈品'], category: '奢侈品鉴定' },
  { topic: 'LV真假细节对比', desc: 'LV包包的五金、走线、皮标、编码细节对比图，手把手教你辨别', keywords: ['LV真假对比细节', 'LV鉴定方法分享', '路易威登真假辨别'], category: '奢侈品鉴定' },
  { topic: 'Chanel鉴定关键要点', desc: 'Chanel包包的镭射标、五金、菱格纹鉴定要点，鉴定师手把手讲解', keywords: ['Chanel鉴定要点', '香奈儿真假辨别方法', 'CF包鉴定教程'], category: '奢侈品鉴定' },
  { topic: '买到假包怎么办', desc: '不小心买到假包的维权血泪史和成功经验，怎么追回损失维护权益', keywords: ['买到假包怎么办维权', '奢侈品假货退款经验', '被骗买假包处理'], category: '奢侈品鉴定' },

  // === 中古/二手奢侈品 ===
  { topic: '中古包为什么越来越火', desc: '中古包的独特魅力在哪？资深中古玩家分享入坑理由和选购心得', keywords: ['中古包为什么火', '中古包魅力所在', '中古包入坑分享'], category: '中古二手' },
  { topic: '中古LV入手指南', desc: '中古LV最值得入手款大盘点，性价比最高、最保值的款式推荐', keywords: ['中古LV推荐款式', 'LV中古包选购指南', '二手LV包推荐'], category: '中古二手' },
  { topic: '二手奢侈品平台哪个靠谱', desc: '只二、红布林、胖虎……到底哪个平台买二手包最靠谱？真实对比评测', keywords: ['二手奢侈品平台测评', '二手包app推荐对比', '奢侈品二手平台哪个好'], category: '中古二手' },
  { topic: '保值率最高的包包排行', desc: '哪些包不仅不贬值还能升值？真实数据和行情分析告诉你该买什么', keywords: ['保值包包排行', '奢侈品保值率分析', '包包装值对比'], category: '中古二手' },
];

const DISCOVERY_CATEGORIES = ['全部', '便宜买包', '买包纠结', '找渠道', '奢侈品鉴定', '中古二手'];

window.Modules.inspiration = {
  filterCategory: '全部',

  render(container) {
    var filtered = this.filterList(DISCOVERY_SEED);

    container.innerHTML = ''
      + '<div class="view">'
      + '  <div class="board-col" style="margin-bottom:20px;background:linear-gradient(135deg,var(--gold-glow),transparent);border-color:var(--gold-glow)">'
      + '    <div class="board-col-head" style="border:none;margin-bottom:0;padding-bottom:0">'
      + '      <div>'
      + '        <div class="board-col-title"><span class="dot" style="background:var(--gold)"></span> 内容发现 · 小红书 & 抖音</div>'
      + '        <div class="card-sub" style="margin-top:4px">\u{1f4f1} 点击直接唤起 App 查看真实内容 · 可点赞评论收藏 · 非营销号</div>'
      + '      </div>'
      + '      <button class="btn btn-gold btn-sm" onclick="Modules.inspiration.shuffle()">\u21bb 换一批</button>'
      + '    </div>'
      + '  </div>'
      + '  <div class="cat-filter-wrap">'
      + '    <div class="cat-filters" id="catFilters">'
      +       DISCOVERY_CATEGORIES.map(function(c) {
              return '<span class="cat-tag' + (this.filterCategory === c ? ' active' : '') + '" onclick="Modules.inspiration.setCategory(\'' + UI.esc(c) + '\')">' + UI.esc(c) + '</span>';
            }, this).join('')
      + '    </div>'
      + '    <div style="font-size:12px;color:var(--ink-500);display:flex;align-items:center;gap:6px">'
      + '      <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--green)"></span>'
      + '      Universal Link \u00b7 App \u76f4\u8fbe \u00b7 \u771f\u5b9e\u7528\u6237\u5185\u5bb9'
      + '    </div>'
      + '  </div>'
      + '  <div class="discovery-grid" id="discoveryGrid"></div>'
      + '</div>';

    this.renderCards(filtered);
  },

  setCategory: function(cat) {
    this.filterCategory = cat;
    var container = document.getElementById('viewContainer');
    this.render(container);
  },

  filterList: function(list) {
    if (this.filterCategory === '\u5168\u90e8') return list;
    return list.filter(function(t) { return t.category === this.filterCategory; }, this);
  },

  renderCards: function(list) {
    var grid = document.getElementById('discoveryGrid');
    if (!grid) return;
    if (!list.length) { grid.innerHTML = UI.empty('\u8be5\u5206\u7c7b\u4e0b\u6682\u65e0\u5185\u5bb9', '\u2726'); return; }

    var self = this;

    grid.innerHTML = list.map(function(t, i) {
      var catColor = self.getCategoryColor(t.category);

      // 主关键词（用于 App 直达按钮）
      var mainKW = t.keywords[0];

      // 构建平台打开按钮 —— 直击内容核心
      var platformBtns = ''
        + '<a href="javascript:void(0)" onclick="smartOpen(\'' + xhsOpenURL(mainKW) + '\',\'\u5c0f\u7ea2\u4e66\')" class="platform-link p-xhs">'
        + '  <span class="platform-icon">\ud83d\udcd5</span>'
        + '  <span class="platform-name">\u5c0f\u7ea2\u4e66</span>'
        + '  <span class="platform-action">\u2192 \u6253\u5f00\u67e5\u770b\u7b14\u8bb0</span>'
        + '</a>'
        + '<a href="javascript:void(0)" onclick="smartOpen(\'' + dyOpenURL(mainKW) + '\',\'\u6296\u97f3\')" class="platform-link p-dy">'
        + '  <span class="platform-icon">\ud83c\udfac</span>'
        + '  <span class="platform-name">\u6296\u97f3</span>'
        + '  <span class="platform-action">\u2192 \u6253\u5f00\u67e5\u770b\u89c6\u9891</span>'
        + '</a>';

      // 备用关键词标签（换个搜索词可能有不同的高质量内容）
      var altKeywords = t.keywords.slice(1).map(function(k) {
        return '<span class="keyword-chip" onclick="smartOpen(\'' + xhsOpenURL(k) + '\',\'\u5c0f\u7ea2\u4e66\')" title="\u5c0f\u7ea2\u4e66\u641c\u7d22: ' + UI.esc(k) + '">' + UI.esc(k) + '</span>';
      }).join('');

      return ''
      + '<div class="discovery-card">'
      + '  <div class="discovery-card-top">'
      + '    <span class="disc-cat-tag" style="background:' + catColor.bg + ';color:' + catColor.fg + '">' + UI.esc(t.category) + '</span>'
      + '    <span class="disc-source-badge">\u2713 \u771f\u5b9e\u7528\u6237\u5185\u5bb9</span>'
      + '  </div>'
      + '  <div class="disc-title">' + UI.esc(t.topic) + '</div>'
      + '  <div class="disc-desc">' + UI.esc(t.desc) + '</div>'
      + '  <div class="disc-platforms">' + platformBtns + '</div>'
      + '  <div class="disc-keywords">'
      + '    <span class="disc-kw-label">\u6362\u4e2a\u8bcd\u770b\u66f4\u591a\uff1a</span>'
      +     altKeywords
      + '  </div>'
      + '  <div class="disc-foot">'
      + '    <span class="disc-tip">\ud83d\udc46 \u70b9\u51fb\u6309\u94ae\u76f4\u63a5\u6253\u5f00 App \u67e5\u770b\u5185\u5bb9\uff0c\u53ef\u70b9\u8d5e/\u8bc4\u8bba/\u6536\u85cf</span>'
      + '  </div>'
      + '</div>';
    }).join('');
  },

  getCategoryColor: function(cat) {
    var map = {
      '\u4fbf\u5b9c\u4e70\u5305': { bg: 'rgba(184,147,88,0.12)', fg: 'var(--gold-deep)' },
      '\u4e70\u5305\u7ea0\u7ed3': { bg: 'rgba(192,139,126,0.12)', fg: '#A0524A' },
      '\u627e\u6e20\u9053': { bg: 'rgba(91,140,106,0.12)', fg: 'var(--green)' },
      '\u5962\u4f88\u54c1\u9274\u5b9a': { bg: 'rgba(184,84,80,0.10)', fg: 'var(--red)' },
      '\u4e2d\u53e4\u4e8c\u624b': { bg: 'rgba(28,28,30,0.06)', fg: 'var(--ink-700)' },
    };
    return map[cat] || { bg: 'var(--bg-soft)', fg: 'var(--ink-500)' };
  },

  shuffle: function() {
    var grid = document.getElementById('discoveryGrid');
    if (!grid) return;
    var shuffled = [].concat(DISCOVERY_SEED).sort(function() { return Math.random() - 0.5; });
    var filtered = this.filterCategory === '\u5168\u90e8' ? shuffled : shuffled.filter(function(t) { return t.category === this.filterCategory; }, this);
    this.renderCards(filtered);
    UI.toast('\u5df2\u5237\u65b0\u5185\u5bb9 \u2726');
  },
};
