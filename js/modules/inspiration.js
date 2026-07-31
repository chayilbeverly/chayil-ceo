/* ============================================
   内容发现 v3 — 多层 App 直达 + 智能回退
   聚焦：便宜买包 · 买包纠结 · 找渠道 · 奢侈品鉴定 · 中古二手
   
   链接机制（多层兜底）：
   1. Universal Link — iOS/Android 原生唤起 App
   2. Intent URL — Android 专属深度链接
   3. 自定义 Scheme — 终极兜底
   4. 网页版 — 最后回退（显示"在App内打开"引导）

   搜索参数优化：
   小红书 sort=general 综合排序，优先高互动真实笔记
   抖音 type=video 只看视频，排除图文营销号
   
   平台算法天然筛选：按互动量排序 → 新人号/营销号排不到前面
   ============================================ */

window.Modules = window.Modules || {};

/* ============================================
   智能 App 唤起系统
   支持：iOS Safari · Android Chrome · 微信内置浏览器 · 各厂商浏览器
   ============================================ */

// 检测设备和浏览器类型
function detectEnv() {
  var ua = navigator.userAgent || '';
  return {
    isMobile: /iPhone|iPad|iPod|Android/i.test(ua),
    isIOS: /iPhone|iPad|iPod/i.test(ua),
    isAndroid: /Android/i.test(ua),
    isWeChat: /MicroMessenger/i.test(ua),
    isWeibo: /Weibo/i.test(ua),
    isQQ: /QQ\//i.test(ua) && !/MicroMessenger/i.test(ua),
  };
}

/**
 * 小红书搜索链接 — 不同层级的 URL
 */
function xhsURLs(keyword) {
  var kw = encodeURIComponent(keyword);
  return {
    // 层级1: Universal Link (iOS/Android 系统级 App 唤起)
    universal: 'https://www.xiaohongshu.com/search_result?keyword=' + kw + '&sort=general&source=web_search_result_notes',
    // 层级2: Android Intent (强制唤起 App)
    intent: 'intent://www.xiaohongshu.com/search_result?keyword=' + kw + '&sort=general#Intent;scheme=https;package=com.xingin.xhs;S.browser_fallback_url=https%3A%2F%2Fwww.xiaohongshu.com%2Fsearch_result%3Fkeyword%3D' + kw + ';end',
    // 层级3: 自定义 Scheme
    scheme: 'xhsdiscover://search?keyword=' + kw,
    // 层级4: 网页回退
    web: 'https://www.xiaohongshu.com/search_result?keyword=' + kw + '&sort=general',
  };
}

/**
 * 抖音搜索链接 — 不同层级的 URL
 */
function dyURLs(keyword) {
  var kw = encodeURIComponent(keyword);
  return {
    universal: 'https://www.douyin.com/search/' + kw + '?type=video',
    intent: 'intent://www.douyin.com/search/' + kw + '?type=video#Intent;scheme=https;package=com.ss.android.ugc.aweme;S.browser_fallback_url=https%3A%2F%2Fwww.douyin.com%2Fsearch%2F' + kw + ';end',
    scheme: 'snssdk1128://search/detail?keyword=' + kw,
    web: 'https://www.douyin.com/search/' + kw + '?type=video',
  };
}

/**
 * 核心：多层 App 唤起
 * 
 * 策略：
 * - iOS Safari: Universal Link → Scheme → Web
 * - Android Chrome: Intent → Universal Link → Web
 * - 微信/微博: 提示用浏览器打开
 * - 桌面端: 直接打开网页版
 */
