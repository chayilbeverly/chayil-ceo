/* ============================================
   每日计划 — 首页
   顶部数据概览 + TRAE Work 风格双栏看板
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

    container.innerHTML = `
      <div class="view">
        <!-- 数据概览卡片 -->
        <div class="stat-grid">
          <div class="stat-card">
            <div class="stat-label">今日任务</div>
            <div class="stat-value">${total}<span class="stat-unit">个</span></div>
            <div class="stat-foot">Daily Tasks</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">已完成</div>
            <div class="stat-value">${done}<span class="stat-unit">个</span></div>
            <div class="stat-foot">Completed</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">待完成</div>
            <div class="stat-value">${remaining}<span class="stat-unit">个</span></div>
            <div class="stat-foot">Remaining</div>
          </div>
          <div class="stat-card gold">
            <div class="stat-label">完成率</div>
            <div class="stat-value">${rate}<span class="stat-unit">%</span></div>
            <div class="stat-foot">Completion Rate</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">连续完成</div>
            <div class="stat-value">${streak}<span class="stat-unit">天</span></div>
            <div class="stat-foot">Streak</div>
          </div>
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
              <input type="text" placeholder="添加成长任务…" data-group="personalGrowth" />
              <button class="btn btn-dark btn-sm" onclick="Modules.dailyPlan.addTask('personalGrowth')">添加</button>
            </div>
          </div>

          <div class="board-col">
            <div class="board-col-head">
              <div class="board-col-title">
                <span class="dot" style="background:var(--gold)"></span>
                商业任务 · 每日成交
              </div>
              <div class="board-col-meta" id="meta-business">${d.tasks.business.filter(t => t.done).length}/${d.tasks.business.length}</div>
            </div>
            <div class="task-list" id="list-business"></div>
            <div class="task-add">
              <input type="text" placeholder="添加商业任务…" data-group="business" />
              <button class="btn btn-dark btn-sm" onclick="Modules.dailyPlan.addTask('business')">添加</button>
            </div>
          </div>

          <div class="board-col full">
            <div class="board-col-head">
              <div class="board-col-title">
                <span class="dot" style="background:var(--green)"></span>
                内容增长任务 · 每日自动生成
              </div>
              <div class="board-col-meta" id="meta-contentGrowth">${d.tasks.contentGrowth.filter(t => t.done).length}/${d.tasks.contentGrowth.length}</div>
            </div>
            <div class="task-list" id="list-contentGrowth"></div>
            <div class="task-add">
              <input type="text" placeholder="添加内容任务…" data-group="contentGrowth" />
              <button class="btn btn-dark btn-sm" onclick="Modules.dailyPlan.addTask('contentGrowth')">添加</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // 渲染任务列表
    ['personalGrowth', 'business', 'contentGrowth'].forEach(group => {
      this.renderList(group);
    });

    // 回车添加
    document.querySelectorAll('.task-add input').forEach(input => {
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter' && input.value.trim()) {
          Modules.dailyPlan.addTask(input.dataset.group);
        }
      });
    });
  },

  renderList(group) {
    const tasks = Store.get().tasks[group];
    const el = document.getElementById('list-' + group);
    if (!el) return;
    if (!tasks.length) {
      el.innerHTML = UI.empty('暂无任务', '○');
      return;
    }
    el.innerHTML = tasks.map(t => `
      <div class="task-item ${t.done ? 'done' : ''}" data-id="${t.id}">
        <div class="task-check" onclick="Modules.dailyPlan.toggle('${group}','${t.id}')"></div>
        <span class="task-text">${UI.esc(t.text)}</span>
        ${t.time ? `<span class="task-time">${UI.esc(t.time)}</span>` : ''}
        <button class="task-del" onclick="Modules.dailyPlan.del('${group}','${t.id}')">×</button>
      </div>
    `).join('');
  },

  toggle(group, id) {
    const d = Store.get();
    const t = d.tasks[group].find(x => x.id === id);
    if (!t) return;
    Store.updateItem(group, id, { done: !t.done }, 'tasks');
    this.renderList(group);
    this.refreshStats();
    this.refreshMeta(group);
    if (!t.done) UI.toast('任务已完成 ✓');
  },

  del(group, id) {
    Store.removeItem(group, id, 'tasks');
    this.renderList(group);
    this.refreshStats();
    this.refreshMeta(group);
  },

  addTask(group) {
    const input = document.querySelector(`.task-add input[data-group="${group}"]`);
    const val = input.value.trim();
    if (!val) return;
    Store.addItem(group, { text: val, done: false, time: '' }, 'tasks');
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
