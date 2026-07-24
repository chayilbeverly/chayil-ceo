/* ============================================
   商业资产库 v3 — 客户资产 / 商品资产 / 内容资产
   ============================================ */

window.Modules = window.Modules || {};

window.Modules.assets = {
  tab: 'customers',

  render(container) {
    container.innerHTML = `
      <div class="view">
        <div class="tabs">
          <div class="tab ${this.tab === 'customers' ? 'active' : ''}" onclick="Modules.assets.switch('customers')">客户资产</div>
          <div class="tab ${this.tab === 'products' ? 'active' : ''}" onclick="Modules.assets.switch('products')">商品资产</div>
          <div class="tab ${this.tab === 'deals' ? 'active' : ''}" onclick="Modules.assets.switch('deals')">成交案例</div>
          <div class="tab ${this.tab === 'content' ? 'active' : ''}" onclick="Modules.assets.switch('content')">内容资产</div>
        </div>
        <div id="assetContent"></div>
      </div>
    `;
    this.renderTab();
  },

  switch(tab) {
    this.tab = tab;
    document.querySelectorAll('.tab').forEach((t, i) => {
      const tabs = ['customers', 'products', 'deals', 'content'];
      t.classList.toggle('active', tabs[i] === tab);
    });
    this.renderTab();
  },

  renderTab() {
    const el = document.getElementById('assetContent');
    if (!el) return;
    if (this.tab === 'customers') this.renderCustomers(el);
    else if (this.tab === 'products') this.renderProducts(el);
    else if (this.tab === 'deals') this.renderDeals(el);
    else if (this.tab === 'content') this.renderContentAssets(el);
  },

  // ===== 客户资产 =====
  renderCustomers(el) {
    const list = Store.get().assets.customers;
    el.innerHTML = `
      <div class="board-col" style="margin-bottom:20px">
        <div class="board-col-head">
          <div class="board-col-title"><span class="dot" style="background:var(--gold)"></span> 新增客户</div>
        </div>
        <div class="card-body" style="padding:0 0 16px">
          <div class="form-grid">
            <div class="form-field"><label class="form-label">客户姓名</label><input type="text" class="form-input" id="c-name" placeholder="客户姓名"></div>
            <div class="form-field"><label class="form-label">联系方式</label><input type="text" class="form-input" id="c-contact" placeholder="微信/电话"></div>
            <div class="form-field"><label class="form-label">购买品牌</label><input type="text" class="form-input" id="c-brand" placeholder="如 LV"></div>
            <div class="form-field"><label class="form-label">购买金额</label><input type="number" class="form-input" id="c-amount" placeholder="0"></div>
            <div class="form-field"><label class="form-label">喜好</label><input type="text" class="form-input" id="c-pref" placeholder="如 实用大包"></div>
            <div class="form-field"><label class="form-label">预算区间</label><input type="text" class="form-input" id="c-budget" placeholder="如 1-3万"></div>
            <div class="form-field"><label class="form-label">购买频率</label><input type="text" class="form-input" id="c-freq" placeholder="如 每月1次"></div>
            <div class="form-field"><label class="form-label">跟进时间</label><input type="date" class="form-input" id="c-followup" value="${Store.todayStr()}"></div>
            <div class="form-field full"><label class="form-label">备注</label><input type="text" class="form-input" id="c-note" placeholder="备注"></div>
          </div>
          <div class="form-actions"><button class="btn btn-gold btn-sm" onclick="Modules.assets.addCustomer()">+ 添加客户</button></div>
        </div>
      </div>

      <div class="ai-analysis" style="margin-bottom:20px">
        <div class="ai-badge">✦ AI 客户分析</div>
        <div class="ai-section-content">${this.analyzeCustomers(list)}</div>
      </div>

      <div style="overflow-x:auto">
        <table class="data-table">
          <thead><tr><th>客户</th><th>品牌</th><th>金额</th><th>需求</th><th>预算</th><th>频率</th><th>跟进时间</th><th></th></tr></thead>
          <tbody>
            ${list.map(c => `
              <tr>
                <td><b>${UI.esc(c.name)}</b></td>
                <td>${UI.esc(c.brand)}</td>
                <td class="num">${UI.money(c.amount)}</td>
                <td>${UI.esc(c.preference || '-')}</td>
                <td>${UI.esc(c.budget || '-')}</td>
                <td>${UI.esc(c.frequency || '-')}</td>
                <td>${UI.esc(c.followUpTime || c.time || '-')}</td>
                <td><button class="task-del" style="opacity:1" onclick="Modules.assets.del('customers','${c.id}')">×</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  analyzeCustomers(list) {
    if (!list.length) return '暂无客户数据，添加客户后 AI 将自动分析复购潜力。';
    const total = list.length;
    const highValue = list.filter(c => +c.amount >= 30000).length;
    const repeatLikely = list.filter(c => /每月|每周|每季|频繁|高/.test(c.frequency || ''));
    const tips = [];
    tips.push(`共 ${total} 位客户，高净值（单笔≥3万）${highValue} 位，占比 ${Math.round(highValue/total*100)}%。`);
    if (repeatLikely.length) tips.push(`AI 预测 <b style="color:var(--gold-deep)">${repeatLikely.length}</b> 位高复购意愿客户：${repeatLikely.map(c => UI.esc(c.name)).join('、')}。`);
    const today = Store.todayStr();
    const needFollow = list.filter(c => c.followUpTime && c.followUpTime <= today);
    if (needFollow.length) tips.push(`<b style="color:var(--red)">${needFollow.length}</b> 位客户需要今日跟进：${needFollow.map(c => UI.esc(c.name)).join('、')}。`);
    return tips.map(t => `<p style="margin-bottom:6px">${t}</p>`).join('');
  },

  addCustomer() {
    const get = id => document.getElementById(id).value.trim();
    if (!get('c-name')) { UI.toast('请输入客户姓名'); return; }
    Store.addItem('customers', {
      name: get('c-name'), contact: get('c-contact'), brand: get('c-brand'),
      time: Store.todayStr(), amount: +get('c-amount') || 0,
      preference: get('c-pref'), budget: get('c-budget'),
      frequency: get('c-freq'), note: get('c-note'),
      followUpTime: get('c-followup'),
    }, 'assets');
    this.renderTab(); UI.toast('客户已添加');
  },

  // ===== 商品资产 =====
  renderProducts(el) {
    const list = Store.get().assets.products;
    const totalValue = list.reduce((s, p) => s + (+p.price || 0) * (+p.stock || 0), 0);
    const totalProfit = list.reduce((s, p) => s + (+p.profit || 0), 0);
    el.innerHTML = `
      <div class="board-col" style="margin-bottom:20px">
        <div class="board-col-head">
          <div class="board-col-title"><span class="dot" style="background:var(--green)"></span> 新增商品</div>
        </div>
        <div class="card-body" style="padding:0 0 16px">
          <div class="form-grid">
            <div class="form-field"><label class="form-label">品牌</label><input type="text" class="form-input" id="p-brand" placeholder="如 Chanel"></div>
            <div class="form-field"><label class="form-label">型号</label><input type="text" class="form-input" id="p-model" placeholder="如 Classic Flap"></div>
            <div class="form-field"><label class="form-label">颜色</label><input type="text" class="form-input" id="p-color" placeholder="如 黑金"></div>
            <div class="form-field"><label class="form-label">售价</label><input type="number" class="form-input" id="p-price" placeholder="0"></div>
            <div class="form-field"><label class="form-label">成本</label><input type="number" class="form-input" id="p-cost" placeholder="0"></div>
            <div class="form-field"><label class="form-label">库存</label><input type="number" class="form-input" id="p-stock" placeholder="0"></div>
            <div class="form-field"><label class="form-label">需求热度</label><select class="form-select" id="p-demand"><option>极高</option><option>高</option><option>中</option><option>低</option></select></div>
          </div>
          <div class="form-actions"><button class="btn btn-gold btn-sm" onclick="Modules.assets.addProduct()">+ 添加商品</button></div>
        </div>
      </div>

      <div class="fin-summary" style="grid-template-columns:repeat(3,1fr);margin-bottom:20px">
        <div class="fin-card"><div class="fin-label">库存总值</div><div class="fin-value income">${UI.money(totalValue)}</div></div>
        <div class="fin-card"><div class="fin-label">预估总利润</div><div class="fin-value profit">${UI.money(totalProfit)}</div></div>
        <div class="fin-card"><div class="fin-label">在库商品</div><div class="fin-value" style="font-family:var(--ff-sans);font-size:26px">${list.length} 款</div></div>
      </div>

      <div class="ai-analysis" style="margin-bottom:20px">
        <div class="ai-badge">✦ AI 商品推荐</div>
        <div class="ai-section-content">${this.recommendProducts(list)}</div>
      </div>

      <div style="overflow-x:auto">
        <table class="data-table">
          <thead><tr><th>品牌</th><th>型号</th><th>颜色</th><th>售价</th><th>成本</th><th>利润</th><th>库存</th><th>需求</th><th></th></tr></thead>
          <tbody>
            ${list.map(p => `
              <tr>
                <td><b>${UI.esc(p.brand)}</b></td>
                <td>${UI.esc(p.model)}</td>
                <td>${UI.esc(p.color)}</td>
                <td class="num">${UI.money(p.price)}</td>
                <td class="num">${UI.money(p.cost || 0)}</td>
                <td class="num" style="color:var(--green)">${UI.money(p.profit || (+(p.price||0) - +(p.cost||0)))}</td>
                <td>${p.stock}</td>
                <td><span class="record-tag" style="background:${p.demand==='极高'||p.demand==='高'?'var(--gold-glow)':'var(--bg-soft)'};color:${p.demand==='极高'||p.demand==='高'?'var(--gold-deep)':'var(--ink-500)'}">${UI.esc(p.demand)}</span></td>
                <td><button class="task-del" style="opacity:1" onclick="Modules.assets.del('products','${p.id}')">×</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  recommendProducts(list) {
    if (!list.length) return '暂无商品数据。';
    const customers = Store.get().assets.customers;
    const tips = [];
    const hot = list.filter(p => p.demand === '极高' || p.demand === '高');
    if (hot.length) tips.push(`高需求商品 ${hot.length} 款：${hot.map(p => UI.esc(p.brand + ' ' + p.model)).join('、')}。`);
    const lowStock = list.filter(p => +p.stock <= 1);
    if (lowStock.length) tips.push(`库存预警：${lowStock.map(p => UI.esc(p.brand + ' ' + p.model)).join('、')} 库存≤1。`);
    if (customers.length) {
      customers.slice(0, 2).forEach(c => {
        const match = list.filter(p => (p.brand || '').toLowerCase().includes((c.brand || '').toLowerCase()));
        if (match.length) {
          const best = match.sort((a, b) => +a.price - +b.price)[0];
          tips.push(`客户 <b>${UI.esc(c.name)}</b> → 推荐 <b>${UI.esc(best.brand + ' ' + best.model)}</b>（${UI.money(best.price)}）。`);
        }
      });
    }
    if (tips.length === 0) tips.push('商品库存充足，可继续扩充商品线。');
    return tips.map(t => `<p style="margin-bottom:6px">${t}</p>`).join('');
  },

  addProduct() {
    const get = id => document.getElementById(id).value.trim();
    if (!get('p-brand') || !get('p-model')) { UI.toast('请输入品牌和型号'); return; }
    const price = +get('p-price') || 0;
    const cost = +get('p-cost') || 0;
    Store.addItem('products', {
      brand: get('p-brand'), model: get('p-model'), color: get('p-color'),
      price, cost, stock: +get('p-stock') || 0, demand: get('p-demand'),
      profit: price - cost,
    }, 'assets');
    this.renderTab(); UI.toast('商品已添加');
  },

  // ===== 成交案例 =====
  renderDeals(el) {
    const list = Store.get().assets.deals;
    el.innerHTML = `
      <div class="board-col" style="margin-bottom:20px">
        <div class="board-col-head">
          <div class="board-col-title"><span class="dot" style="background:var(--rose)"></span> 记录成交案例</div>
        </div>
        <div class="card-body" style="padding:0 0 16px">
          <div class="form-grid two">
            <div class="form-field full"><label class="form-label">客户需求</label><input type="text" class="form-input" id="d-need" placeholder="客户需求描述"></div>
            <div class="form-field full"><label class="form-label">推荐过程</label><textarea class="form-textarea" id="d-process" placeholder="描述推荐匹配的过程"></textarea></div>
            <div class="form-field"><label class="form-label">成交价格</label><input type="number" class="form-input" id="d-price" placeholder="0"></div>
            <div class="form-field"><label class="form-label">成交原因</label><input type="text" class="form-input" id="d-reason" placeholder="总结成交关键因素"></div>
          </div>
          <div class="form-actions"><button class="btn btn-gold btn-sm" onclick="Modules.assets.addDeal()">+ 记录成交</button></div>
        </div>
      </div>

      <div class="ai-analysis" style="margin-bottom:20px">
        <div class="ai-badge">✦ AI 成交洞察</div>
        <div class="ai-section-content">${this.analyzeDeals(list)}</div>
      </div>

      <div class="record-list">
        ${list.length ? list.map(d => `
          <div class="record-item" style="align-items:flex-start;flex-direction:column;gap:8px">
            <div style="display:flex;width:100%;align-items:center;justify-content:space-between">
              <div class="record-title">${UI.esc(d.need)}</div>
              <div class="record-amount income">${UI.money(d.price)}</div>
            </div>
            <div class="record-meta">推荐：${UI.esc(d.process)}</div>
            <div class="record-meta" style="color:var(--gold-deep)">成交原因：${UI.esc(d.reason)}</div>
          </div>
        `).join('') : UI.empty('暂无成交案例', '◈')}
      </div>
    `;
  },

  analyzeDeals(list) {
    if (!list.length) return '暂无成交案例。';
    const tips = [];
    tips.push(`共 ${list.length} 笔成交，总额 <b style="color:var(--gold-deep)">${UI.money(list.reduce((s,d)=>s+(+d.price||0),0))}</b>。`);
    tips.push('共性：客户决策围绕"需求匹配+信任建立"，建议强化人设内容。');
    return tips.map(t => `<p style="margin-bottom:6px">${t}</p>`).join('');
  },

  addDeal() {
    const get = id => document.getElementById(id).value.trim();
    if (!get('d-need')) { UI.toast('请输入客户需求'); return; }
    Store.addItem('deals', {
      need: get('d-need'), process: get('d-process'),
      price: +get('d-price') || 0, reason: get('d-reason'),
    }, 'assets');
    this.renderTab(); UI.toast('成交案例已记录');
  },

  // ===== 内容资产 =====
  renderContentAssets(el) {
    const list = Store.get().assets.contentAssets || [];
    el.innerHTML = `
      <div class="board-col" style="margin-bottom:20px">
        <div class="board-col-head">
          <div class="board-col-title"><span class="dot" style="background:var(--gold-soft)"></span> 记录爆款案例</div>
        </div>
        <div class="card-body" style="padding:0 0 16px">
          <div class="form-grid two">
            <div class="form-field full"><label class="form-label">标题</label><input type="text" class="form-input" id="ca-title" placeholder="爆款标题"></div>
            <div class="form-field"><label class="form-label">播放量</label><input type="number" class="form-input" id="ca-views" placeholder="0"></div>
            <div class="form-field"><label class="form-label">点赞</label><input type="number" class="form-input" id="ca-likes" placeholder="0"></div>
            <div class="form-field"><label class="form-label">收藏</label><input type="number" class="form-input" id="ca-saves" placeholder="0"></div>
            <div class="form-field"><label class="form-label">评论</label><input type="number" class="form-input" id="ca-comments" placeholder="0"></div>
            <div class="form-field full"><label class="form-label">经验总结</label><textarea class="form-textarea" id="ca-summary" placeholder="爆款原因、可复用经验…"></textarea></div>
          </div>
          <div class="form-actions"><button class="btn btn-gold btn-sm" onclick="Modules.assets.addContentAsset()">+ 记录爆款案例</button></div>
        </div>
      </div>

      <div class="record-list" id="caList">
        ${list.length ? list.map(ca => `
          <div class="record-item" style="flex-direction:column;align-items:flex-start;gap:10px">
            <div class="record-title" style="font-family:var(--ff-serif);font-size:16px">${UI.esc(ca.title)}</div>
            <div class="record-meta">
              <span>播放 ${UI.fmt(ca.views)}</span>
              <span>赞 ${UI.fmt(ca.likes)}</span>
              <span>藏 ${UI.fmt(ca.saves)}</span>
              <span>评 ${UI.fmt(ca.comments)}</span>
            </div>
            <div style="font-size:12px;color:var(--gold-deep);background:var(--gold-glow);padding:8px 14px;border-radius:6px;width:100%">
              💡 ${UI.esc(ca.summary || '暂无总结')}
            </div>
            <button class="task-del" style="opacity:1;align-self:flex-end" onclick="Modules.assets.delContentAsset('${ca.id}')">×</button>
          </div>
        `).join('') : UI.empty('暂无爆款案例记录', '◈')}
      </div>
    `;
  },

  addContentAsset() {
    const get = id => document.getElementById(id).value.trim();
    if (!get('ca-title')) { UI.toast('请输入标题'); return; }
    Store.addItem('contentAssets', {
      title: get('ca-title'), views: +get('ca-views') || 0,
      likes: +get('ca-likes') || 0, saves: +get('ca-saves') || 0,
      comments: +get('ca-comments') || 0, summary: get('ca-summary'),
      date: Store.todayStr(),
    }, 'assets');
    this.renderTab(); UI.toast('爆款案例已记录');
  },

  delContentAsset(id) {
    Store.removeItem('contentAssets', id, 'assets');
    this.renderTab(); UI.toast('已删除');
  },

  del(type, id) {
    Store.removeItem(type, id, 'assets');
    this.renderTab(); UI.toast('已删除');
  },
};