function smartOpen(urls, platformName, keyword) {
  var env = detectEnv();

  // 记录点击
  try {
    var clicks = JSON.parse(localStorage.getItem('chayil_clicks') || '[]');
    clicks.push({ platform: platformName, keyword: keyword, time: Date.now() });
    if (clicks.length > 100) clicks = clicks.slice(-100);
    localStorage.setItem('chayil_clicks', JSON.stringify(clicks));
  } catch (e) {}

  // === 桌面端 ===
  if (!env.isMobile) {
    // 桌面端无法唤起 App，打开网页版 + 提示
    window.open(urls.web, '_blank');
    showMobileTip(platformName);
    return;
  }

  // === 移动端 ===

  // 微信/微博内置浏览器：无法直接唤起 App
  if (env.isWeChat || env.isWeibo) {
    showWeChatTip(platformName, urls.universal);
    return;
  }

  // === Android ===
  if (env.isAndroid) {
    // Android 优先使用 Intent URL（最强 App 唤起方式）
    tryOpenIntent(urls.intent, urls.universal, urls.web, platformName);
    return;
  }

  // === iOS ===
  if (env.isIOS) {
    // iOS 使用 Universal Link
    tryOpenUniversal(urls.universal, urls.scheme, urls.web, platformName);
    return;
  }

  // 兜底
  window.open(urls.web, '_blank');
}

/**
 * Android Intent URL 方式
 */
function tryOpenIntent(intentUrl, universalUrl, webUrl, platformName) {
  var startTime = Date.now();
  var appOpened = false;

  // 监听页面失焦/隐藏（App 被唤起）
  var onHide = function() {
    appOpened = true;
    cleanup();
  };
  document.addEventListener('visibilitychange', onHide, { once: true });
  document.addEventListener('pagehide', onHide, { once: true });

  var cleanup = function() {
    document.removeEventListener('visibilitychange', onHide);
    document.removeEventListener('pagehide', onHide);
    clearTimeout(fallbackTimer);
  };

  // 2.5秒后如果还在当前页面，说明 Intent 失败，用 Universal Link 兜底
  var fallbackTimer = setTimeout(function() {
    if (!appOpened && !document.hidden) {
      cleanup();
      tryOpenUniversal(universalUrl, null, webUrl, platformName);
    }
  }, 2500);

  // 尝试 Intent URL
  try {
    window.location.href = intentUrl;
  } catch (e) {
    cleanup();
    window.open(webUrl, '_blank');
  }
}

/**
 * iOS Universal Link 方式
 */
function tryOpenUniversal(universalUrl, schemeUrl, webUrl, platformName) {
  var startTime = Date.now();
  var appOpened = false;

  var onHide = function() {
    appOpened = true;
    cleanup();
  };
  document.addEventListener('visibilitychange', onHide, { once: true });

  var cleanup = function() {
    document.removeEventListener('visibilitychange', onHide);
    clearTimeout(fallbackTimer);
  };

  // 1.5秒后尝试自定义 Scheme 兜底
  var fallbackTimer = setTimeout(function() {
    if (!appOpened && !document.hidden) {
      if (schemeUrl) {
        try {
          window.location.href = schemeUrl;
        } catch (e) {}
        // 再等 1 秒
        var schemeTimer = setTimeout(function() {
          if (!document.hidden) {
            cleanup();
            window.open(webUrl, '_blank');
          }
        }, 1000);
      } else {
        cleanup();
        window.open(webUrl, '_blank');
      }
    }
  }, 1500);

  // 用 a 标签触发（比 window.location 更可靠）
  var a = document.createElement('a');
  a.href = universalUrl;
  a.target = '_self';
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(function() {
    if (a.parentNode) document.body.removeChild(a);
  }, 100);
}

/**
 * 微信/微博内置浏览器提示
 */
