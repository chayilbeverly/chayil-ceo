/* ============================================
   CEO 驾驶舱 — 首页
   顶部数据卡片 + 今日Top3 + 成长打卡 + CEO日报
   ============================================ */

window.Modules = window.Modules || {};

window.Modules.home = {
  render(container) {
    const d = Store.get();
    const today = Store.todayStr();
    const month = today.slice(0, 7);

    // 计算数据
    const allTasks = [...d.tasks.personalGrowth, ...d.tasks.business, ...d.tasks.contentGrowth];
    const total = allTasks.length;
    const done = allTasks.filter(t => t.done).length;
    const rate = total ? Math.round((done / total) * 100) : 0;

    const todayIncome = d.finance.income.filter(i => i.date === today).reduce((s, i) => s + (+i.amount || 0), 0);
    const todayExpense = d.finance.expense.filter(e => e.date === today).reduce((s, e) => s + (+e.amount || 0), 0);
    const monthIncome = d.finance.income.filter(i => i.date.startsWith(month)).reduce((s, i) => s + (+i.amount || 0), 0);
    const monthExpense = d.finance.expense.filter(e => e.date.startsWith(month)).reduce((s, e) => s + (+e.amount || 0), 0);
    const monthProfit = monthIncome - monthExpense;
    const dailyTarget = d.finance.dailyTarget || 4000;
    const targetGap = dailyTarget - todayIncome;

    const publishedToday = (d.reviews || []).filter(r => r.date === today).length;
    const customersTotal = d.assets.customers.length;
    const customersToday = d.assets.customers.filter(c => c.time === today || c.followUpTime === today).length;

    // Top 3
    const topThreeIds = d.tasks.topThree || [];
    const topThreeTasks = topThreeIds.map(id => allTasks.find(t => t.id === id)).filter(Boolean);

    // 成长打卡
    const streaks = d.meta.personalStreaks || { fitness: 0, english: 0, learning: 0, spiritual: 0 };

    container.innerHTML = `
      <div class="view">
        <!-- CEO 驾驶舱数据卡片 -->
        <div class="section-title" style="margin-top:0">CEO 驾驶舱</div>
        <div class="stat-grid cockpit-grid">
          <div class="stat-card gold">
            <div class="stat-label">今日收入</div>
            <div class="stat-value">${UI.money(todayIncome)}</div>
            <div class="stat-foot">目标 ${UI.money(dailyTarget)} · ${targetGap > 0 ? `还差 ${UI.money(targetGap)}` : '已达成 ✓'}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">任务完成率</div>
            <div class="stat-value">${rate}<span class="stat-unit">%</span></div>
            <div class="stat-foot">${done}/${total} 已完成</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">内容发布</div>
            <div class="stat-value">${publishedToday}<span class="stat-unit">条</span></div>
            <div class="stat-foot">今日已发布</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">客户跟进</div>
            <div class="stat-value">${customersTotal}<span class="stat-unit">位</span></div>
            <div class="stat-foot">${customersToday} 位今日待跟进</div>
          </div>
        </div>

        <!-- 今日最重要三件事 -->
        <div class="section-title">今日最重要三件事</div>
        <div class="top-three-wrap" id="topThreeWrap">
          ${this.renderTopThree(topThreeTasks, allTasks)}
        </div>

        <!-- 个人成长打卡 -->
        <div class="section-title">个人成长 · 连续打卡</div>
        <div class="streak-grid" id="streakGrid">
          ${this.renderStreaks(streaks)}
        </div>

        <!-- CEO 日报 -->
        <div class="section-title">CEO 日报</div>
        <div id="ceoDailyReport">${this.renderDailyReport()}</div>
      </div>
    `;
  },

  renderTopThree(tasks, allTasks) {
    return `
      <div class="top-three-inner">
        ${[0, 1, 2].map(i => {
          const t = tasks[i];
          const icons = ['❶', '❷', '❸'];
          const labels = ['第一件事', '第二件事', '第三件事'];
          if (t) {
            const prioLabel = t.priority === 'high' ? '重要' : t.priority === 'low' ? '低优先' : '普通';
            const prioClass = t.priority === 'high' ? 'prio-high' : t.priority === 'low' ? 'prio-low' : 'prio-normal';
            return `
            <div class="top-three-item ${t.done ? 'done' : ''}" onclick="Modules.home.toggleTopThree('${t.id}')">
              <div class="top-three-num">${icons[i]}</div>
              <div class="top-three-content">
                <div class="top-three-text">${UI.esc(t.text)}</div>
                <div class="top-three-sub">${labels[i]} · <span class="priority-tag ${prioClass}">${prioLabel}</span></div>
              </div>
              ${t.done ? '<div class="top-three-check">✓</div>' : '<div class="top-three-circle"></div>'}
            </div>`;
          } else {
            return `
            <div class="top-three-item empty" onclick="Modules.home.pickTopThree()">
              <div class="top-three-num">${icons[i]}</div>
              <div class="top-three-content">
                <div class="top-three-text" style="color:var(--ink-300)">${labels[i]} · 点击选择</div>
              </div>
              <div class="top-three-circle"></div>
            </div>`;
          }
        }).join('')}
      </div>
      <div class="top-three-pick" id="topThreePicker" style="display:none">
        <div style="font-size:12px;color:var(--ink-500);margin-bottom:10px">从任务列表中选择最重要的3件事：</div>
        <div style="display:flex;flex-direction:column;gap:6px;max-height:300px;overflow-y:auto" id="pickList"></div>
        <button class="btn btn-ghost btn-sm" style="margin-top:10px" onclick="document.getElementById('topThreePicker').style.display='none'">关闭</button>
      </div>
    `;
  },

  pickTopThree() {
    const d = Store.get();
    const allTasks = [...d.tasks.personalGrowth, ...d.tasks.business, ...d.tasks.contentGrowth];
    const topIds = d.tasks.topThree || [];
    const picker = document.getElementById('topThreePicker');
    const pickList = document.getElementById('pickList');

    pickList.innerHTML = allTasks.map(t => {
      const selected = topIds.includes(t.id);
      const prioLabel = t.priority === 'high' ? '🔥' : t.priority === 'low' ? '○' : '⭐';
      return `
      <div class="pick-item ${selected ? 'picked' : ''}" onclick="Modules.home.selectTopThree('${t.id}')" style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:6px;cursor:pointer;background:${selected ? 'var(--gold-glow)' : 'var(--bg-base)'};font-size:13px">
        <span>${prioLabel}</span>
        <span style="flex:1">${UI.esc(t.text)}</span>
        ${selected ? '<span style="color:var(--gold-deep);font-weight:600">已选</span>' : '<span style="color:var(--ink-300)">选择</span>'}
      </div>`;
    }).join('');

    picker.style.display = 'block';
  },

  selectTopThree(id) {
    Store.update(d => {
      const topThree = d.tasks.topThree || [];
      const idx = topThree.indexOf(id);
      if (idx > -1) {
        topThree.splice(idx, 1);
      } else {
        if (topThree.length >= 3) {
          topThree.shift(); // 移除第一个，保持最多3个
        }
        topThree.push(id);
      }
      d.tasks.topThree = topThree;
    });
    // 重新渲染
    const d = Store.get();
    const allTasks = [...d.tasks.personalGrowth, ...d.tasks.business, ...d.tasks.contentGrowth];
    const topThreeIds = d.tasks.topThree || [];
    const topThreeTasks = topThreeIds.map(id => allTasks.find(t => t.id === id)).filter(Boolean);
    document.getElementById('topThreeWrap').innerHTML = this.renderTopThree(topThreeTasks, allTasks);
    UI.toast('Top 3 已更新');
  },

  toggleTopThree(id) {
    const d = Store.get();
    const groups = ['personalGrowth', 'business', 'contentGrowth'];
    let found = null;
    for (const g of groups) {
      const t = d.tasks[g].find(x => x.id === id);
      if (t) { found = { group: g, task: t }; break; }
    }
    if (!found) return;
    Store.updateItem(found.group, id, { done: !found.task.done }, 'tasks');
    // refresh
    const container = document.getElementById('viewContainer');
    this.render(container);
  },

  renderStreaks(streaks) {
    const items = [
      { key: 'fitness', icon: '💪', label: '健身2小时', days: streaks.fitness || 0 },
      { key: 'english', icon: '🗣', label: '英语30分钟', days: streaks.english || 0 },
      { key: 'learning', icon: '📚', label: '学习1小时', days: streaks.learning || 0 },
      { key: 'spiritual', icon: '🙏', label: '灵修', days: streaks.spiritual || 0 },
    ];
    return items.map(s => `
      <div class="streak-item" onclick="Modules.home.toggleStreak('${s.key}')">
        <div class="streak-icon">${s.icon}</div>
        <div class="streak-info">
          <div class="streak-name">${s.label}</div>
          <div class="streak-days">连续 <b>${s.days}</b> 天</div>
        </div>
        <div class="streak-toggle" id="streakToggle_${s.key}">
          <span>✓ 打卡</span>
        </div>
      </div>
    `).join('');
  },

  toggleStreak(key) {
    Store.update(d => {
      if (!d.meta.personalStreaks) d.meta.personalStreaks = { fitness: 0, english: 0, learning: 0, spiritual: 0 };
      const today = Store.todayStr();
      if (d.meta.lastStreakDate !== today) {
        // 新的一天，所有streak重置检查
        d.meta.lastStreakDate = today;
      }
      d.meta.personalStreaks[key] = (d.meta.personalStreaks[key] || 0) + 1;
    });
    const d = Store.get();
    const streaks = d.meta.personalStreaks || { fitness: 0, english: 0, learning: 0, spiritual: 0 };
    document.getElementById('streakGrid').innerHTML = this.renderStreaks(streaks);
    // 更新侧边栏 streak
    App.renderStreak();
    UI.toast('打卡成功！连续坚持中 💪');
  },

  renderDailyReport() {
    const d = Store.get();
    const today = Store.todayStr();
    const month = today.slice(0, 7);

    const allTasks = [...d.tasks.personalGrowth, ...d.tasks.business, ...d.tasks.contentGrowth];
    const done = allTasks.filter(t => t.done).length;
    const undone = allTasks.filter(t => !t.done).slice(0, 3);

    const todayIncome = d.finance.income.filter(i => i.date === today).reduce((s, i) => s + (+i.amount || 0), 0);
    const todayExpense = d.finance.expense.filter(e => e.date === today).reduce((s, e) => s + (+e.amount || 0), 0);
    const monthIncome = d.finance.income.filter(i => i.date.startsWith(month)).reduce((s, i) => s + (+i.amount || 0), 0);
    const monthExpense = d.finance.expense.filter(e => e.date.startsWith(month)).reduce((s, e) => s + (+e.amount || 0), 0);
    const monthProfit = monthIncome - monthExpense;

    const published = (d.reviews || []).filter(r => r.date === today).length;
    const customers = d.assets.customers || [];
    const topThreeIds = d.tasks.topThree || [];
    const topThreeDone = topThreeIds.filter(id => allTasks.find(t => t.id === id && t.done)).length;

    const streaks = d.meta.personalStreaks || {};
    const maxStreak = Math.max(streaks.fitness || 0, streaks.english || 0, streaks.learning || 0, streaks.spiritual || 0);

    return `
      <div class="ceo-report-card">
        <div class="cr-grid">
          <div class="cr-item">
            <div class="cr-label">今日完成</div>
            <div class="cr-value">${done} 项任务</div>
            <div class="cr-detail">Top3: ${topThreeDone}/3 完成</div>
          </div>
          <div class="cr-item">
            <div class="cr-label">今日收入</div>
            <div class="cr-value income">${UI.money(todayIncome)}</div>
            <div class="cr-detail">本月 ${UI.money(monthIncome)} · 利润 ${UI.money(monthProfit)}</div>
          </div>
          <div class="cr-item">
            <div class="cr-label">今日内容</div>
            <div class="cr-value">${published} 条</div>
            <div class="cr-detail">${published > 0 ? '已发布' : '待发布'}</div>
          </div>
          <div class="cr-item">
            <div class="cr-label">客户情况</div>
            <div class="cr-value">${customers.length} 位</div>
            <div class="cr-detail">最长打卡 ${maxStreak} 天</div>
          </div>
        </div>
        <div class="cr-tomorrow">
          <div class="cr-tomorrow-label">明日重点</div>
          <div class="cr-tomorrow-content">
            ${undone.length ? undone.map(t => `<span class="cr-tag">${UI.esc(t.text)}</span>`).join('') : '<span style="color:var(--ink-300)">今日任务全部完成，明日继续加油 ✨</span>'}
          </div>
        </div>
      </div>
    `;
  },
};
