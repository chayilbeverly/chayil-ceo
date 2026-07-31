/* ============================================
   英语学习 — 每日跟读练习
   聚焦：奢侈品商务 · 客户交流 · 日常口语
   ============================================ */

window.Modules = window.Modules || {};

const ENGLISH_DAILY = [
  {
    day: 1,
    scene: '招呼顾客',
    sentences: [
      { en: 'Welcome! Everything is freshly made today.', zh: '欢迎光临！今天都是现做的。', tip: 'Welcome 重音在第一个音节 Wel' },
      { en: 'Would you like to try a sample?', zh: '想试吃一下吗？', tip: 'sample 的 a 发 /æ/，嘴巴张大' },
      { en: 'What would you like to order?', zh: '您想点什么？', tip: 'order 结尾 r 轻轻卷舌' },
    ],
  },
  {
    day: 2,
    scene: '介绍食物',
    sentences: [
      { en: 'This is our most popular dish.', zh: '这是我们最受欢迎的菜品。', tip: 'popular 重音在第一个音节' },
      { en: 'It comes with a special sauce on the side.', zh: '配一份特制酱料。', tip: 'sauce 发 /sɔːs/，不是 so-s' },
      { en: 'Would you like it spicy or mild?', zh: '要辣的还是不辣的？', tip: 'spicy 的 s 后面 p 不送气，像 sbicy' },
    ],
  },
  {
    day: 3,
    scene: '价格与付款',
    sentences: [
      { en: 'That will be fifteen yuan in total.', zh: '一共15块钱。', tip: 'fifteen 重音在第二个音节 teen' },
      { en: 'We accept both cash and mobile payment.', zh: '我们收现金也收手机支付。', tip: 'mobile 发 /ˈmoʊbaɪl/' },
      { en: 'Here is your change. Have a nice day!', zh: '找您的零钱，祝您愉快！', tip: 'change 的 a 发 /eɪ/' },
    ],
  },
  {
    day: 4,
    scene: '推荐与追加',
    sentences: [
      { en: 'If you like this, you should try our special combo.', zh: '喜欢这个的话，可以试试我们的招牌套餐。', tip: 'combo 的 o 发 /oʊ/' },
      { en: 'Would you like to add a drink for just three yuan more?', zh: '加3块钱多一杯饮料，要吗？', tip: 'just 的 u 发 /ʌ/' },
      { en: 'Many customers come back just for this one.', zh: '很多客人专门为这个回头。', tip: 'customers 的 s 发 /z/' },
    ],
  },
  {
    day: 5,
    scene: '社交闲聊',
    sentences: [
      { en: 'How has your day been so far?', zh: '今天过得怎么样？', tip: 'been 发 /bɪn/，不是 bin' },
      { en: 'I hope you enjoy the food!', zh: '希望您喜欢这些吃的！', tip: 'hope 的 o 发 /oʊ/' },
      { en: 'See you next time! Take care!', zh: '下次见！慢走！', tip: 'next time 连读像 nex-time' },
    ],
  },
  {
    day: 6,
    scene: '处理问题',
    sentences: [
      { en: 'I\'m sorry about that. Let me fix it for you.', zh: '抱歉，我帮您处理一下。', tip: 'sorry 英式 /ˈsɒri/，美式 /ˈsɑːri/' },
      { en: 'Would you like a replacement or a refund?', zh: '您想换一份还是退款？', tip: 'refund 重音在第一个音节' },
      { en: 'Thank you for your patience.', zh: '感谢您的耐心。', tip: 'patience 结尾 ce 发 /s/' },
    ],
  },
  {
    day: 7,
    scene: '收摊与结束',
    sentences: [
      { en: 'We\'re almost sold out for today.', zh: '今天快卖完了。', tip: 'almost 的 l 要发出来' },
      { en: 'Thank you for stopping by!', zh: '谢谢光临！', tip: 'stopping 的 p 不送气' },
      { en: 'Same time tomorrow, same great taste!', zh: '明天同一时间，同样好味道！', tip: 'taste 的 a 发 /eɪ/' },
    ],
  },
];

