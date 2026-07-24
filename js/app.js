/* ============================================
   Chayil CEO OS — Main App v4
   Supabase 认证 + 云端实时同步 + 响应式布局
   ============================================ */

const App = {
  current: 'home',

  routes: {
    'home': { title: 'CEO 驾驶舱', module: 'home' },
    'daily-plan': { title: '每日计划', module: 'dailyPlan' },
    'inspiration': { title: '灵感中心', module: 'inspiration' },
    'radar': { title: '爆款雷达', module: 'radar' },
    'review': { title: '内容复盘', module: 'review' },
    'finance': { title: '财务管理', module: 'finance' },
    'english': { title: '英语学习', module: 'english' },
    'assets': { title: '我的资产库', module: 'assets' },
  },

  async init() {
    // === Supabase 配置检查 ===
    if (!Supa.isConfigured()) {
      // Supabase 未配置，使用纯本地模式（兼容旧版）
      console.warn('⚠ Supabase 未配置，使用本地存储模式');
      await this.initLocalMode();
      return;
    }

    // === 认证检查 ===
    const session = await Supa.getSession();
    if (!session) {
      window.location.href = 'login.html';
      return;
    }

    // === 数据迁移检测 ===
    await this.checkMigration();

    // === 加载数据（本地 + 云端） ===
    await Store.load();

    // === 重新计算 streak ===
    Store.update(data => {
      Store.ensureStreakHistory();
      const history = data.meta.streakHistory || {};
      const keys = ['fitness', 'english', 'learning', 'spiritual'];
      if (!data.meta.personalStreaks) data.meta.personalStreaks = {};
      keys.forEach(k => {
        if (!history[k]) history[k] = [];
        data.meta.personalStreaks[k] = Store.calcStreak(history[k]);
      });
    });

    // === 预填充灵感与爆款数据 ===
    Store.update(data => {
      if ((!data.inspirations || !data.inspirations.length) && typeof INSPIRATION_SEED !== 'undefined') {
        data.inspirations = INSPIRATION_SEED.map(s => ({
          id: Store.uid(), ...s, _updated: Date.now(), date: Store.todayStr(),
          category: s.category || '创业', status: 'pending'
        }));
      }
      if ((!data.radar || !data.radar.length) && typeof RADAR_SEED !== 'undefined') {
        data.radar = RADAR_SEED.map(s => ({
          id: Store.uid(), ...s, _updated: Date.now(), date: Store.todayStr(),
          bookmarked: false, emotionPoint: s.emotionPoint || '', myAdaptation: s.myAdaptation || ''
        }));
      }
    });

    this.bindNav();
    this.renderDate();
    this.renderStreak();
    this.renderSyncStatus();
    this.route(this.current);

    // === 启动 Supabase 轮询（每 30 秒，静默更新，不弹 toast） ===
    Supa.startPolling(async () => {
      try {
        const changed = await Store.pullFromCloud();
        if (changed) {
          this.renderSyncStatus();
          this.renderStreak();
          this.route(this.current);
        }
      } catch (e) { /* 静默 */ }
    });

    // === 页面恢复可见时拉取（带 5 秒冷却，避免频繁请求） ===
    let lastVisibilityPull = 0;
    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      const now = Date.now();
      if (now - lastVisibilityPull < 5000) return;
      lastVisibilityPull = now;
      this.onPageVisible();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('focus', onVisibilityChange);

    // === CEO 日报按钮 ===
    document.getElementById('ceoReportBtn').addEventListener('click', () => this.openCeoModal());
    document.getElementById('ceoModal').addEventListener('click', e => {
      if (e.target.id === 'ceoModal') this.closeCeoModal();
    });

    // === 顶部同步状态按钮 ===
    const syncStatusBtn = document.getElementById('syncStatusBtn');
    if (syncStatusBtn) {
      syncStatusBtn.addEventListener('click', () => this.showSyncInfo());
    }

    // === 退出登录 ===
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        if (confirm('确定退出登录？本地数据不会丢失。')) {
          Supa.stopPolling();
          await Supa.signOut();
          window.location.href = 'login.html';
        }
      });
    }
  },

  // === 数据迁移（localStorage → Supabase 分离表） ===

  async checkMigration() {
    if (Store.hasLegacyData()) {
      const legacy = Store.getLegacyData();
      if (legacy) {
        const confirmed = confirm(
          '📦 检测到旧版本地数据。\n\n' +
          '是否将旧数据导入到云端账号？\n' +
          '选择「确定」导入并同步到 Supabase 数据库，\n' +
          '选择「取消」则使用全新数据。'
        );
        if (confirmed) {
          // 合并旧数据到当前 Store
          Store.update(d => {
            const merged = Store.deepMerge(d, legacy);
            Object.assign(d, merged);
          });

          // 迁移到 Supabase 分离表
          const result = await Supa.migrateFromBlob(legacy);
          if (result.success) {
            UI.toast('✅ ' + result.message);
          } else {
            UI.toast('⚠ ' + result.message);
          }

          // 清除旧版本标记（保留备份）
          localStorage.setItem('chayil_ceo_data_legacy_backup', JSON.stringify(legacy));
          localStorage.removeItem('chayil_ceo_data_v4');
          localStorage.removeItem('chayil_ceo_data_v3');
        }
      }
    }
  },

  // === 页面恢复可见时拉取 ===

  async onPageVisible() {
    try {
      const changed = await Store.pullFromCloud();
      if (changed) {
        this.renderSyncStatus();
        this.renderStreak();
        this.route(this.current);
      }
    } catch (e) { /* 静默 */ }
  },

  // === 同步状态 ===

  renderSyncStatus() {
    const dot = document.getElementById('syncDot');
    const text = document.getElementById('syncText');
    if (!dot || !text) return;

    const cloudVer = Store.getCloudVersion();
    dot.className = 'sync-dot';
    if (!Supa.getUserId()) {
      dot.classList.add('sync-off');
      text.textContent = '未登录';
    } else if (cloudVer) {
      dot.classList.add('sync-on');
      const d = new Date(cloudVer);
      const now = new Date();
      const diff = Math.floor((now - d) / 1000);
      if (diff < 10) text.textContent = '已同步 · 刚刚';
      else if (diff < 60) text.textContent = '已同步 · ' + diff + '秒前';
      else if (diff < 3600) text.textContent = '已同步 · ' + Math.floor(diff / 60) + '分钟前';
      else text.textContent = '已同步 · ' + Math.floor(diff / 3600) + '小时前';
    } else {
      dot.classList.add('sync-on');
      text.textContent = '已连接';
    }
  },

  showSyncInfo() {
    const cloudVer = Store.getCloudVersion();
    const msg = cloudVer
      ? '最后同步：' + new Date(cloudVer).toLocaleString('zh-CN')
      : '尚未同步到云端，数据仅存在本地。';
    UI.toast(msg);
  },

  // === 路由 ===

  bindNav() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const route = item.dataset.route;
        this.route(route);
      });
    });

    // 移动端底部导航
    document.querySelectorAll('.mnav-item[data-mroute]').forEach(item => {
      item.addEventListener('click', () => {
        const route = item.dataset.mroute;
        this.route(route);
      });
    });

    // 移动端同步按钮
    const mnavSync = document.getElementById('mnavSync');
    if (mnavSync) {
      mnavSync.addEventListener('click', async () => {
        UI.toast('正在同步...');
        const ok = await Store.pushNow();
        if (ok) {
          this.renderSyncStatus();
          UI.toast('同步完成 ✓');
        } else {
          UI.toast('同步失败，请检查网络');
        }
      });
    }
  },

  route(name) {
    if (!this.routes[name]) return;
    this.current = name;
    document.querySelectorAll('.nav-item').forEach(i => i.classList.toggle('active', i.dataset.route === name));
    document.querySelectorAll('.mnav-item[data-mroute]').forEach(i => i.classList.toggle('active', i.dataset.mroute === name));
    document.getElementById('pageTitle').textContent = this.routes[name].title;

    const container = document.getElementById('viewContainer');
    const moduleName = this.routes[name].module;
    const mod = window.Modules[moduleName];
    if (mod && mod.render) {
      container.innerHTML = '';
      mod.render(container);
    }
  },

  renderDate() {
    const d = new Date();
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const str = d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日 · ' + weekdays[d.getDay()];
    document.getElementById('pageDate').textContent = str;
  },

  renderStreak() {
    const d = Store.get();
    const streaks = d.meta.personalStreaks || {};
    const max = Math.max(streaks.fitness || 0, streaks.english || 0, streaks.learning || 0, streaks.spiritual || 0);
    document.getElementById('sidebarStreak').textContent = max || 0;
  },

  // === CEO 日报 ===

  openCeoModal() {
    const d = Store.get();
    const body = document.getElementById('ceoModalBody');
    const dateTitle = document.getElementById('ceoDateTitle');

    const now = new Date();
    const hour = now.getHours();
    let greeting = '早安';
    if (hour >= 11 && hour < 13) greeting = '午安';
    else if (hour >= 13 && hour < 18) greeting = '下午好';
    else if (hour >= 18) greeting = '晚安';
    dateTitle.textContent = 'Chayil ' + greeting;

    const today = Store.todayStr();
    const month = today.slice(0, 7);
    const allTasks = [...d.tasks.personalGrowth, ...d.tasks.business, ...d.tasks.contentGrowth];
    const undone = allTasks.filter(t => !t.done).slice(0, 5);
    const todayIncome = d.finance.income.filter(i => i.date === today).reduce((s, i) => s + (+i.amount || 0), 0);
    const todayExpense = d.finance.expense.filter(e => e.date === today).reduce((s, e) => s + (+e.amount || 0), 0);
    const monthIncome = d.finance.income.filter(i => i.date.startsWith(month)).reduce((s, i) => s + (+i.amount || 0), 0);
    const monthProfit = monthIncome - d.finance.expense.filter(e => e.date.startsWith(month)).reduce((s, e) => s + (+e.amount || 0), 0);
    const radar = d.radar || [];
    const topRadar = radar[0];
    const topics = d.inspirations || [];
    const topTopic = topics[0];
    const dailyTarget = d.finance.dailyTarget || 4000;
    const targetGap = dailyTarget - todayIncome;

    body.innerHTML = `
      <div class="ceo-section">
        <div class="ceo-section-label">今日重点</div>
        <div class="ceo-section-body">
          ${undone.length ? `<ul>${undone.map(t => `<li>${UI.esc(t.text)}</li>`).join('')}</ul>` : '<p>今日任务已全部完成，给自己一杯好咖啡 ☕</p>'}
        </div>
      </div>
      <div class="ceo-section">
        <div class="ceo-section-label">商业提醒</div>
        <div class="ceo-section-body">
          <ul>
            <li>今日收入 <b style="color:var(--green)">${UI.money(todayIncome)}</b>，支出 <b style="color:var(--red)">${UI.money(todayExpense)}</b>，净额 <b style="color:var(--gold-deep)">${UI.money(todayIncome - todayExpense)}</b></li>
            <li>日目标 ${UI.money(dailyTarget)}，${targetGap > 0 ? `还差 <b style="color:var(--red)">${UI.money(targetGap)}</b>` : '已达成 ✓'}</li>
            <li>本月累计：收入 ${UI.money(monthIncome)} · 利润 ${UI.money(monthProfit)}</li>
            <li>待跟进客户：${d.assets.customers.length} 位在册，建议今日主动触达 2-3 位高复购客户</li>
          </ul>
        </div>
      </div>
      <div class="ceo-section">
        <div class="ceo-section-label">行业热点</div>
        <div class="ceo-section-body">
          ${topRadar ? `<p><b>${UI.esc(topRadar.title)}</b></p><p style="color:var(--ink-500);font-size:12px">爆款原因：${UI.esc((topRadar.reasons||[]).slice(0,2).join('；'))}</p>` : '<p>今日暂无热点</p>'}
        </div>
      </div>
      <div class="ceo-section">
        <div class="ceo-section-label">内容建议</div>
        <div class="ceo-section-body">
          ${topTopic ? `<p>今日推荐选题：<b>${UI.esc(topTopic.title)}</b></p><p style="color:var(--ink-500);font-size:12px">方向：${UI.esc(topTopic.direction)} · 适合平台：${UI.esc(topTopic.platform)}</p>` : '<p>前往灵感中心查看今日选题</p>'}
        </div>
      </div>
      <div class="ceo-section">
        <div class="ceo-section-label">成长箴言</div>
        <div class="ceo-section-body" style="font-family:var(--ff-serif);font-size:16px;color:var(--gold-deep);font-style:italic">
          "才德的妇人谁能得着呢？她的价值远胜过珍珠。"<br><span style="font-size:12px;color:var(--ink-300);font-style:normal">— 箴言 31:10</span>
        </div>
      </div>
    `;

    document.getElementById('ceoModal').classList.add('show');
  },

  closeCeoModal() {
    document.getElementById('ceoModal').classList.remove('show');
  },

  // === 本地模式（Supabase 未配置时的回退） ===
  async initLocalMode() {
    await Store.load();
    Store.update(data => {
      Store.ensureStreakHistory();
      const history = data.meta.streakHistory || {};
      const keys = ['fitness', 'english', 'learning', 'spiritual'];
      if (!data.meta.personalStreaks) data.meta.personalStreaks = {};
      keys.forEach(k => {
        if (!history[k]) history[k] = [];
        data.meta.personalStreaks[k] = Store.calcStreak(history[k]);
      });
    });
    Store.update(data => {
      if ((!data.inspirations || !data.inspirations.length) && typeof INSPIRATION_SEED !== 'undefined') {
        data.inspirations = INSPIRATION_SEED.map(s => ({ id: Store.uid(), ...s, _updated: Date.now(), date: Store.todayStr(), category: s.category || '创业', status: 'pending' }));
      }
      if ((!data.radar || !data.radar.length) && typeof RADAR_SEED !== 'undefined') {
        data.radar = RADAR_SEED.map(s => ({ id: Store.uid(), ...s, _updated: Date.now(), date: Store.todayStr(), bookmarked: false, emotionPoint: s.emotionPoint || '', myAdaptation: s.myAdaptation || '' }));
      }
    });

    this.bindNav();
    this.renderDate();
    this.renderStreak();
    this.renderSyncStatusLocal();
    this.route(this.current);

    // 本地模式下同步按钮触发 Supabase 配置提示
    document.getElementById('ceoReportBtn').addEventListener('click', () => this.openCeoModal());
    document.getElementById('ceoModal').addEventListener('click', e => {
      if (e.target.id === 'ceoModal') this.closeCeoModal();
    });

    const syncBtn = document.getElementById('syncStatusBtn');
    if (syncBtn) {
      syncBtn.addEventListener('click', () => {
        alert('Supabase 尚未配置。\n\n请在 js/supabase.js 中填入你的 Supabase 项目 URL 和 anon key。\n\n1. 前往 supabase.com 创建项目\n2. Settings > API 复制 URL 和 anon key\n3. 在 SQL Editor 运行 supabase-schema.sql');
      });
    }
  },

  renderSyncStatusLocal() {
    const dot = document.getElementById('syncDot');
    const text = document.getElementById('syncText');
    if (dot && text) {
      dot.className = 'sync-dot sync-off';
      text.textContent = '本地模式';
    }
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
