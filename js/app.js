/* ============================================
   Chayil CEO OS — Main App
   路由 / 导航 / CEO 日报
   ============================================ */

const App = {
  current: 'daily-plan',

  routes: {
    'daily-plan': { title: '每日计划', module: 'dailyPlan' },
    'inspiration': { title: '灵感中心', module: 'inspiration' },
    'radar': { title: '爆款雷达', module: 'radar' },
    'review': { title: '内容复盘', module: 'review' },
    'finance': { title: '财务管理', module: 'finance' },
    'assets': { title: '我的资产库', module: 'assets' },
  },

  init() {
    Store.load();
    // 预填充灵感与爆款数据，确保CEO日报有内容
    Store.update(data => {
      if ((!data.inspirations || !data.inspirations.length) && typeof INSPIRATION_SEED !== 'undefined') {
        data.inspirations = INSPIRATION_SEED.map(s => ({ id: Store.uid(), ...s, date: Store.todayStr() }));
      }
      if ((!data.radar || !data.radar.length) && typeof RADAR_SEED !== 'undefined') {
        data.radar = RADAR_SEED.map(s => ({ id: Store.uid(), ...s, date: Store.todayStr() }));
      }
    });
    this.bindNav();
    this.renderDate();
    this.renderStreak();
    this.route(this.current);

    document.getElementById('ceoReportBtn').addEventListener('click', () => this.openCeoModal());

    // 点击遮罩关闭弹窗
    document.getElementById('ceoModal').addEventListener('click', e => {
      if (e.target.id === 'ceoModal') this.closeCeoModal();
    });
  },

  bindNav() {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', () => {
        const route = item.dataset.route;
        this.route(route);
      });
    });
  },

  route(name) {
    if (!this.routes[name]) return;
    this.current = name;
    document.querySelectorAll('.nav-item').forEach(i => i.classList.toggle('active', i.dataset.route === name));
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
    document.getElementById('sidebarStreak').textContent = d.meta.streak || 0;
  },

  // CEO 每日日报
  openCeoModal() {
    const d = Store.get();
    const modal = document.getElementById('ceoModal');
    const body = document.getElementById('ceoModalBody');
    const dateTitle = document.getElementById('ceoDateTitle');

    const now = new Date();
    const hour = now.getHours();
    let greeting = '早安';
    if (hour >= 11 && hour < 13) greeting = '午安';
    else if (hour >= 13 && hour < 18) greeting = '下午好';
    else if (hour >= 18) greeting = '晚安';
    dateTitle.textContent = 'Chayil ' + greeting;

    // 今日任务重点
    const allTasks = [...d.tasks.personalGrowth, ...d.tasks.business, ...d.tasks.contentGrowth];
    const undone = allTasks.filter(t => !t.done).slice(0, 5);

    // 今日收入
    const today = Store.todayStr();
    const todayIncome = d.finance.income.filter(i => i.date === today).reduce((s, i) => s + (+i.amount || 0), 0);
    const todayExpense = d.finance.expense.filter(e => e.date === today).reduce((s, e) => s + (+e.amount || 0), 0);

    // 爆款
    const radar = d.radar || [];
    const topRadar = radar[0];

    // 选题
    const topics = d.inspirations || [];
    const topTopic = topics[0];

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
            <li>待跟进客户：${d.assets.customers.length} 位在册，建议今日主动触达 2-3 位高复购客户</li>
            <li>库存预警：${d.assets.products.filter(p=>+p.stock<=1).length} 款商品库存≤1，需及时补货</li>
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
          ${topTopic ? `<p>今日推荐选题：<b>${UI.esc(topTopic.title)}</b></p><p style="color:var(--ink-500);font-size:12px">方向：${UI.esc(topTopic.direction)} · 适合平台：${UI.esc(topTopic.platform)}</p><p style="color:var(--gold-deep);font-size:12px">改编建议：${UI.esc(topTopic.suggestion)}</p>` : '<p>前往灵感中心查看今日选题</p>'}
        </div>
      </div>

      <div class="ceo-section">
        <div class="ceo-section-label">成长箴言</div>
        <div class="ceo-section-body" style="font-family:var(--ff-serif);font-size:16px;color:var(--gold-deep);font-style:italic">
          "才德的妇人谁能得着呢？她的价值远胜过珍珠。"<br><span style="font-size:12px;color:var(--ink-300);font-style:normal">— 箴言 31:10</span>
        </div>
      </div>
    `;

    modal.classList.add('show');
  },

  closeCeoModal() {
    document.getElementById('ceoModal').classList.remove('show');
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