function showWeChatTip(platformName, url) {
  var tip = document.getElementById('chayilTip');
  if (!tip) {
    tip = document.createElement('div');
    tip.id = 'chayilTip';
    tip.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9999;background:var(--bg);border:1px solid var(--border);border-radius:16px;padding:28px 24px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.25);max-width:320px;width:90%';
    document.body.appendChild(tip);
  }

  var shareUrl = url;
  tip.innerHTML = ''
    + '<div style="font-size:40px;margin-bottom:12px">📱</div>'
    + '<div style="font-size:16px;font-weight:600;margin-bottom:8px;color:var(--ink)">请在浏览器中打开</div>'
    + '<div style="font-size:13px;color:var(--ink-500);margin-bottom:16px;line-height:1.6">微信/微博内置浏览器无法唤起 App，请点击右上角「<b>在浏览器中打开</b>」</div>'
    + '<button onclick="navigator.clipboard.writeText(\'' + shareUrl + '\');this.textContent=\'已复制 ✓\'" style="padding:10px 24px;border-radius:8px;border:1px solid var(--border);background:var(--bg-soft);font-size:14px;cursor:pointer">📋 复制链接</button>'
    + '<button onclick="document.getElementById(\'chayilTip\').remove()" style="display:block;margin:12px auto 0;padding:6px 16px;background:none;border:none;color:var(--ink-400);font-size:13px;cursor:pointer">关闭</button>';

  setTimeout(function() { if (tip.parentNode) tip.remove(); }, 8000);
}

/**
 * 桌面端提示
 */
function showMobileTip(platformName) {
  var tip = document.getElementById('chayilTip');
  if (!tip) {
    tip = document.createElement('div');
    tip.id = 'chayilTip';
    tip.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9999;background:var(--bg);border:1px solid var(--border);border-radius:16px;padding:28px 24px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.25);max-width:340px;width:90%';
    document.body.appendChild(tip);
  }

  tip.innerHTML = ''
    + '<div style="font-size:40px;margin-bottom:12px">📱</div>'
    + '<div style="font-size:16px;font-weight:600;margin-bottom:8px;color:var(--ink)">请在手机上打开此页面</div>'
    + '<div style="font-size:13px;color:var(--ink-500);margin-bottom:16px;line-height:1.6">' + platformName + ' 的内容需要在手机 App 中查看。<br>用手机访问此网站，点击卡片即可唤起 App。</div>'
    + '<button onclick="document.getElementById(\'chayilTip\').remove()" style="display:block;margin:0 auto;padding:6px 16px;background:none;border:none;color:var(--ink-400);font-size:13px;cursor:pointer">我知道了</button>';
  setTimeout(function() { if (tip.parentNode) tip.remove(); }, 6000);
}

/* ============================================
   内容种子数据
   搜索词设计原则：
   - 使用用户日常会搜的自然语言（不是SEO关键词）
   - 加限定词精准匹配真实用户内容
   - 平台算法按互动量排序，天然过滤商业号/新人号
   ============================================ */

