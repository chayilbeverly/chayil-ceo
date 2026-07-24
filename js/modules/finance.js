/* ============================================
   财务管理 v3 — 日目标 + 月度趋势
   ============================================ */

window.Modules = window.Modules || {};

window.Modules.finance = {
  charts: { trend: null, monthly: null },
  editingIncomeId: null,
  editingExpenseId: null,

  render(container) {
    const d = Store.get();
    const today = Store.todayStr();
    const month = today.slice(0, 7);

    const todayIncome = d.finance.income.filter(i => i.date === today).reduce((s, i) => s + (+i.amount || 0), 0);
    const todayExpense = d.finance.expense.filter(e => e.date === today).reduce((s, e) => s + (+e.amount || 0), 0);
    const monthIncome = d.finance.income.filter(i => i.date.startsWith(month)).reduce((s, i) => s + (+i.amount || 0), 0);
    const monthExpense = d.finance.expense.filter(e => e.date.startsWith(month)).reduce((s, e) => s + (+e.amount || 0), 0);
    const monthProfit = monthIncome - monthExpense;
    const yearIncome = d.finance.income.filter(i => i.date.startsWith(today.slice(0, 4))).reduce((s, i) => s + (+i.amount || 0), 0);
    const dailyTarget = d.finance.dailyTarget || 4000;
    const targetGap = dailyTarget - todayIncome;
    const targetRate = dailyTarget ? Math.round((todayIncome / dailyTarget) * 100) : 0;

    const incBtnText = this.editingIncomeId ? '✓ 更新收入' : '+ 添加收入';
    const expBtnText = this.editingExpenseId ? '✓ 更新支出' : '+ 添加支出';
    const incBtnClass = this.editingIncomeId ? 'btn btn-gold btn-sm btn-block' : 'btn btn-dark btn-sm btn-block';
    const expBtnClass = this.editingExpenseId ? 'btn btn-gold btn-sm btn-block' : 'btn btn-dark btn-sm btn-block';

    container.innerHTML = `
      <div class="view">
        <!-- Dashboard 概览 -->
        <div class="fin-summary">
          <div class="fin-card gold-card">
            <div class="fin-label">今日收入</div>
            <div class="fin-value income">${UI.money(todayIncome)}</div>
            <div class="fin-sub">目标 ${UI.money(dailyTarget)} · 完成 ${targetRate}%</div>
          </div>
          <div class="fin-card">
            <div class="fin-label">今日支出</div>
            <div class="fin-value expense">${UI.money(todayExpense)}</div>
          </div>
          <div class="fin-card">
            <div class="fin-label">距目标</div>
            <div class="fin-value ${targetGap > 0 ? 'expense' : 'income'}">${targetGap > 0 ? UI.money(targetGap) : '已达成 ✓'}</div>
            <div class="fin-sub">${targetGap > 0 ? '还差这些' : '恭喜达成！'}</div>
          </div>
          <div class="fin-card">
            <div class="fin-label">本月收入</div>
            <div class="fin-value income">${UI.money(monthIncome)}</div>
          </div>
          <div class="fin-card">
            <div class="fin-label">本月利润</div>
            <div class="fin-value profit">${UI.money(monthProfit)}</div>
          </div>
        </div>

        <!-- 日目标设置 -->
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;background:var(--bg-card);border:1px solid var(--line-soft);border-radius:var(--r-md);padding:14px 20px">
          <span style="font-size:13px;color:var(--ink-700);font-weight:500">每日目标收入：</span>
          <input type="number" class="form-input" id="dailyTargetInput" value="${dailyTarget}" style="width:120px" placeholder="4000">
          <button class="btn btn-gold btn-sm" onclick="Modules.finance.updateTarget()">设定目标</button>
          <div class="fin-target-bar" style="flex:1;margin-left:16px">
            <div class="fin-target-label">今日完成</div>
            <div class="fin-target-track">
              <div class="fin-target-fill" style="width:${Math.min(targetRate, 100)}%"></div>
            </div>
            <div class="fin-target-perc">${targetRate}%</div>
          </div>
        </div>

        <!-- 图表区 -->
        <div class="fin-charts">
          <div class="chart-wrap">
            <h3>收入与支出趋势（近7天）</h3>
            <div class="chart-box"><canvas id="chartTrend"></canvas></div>
          </div>
          <div class="chart-wrap">
            <h3>月度收入趋势</h3>
            <div class="chart-box"><canvas id="chartMonthly"></canvas></div>
          </div>
        </div>

        <!-- 记账 -->
        <div class="board">
          <div class="board-col">
            <div class="board-col-head">
              <div class="board-col-title"><span class="dot" style="background:var(--green)"></span> 每日收入</div>
              <div class="board-col-meta">${UI.money(todayIncome)} 今日</div>
            </div>
            <div class="card-body" style="padding:0 0 16px">
              ${this.editingIncomeId ? '<div style="font-size:11px;color:var(--gold-deep);margin-bottom:8px">◆ 正在编辑收入记录</div>' : ''}
              <div class="form-grid two" style="margin-bottom:12px">
                <div class="form-field"><label class="form-label">日期</label><input type="date" class="form-input" id="inc-date" value="${today}"></div>
                <div class="form-field"><label class="form-label">收入来源</label><input type="text" class="form-input" id="inc-source" placeholder="商品销售"></div>
                <div class="form-field"><label class="form-label">客户</label><input type="text" class="form-input" id="inc-customer" placeholder="客户姓名"></div>
                <div class="form-field"><label class="form-label">商品</label><input type="text" class="form-input" id="inc-product" placeholder="商品名称"></div>
                <div class="form-field"><label class="form-label">金额</label><input type="number" class="form-input" id="inc-amount" placeholder="0"></div>
                <div class="form-field"><label class="form-label">付款方式</label><select class="form-select" id="inc-method"><option>微信</option><option>支付宝</option><option>银行转账</option><option>现金</option></select></div>
                <div class="form-field full"><label class="form-label">备注</label><input type="text" class="form-input" id="inc-note" placeholder="备注"></div>
              </div>
              <div style="display:flex;gap:8px">
                <button class="${incBtnClass}" onclick="Modules.finance.addIncome()" style="flex:1">${incBtnText}</button>
                ${this.editingIncomeId ? '<button class="btn btn-ghost btn-sm" onclick="Modules.finance.cancelEdit()">取消</button>' : ''}
              </div>
            </div>
            <div id="inc-list" style="margin-top:14px"></div>
          </div>

          <div class="board-col">
            <div class="board-col-head">
              <div class="board-col-title"><span class="dot" style="background:var(--red)"></span> 每日支出</div>
              <div class="board-col-meta">${UI.money(todayExpense)} 今日</div>
            </div>
            <div class="card-body" style="padding:0 0 16px">
              ${this.editingExpenseId ? '<div style="font-size:11px;color:var(--gold-deep);margin-bottom:8px">◆ 正在编辑支出记录</div>' : ''}
              <div class="form-grid two" style="margin-bottom:12px">
                <div class="form-field"><label class="form-label">日期</label><input type="date" class="form-input" id="exp-date" value="${today}"></div>
                <div class="form-field"><label class="form-label">类别</label><select class="form-select" id="exp-cat"><option>采购</option><option>广告</option><option>生活</option><option>学习</option><option>交通</option><option>其他</option></select></div>
                <div class="form-field"><label class="form-label">金额</label><input type="number" class="form-input" id="exp-amount" placeholder="0"></div>
                <div class="form-field"><label class="form-label">备注</label><input type="text" class="form-input" id="exp-note" placeholder="备注"></div>
              </div>
              <div style="display:flex;gap:8px">
                <button class="${expBtnClass}" onclick="Modules.finance.addExpense()" style="flex:1">${expBtnText}</button>
                ${this.editingExpenseId ? '<button class="btn btn-ghost btn-sm" onclick="Modules.finance.cancelEdit()">取消</button>' : ''}
              </div>
            </div>
            <div id="exp-list" style="margin-top:14px"></div>
          </div>
        </div>
      </div>
    `;

    if (this.editingIncomeId) {
      const item = d.finance.income.find(i => i.id === this.editingIncomeId);
      if (item) this.fillIncomeForm(item);
    }
    if (this.editingExpenseId) {
      const item = d.finance.expense.find(e => e.id === this.editingExpenseId);
      if (item) this.fillExpenseForm(item);
    }

    this.renderIncomeList();
    this.renderExpenseList();
    this.renderCharts();
  },

  updateTarget() {
    const val = +document.getElementById('dailyTargetInput').value;
    if (!val || val <= 0) { UI.toast('请输入有效目标金额'); return; }
    Store.update(d => { d.finance.dailyTarget = val; });
    this.rerender();
    UI.toast('日目标已更新为 ' + UI.money(val));
  },

  fillIncomeForm(item) {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    set('inc-date', item.date); set('inc-source', item.source);
    set('inc-customer', item.customer); set('inc-product', item.product);
    set('inc-amount', item.amount); set('inc-note', item.note);
    if (item.method) {
      const sel = document.getElementById('inc-method');
      if (sel) { for (const o of sel.options) { if (o.value === item.method) { o.selected = true; break; } } }
    }
  },

  fillExpenseForm(item) {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    set('exp-date', item.date); set('exp-amount', item.amount); set('exp-note', item.note);
    if (item.category) {
      const sel = document.getElementById('exp-cat');
      if (sel) { for (const o of sel.options) { if (o.value === item.category) { o.selected = true; break; } } }
    }
  },

  cancelEdit() { this.editingIncomeId = null; this.editingExpenseId = null; this.rerender(); },

  addIncome() {
    const get = id => document.getElementById(id).value.trim();
    const amount = +get('inc-amount');
    if (!amount) { UI.toast('请输入金额'); return; }
    const itemData = {
      date: get('inc-date'), source: get('inc-source') || '商品销售',
      customer: get('inc-customer'), product: get('inc-product'),
      amount, method: get('inc-method'), note: get('inc-note'),
    };
    if (this.editingIncomeId) {
      Store.updateItem('income', this.editingIncomeId, itemData, 'finance');
      this.editingIncomeId = null; UI.toast('收入已更新');
    } else {
      Store.addItem('income', itemData, 'finance'); UI.toast('收入已记录');
    }
    ['inc-customer', 'inc-product', 'inc-amount', 'inc-note'].forEach(id => {
      const el = document.getElementById(id); if (el) el.value = '';
    });
    this.rerender();
  },

  addExpense() {
    const get = id => document.getElementById(id).value.trim();
    const amount = +get('exp-amount');
    if (!amount) { UI.toast('请输入金额'); return; }
    const itemData = { date: get('exp-date'), category: get('exp-cat'), amount, note: get('exp-note') };
    if (this.editingExpenseId) {
      Store.updateItem('expense', this.editingExpenseId, itemData, 'finance');
      this.editingExpenseId = null; UI.toast('支出已更新');
    } else {
      Store.addItem('expense', itemData, 'finance'); UI.toast('支出已记录');
    }
    document.getElementById('exp-amount').value = '';
    document.getElementById('exp-note').value = '';
    this.rerender();
  },

  editIncome(id) { this.editingIncomeId = id; this.editingExpenseId = null; this.rerender(); },
  editExpense(id) { this.editingExpenseId = id; this.editingIncomeId = null; this.rerender(); },

  deleteIncome(id) {
    if (!confirm('确定删除这条收入记录吗？')) return;
    Store.removeItem('income', id, 'finance');
    if (this.editingIncomeId === id) this.editingIncomeId = null;
    this.rerender(); UI.toast('已删除');
  },

  deleteExpense(id) {
    if (!confirm('确定删除这条支出记录吗？')) return;
    Store.removeItem('expense', id, 'finance');
    if (this.editingExpenseId === id) this.editingExpenseId = null;
    this.rerender(); UI.toast('已删除');
  },

  renderIncomeList() {
    const el = document.getElementById('inc-list');
    if (!el) return;
    const list = Store.get().finance.income.filter(i => i.date === Store.todayStr());
    if (!list.length) { el.innerHTML = UI.empty('今日暂无收入记录', '◇'); return; }
    el.innerHTML = list.map(i => `
      <div class="record-item">
        <div class="record-main">
          <div class="record-title">${UI.esc(i.customer || '客户')} · ${UI.esc(i.product || i.source)}</div>
          <div class="record-meta">
            <span class="record-tag" style="background:var(--bg-soft)">${UI.esc(i.method)}</span>
            <span>${UI.esc(i.date)}</span>
            ${i.note ? `<span>${UI.esc(i.note)}</span>` : ''}
          </div>
        </div>
        <div class="record-actions">
          <button class="rec-act-edit" onclick="Modules.finance.editIncome('${i.id}')" title="编辑">✎</button>
          <button class="rec-act-del" onclick="Modules.finance.deleteIncome('${i.id}')" title="删除">×</button>
        </div>
        <div class="record-amount income">+${UI.money(i.amount)}</div>
      </div>
    `).join('');
  },

  renderExpenseList() {
    const el = document.getElementById('exp-list');
    if (!el) return;
    const list = Store.get().finance.expense.filter(e => e.date === Store.todayStr());
    if (!list.length) { el.innerHTML = UI.empty('今日暂无支出记录', '◇'); return; }
    el.innerHTML = list.map(e => `
      <div class="record-item">
        <div class="record-main">
          <div class="record-title">${UI.esc(e.category)}</div>
          <div class="record-meta"><span>${UI.esc(e.date)}</span>${e.note ? `<span>${UI.esc(e.note)}</span>` : ''}</div>
        </div>
        <div class="record-actions">
          <button class="rec-act-edit" onclick="Modules.finance.editExpense('${e.id}')" title="编辑">✎</button>
          <button class="rec-act-del" onclick="Modules.finance.deleteExpense('${e.id}')" title="删除">×</button>
        </div>
        <div class="record-amount expense">-${UI.money(e.amount)}</div>
      </div>
    `).join('');
  },

  renderCharts() {
    const d = Store.get();
    const today = new Date();

    // 7天趋势
    const labels = [];
    const incomeData = [];
    const expenseData = [];
    for (let i = 6; i >= 0; i--) {
      const dt = new Date(today);
      dt.setDate(dt.getDate() - i);
      const ds = dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
      labels.push(String(dt.getMonth() + 1) + '/' + String(dt.getDate()));
      incomeData.push(d.finance.income.filter(x => x.date === ds).reduce((s, x) => s + (+x.amount || 0), 0));
      expenseData.push(d.finance.expense.filter(x => x.date === ds).reduce((s, x) => s + (+x.amount || 0), 0));
    }

    try { if (this.charts.trend) this.charts.trend.destroy(); } catch(e) {}
    try { if (this.charts.monthly) this.charts.monthly.destroy(); } catch(e) {}
    this.charts.trend = null; this.charts.monthly = null;

    const trendCtx = document.getElementById('chartTrend');
    if (trendCtx) {
      this.charts.trend = new Chart(trendCtx, {
        type: 'bar',
        data: {
          labels,
          datasets: [
            { label: '收入', data: incomeData, backgroundColor: '#B89358', borderRadius: 6, barPercentage: 0.6 },
            { label: '支出', data: expenseData, backgroundColor: '#D8D7D2', borderRadius: 6, barPercentage: 0.6 },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, color: '#6B6B70', usePointStyle: true } } },
          scales: {
            x: { grid: { display: false }, ticks: { color: '#9E9EA4', font: { size: 11 } } },
            y: { grid: { color: '#F0EEE8' }, ticks: { color: '#9E9EA4', font: { size: 11 }, callback: v => '¥' + UI.fmt(v) } },
          },
        },
      });
    }

    // 月度收入/利润趋势（近6个月）
    const monthLabels = [];
    const monthIncData = [];
    const monthProfitData = [];
    for (let i = 5; i >= 0; i--) {
      const dt = new Date(today);
      dt.setMonth(dt.getMonth() - i);
      const m = dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0');
      monthLabels.push(String(dt.getMonth() + 1) + '月');
      monthIncData.push(d.finance.income.filter(x => x.date.startsWith(m)).reduce((s, x) => s + (+x.amount || 0), 0));
      const exp = d.finance.expense.filter(x => x.date.startsWith(m)).reduce((s, x) => s + (+x.amount || 0), 0);
      monthProfitData.push(monthIncData[monthIncData.length - 1] - exp);
    }

    const monthlyCtx = document.getElementById('chartMonthly');
    if (monthlyCtx) {
      this.charts.monthly = new Chart(monthlyCtx, {
        type: 'line',
        data: {
          labels: monthLabels,
          datasets: [
            { label: '收入', data: monthIncData, borderColor: '#B89358', backgroundColor: 'rgba(184,147,88,0.08)', fill: true, tension: 0.3, pointRadius: 4 },
            { label: '利润', data: monthProfitData, borderColor: '#5B8C6A', backgroundColor: 'rgba(91,140,106,0.08)', fill: true, tension: 0.3, pointRadius: 4 },
          ],
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, color: '#6B6B70', usePointStyle: true } } },
          scales: {
            x: { grid: { display: false }, ticks: { color: '#9E9EA4', font: { size: 11 } } },
            y: { grid: { color: '#F0EEE8' }, ticks: { color: '#9E9EA4', font: { size: 11 }, callback: v => '¥' + UI.fmt(v) } },
          },
        },
      });
    }
  },

  rerender() {
    const c = document.getElementById('viewContainer');
    this.render(c);
  },
};
