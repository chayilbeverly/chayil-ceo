/* ============================================
   商业资产库 — 客户 / 商品 / 成交案例
   含 AI 复购分析与商品推荐
   ============================================ */

window.Modules = window.Modules || {};

window.Modules.assets = {
  tab: 'customers',

  render(container) {
    container.innerHTML = `
      <div class="view">
        <div class="tabs">
          <div class="tab ${this.tab === 'customers' ? 'active' : ''}" onclick="Modules.assets.switch('customers')">客户数据库</div>
          <div class="tab ${this.tab === 'products' ? 'active' : ''}" onclick="Modules.assets.switch('products')">商品数据库</div>
          <div class="tab ${this.tab === 'deals' ? 'active' : ''}" onclick="Modules.assets.switch('deals')">成交案例库</div>
        </div>
        <div id="assetContent"></div>
      </div>
    `;
    this.renderTab();
  },

  switch(tab) {
    this.tab = tab;
    document.querySelectorAll('.tab').forEach((t, i) => {
      t.classList.toggle('active', ['customers', 'products', 'deals'][i] === tab);
    });
    this.renderTab();
  },

  renderTab() {
    const el = document.getElementById('assetContent');
    if (!el) return;
    if (this.tab === 'customers') this.renderCustomers(el);
    else if (this.tab === 'products') this.renderProducts(el);
    else this.renderDeals(el);
  },

  // 客户数据库
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
            <div class="form-field"><label class="form-label">备注</label><input type="text" class="form-input" id="c-note" placeholder="备注"></div>
          </div>
          <div class="form-actions"><button class="btn btn-gold btn-sm" onclick="Modules.assets.addCustomer()">+ 添加客户</button></div>
        </div>
      </div>

      <div class="ai-analysis" style="margin-bottom:20px">
        <div class="ai-badge">✦ AI 客户分析</div>
        <div class="ai-section-content">${this.analyzeCustomers(list)}</div>
      </div>

      <div class="chart-wrap" style="margin-bottom:20px;padding:0;overflow:hidden">
        <table class="data-table">
          <thead><tr><th>客户</th><th>品牌</th><th>金额</th><th>喜好</th><th>预算</th><th>频率</th><th>备注</th><th></th></tr></thead>
          <tbody>
            ${list.map(c => `
              <tr>
                <td><b>${UI.esc(c.name)}</b><br><span style="font-size:11px;color:var(--ink-300)">${UI.esc(c.contact || '')}</span></td>
                <td>${UI.esc(c.brand)}</td>
                <td class="num">${UI.money(c.amount)}</td>
                <td>${UI.esc(c.preference || '-')}</td>
                <td>${UI.esc(c.budget || '-')}</td>
                <td>${UI.esc(c.frequency || '-')}</td>
                <td style="font-size:12px;color:var(--ink-500)">${UI.esc(c.note || '-')}</td>
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
    const repeatLikely = list.filter(c => {
      const freq = (c.frequency || '');
      return /每月|每周|每季|频繁|高/.test(freq);
    });
    const tips = [];
    tips.push(`共 ${total} 位客户，其中高净值客户（单笔≥3万）${highValue} 位，占比 ${Math.round(highValue/total*100)}%。`);
    if (repeatLikely.length) tips.push(`AI 预测 <b style="color:var(--gold-deep)">${repeatLikely.length}</b> 位客户有较高复购意愿：${repeatLikely.map(c => UI.esc(c.name)).join('、')}。建议主动跟进，推荐新品或稀缺款。`);
    const dormant = list.filter(c => { const freq = (c.frequency||''); return /不定|偶尔|低|未知/.test(freq); });
    if (dormant.length) tips.push(`${dormant.length} 位客户购买频率较低（${dormant.map(c=>UI.esc(c.name)).join('、')}），建议通过朋友圈内容和节日关怀激活。`);
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
    }, 'assets');
    this.renderTab();
    UI.toast('客户已添加');
  },

  // 商品数据库
  renderProducts(el) {
    const list = Store.get().assets.products;
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
            <div class="form-field"><label class="form-label">价格</label><input type="number" class="form-input" id="p-price" placeholder="0"></div>
            <div class="form-field"><label class="form-label">库存</label><input type="number" class="form-input" id="p-stock" placeholder="0"></div>
            <div class="form-field"><label class="form-label">客户需求热度</label><select class="form-select" id="p-demand"><option>极高</option><option>高</option><option>中</option><option>低</option></select></div>
          </div>
          <div class="form-actions"><button class="btn btn-gold btn-sm" onclick="Modules.assets.addProduct()">+ 添加商品</button></div>
        </div>
      </div>

      <div class="ai-analysis" style="margin-bottom:20px">
        <div class="ai-badge">✦ AI 商品推荐</div>
        <div class="ai-section-content">${this.recommendProducts(list)}</div>
      </div>

      <div class="chart-wrap" style="padding:0;overflow:hidden">
        <table class="data-table">
          <thead><tr><th>品牌</th><th>型号</th><th>颜色</th><th>价格</th><th>库存</th><th>需求热度</th><th></th></tr></thead>
          <tbody>
            ${list.map(p => `
              <tr>
                <td><b>${UI.esc(p.brand)}</b></td>
                <td>${UI.esc(p.model)}</td>
                <td>${UI.esc(p.color)}</td>
                <td class="num">${UI.money(p.price)}</td>
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
    // 高需求商品
    const hot = list.filter(p => p.demand === '极高' || p.demand === '高');
    if (hot.length) tips.push(`当前高需求商品 ${hot.length} 款：${hot.map(p => UI.esc(p.brand + ' ' + p.model)).join('、')}，建议优先推广。`);
    // 库存预警
    const lowStock = list.filter(p => +p.stock <= 1);
    if (lowStock.length) tips.push(`库存预警：${lowStock.map(p => UI.esc(p.brand + ' ' + p.model)).join('、')} 库存≤1，需及时补货。`);
    // 客户匹配推荐
    if (customers.length) {
      customers.slice(0, 3).forEach(c => {
        const match = list.filter(p => {
          const b = (c.brand || '').toLowerCase();
          return b && (p.brand || '').toLowerCase().includes(b);
        });
        if (match.length) {
          const best = match.sort((a, b) => +a.price - +b.price)[0];
          tips.push(`客户 <b>${UI.esc(c.name)}</b>（预算 ${UI.esc(c.budget || '未知')}）推荐 <b>${UI.esc(best.brand + ' ' + best.model)}</b>（${UI.money(best.price)}），匹配其品牌偏好。`);
        }
      });
    }
    if (tips.length === 0) tips.push('商品库存充足，可继续扩充商品线。');
    return tips.map(t => `<p style="margin-bottom:6px">${t}</p>`).join('');
  },

  addProduct() {
    const get = id => document.getElementById(id).value.trim();
    if (!get('p-brand') || !get('p-model')) { UI.toast('请输入品牌和型号'); return; }
    Store.addItem('products', {
      brand: get('p-brand'), model: get('p-model'), color: get('p-color'),
      price: +get('p-price') || 0, stock: +get('p-stock') || 0, demand: get('p-demand'),
    }, 'assets');
    this.renderTab();
    UI.toast('商品已添加');
  },

  // 成交案例库
  renderDeals(el) {
    const list = Store.get().assets.deals;
    el.innerHTML = `
      <div class="board-col" style="margin-bottom:20px">
        <div class="board-col-head">
          <div class="board-col-title"><span class="dot" style="background:var(--rose)"></span> 记录成交案例</div>
        </div>
        <div class="card-body" style="padding:0 0 16px">
          <div class="form-grid two">
            <div class="form-field full"><label class="form-label">客户需求</label><input type="text" class="form-input" id="d-need" placeholder="如 通勤大容量包，预算1万内"></div>
            <div class="form-field full"><label class="form-label">推荐过程</label><textarea class="form-textarea" id="d-process" placeholder="描述你如何推荐、匹配的过程"></textarea></div>
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
            <div class="record-meta" style="width:100%"><span style="color:var(--ink-700)">推荐：${UI.esc(d.process)}</span></div>
            <div class="record-meta" style="width:100%"><span style="color:var(--gold-deep)">成交原因：${UI.esc(d.reason)}</span></div>
          </div>
        `).join('') : UI.empty('暂无成交案例，记录后将用于训练 AI 销售助手', '◈')}
      </div>
    `;
  },

  analyzeDeals(list) {
    if (!list.length) return '暂无成交案例。记录后将自动分析成交规律，训练 AI 销售助手。';
    const tips = [];
    tips.push(`共记录 ${list.length} 笔成交，总成交额 <b style="color:var(--gold-deep)">${UI.money(list.reduce((s,d)=>s+(+d.price||0),0))}</b>。`);
    tips.push('成交共性：客户决策均围绕"需求匹配+信任建立"，建议强化真实案例与人设内容。');
    tips.push('下一步：积累更多案例后，AI 将自动提炼最佳话术与推荐路径，形成销售 SOP。');
    return tips.map(t => `<p style="margin-bottom:6px">${t}</p>`).join('');
  },

  addDeal() {
    const get = id => document.getElementById(id).value.trim();
    if (!get('d-need')) { UI.toast('请输入客户需求'); return; }
    Store.addItem('deals', {
      need: get('d-need'), process: get('d-process'),
      price: +get('d-price') || 0, reason: get('d-reason'),
    }, 'assets');
    this.renderTab();
    UI.toast('成交案例已记录');
  },

  del(type, id) {
    Store.removeItem(type, id, 'assets');
    this.renderTab();
    UI.toast('已删除');
  },
};