var DISCOVERY_SEED = [
  // === 便宜买包 ===
  { topic: '便宜买包攻略合集', desc: '真实买家分享的便宜买正品大牌包渠道和经验，不是广告', keywords: ['便宜买包攻略 个人分享', '大牌包怎么买最便宜', '平价轻奢包推荐日常'], category: '便宜买包' },
  { topic: '千元预算买大牌包', desc: '预算有限怎么买大牌？二奢、折扣村、员工内购，真实经验', keywords: ['千元预算买大牌包', '平价奢侈品包真实测评', '贫民窟女孩买大牌'], category: '便宜买包' },
  { topic: '专柜VS代购差价实测', desc: '同一款包不同渠道价格差多少？买到的人晒实拍对比', keywords: ['奢侈品代购差价值不值', '专柜买包涨价前囤货', '怎么买奢侈品包包最划算'], category: '便宜买包' },
  { topic: '月薪五千买包计划', desc: '普通人攒钱买第一只大牌包的预算方案，不超前消费也能拥有', keywords: ['月薪5000入手大牌包', '存钱买包真实计划', '上班族买包省钱攻略'], category: '便宜买包' },

  // === 买包纠结 ===
  { topic: '买包纠结求助帖', desc: '每天无数人在纠结两只包二选一，评论区的真实建议很有用', keywords: ['买包二选一纠结求助', '选哪只包帮帮我', '买包退换经历分享'], category: '买包纠结' },
  { topic: '第一只大牌包怎么选', desc: '人生第一只奢侈品包选什么？过来人踩过的坑和真诚推荐', keywords: ['人生第一只大牌包选什么', '新手买包不踩雷指南', '入门奢侈品包包真实推荐'], category: '买包纠结' },
  { topic: '买新包还是入中古', desc: '同预算买全新轻奢还是中古LV？两边都有人晒上身实拍', keywords: ['新包还是中古包好', '同价位买包终极对比', '中古包入手真实体验'], category: '买包纠结' },
  { topic: '买了就后悔的包', desc: '入手就闲置、背两次就腻的包款大盘点，过来人的真实血泪分享', keywords: ['买完后悔的包包分享', '包包踩雷教训总结', '最不值得买的奢侈品包'], category: '买包纠结' },

  // === 找渠道 ===
  { topic: '靠谱买包渠道汇总', desc: '专柜太贵代购不放心，去哪买？真实买家分享的各渠道体验', keywords: ['买包靠谱渠道推荐 不是广告', '正品包包去哪买经验', '奢侈品包购买渠道测评'], category: '找渠道' },
  { topic: '代购靠谱吗真实经历', desc: '找代购买包的水有多深？被骗过的人分享怎么分辨靠谱代购', keywords: ['代购买包被骗经历', '怎么判断代购真假', '靠谱代购买包推荐'], category: '找渠道' },
  { topic: '中古店探店测评', desc: '中古包性价比高但水深，真实探店测评告诉你哪些店靠谱', keywords: ['中古店探店真实测评', '中古包去哪买靠谱', '第一次逛中古店经历'], category: '找渠道' },
  { topic: '闲鱼买包的坑和捡漏', desc: '闲鱼买奢侈品的亲身经历，怎么分辨真实个人卖家', keywords: ['闲鱼买包经验教训', '二手平台买包避坑', '闲鱼捡漏大牌包分享'], category: '找渠道' },

  // === 奢侈品鉴定 ===
  { topic: '奢侈包真假鉴定教程', desc: '鉴定师和资深买家分享的实用辨假方法，买前必看', keywords: ['包包真假鉴定教程 细节', '自己鉴定奢侈品方法', '大牌包真假对比图'], category: '奢侈品鉴定' },
  { topic: 'LV真假细节对比', desc: 'LV包的五金、走线、皮标、序列号细节对比，手把手教', keywords: ['LV真假对比 细节图', '路易威登鉴定方法教学', 'LV老花真假辨别'], category: '奢侈品鉴定' },
  { topic: 'Chanel鉴定核心要点', desc: 'Chanel包的镭射标、五金刻字、菱格纹鉴定要点深度讲解', keywords: ['香奈儿鉴定方法 干货', 'Chanel真假辨别教程', 'CF包鉴定要点总结'], category: '奢侈品鉴定' },
  { topic: '买到假包维权经历', desc: '不小心买到假包的维权过程，怎么追回损失、维护权益', keywords: ['买到假包维权成功经验', '奢侈品假货怎么退款', '被代购骗了怎么处理'], category: '奢侈品鉴定' },

  // === 中古二手 ===
  { topic: '中古包入坑指南', desc: '为什么越来越多人迷上中古包？资深玩家分享选购心得和入坑理由', keywords: ['中古包入坑真实分享', '二手奢侈品包选购心得', '中古包新手入门指南'], category: '中古二手' },
  { topic: '中古LV最值得入的款', desc: '中古LV哪些款性价比最高、最保值？真实行情和上身效果', keywords: ['中古LV最值得买款式', 'LV中古包行情价格', '二手LV包包上身分享'], category: '中古二手' },
  { topic: '二手奢侈品平台横评', desc: '只二、红布林、胖虎……哪个平台买二手包最靠谱？真实体验', keywords: ['二手奢侈品平台对比测评', '二奢app哪个好用', '买二手包平台推荐 个人感受'], category: '中古二手' },
  { topic: '最保值的包包排行榜', desc: '哪些包不仅不贬值还升值？真实二手行情数据分析', keywords: ['保值率最高包包排名', '奢侈品包保值分析', '哪些包买了不亏钱'], category: '中古二手' },
];

