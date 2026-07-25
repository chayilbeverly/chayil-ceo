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
  // normalizeProduct: 兼容旧数据格式
  normalizeProduct(p) {
    return {
      id: p.id,
      product_name: p.product_name || p.model || '',
      brand: p.brand || '',
      category: p.category || '',
      quantity: p.quantity !== undefined ? p.quantity : (p.stock || 0),
      cost_price: p.cost_price !== undefined ? p.cost_price : (p.cost || 0),
      sale_price: p.sale_price !== undefined ? p.sale_price : (p.price || 0),
      status: p.status || '库存中',
      image: p.image || '',
      acquisition_type: p.acquisition_type || '',
      acquisition_notes: p.acquisition_notes || '',
      _updated: p._updated || 0,
    };
  },

  renderProducts(el) {
    const rawList = Store.get().assets.products;
    const list = rawList.map(p => this.normalizeProduct(p));
    const totalValue = list.reduce((s, p) => s + (+p.sale_price || 0) * (+p.quantity || 0), 0);
    const totalCost = list.reduce((s, p) => s + (+p.cost_price || 0) * (+p.quantity || 0), 0);
    const totalProfit = list.reduce((s, p) => s + (+p.sale_price || 0) - (+p.cost_price || 0), 0);

    el.innerHTML = `
      <div class="board-col" style="margin-bottom:20px">
        <div class="board-col-head">
          <div class="board-col-title"><span class="dot" style="background:var(--green)"></span> 新增商品</div>
        </div>
        <div class="card-body" style="padding:0 0 16px">
          <div class="form-grid">
            <div class="form-field"><label class="form-label">商品名称 *</label><input type="text" class="form-input" id="p-name" placeholder="如 Chanel CF"></div>
            <div class="form-field"><label class="form-label">品牌 *</label><input type="text" class="form-input" id="p-brand" placeholder="如 Chanel"></div>
            <div class="form-field"><label class="form-label">分类</label><select class="form-select" id="p-category"><option>托特包</option><option>单肩包</option><option>手提包</option><option>斜挎包</option><option>双肩包</option><option>钱包/卡包</option><option>腰带/配饰</option><option>鞋履</option><option>服装</option><option>其他</option></select></div>
            <div class="form-field"><label class="form-label">数量</label><input type="number" class="form-input" id="p-quantity" placeholder="0" min="0"></div>
            <div class="form-field"><label class="form-label">成本价 ¥</label><input type="number" class="form-input" id="p-cost" placeholder="0" step="0.01"></div>
            <div class="form-field"><label class="form-label">售价 ¥</label><input type="number" class="form-input" id="p-price" placeholder="0" step="0.01"></div>
            <div class="form-field"><label class="form-label">状态</label><select class="form-select" id="p-status"><option>库存中</option><option>已售出</option><option>预留</option></select></div>
            <div class="form-field"><label class="form-label">来源</label><select class="form-select" id="p-source"><option value="">— 选填 —</option><option>个人回收</option><option>客户寄售</option><option>同行调货</option><option>代购</option><option>自有闲置</option></select></div>
            <div class="form-field full">
              <label class="form-label">商品图片</label>
              <div class="image-upload-wrap">
                <input type="file" class="form-input" id="p-image" accept="image/*" style="padding:7px 12px" onchange="Modules.assets.previewProductImage(this)">
                <div class="image-preview" id="p-image-preview" style="display:none"></div>
              </div>
            </div>
          </div>
          <div class="form-actions"><button class="btn btn-gold btn-sm" onclick="Modules.assets.addProduct()">+ 添加商品</button></div>
        </div>
      </div>

      <div class="fin-summary" style="grid-template-columns:repeat(4,1fr);margin-bottom:20px">
        <div class="fin-card"><div class="fin-label">库存总值</div><div class="fin-value income">${UI.money(totalValue)}</div></div>
        <div class="fin-card"><div class="fin-label">库存成本</div><div class="fin-value expense">${UI.money(totalCost)}</div></div>
        <div class="fin-card"><div class="fin-label">预估总利润</div><div class="fin-value profit">${UI.money(totalProfit)}<span style="font-size:11px;color:var(--ink-300);margin-left:4px">${totalCost > 0 ? Math.round(totalProfit / totalCost * 100) : 0}%</span></div></div>
        <div class="fin-card"><div class="fin-label">在库商品</div><div class="fin-value" style="font-family:var(--ff-sans);font-size:26px">${list.length} 款</div></div>
      </div>

      <div class="ai-analysis" style="margin-bottom:20px">
        <div class="ai-badge">✦ AI 商品推荐</div>
        <div class="ai-section-content">${this.recommendProducts(list)}</div>
      </div>

      <!-- 状态筛选 -->
      <div class="cat-filter-wrap" style="margin-bottom:14px">
        <div class="cat-filters">
          <span class="cat-tag active" onclick="Modules.assets.filterProducts('all',this)">全部</span>
          <span class="cat-tag" onclick="Modules.assets.filterProducts('库存中',this)">🟢 库存中</span>
          <span class="cat-tag" onclick="Modules.assets.filterProducts('已售出',this)">🔴 已售出</span>
          <span class="cat-tag" onclick="Modules.assets.filterProducts('预留',this)">🟡 预留</span>
        </div>
      </div>

      <!-- 商品卡片网格 -->
      <div class="product-card-grid" id="productCardGrid">
        ${list.map(p => this.renderProductCard(p)).join('')}
      </div>
    `;
  },

  filterProducts(status, el) {
    document.querySelectorAll('#productCardGrid + .cat-filter-wrap .cat-tag, .cat-filter-wrap .cat-tag').forEach(t => t.classList.remove('active'));
    if (el) el.classList.add('active');

    const rawList = Store.get().assets.products;
    const list = rawList.map(p => this.normalizeProduct(p));
    const filtered = status === 'all' ? list : list.filter(p => p.status === status);

    const grid = document.getElementById('productCardGrid');
    if (grid) {
      grid.innerHTML = filtered.map(p => this.renderProductCard(p)).join('');
    }
  },

  renderProductCard(p) {
    const profit = (+p.sale_price || 0) - (+p.cost_price || 0);
    const statusColors = { '库存中': 'var(--green)', '已售出': 'var(--ink-300)', '预留': 'var(--gold-deep)' };
    const statusBg = { '库存中': 'rgba(91,140,106,0.08)', '已售出': 'var(--bg-soft)', '预留': 'var(--gold-glow)' };

    return `
    <div class="product-card-v2" onclick="Modules.assets.openProductDetail('${p.id}')">
      <div class="pcv2-img">
        ${p.image ? `<img src="${UI.esc(p.image)}" alt="${UI.esc(p.product_name)}">` : '<span class="pcv2-noimg">📷</span>'}
        <span class="pcv2-status" style="background:${statusBg[p.status] || 'var(--bg-soft)'};color:${statusColors[p.status] || 'var(--ink-500)'}">${UI.esc(p.status)}</span>
      </div>
      <div class="pcv2-info">
        <div class="pcv2-name">${UI.esc(p.product_name)}</div>
        <div class="pcv2-brand">${UI.esc(p.brand)}${p.category ? ' · ' + UI.esc(p.category) : ''}${p.acquisition_type ? ' · <span style="color:var(--ink-400)">' + UI.esc(p.acquisition_type) + '</span>' : ''}</div>
        <div class="pcv2-stats">
          <div class="pcv2-stat">
            <span class="pcv2-stat-label">数量</span>
            <span class="pcv2-stat-val">${p.quantity}</span>
          </div>
          <div class="pcv2-stat">
            <span class="pcv2-stat-label">成本</span>
            <span class="pcv2-stat-val">${UI.money(p.cost_price)}</span>
          </div>
          <div class="pcv2-stat">
            <span class="pcv2-stat-label">售价</span>
            <span class="pcv2-stat-val price">${UI.money(p.sale_price)}</span>
          </div>
          <div class="pcv2-stat">
            <span class="pcv2-stat-label">利润</span>
            <span class="pcv2-stat-val" style="color:${profit >= 0 ? 'var(--green)' : 'var(--red)'}">${UI.money(profit)}</span>
          </div>
        </div>
      </div>
      <button class="pcv2-del" onclick="event.stopPropagation();Modules.assets.del('products','${p.id}')" title="删除">×</button>
    </div>`;
  },

  openProductDetail(id) {
    const rawList = Store.get().assets.products;
    const raw = rawList.find(p => p.id === id);
    if (!raw) return;
    const p = this.normalizeProduct(raw);
    const profit = (+p.sale_price || 0) - (+p.cost_price || 0);

    // 创建模态窗口
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay show';
    overlay.id = 'productDetailModal';
    overlay.innerHTML = `
      <div class="modal product-detail-modal">
        <div class="modal-header" style="border-bottom:none;padding-bottom:0">
          <div>
            <div class="modal-eyebrow">商品详情</div>
            <h2 class="modal-title">${UI.esc(p.product_name)}</h2>
          </div>
          <button class="modal-close" onclick="document.getElementById('productDetailModal').remove()">×</button>
        </div>
        <div class="modal-body">
          <div class="pd-image-wrap">
            ${p.image ? `<img src="${UI.esc(p.image)}" class="pd-image" alt="${UI.esc(p.product_name)}">` : '<div class="pd-noimage">📷 暂无图片</div>'}
          </div>
          <div class="pd-info-grid">
            <div class="pd-info-item"><span class="pd-label">品牌</span><span class="pd-value">${UI.esc(p.brand)}</span></div>
            <div class="pd-info-item"><span class="pd-label">分类</span><span class="pd-value">${UI.esc(p.category || '—')}</span></div>
            <div class="pd-info-item"><span class="pd-label">数量</span><span class="pd-value">${p.quantity}</span></div>
            <div class="pd-info-item"><span class="pd-label">状态</span><span class="pd-value">${UI.esc(p.status)}</span></div>
            <div class="pd-info-item"><span class="pd-label">来源</span><span class="pd-value">${UI.esc(p.acquisition_type || '—')}</span></div>
            <div class="pd-info-item"><span class="pd-label">成本价</span><span class="pd-value">${UI.money(p.cost_price)}</span></div>
            <div class="pd-info-item"><span class="pd-label">售价</span><span class="pd-value price">${UI.money(p.sale_price)}</span></div>
            <div class="pd-info-item full"><span class="pd-label">单品利润</span><span class="pd-value" style="color:${profit >= 0 ? 'var(--green)' : 'var(--red)'};font-size:18px">${UI.money(profit)}<span style="font-size:11px;color:var(--ink-300);margin-left:4px">${(+p.cost_price > 0) ? Math.round(profit / +p.cost_price * 100) : 0}%</span></span></div>
          </div>
          <div class="pd-actions">
            <button class="btn btn-gold" onclick="Modules.assets.quickEditStatus('${p.id}')">🔄 修改状态</button>
            ${p.status !== '已售出' ? `<button class="btn btn-sell" onclick="Modules.assets.quickSell('${p.id}')">💰 一键售出</button>` : ''}
            <button class="btn btn-ghost" onclick="document.getElementById('productDetailModal').remove()">关闭</button>
          </div>
        </div>
      </div>
    `;
    overlay.addEventListener('click', e => {
      if (e.target.id === 'productDetailModal') overlay.remove();
    });
    document.body.appendChild(overlay);
  },

  quickEditStatus(id) {
    const d = Store.get();
    const p = d.assets.products.find(p => p.id === id);
    if (!p) return;
    const statuses = ['库存中', '已售出', '预留'];
    const current = p.status || '库存中';
    const next = statuses[(statuses.indexOf(current) + 1) % statuses.length];
    Store.updateItem('products', id, { status: next }, 'assets');
    UI.toast('状态已改为：' + next);
    // 刷新弹窗
    document.getElementById('productDetailModal').remove();
    this.openProductDetail(id);
  },

  // 一键售出：改状态 + 建收入记录
  quickSell(id) {
    const d = Store.get();
    const p = d.assets.products.find(p => p.id === id);
    if (!p) return;
    const np = this.normalizeProduct(p);
    const salePrice = +np.sale_price || 0;
    // 更新商品状态
    Store.updateItem('products', id, { status: '已售出' }, 'assets');
    // 创建收入记录
    Store.addItem('income', {
      amount: salePrice,
      date: Store.todayStr(),
      category: '商品销售',
      note: `${np.brand} ${np.product_name}` + (np.acquisition_type ? ` (${np.acquisition_type})` : ''),
      source: 'product_sell',
    }, 'finance');
    // 计算利润
    const profit = salePrice - (+np.cost_price || 0);
    UI.toast(`✅ 已售出！收入 +${UI.money(salePrice)}，利润 ${UI.money(profit)}`);
    // 刷新页面
    document.getElementById('productDetailModal')?.remove();
    this.renderTab();
  },

  previewProductImage(input) {
    const previewEl = document.getElementById('p-image-preview');
    if (!input.files || !input.files[0]) {
      previewEl.style.display = 'none';
      return;
    }
    const file = input.files[0];
    if (file.size > 2 * 1024 * 1024) {
      UI.toast('图片太大，请选择小于 2MB 的图片');
      input.value = '';
      previewEl.style.display = 'none';
      return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
      previewEl.style.display = 'block';
      previewEl.innerHTML = `<img src="${e.target.result}" style="width:120px;height:120px;object-fit:cover;border-radius:8px;border:2px solid var(--line)">`;
    };
    reader.readAsDataURL(file);
  },

  recommendProducts(list) {
    if (!list.length) return '暂无商品数据。';
    const customers = Store.get().assets.customers;
    const tips = [];
    // 库存预警
    const lowStock = list.filter(p => +p.quantity <= 1 && p.status === '库存中');
    if (lowStock.length) tips.push(`库存预警：${lowStock.map(p => UI.esc(p.brand + ' ' + p.product_name)).join('、')} 库存≤1。`);
    const active = list.filter(p => p.status === '库存中');
    tips.push(`在库商品 ${active.length} 款，${list.length - active.length} 款已售/预留。`);
    if (customers.length) {
      customers.slice(0, 2).forEach(c => {
        const match = list.filter(p => (p.brand || '').toLowerCase().includes((c.brand || '').toLowerCase()));
        if (match.length) {
          const best = match.sort((a, b) => (+a.sale_price || 0) - (+b.sale_price || 0))[0];
          const name = best.product_name || '';
          tips.push(`客户 <b>${UI.esc(c.name)}</b> → 推荐 <b>${UI.esc(best.brand + ' ' + name)}</b>（${UI.money(best.sale_price)}）。`);
        }
      });
    }
    if (tips.length === 0) tips.push('商品库存充足，可继续扩充商品线。');
    return tips.map(t => `<p style="margin-bottom:6px">${t}</p>`).join('');
  },

  addProduct() {
    const get = id => document.getElementById(id).value.trim();
    if (!get('p-name') || !get('p-brand')) { UI.toast('请输入商品名称和品牌'); return; }
    const sale_price = +get('p-price') || 0;
    const cost_price = +get('p-cost') || 0;
    let image = '';
    const previewImg = document.querySelector('#p-image-preview img');
    if (previewImg && previewImg.src) {
      image = previewImg.src;
    }
    Store.addItem('products', {
      product_name: get('p-name'),
      brand: get('p-brand'),
      category: get('p-category'),
      quantity: +get('p-quantity') || 0,
      cost_price,
      sale_price,
      status: get('p-status') || '库存中',
      acquisition_type: get('p-source') || '',
      image: image,
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