window.Modules.english = {
  currentDay: 0,
  progress: {},
  speaking: null,

  render(container) {
    const d = Store.get();
    // 加载进度
    if (d.englishProgress) {
      this.progress = d.englishProgress;
    }

    // 根据今天日期计算当天内容
    const today = new Date();
    const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const dayIndex = dayOfYear % ENGLISH_DAILY.length;
    this.currentDay = dayIndex;

    const lesson = ENGLISH_DAILY[dayIndex];
    const completed = this.progress[dayIndex] || [];

    container.innerHTML = `
      <div class="view">
        <div class="section-title">每日跟读练习</div>

        <!-- 课程信息 -->
        <div class="eng-lesson-header">
          <div class="eng-lesson-badge">Day ${lesson.day}</div>
          <div class="eng-lesson-scene">场景：${lesson.scene}</div>
          <div class="eng-lesson-sub">跟读以下句子，练出地道口语</div>
        </div>

        <!-- 句子列表 -->
        <div class="eng-sentence-list" id="engSentenceList">
          ${lesson.sentences.map((s, i) => {
            const isDone = completed.includes(i);
            return `
            <div class="eng-card ${isDone ? 'done' : ''}" id="engCard${i}">
              <div class="eng-card-main">
                <div class="eng-en">${UI.esc(s.en)}</div>
                <div class="eng-zh">${UI.esc(s.zh)}</div>
                <div class="eng-tip">💡 发音提示：${UI.esc(s.tip)}</div>
              </div>
              <div class="eng-card-actions">
                <button class="btn btn-sm btn-ghost eng-speak-btn" onclick="Modules.english.speak(${i})" id="speakBtn${i}">
                  🔊 跟读
                </button>
                <button class="btn btn-sm ${isDone ? 'btn-dark' : 'btn-ghost'} eng-done-btn" onclick="Modules.english.markDone(${i})" id="doneBtn${i}">
                  ${isDone ? '✓ 已完成' : '✓ 标记完成'}
                </button>
              </div>
            </div>`;
          }).join('')}
        </div>

        <!-- 进度条 -->
        <div class="eng-progress-wrap">
          <div class="eng-progress-label">
            本周进度
            <span style="float:right">${completed.length}/${lesson.sentences.length} 句</span>
          </div>
          <div class="eng-progress-bar">
            <div class="eng-progress-fill" style="width:${(completed.length / lesson.sentences.length) * 100}%"></div>
          </div>
        </div>

        <!-- 跟读技巧 -->
        <div class="section-title">跟读小技巧</div>
        <div class="eng-tips-grid">
          <div class="eng-tip-card">
            <div class="eng-tip-num">1</div>
            <div>先听一遍完整句子，不要急着跟读</div>
          </div>
          <div class="eng-tip-card">
            <div class="eng-tip-num">2</div>
            <div>模仿语调和节奏，不要只关注单词</div>
          </div>
          <div class="eng-tip-card">
            <div class="eng-tip-num">3</div>
            <div>比原声延迟0.5秒跟读（影子跟读法）</div>
          </div>
          <div class="eng-tip-card">
            <div class="eng-tip-num">4</div>
            <div>录下自己的声音，和原声对比找差距</div>
          </div>
          <div class="eng-tip-card">
            <div class="eng-tip-num">5</div>
            <div>每天练3-5分钟，比偶尔狂练2小时有效</div>
          </div>
        </div>
      </div>
    `;
  },

  // 浏览器语音朗读
  speak(index) {
    if (!window.speechSynthesis) {
      UI.toast('浏览器不支持语音朗读');
      return;
    }

    window.speechSynthesis.cancel();

    const lesson = ENGLISH_DAILY[this.currentDay];
    const text = lesson.sentences[index].en;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.85; // 稍慢，方便跟读
    utterance.pitch = 1.0;

    // 高亮当前卡片
    const card = document.getElementById('engCard' + index);
    if (card) card.classList.add('speaking');

    utterance.onend = () => {
      if (card) card.classList.remove('speaking');
    };

    utterance.onerror = () => {
      if (card) card.classList.remove('speaking');
    };

    window.speechSynthesis.speak(utterance);
  },

  // 标记完成
  markDone(index) {
    const dayIndex = this.currentDay;
    if (!this.progress[dayIndex]) this.progress[dayIndex] = [];

    const arr = this.progress[dayIndex];
    const pos = arr.indexOf(index);

    if (pos > -1) {
      arr.splice(pos, 1);
    } else {
      arr.push(index);
    }

    // 持久化
    Store.update(data => { data.englishProgress = this.progress; });

    // 更新UI
    const card = document.getElementById('engCard' + index);
    const doneBtn = document.getElementById('doneBtn' + index);
    if (card && doneBtn) {
      const isDone = arr.includes(index);
      card.classList.toggle('done', isDone);
      doneBtn.textContent = isDone ? '✓ 已完成' : '✓ 标记完成';
      doneBtn.className = 'btn btn-sm ' + (isDone ? 'btn-dark' : 'btn-ghost') + ' eng-done-btn';
    }

    // 更新进度条
    const lesson = ENGLISH_DAILY[dayIndex];
    const completed = arr.length;
    const fill = document.querySelector('.eng-progress-fill');
    const label = document.querySelector('.eng-progress-label');
    if (fill) fill.style.width = (completed / lesson.sentences.length) * 100 + '%';
    if (label) label.innerHTML = '本周进度 <span style="float:right">' + completed + '/' + lesson.sentences.length + ' 句</span>';

    if (arr.includes(index)) {
      UI.toast('已标记完成 ✓');
    }
  },
};