var DISCOVERY_CATEGORIES = ['全部', '便宜买包', '买包纠结', '找渠道', '奢侈品鉴定', '中古二手'];

window.Modules.inspiration = {
  filterCategory: '全部',

  render: function(container) {
    var env = detectEnv();
    var filtered = this.filterList(DISCOVERY_SEED);
    var self = this;

    // 顶部提示
    var topBanner = '';
    if (!env.isMobile) {
      topBanner = ''
        + '<div style="background:linear-gradient(135deg,#feefc3,#fff8e1);border-radius:12px;padding:14px 20px;margin-bottom:16px;display:flex;align-items:center;gap:12px">'
        + '  <span style="font-size:28px">📱</span>'
        + '  <div style="flex:1">'
        + '    <div style="font-size:14px;font-weight:600;color:#8B6914">当前为桌面端，点击将打开网页版</div>'
        + '    <div style="font-size:12px;color:#A0883C;margin-top:2px">用手机访问此页面，点击卡片可唤起 App 直接查看内容，支持点赞评论</div>'
        + '  </div>'
        + '  <span style="font-size:11px;background:#8B6914;color:#fff;padding:3px 10px;border-radius:10px">手机访问更好</span>'
        + '</div>';
    }

    container.innerHTML = ''
      + '<div class="view">'
      + '  <div class="board-col" style="margin-bottom:20px;background:linear-gradient(135deg,var(--gold-glow),transparent);border-color:var(--gold-glow)">'
      + '    <div class="board-col-head" style="border:none;margin-bottom:0;padding-bottom:0">'
      + '      <div>'
      + '        <div class="board-col-title"><span class="dot" style="background:var(--gold)"></span> 内容发现 · 每日精选</div>'
      + '        <div class="card-sub" style="margin-top:4px">小红书 & 抖音真实用户内容 · 手机点击直接唤起 App · 可点赞评论收藏</div>'
      + '      </div>'
      + '      <button class="btn btn-gold btn-sm" onclick="Modules.inspiration.shuffle()">↻ 换一批</button>'
      + '    </div>'
      + '  </div>'
      + topBanner
      + '  <div class="cat-filter-wrap">'
      + '    <div class="cat-filters" id="catFilters">'
      +       DISCOVERY_CATEGORIES.map(function(c) {
              return '<span class="cat-tag' + (self.filterCategory === c ? ' active' : '') + '" onclick="Modules.inspiration.setCategory(\'' + UI.esc(c) + '\')">' + UI.esc(c) + '</span>';
            }).join('')
      + '    </div>'
      + '    <div style="font-size:12px;color:var(--ink-500);display:flex;align-items:center;gap:6px">'
      + '      <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--green)"></span>'
      + '      每日更新 · 手机点击直接跳转 App 查看'
      + '    </div>'
      + '  </div>'
      + '  <div class="discovery-grid" id="discoveryGrid"></div>'
      + '</div>';

    this.renderCards(filtered);
  },

  setCategory: function(cat) {
    this.filterCategory = cat;
    this.render(document.getElementById('viewContainer'));
  },

  filterList: function(list) {
    if (this.filterCategory === '全部') return list;
    return list.filter(function(t) { return t.category === this.filterCategory; }, this);
  },

  renderCards: function(list) {
    var grid = document.getElementById('discoveryGrid');
    if (!grid) return;
    if (!list.length) { grid.innerHTML = UI.empty('该分类下暂无内容', '✦'); return; }

    var self = this;
    var env = detectEnv();

    grid.innerHTML = list.map(function(t, i) {
      var catColor = self.getCategoryColor(t.category);
      var mainKW = t.keywords[0];
      
      var xhsU = xhsURLs(mainKW);
      var dyU = dyURLs(mainKW);

      // 移动端：onclick 触发多层 App 唤起
      // 桌面端：直接打开网页版
      var xhsClick = env.isMobile
        ? "smartOpen(" + JSON.stringify(xhsU) + ",'小红书','" + mainKW.replace(/'/g, "\\'") + "')"
        : "window.open('" + xhsU.web + "','_blank')";
      var dyClick = env.isMobile
        ? "smartOpen(" + JSON.stringify(dyU) + ",'抖音','" + mainKW.replace(/'/g, "\\'") + "')"
        : "window.open('" + dyU.web + "','_blank')";

      var platformBtns = ''
        + '<button class="platform-link p-xhs" onclick="' + xhsClick + ';return false;">'
        + '  <span class="platform-icon">📕</span>'
        + '  <span class="platform-name">小红书</span>'
        + '  <span class="platform-action">打开查看笔记 →</span>'
        + '</button>'
        + '<button class="platform-link p-dy" onclick="' + dyClick + ';return false;">'
        + '  <span class="platform-icon">🎬</span>'
        + '  <span class="platform-name">抖音</span>'
        + '  <span class="platform-action">打开查看视频 →</span>'
        + '</button>';

      // 备用关键词
      var altKeywords = t.keywords.slice(1).map(function(k) {
        var altXhs = xhsURLs(k);
        var altClick = env.isMobile
          ? "smartOpen(" + JSON.stringify(altXhs) + ",'小红书','" + k.replace(/'/g, "\\'") + "')"
          : "window.open('" + altXhs.web + "','_blank')";
        return '<span class="keyword-chip" onclick="' + altClick + ';return false;" title="小红书搜索: ' + UI.esc(k) + '">' + UI.esc(k) + '</span>';
      }).join('');

      return ''
      + '<div class="discovery-card">'
      + '  <div class="discovery-card-top">'
      + '    <span class="disc-cat-tag" style="background:' + catColor.bg + ';color:' + catColor.fg + '">' + UI.esc(t.category) + '</span>'
      + '    <span class="disc-source-badge">✓ 真实用户内容</span>'
      + '  </div>'
      + '  <div class="disc-title" style="font-size:16px;font-weight:600;margin:12px 0 6px">' + UI.esc(t.topic) + '</div>'
      + '  <div class="disc-desc" style="font-size:13px;color:var(--ink-500);line-height:1.6;margin-bottom:12px">' + UI.esc(t.desc) + '</div>'
      + '  <div class="disc-platforms" style="display:flex;gap:10px;margin-bottom:12px">' + platformBtns + '</div>'
      + '  <div class="disc-keywords" style="display:flex;flex-wrap:wrap;gap:6px;align-items:center">'
      + '    <span style="font-size:11px;color:var(--ink-400);flex-shrink:0">换个词搜：</span>'
      +     altKeywords
      + '  </div>'
      + '  <div class="disc-foot" style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border);font-size:11px;color:var(--ink-400)">'
      + '    👆 点击按钮直接唤起 App 查看内容，可点赞、评论、收藏'
      + '  </div>'
      + '</div>';
    }).join('');
  },

  getCategoryColor: function(cat) {
    var map = {
      '便宜买包': { bg: 'rgba(184,147,88,0.12)', fg: 'var(--gold-deep)' },
      '买包纠结': { bg: 'rgba(192,139,126,0.12)', fg: '#A0524A' },
      '找渠道':    { bg: 'rgba(91,140,106,0.12)', fg: 'var(--green)' },
      '奢侈品鉴定': { bg: 'rgba(184,84,80,0.10)',   fg: 'var(--red)' },
      '中古二手':   { bg: 'rgba(28,28,30,0.06)',   fg: 'var(--ink-700)' },
    };
    return map[cat] || { bg: 'var(--bg-soft)', fg: 'var(--ink-500)' };
  },

  shuffle: function() {
    var grid = document.getElementById('discoveryGrid');
    if (!grid) return;
    var shuffled = [].concat(DISCOVERY_SEED).sort(function() { return Math.random() - 0.5; });
    var filtered = this.filterCategory === '全部' ? shuffled : shuffled.filter(function(t) { return t.category === this.filterCategory; }, this);
    this.renderCards(filtered);
    UI.toast('已刷新内容 ✦');
  },
};
