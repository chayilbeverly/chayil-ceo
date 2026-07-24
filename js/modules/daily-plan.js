/* ============================================
   每日计划 v3 — 优先级 + Top3
   ============================================ */

window.Modules = window.Modules || {};

window.Modules.dailyPlan = {
  render(container) {
    const d = Store.get();
    const allTasks = [
      ...d.tasks.personalGrowth,
      ...d.tasks.business,
      ...d.tasks.contentGrowth,
    ];
    const total = allTasks.length;
    const done = allTasks.filter(t => t.done).length;
    const remaining = total - done;
    const rate = total ? Math.round((done / total) * 100) : 0;
    const streak = d.meta.streak || 0;

    // Top 3
    const topThreeIds = d.tasks.topThree || [];
    const topThreeTasks = topThreeIds.map(id => allTasks.find(t => t.id === id)).filter(Boolean);

    container.innerHTML = `
      <div class="view">
        <!-- 数据概览卡片 -->
        <div class="stat-grid">
          <div class="stat-card">
            <div class="stat-label">今日任务</div>
            <div class="stat-value">${total}<span class="stat-unit">个</span></div>
          </div>
          <div class="stat-card">
            <div class="stat-label">已完成</div>
            <div class="stat-value">${done}<span class="stat-unit">个</span></div>
          </div>
          <div class="stat-card">
            <div class="stat-label">待完成</div>
            <div class="stat-value">${remaining}<span class="stat-unit">个</span></div>
          </div>
          <div class="stat-card gold">
            <div class="stat-label">完成率</div>
            <div class="stat-value">${rate}<span class="stat-unit">%</span></div>
          </div>
          <div class="stat-card">
            <div class="stat-label">连续完成</div>
            <div class="stat-value">${streak}<span class="stat-unit">天</span></div>
          </div>
        </div>

        <!-- 今日最重要三件事 -->
        <div class="section-title" style="margin-top:0">今日最重要三件事 <span style="font-weight:400;font-size:11px;color:var(--ink-300)">（限选3个）</span></div>
        <div class="top-three-wrap-small" id="topThreeWrapSmall">
          ${this.renderTopThreeMini(topThreeTasks)}
        </div>

        <!-- 看板 -->
        <div class="board">
          <div class="board-col">
            <div class="board-col-head">
              <div class="board-col-title">
                <span class="dot" style="background:var(--rose)"></span>
                个人成长
              </div>
              <div class="board-col-meta" id="meta-personalGrowth">${d.tasks.personalGrowth.filter(t => t.done).length}/${d.tasks.personalGrowth.length}</div>
            </div>
            <div class="task-list" id="list-personalGrowth"></div>
            <div class="task-add">
              <select class="form-select" data-group="personalGrowth-prio" style="width:80px;flex-shrink:0">
                <option value="high">🔥 重要</option>
                <option value="normal" selected>⭐ 普通</option>
                <option value="low">○ 低优先</option>
              </select>
              <input type="text" placeholder="添加成长任务…" data-group="personalGrowth" />
              <button class="btn btn-dark btn-sm" onclick="Modules.dailyPlan.addTask('personalGrowth')">添加</button>
            </div>
          </div>

          <div class="board-col">
            <div class="board-col-head">
              <div class="board-col-title">
                <span class="dot" style="background:var(--gold)"></span>
                商业任务
              </div>
              <div class="board-col-meta" id="meta-business">${d.tasks.business.filter(t => t.done).length}/${d.tasks.business.length}</div>
            </div>
            <div class="task-list" id="list-business"></div>
            <div class="task-add">
              <select class="form-select" data-group="business-prio" style="width:80px;flex-shrink:0">
                <option value="high">🔥 重要</option>
                <option value="normal" selected>⭐ 普通</option>
                <option value="low">○ 低优先</option>
              </select>
              <input type="text" placeholder="添加商业任务…" data-group="business" />
              <button class="btn btn-dark btn-sm" onclick="Modules.dailyPlan.addTask('business')">添加</button>
            </div>
          </div>

          <div class="board-col full">
            <div class="board-col-head">
              <div class="board-col-title">
                <span class="dot" style="background:var(--green)"></span>
                内容增长任务
              </div>
              <div class="board-col-meta" id="meta-contentGrowth">${d.tasks.contentGrowth.filter(t => t.done).length}/${d.tasks.contentGrowth.length}</div>
            </div>
            <div class="task-list" id="list-contentGrowth"></div>
            <div class="task-add">
              <select class="form-select" data-group="contentGrowth-prio" style="width:80px;flex-shrink:0">
                <option value="high">🔥 重要</option>
                <option value="normal" selected>⭐ 普通</option>
                <option value="low">○ 低优先</option>
              </select>
              <input type="text" placeholder="添加内容任务…" data-group="contentGrowth" />
              <button class="btn btn-dark btn-sm" onclick="Modules.dailyPlan.addTask('contentGrowth')">添加</button>
            </div>
          </div>
        </div>
      </div>
    `;

    ['personalGrowth', 'business', 'contentGrowth'].forEach(group => {
      this.renderList(group);
    });

    document.querySelectorAll('.task-add input').forEach(input => {
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter' && input.value.trim()) {
          Modules.dailyPlan.addTask(input.dataset.group);
        }
      });
    });
  },

  renderTopThreeMini(tasks) {
    return `
      <div class="top-three-mini">
        ${[0, 1, 2].map(i => {
          const t = tasks[i];
          if (t) {
            const prioEmoji = t.priority === 'high' ? '🔥' : t.priority === 'low' ? '○' : '⭐';
            return `<div class="t3m-item ${t.done ? 'done' : ''}" onclick="Modules.dailyPlan.toggleById('${t.id}')">
              <span class="t3m-num">${['①','②','③'][i]}</span>
              <span class="t3m-text">${prioEmoji} ${UI.esc(t.text)}</span>
              ${t.done ? '<span class="t3m-check">✓</span>' : ''}
            </div>`;
          }
          return `<div class="t3m-item empty"><span class="t3m-num">${['①','②','③'][i]}</span><span class="t3m-text" style="color:var(--ink-300)">从下方任务标记为Top3</span></div>`;
        }).join('')}
      </div>
    `;
  },

  renderList(group) {
    const tasks = Store.get().tasks[group];
    const el = document.getElementById('list-' + group);
    if (!el) return;
    if (!tasks.length) {
      el.innerHTML = UI.empty('暂无任务', '○');
      return;
    }
    // 按优先级排序：high > normal > low
    const sorted = [...tasks].sort((a, b) => {
      const o = { high: 0, normal: 1, low: 2 };
      return (o[a.priority] || 1) - (o[b.priority] || 1);
    });

    el.innerHTML = sorted.map(t => {
      const prioEmoji = t.priority === 'high' ? '🔥' : t.priority === 'low' ? '○' : '⭐';
      const prioLabel = t.priority === 'high' ? '重要' : t.priority === 'low' ? '低优先' : '普通';
      const prioClass = 'prio-' + (t.priority || 'normal');
      const topThreeIds = Store.get().tasks.topThree || [];
      const isTop = topThreeIds.includes(t.id);
      return `
      <div class="task-item ${t.done ? 'done' : ''}" data-id="${t.id}">
        <div class="task-check" onclick="Modules.dailyPlan.toggle('${group}','${t.id}')"></div>
        <span class="task-text">${UI.esc(t.text)}</span>
        <span class="priority-badge ${prioClass}" onclick="Modules.dailyPlan.cyclePriority('${group}','${t.id}')" title="点击切换优先级">${prioEmoji} ${prioLabel}</span>
        <button class="task-top3-btn ${isTop ? 'active' : ''}" onclick="Modules.dailyPlan.toggleTop3('${t.id}')" title="标记为今日Top3">${isTop ? '★' : '☆'}</button>
        ${t.time ? `<span class="task-time">${UI.esc(t.time)}</span>` : ''}
        <button class="task-del" onclick="Modules.dailyPlan.del('${group}','${t.id}')">×</button>
      </div>`;
    }).join('');
  },

  toggle(group, id) {
    const d = Store.get();
    const t = d.tasks[group].find(x => x.id === id);
    if (!t) return;
    Store.updateItem(group, id, { done: !t.done }, 'tasks');
    this.renderList(group);
    this.refreshStats();
    this.refreshMeta(group);
    this.refreshTopThreeMini();
    if (!t.done) UI.toast('任务已完成 ✓');
  },

  toggleById(id) {
    const d = Store.get();
    const groups = ['personalGrowth', 'business', 'contentGrowth'];
    for (const g of groups) {
      const t = d.tasks[g].find(x => x.id === id);
      if (t) { this.toggle(g, id); return; }
    }
  },

  cyclePriority(group, id) {
    const d = Store.get();
    const t = d.tasks[group].find(x => x.id === id);
    if (!t) return;
    const next = { high: 'normal', normal: 'low', low: 'high' };
    Store.updateItem(group, id, { priority: next[t.priority || 'normal'] }, 'tasks');
    this.renderList(group);
    UI.toast('优先级已更新');
  },

  toggleTop3(id) {
    Store.update(d => {
      const topThree = d.tasks.topThree || [];
      const idx = topThree.indexOf(id);
      if (idx > -1) {
        topThree.splice(idx, 1);
      } else {
        if (topThree.length >= 3) {
          UI.toast('最多选3个Top3事项');
          return;
        }
        topThree.push(id);
      }
      d.tasks.topThree = topThree;
    });
    // 重渲染所有列表
    ['personalGrowth', 'business', 'contentGrowth'].forEach(g => this.renderList(g));
    this.refreshTopThreeMini();
  },

  refreshTopThreeMini() {
    const el = document.getElementById('topThreeWrapSmall');
    if (!el) return;
    const d = Store.get();
    const allTasks = [...d.tasks.personalGrowth, ...d.tasks.business, ...d.tasks.contentGrowth];
    const topThreeIds = d.tasks.topThree || [];
    const topThreeTasks = topThreeIds.map(id => allTasks.find(t => t.id === id)).filter(Boolean);
    el.innerHTML = this.renderTopThreeMini(topThreeTasks);
  },

  del(group, id) {
    Store.removeItem(group, id, 'tasks');
    // 同时从 topThree 移除
    Store.update(d => {
      const idx = (d.tasks.topThree || []).indexOf(id);
      if (idx > -1) d.tasks.topThree.splice(idx, 1);
    });
    this.renderList(group);
    this.refreshStats();
    this.refreshMeta(group);
    this.refreshTopThreeMini();
  },

  addTask(group) {
    const input = document.querySelector(`.task-add input[data-group="${group}"]`);
    const prioSelect = document.querySelector(`select[data-group="${group}-prio"]`);
    const val = input.value.trim();
    if (!val) return;
    const priority = prioSelect ? prioSelect.value : 'normal';
    Store.addItem(group, { text: val, done: false, time: '', priority }, 'tasks');
    input.value = '';
    this.renderList(group);
    this.refreshStats();
    this.refreshMeta(group);
    UI.toast('任务已添加');
  },

  refreshMeta(group) {
    const el = document.getElementById('meta-' + group);
    if (!el) return;
    const tasks = Store.get().tasks[group];
    el.textContent = `${tasks.filter(t => t.done).length}/${tasks.length}`;
  },

  refreshStats() {
    const d = Store.get();
    const all = [...d.tasks.personalGrowth, ...d.tasks.business, ...d.tasks.contentGrowth];
    const total = all.length;
    const done = all.filter(t => t.done).length;
    const remaining = total - done;
    const rate = total ? Math.round((done / total) * 100) : 0;
    const cards = document.querySelectorAll('.stat-grid .stat-value');
    if (cards[0]) cards[0].innerHTML = `${total}<span class="stat-unit">个</span>`;
    if (cards[1]) cards[1].innerHTML = `${done}<span class="stat-unit">个</span>`;
    if (cards[2]) cards[2].innerHTML = `${remaining}<span class="stat-unit">个</span>`;
    if (cards[3]) cards[3].innerHTML = `${rate}<span class="stat-unit">%</span>`;
  }
};
