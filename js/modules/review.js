/* ============================================
   内容复盘 — AI 内容教练
   ============================================ */

window.Modules = window.Modules || {};

window.Modules.review = {
  render(container) {
    const d = Store.get();
    container.innerHTML = `
      <div class="view">
        <div class="card" style="margin-bottom:24px">
          <div class="card-head">
            <div class="card-title">录入内容数据</div>
            <div class="card-sub">发布内容后输入数据，AI 将自动分析并给出优化建议</div>
          </div>
          <div class="card-body">
            <div class="form-grid">
              <div class="form-field">
                <label class="form-label">发布时间</label>
                <input type="date" class="form-input" id="rv-date" value="${Store.todayStr()}">
              </div>
              <div class="form-field">
                <label class="form-label">平台</label>
                <select class="form-select" id="rv-platform">
                  <option value="抖音">抖音</option>
                  <option value="小红书">小红书</option>
                  <option value="视频号">视频号</option>
                </select>
              </div>
              <div class="form-field full">
                <label class="form-label">标题</label>
                <input type="text" class="form-input" id="rv-title" placeholder="输入内容标题">
              </div>
              <div class="form-field">
                <label class="form-label">播放量</label>
                <input type="number" class="form-input" id="rv-views" placeholder="0">
              </div>
              <div class="form-field">
                <label class="form-label">点赞</label>
                <input type="number" class="form-input" id="rv-likes" placeholder="0">
              </div>
              <div class="form-field">
                <label class="form-label">收藏</label>
                <input type="number" class="form-input" id="rv-saves" placeholder="0">
              </div>
              <div class="form-field">
                <label class="form-label">评论</label>
                <input type="number" class="form-input" id="rv-comments" placeholder="0">
              </div>
              <div class="form-field">
                <label class="form-label">涨粉</label>
                <input type="number" class="form-input" id="rv-followers" placeholder="0">
              </div>
              <div class="form-field">
                <label class="form-label">成交（元）</label>
                <input type="number" class="form-input" id="rv-sales" placeholder="0">
              </div>
            </div>
            <div class="form-actions">
              <button class="btn btn-gold" onclick="Modules.review.analyze()">✦ AI 复盘分析</button>
            </div>
          </div>
        </div>

        <div id="rv-result"></div>

        <div class="section-title">内容成长数据库</div>
        <div id="rv-history"></div>
      </div>
    `;

    this.renderHistory();
  },

  analyze() {
    const get = id => document.getElementById(id).value;
    const title = get('rv-title');
    if (!title) { UI.toast('请先输入标题'); return; }

    const views = +get('rv-views') || 0;
    const likes = +get('rv-likes') || 0;
    const saves = +get('rv-saves') || 0;
    const comments = +get('rv-comments') || 0;
    const followers = +get('rv-followers') || 0;
    const sales = +get('rv-sales') || 0;

    // 指标计算
    const likeRate = views ? (likes / views * 100).toFixed(1) : 0;
    const saveRate = views ? (saves / views * 100).toFixed(1) : 0;
    const interactRate = views ? ((likes + comments + saves) / views * 100).toFixed(1) : 0;

    // AI 分析逻辑（基于数据规则的模拟）
    const analysis = this.generateAnalysis({ title, views, likes, saves, comments, followers, sales, likeRate, saveRate, interactRate });

    // 保存记录
    const record = {
      date: get('rv-date'), platform: get('rv-platform'), title,
      views, likes, saves, comments, followers, sales,
      analysis,
    };
    Store.addItem('reviews', record);
    Store.update(d => { if (d.reviews.length > 50) d.reviews = d.reviews.slice(0, 50); });

    // 渲染分析结果
    document.getElementById('rv-result').innerHTML = `
      <div class="ai-analysis">
        <div class="ai-badge">✦ AI 内容教练复盘</div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:20px">
          <div><div class="topic-field-label">点赞率</div><div style="font-family:var(--ff-serif);font-size:20px;font-weight:600">${likeRate}%</div></div>
          <div><div class="topic-field-label">收藏率</div><div style="font-family:var(--ff-serif);font-size:20px;font-weight:600">${saveRate}%</div></div>
          <div><div class="topic-field-label">互动率</div><div style="font-family:var(--ff-serif);font-size:20px;font-weight:600">${interactRate}%</div></div>
          <div><div class="topic-field-label">转化成交</div><div style="font-family:var(--ff-serif);font-size:20px;font-weight:600;color:var(--green)">${UI.money(sales)}</div></div>
        </div>
        <div class="ai-section">
          <div class="ai-section-label">优势</div>
          <div class="ai-section-content"><ul>${analysis.advantages.map(a => `<li>${a}</li>`).join('')}</ul></div>
        </div>
        <div class="ai-section">
          <div class="ai-section-label">问题</div>
          <div class="ai-section-content"><ul>${analysis.problems.map(p => `<li>${p}</li>`).join('')}</ul></div>
        </div>
        <div class="ai-section">
          <div class="ai-section-label">下一次优化</div>
          <div class="ai-section-content"><ul>${analysis.suggestions.map(s => `<li>${s}</li>`).join('')}</ul></div>
        </div>
      </div>
    `;

    this.renderHistory();
    UI.toast('复盘分析已生成 ✦');
  },

  generateAnalysis(d) {
    const advantages = [];
    const problems = [];
    const suggestions = [];

    // 点赞率分析（行业参考 3-5%）
    if (+d.likeRate >= 5) advantages.push('点赞率优秀，标题与情绪共鸣强，触达精准人群');
    else if (+d.likeRate >= 3) advantages.push('点赞率达标，内容有一定吸引力');
    else { problems.push('点赞率偏低，标题吸引力或开头留存不足'); suggestions.push('优化标题，加入数字或冲突感，如"4年经验""我发现一个秘密"'); }

    // 收藏率分析（参考 2-4%）
    if (+d.saveRate >= 4) advantages.push('收藏率极高，实用价值突出，用户愿意反复查看');
    else if (+d.saveRate >= 2) advantages.push('收藏率正常，内容有一定实用价值');
    else { problems.push('收藏率偏低，内容实用价值或干货密度不足'); suggestions.push('增加可落地清单或对比表格，提升收藏价值'); }

    // 互动/评论
    if (d.comments >= d.likes * 0.05 && d.comments > 0) {
      advantages.push('评论互动活跃，话题有争议性或共鸣点，利于二次传播');
    } else if (d.comments > 0) {
      suggestions.push('结尾设置互动钩子，如提问"你第一只包是什么"引导评论');
    } else {
      problems.push('评论数为零，内容缺乏讨论点');
      suggestions.push('加入争议性观点或开放性问题，激发评论区讨论');
    }

    // 涨粉
    if (d.followers >= 50) advantages.push(`涨粉 ${d.followers}，人设定位清晰，转化效果好`);
    else if (d.followers > 0) suggestions.push('强化人设标签，在内容中反复出现"4年奢侈品从业者"等记忆点');
    else { problems.push('未产生涨粉，内容未有效传递关注价值'); suggestions.push('在视频末尾加入关注引导，说明关注后能获得什么'); }

    // 成交
    if (d.sales > 0) advantages.push(`直接成交 ${UI.money(d.sales)}，内容带货能力强，信任建立到位`);
    else suggestions.push('软性植入成交钩子，如"私信咨询选包"，但控制密度避免影响内容');

    // 通用建议
    if (problems.length === 0) {
      suggestions.push('保持当前内容方向，尝试复制爆款结构到新选题');
      suggestions.push('将本条作为模板，沉淀到"最佳标题库"供后续参考');
    }
    suggestions.push('前三秒增加冲突或悬念，提升完播率');

    if (advantages.length === 0) advantages.push('内容已发布，坚持输出本身就是最大的优势');

    return { advantages, problems, suggestions };
  },

  renderHistory() {
    const el = document.getElementById('rv-history');
    if (!el) return;
    const list = Store.get().reviews;
    if (!list.length) { el.innerHTML = UI.empty('暂无复盘记录，发布后录入数据即可生成分析', '❖'); return; }

    el.innerHTML = `
      <div class="record-list">
        ${list.slice(0, 10).map(r => {
          const isGood = r.likes && r.views && (r.likes / r.views) >= 0.04;
          return `
          <div class="record-item">
            <div class="record-main">
              <div class="record-title">${UI.esc(r.title)}</div>
              <div class="record-meta">
                <span><span class="record-tag" style="background:var(--gold-glow);color:var(--gold-deep)">${UI.esc(r.platform)}</span></span>
                <span>${UI.esc(r.date)}</span>
                <span>播放 ${UI.fmt(r.views)}</span>
                <span>赞 ${UI.fmt(r.likes)}</span>
                <span>藏 ${UI.fmt(r.saves)}</span>
                <span>评 ${UI.fmt(r.comments)}</span>
                ${r.followers ? `<span>涨粉 ${UI.fmt(r.followers)}</span>` : ''}
              </div>
            </div>
            <div style="text-align:right">
              <div class="record-amount ${isGood ? 'income' : 'expense'}">${isGood ? '爆款' : '待优化'}</div>
              ${r.sales ? `<div style="font-size:12px;color:var(--green);margin-top:2px">${UI.money(r.sales)}成交</div>` : ''}
            </div>
          </div>`;
        }).join('')}
      </div>
    `;
  },
};
