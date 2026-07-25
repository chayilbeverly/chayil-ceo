/* ============================================
   Chayil CEO OS — Data Store v5
   Supabase 分离表存储 + localStorage 离线缓存
   支持：多设备实时同步 / 用户隔离 / 离线回退
   ============================================ */

const Store = (function () {
  const KEY = 'chayil_ceo_data_v5';

  function todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function uid() { return Supa.uid(); }
  function now() { return Date.now(); }

  // 默认种子数据
  function seed() {
    const today = todayStr();
    const ts = now();
    return {
      _syncVersion: ts,
      meta: {
        created: today,
        streak: 0,
        personalStreaks: { fitness: 0, english: 0, learning: 0, spiritual: 0 },
        streakHistory: { fitness: [], english: [], learning: [], spiritual: [] },
        lastStreakDate: today,
        loginDates: [today],
        loginDays: 1,
        loginStreak: 1,
        firstLoginDate: today,
        lastLoginDate: today,
      },
      tasks: {
        topThree: [],
        personalGrowth: [
          { id: uid(), text: '健身 2小时', done: false, time: '06:30', priority: 'high', _updated: ts },
          { id: uid(), text: '学习 1小时', done: false, time: '09:00', priority: 'high', _updated: ts },
          { id: uid(), text: '英语练习 30分钟', done: false, time: '10:00', priority: 'normal', _updated: ts },
          { id: uid(), text: '灵修 / 读经 30分钟', done: false, time: '07:00', priority: 'high', _updated: ts },
          { id: uid(), text: '阅读 30分钟', done: false, time: '21:00', priority: 'low', _updated: ts },
          { id: uid(), text: '今日感恩记录', done: false, time: '22:00', priority: 'low', _updated: ts },
        ],
        business: [
          { id: uid(), text: '回复客户咨询', done: false, time: '10:30', priority: 'high', _updated: ts },
          { id: uid(), text: '跟进 3 位老客户', done: false, time: '14:00', priority: 'high', _updated: ts },
          { id: uid(), text: '更新商品库存', done: false, time: '16:00', priority: 'normal', _updated: ts },
          { id: uid(), text: '发布朋友圈', done: false, time: '12:00', priority: 'normal', _updated: ts },
        ],
        contentGrowth: [
          { id: uid(), text: '寻找今日爆款', done: false, time: '11:00', priority: 'normal', _updated: ts },
          { id: uid(), text: '分析一个优秀视频', done: false, time: '11:30', priority: 'normal', _updated: ts },
          { id: uid(), text: '发布一条内容', done: false, time: '17:00', priority: 'high', _updated: ts },
          { id: uid(), text: '复盘昨天内容', done: false, time: '18:00', priority: 'normal', _updated: ts },
        ],
      },
      inspirations: [],
      radar: [],
      reviews: [],
      finance: {
        dailyTarget: 4000,
        income: [],
        expense: [],
      },
      assets: {
        customers: [
          { id: uid(), name: '张女士', contact: '微信 zhang****', brand: 'Louis Vuitton', time: today, amount: 8800, preference: '实用大包', budget: '8000-15000', frequency: '每月1-2次', note: '偏好中古款，复购意愿强', followUpTime: today, _updated: ts },
          { id: uid(), name: '林小姐', contact: '微信 lin****', brand: 'Chanel', time: today, amount: 52000, preference: '经典款', budget: '30000-60000', frequency: '每季度', note: '注重成色与配件齐全', followUpTime: '', _updated: ts },
          { id: uid(), name: '王太太', contact: '电话 138****', brand: 'Hermes', time: '2026-07-20', amount: 98000, preference: '限量款', budget: '80000-200000', frequency: '不定期', note: '高净值客户，推荐稀缺款', followUpTime: '', _updated: ts },
        ],
        products: [
          { id: uid(), product_name: 'Neverfull MM', brand: 'Louis Vuitton', category: '托特包', quantity: 3, cost_price: 6500, sale_price: 8800, status: '库存中', acquisition_type: '客户寄售', image: '', _updated: ts },
          { id: uid(), product_name: 'Classic Flap 中号', brand: 'Chanel', category: '单肩包', quantity: 1, cost_price: 38000, sale_price: 52000, status: '库存中', acquisition_type: '个人回收', image: '', _updated: ts },
          { id: uid(), product_name: 'Birkin 25', brand: 'Hermes', category: '手提包', quantity: 1, cost_price: 75000, sale_price: 98000, status: '库存中', acquisition_type: '代购', image: '', _updated: ts },
          { id: uid(), product_name: 'Lady Dior 中号', brand: 'Dior', category: '单肩包', quantity: 2, cost_price: 28000, sale_price: 38000, status: '库存中', acquisition_type: '同行调货', image: '', _updated: ts },
        ],
        deals: [
          { id: uid(), need: '通勤大容量包，预算1万内', process: '推荐 LV Neverfull，强调耐用与保值', price: 8800, reason: '客户看重实用+品牌认知，Neverfull 完美匹配', _updated: ts },
          { id: uid(), need: '正式场合经典款，预算5万', process: '对比 Chanel CF 与 CF 中号，黑金配色', price: 52000, reason: '经典款认知度最高，客户一眼心动', _updated: ts },
        ],
        contentAssets: [],
      },
    };
  }

  let data = null;
  let cloudUpdatedAt = null;
  let cloudError = null;  // 最新同步错误信息
  let saveDebounceTimer = null;
  let _cloudBusy = false;  // 同步锁：防止并发 push/pull
  let _lastSyncAttempt = 0; // 上次同步尝试时间戳，用于冷却

  // ========== 本地存储 ==========

  function loadLocal() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) { data = JSON.parse(raw); return true; }
    } catch (e) { /* fall through */ }
    return false;
  }

  function saveLocal() {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) {}
  }

  // ========== 云端存储（分离表） ==========

  function scheduleCloudSave() {
    clearTimeout(saveDebounceTimer);
    saveDebounceTimer = setTimeout(async () => {
      if (_cloudBusy) { console.log('[自动保存] 同步锁忙，稍后重试'); return; }
      if (Date.now() - _lastSyncAttempt < 2000) { console.log('[自动保存] 冷却中，跳过'); return; } // 2秒冷却
      if (!Supa.getUserId()) { console.log('[自动保存] 未登录，跳过'); return; }
      _cloudBusy = true;
      _lastSyncAttempt = Date.now();
      cloudError = null;
      try {
        data._syncVersion = Date.now();
        const taskCount = (data.tasks.personalGrowth||[]).length + (data.tasks.business||[]).length + (data.tasks.contentGrowth||[]).length;
        console.log('[自动保存] 触发推送: tasks=', taskCount, 'customers=', (data.assets.customers||[]).length);
        const result = await Supa.pushAllData(data);
        if (result && result.success !== false) {
          cloudUpdatedAt = new Date().toISOString();
          cloudError = null;
          saveLocal();
          console.log('[自动保存] ✅ 推送成功, time:', cloudUpdatedAt);
        } else {
          const errMsg = (result && result.error) ? result.error : '未知错误';
          cloudError = errMsg;
          console.error('[自动保存] ❌ 推送失败:', errMsg);
        }
      } catch (e) {
        cloudError = e.message || String(e);
        console.error('[自动保存] 异常:', cloudError);
      } finally {
        _cloudBusy = false;
      }
    }, 1000);
  }

  async function pushNow() {
    clearTimeout(saveDebounceTimer);
    if (!Supa.getUserId()) { console.warn('[pushNow] 未登录，跳过'); return false; }
    if (_cloudBusy) { console.warn('[pushNow] 同步锁忙，跳过'); return false; }
    if (Date.now() - _lastSyncAttempt < 2000) { console.log('[pushNow] 冷却中，跳过'); return false; }
    _cloudBusy = true;
    _lastSyncAttempt = Date.now();
    cloudError = null;
    try {
      data._syncVersion = Date.now();
      const taskCount = (data.tasks.personalGrowth||[]).length + (data.tasks.business||[]).length + (data.tasks.contentGrowth||[]).length;
      console.log('[pushNow] 推送: tasks=', taskCount, 'customers=', (data.assets.customers||[]).length, 'inspirations=', (data.inspirations||[]).length);
      const result = await Supa.pushAllData(data);
      if (result && result.success !== false) {
        cloudUpdatedAt = new Date().toISOString();
        cloudError = null;
        saveLocal();
        console.log('[pushNow] ✅ 推送成功, time:', cloudUpdatedAt);
        return true;
      } else {
        const errMsg = (result && result.error) ? result.error : '推送失败：服务器无响应';
        cloudError = errMsg;
        console.error('[pushNow] ❌', errMsg);
        return false;
      }
    } catch (e) {
      cloudError = e.message || String(e);
      console.error('[pushNow] 异常:', cloudError);
      return false;
    } finally {
      _cloudBusy = false;
    }
  }

  // 计算数据内容指纹（所有条目的 id + _updated 时间戳）
  function dataFingerprint(d) {
    const parts = [];
    function collect(arr) {
      if (!arr || !arr.length) return;
      for (let i = 0; i < arr.length; i++) {
        const item = arr[i];
        if (item && item.id) parts.push(item.id + ':' + (item._updated || 0));
      }
    }
    if (d.tasks) {
      collect(d.tasks.personalGrowth);
      collect(d.tasks.business);
      collect(d.tasks.contentGrowth);
      collect(d.tasks.topThree);
    }
    if (d.assets) {
      collect(d.assets.customers);
      collect(d.assets.products);
      collect(d.assets.deals);
      collect(d.assets.contentAssets);
    }
    if (d.finance) {
      collect(d.finance.income);
      collect(d.finance.expense);
    }
    collect(d.inspirations);
    collect(d.radar);
    collect(d.reviews);
    collect(d.dailyReviews);
    return parts.sort().join('|');
  }

  async function pullFromCloud() {
    if (!Supa.getUserId()) { console.warn('[pullFromCloud] 未登录，跳过'); return false; }
    if (_cloudBusy) { console.log('[pullFromCloud] 同步锁忙，跳过'); return false; }
    if (Date.now() - _lastSyncAttempt < 2000) { console.log('[pullFromCloud] 冷却中，跳过'); return false; }
    _cloudBusy = true;
    _lastSyncAttempt = Date.now();
    try {
      const remoteData = await Supa.pullAllData(data);
      if (!remoteData) { console.warn('[pullFromCloud] 拉取返回空'); return false; }

      // 指纹对比：合并前后是否真的有数据变化
      const fpBefore = dataFingerprint(data);
      data = deepMerge(data, remoteData);
      deduplicateAll(data);
      saveLocal();
      const fpAfter = dataFingerprint(data);

      if (fpAfter !== fpBefore) {
        cloudUpdatedAt = new Date().toISOString();
        cloudError = null;
        console.log('[pullFromCloud] ✅ 有新数据 (指纹变化), time:', cloudUpdatedAt);
        // 如果去重移除了条目，推送清理后的数据到云端
        const fpDedup = dataFingerprint(data);
        if (fpDedup !== fpAfter) {
          console.log('[pullFromCloud] 去重后有变化，推送清理数据');
          setTimeout(() => pushNow(), 500);
        }
        return true;
      }
      console.log('[pullFromCloud] 指纹未变，跳过');
      return false;
    } catch (e) {
      cloudError = e.message || String(e);
      console.error('[pullFromCloud] 异常:', cloudError);
      return false;
    } finally {
      _cloudBusy = false;
    }
  }

  // ========== 去重 ==========

  function deduplicateArray(arr, key) {
    if (!arr || !arr.length) return arr;
    const seen = new Map();
    const result = [];
    for (const item of arr) {
      const k = item[key];
      if (k === undefined || k === null || k === '') { result.push(item); continue; }
      if (seen.has(k)) {
        // 保留 _updated 更大的
        const existing = seen.get(k);
        if ((item._updated || 0) > (existing._updated || 0)) {
          seen.set(k, item);
        }
      } else {
        seen.set(k, item);
      }
    }
    return Array.from(seen.values());
  }

  function deduplicateAll(d) {
    if (!d) return d;
    let removed = 0;
    if (d.tasks) {
      ['personalGrowth', 'business', 'contentGrowth'].forEach(sub => {
        const before = (d.tasks[sub] || []).length;
        d.tasks[sub] = deduplicateArray(d.tasks[sub], 'text');
        removed += before - d.tasks[sub].length;
      });
    }
    if (d.assets && d.assets.customers) {
      const before = d.assets.customers.length;
      d.assets.customers = deduplicateArray(d.assets.customers, 'name');
      removed += before - d.assets.customers.length;
    }
    if (removed > 0) console.log('[去重] 移除了', removed, '条重复数据');
    return d;
  }

  // ========== 深度合并 ==========

  function deepMerge(local, remote) {
    if (!remote) return local;
    if (!local) return remote;
    const result = JSON.parse(JSON.stringify(local));

    // 合并任务
    if (remote.tasks) {
      result.tasks = result.tasks || {};
      ['personalGrowth', 'business', 'contentGrowth'].forEach(sub => {
        result.tasks[sub] = mergeArrayById(
          (local.tasks && local.tasks[sub]) || [],
          (remote.tasks && remote.tasks[sub]) || []
        );
      });
      result.tasks.topThree = remote.tasks.topThree || (local.tasks && local.tasks.topThree) || [];
    }

    // 合并财务
    if (remote.finance) {
      result.finance = result.finance || {};
      result.finance.income = mergeArrayById(
        (local.finance && local.finance.income) || [],
        (remote.finance && remote.finance.income) || []
      );
      result.finance.expense = mergeArrayById(
        (local.finance && local.finance.expense) || [],
        (remote.finance && remote.finance.expense) || []
      );
      result.finance.dailyTarget = remote.finance.dailyTarget || (local.finance && local.finance.dailyTarget) || 4000;
    }

    // 合并资产
    if (remote.assets) {
      result.assets = result.assets || {};
      ['customers', 'products', 'deals', 'contentAssets'].forEach(sub => {
        result.assets[sub] = mergeArrayById(
          (local.assets && local.assets[sub]) || [],
          (remote.assets && remote.assets[sub]) || []
        );
      });
    }

    // 合并灵感 / 雷达 / 复盘
    ['inspirations', 'radar', 'reviews', 'dailyReviews'].forEach(key => {
      result[key] = mergeArrayById(
        (local[key] || []), (remote[key] || [])
      );
    });

    // 合并 meta
    if (remote.meta) {
      result.meta = result.meta || {};
      result.meta.created = remote.meta.created || (local.meta && local.meta.created) || '';
      result.meta.streak = Math.max((local.meta && local.meta.streak) || 0, remote.meta.streak || 0);
      result.meta.lastStreakDate = remote.meta.lastStreakDate || (local.meta && local.meta.lastStreakDate) || '';
      if (remote.meta.streakHistory) {
        result.meta.streakHistory = result.meta.streakHistory || {};
        ['fitness', 'english', 'learning', 'spiritual'].forEach(hk => {
          const lArr = ((local.meta && local.meta.streakHistory && local.meta.streakHistory[hk]) || []);
          const rArr = (remote.meta.streakHistory[hk] || []);
          result.meta.streakHistory[hk] = Array.from(new Set(lArr.concat(rArr))).sort();
        });
      }
      if (remote.meta.personalStreaks) {
        result.meta.personalStreaks = result.meta.personalStreaks || {};
        ['fitness', 'english', 'learning', 'spiritual'].forEach(pk => {
          result.meta.personalStreaks[pk] = Math.max(
            ((local.meta && local.meta.personalStreaks && local.meta.personalStreaks[pk]) || 0),
            (remote.meta.personalStreaks[pk] || 0)
          );
        });
      }
      // 合并登录天数
      if (remote.meta.loginDates) {
        const allLoginDates = Array.from(new Set(
          ((local.meta && local.meta.loginDates) || []).concat(remote.meta.loginDates)
        )).sort();
        result.meta.loginDates = allLoginDates;
        result.meta.loginDays = allLoginDates.length;
        result.meta.loginStreak = calcLoginStreak(allLoginDates);
      }
      // 合并首次/最后登录日期
      if (remote.meta.firstLoginDate) {
        const localFirst = (local.meta && local.meta.firstLoginDate) || '';
        result.meta.firstLoginDate = localFirst && localFirst < remote.meta.firstLoginDate ? localFirst : remote.meta.firstLoginDate;
      }
      if (remote.meta.lastLoginDate) {
        const localLast = (local.meta && local.meta.lastLoginDate) || '';
        result.meta.lastLoginDate = localLast > remote.meta.lastLoginDate ? localLast : remote.meta.lastLoginDate;
      }
    }

    result._syncVersion = Math.max(local._syncVersion || 0, remote._syncVersion || 0);
    return result;
  }

  function mergeArrayById(arrA, arrB) {
    const map = new Map();
    arrA.forEach(item => { if (item && item.id) map.set(item.id, item); });
    arrB.forEach(item => {
      if (!item || !item.id) return;
      const existing = map.get(item.id);
      if (!existing) { map.set(item.id, item); }
      else {
        const tsA = existing._updated || 0;
        const tsB = item._updated || 0;
        if (tsB > tsA) map.set(item.id, item);
      }
    });
    return Array.from(map.values());
  }

  // ========== 公开 API ==========

  async function load() {
    const hasLocal = loadLocal();

    if (!hasLocal) {
      // 无本地缓存，尝试云端加载
      if (Supa.getUserId()) {
        try {
          const remote = await Supa.pullAllData(seed());
          if (remote) {
            data = remote;
            saveLocal();
          } else {
            data = seed();
          }
        } catch (e) {
          data = seed();
        }
      } else {
        data = seed();
      }
    } else {
      // 有本地缓存，异步合并云端
      if (Supa.getUserId()) {
        try {
          const remote = await Supa.pullAllData(data);
          if (remote) {
            data = deepMerge(data, remote);
            saveLocal();
          }
        } catch (e) {
          console.log('离线模式，使用本地缓存');
        }
      }
    }

    // 确保必要字段
    if (!data.meta) data.meta = {};
    if (!data.meta.streakHistory) {
      data.meta.streakHistory = { fitness: [], english: [], learning: [], spiritual: [] };
    }
    if (!data.meta.personalStreaks) {
      data.meta.personalStreaks = { fitness: 0, english: 0, learning: 0, spiritual: 0 };
    }
    if (!data.meta.loginDates) {
      data.meta.loginDates = [todayStr()];
      data.meta.loginDays = 1;
      data.meta.loginStreak = 1;
      data.meta.firstLoginDate = todayStr();
      data.meta.lastLoginDate = todayStr();
    }
    if (!data.meta.loginDays && data.meta.loginDates) {
      data.meta.loginDays = data.meta.loginDates.length;
    }
    if (!data.meta.firstLoginDate) {
      data.meta.firstLoginDate = data.meta.loginDates[0] || todayStr();
    }
    if (!data.meta.lastLoginDate) {
      data.meta.lastLoginDate = data.meta.loginDates[data.meta.loginDates.length - 1] || todayStr();
    }
    if (!data.meta.loginStreak) {
      data.meta.loginStreak = calcLoginStreak(data.meta.loginDates);
    }
    if (!data.tasks) data.tasks = { topThree: [], personalGrowth: [], business: [], contentGrowth: [] };
    if (!data.finance) data.finance = { dailyTarget: 4000, income: [], expense: [] };
    if (!data.assets) data.assets = { customers: [], products: [], deals: [], contentAssets: [] };
    if (!data.inspirations) data.inspirations = [];
    if (!data.radar) data.radar = [];
    if (!data.reviews) data.reviews = [];
    if (!data.dailyReviews) data.dailyReviews = [];

    // 去重（清理同步过程中产生的重复条目）
    const fpBefore = dataFingerprint(data);
    deduplicateAll(data);
    const fpAfter = dataFingerprint(data);
    if (fpAfter !== fpBefore) {
      saveLocal();
      // 异步推送清理后的数据到云端
      setTimeout(() => scheduleCloudSave(), 500);
    }

    return data;
  }

  function get() {
    if (!data) { loadLocal(); if (!data) data = seed(); }
    return data;
  }

  function update(fn) {
    if (!data) get();
    fn(data);
    data._syncVersion = Date.now();
    saveLocal();
    scheduleCloudSave();
  }

  function save() {
    saveLocal();
    scheduleCloudSave();
  }

  // 通用 CRUD
  function addItem(collection, item, parent) {
    update(d => {
      const arr = parent ? d[parent][collection] : d[collection];
      arr.unshift({ id: uid(), _updated: now(), ...item });
    });
  }

  // 添加到根级别数组（非嵌套）
  function addItemToList(collection, item) {
    update(d => {
      if (!d[collection]) d[collection] = [];
      d[collection].unshift({ id: uid(), _updated: now(), ...item });
    });
  }

  function removeItem(collection, id, parent) {
    update(d => {
      const arr = parent ? d[parent][collection] : d[collection];
      const idx = arr.findIndex(x => x.id === id);
      if (idx > -1) arr.splice(idx, 1);
    });
  }

  function updateItem(collection, id, patch, parent) {
    update(d => {
      const arr = parent ? d[parent][collection] : d[collection];
      const idx = arr.findIndex(x => x.id === id);
      if (idx > -1) { Object.assign(arr[idx], patch); arr[idx]._updated = now(); }
    });
  }

  function yesterdayStr() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function recordLogin() {
    const d = get();
    if (!d.meta.loginDates) d.meta.loginDates = [];
    const today = todayStr();
    if (!d.meta.firstLoginDate) d.meta.firstLoginDate = today;
    if (!d.meta.loginDates.includes(today)) {
      d.meta.loginDates.push(today);
      d.meta.loginDays = d.meta.loginDates.length;
    }
    // 更新最后登录日期和连续经营天数
    d.meta.lastLoginDate = today;
    d.meta.loginStreak = calcLoginStreak(d.meta.loginDates);
    d._syncVersion = Date.now();
    saveLocal();
    scheduleCloudSave();
  }

  function getLoginDays() {
    const d = get();
    return d.meta.loginDays || (d.meta.loginDates ? d.meta.loginDates.length : 1);
  }

  // 计算连续经营天数（基于 loginDates 的日期连续性）
  function calcLoginStreak(dates) {
    if (!dates || !dates.length) return 0;
    const sorted = [...new Set(dates)].sort().reverse();
    const today = todayStr();
    let expected = today;
    let streak = 0;
    for (const d of sorted) {
      if (d === expected) {
        streak++;
        const dt = new Date(d + 'T00:00:00');
        dt.setDate(dt.getDate() - 1);
        expected = dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
      } else if (d < expected) break;
    }
    return streak;
  }

  function getLoginStreak() {
    const d = get();
    if (!d.meta.loginDates || !d.meta.loginDates.length) return 0;
    return calcLoginStreak(d.meta.loginDates);
  }

  // 获取昨天数据概况
  function getYesterdaySnapshot() {
    const d = get();
    const yest = yesterdayStr();
    const allTasks = [...d.tasks.personalGrowth, ...d.tasks.business, ...d.tasks.contentGrowth];
    const total = allTasks.length;
    const done = allTasks.filter(t => t.done).length;

    const yestIncome = d.finance.income.filter(i => i.date === yest).reduce((s, i) => s + (+i.amount || 0), 0);
    const yestExpense = d.finance.expense.filter(e => e.date === yest).reduce((s, e) => s + (+e.amount || 0), 0);
    const yestReviews = (d.reviews || []).filter(r => r.date === yest).length;
    const yestCustomers = d.assets.customers.filter(c => c.time === yest || c.followUpTime === yest).length;

    // 打卡情况
    Store.ensureStreakHistory();
    const history = d.meta.streakHistory || {};
    const yestStreaks = {};
    ['fitness', 'english', 'learning', 'spiritual'].forEach(k => {
      yestStreaks[k] = (history[k] || []).includes(yest);
    });

    // 已完成的top3
    const yestTopIds = d.tasks.topThree || [];
    const yestTopDone = yestTopIds.filter(id => allTasks.find(t => t.id === id && t.done)).length;

    return {
      date: yest,
      total, done,
      rate: total ? Math.round((done / total) * 100) : 0,
      income: yestIncome,
      expense: yestExpense,
      profit: yestIncome - yestExpense,
      reviewsCount: yestReviews,
      customersCount: yestCustomers,
      yestStreaks,
      topDone: yestTopDone,
      topTotal: yestTopIds.length,
    };
  }

  function calcStreak(dates) {
    if (!dates || !dates.length) return 0;
    const sorted = [...new Set(dates)].sort().reverse();
    const today = todayStr();
    let expected = today;
    let streak = 0;
    for (const d of sorted) {
      if (d === expected) {
        streak++;
        const dt = new Date(d + 'T00:00:00');
        dt.setDate(dt.getDate() - 1);
        expected = dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
      } else if (d < expected) break;
    }
    return streak;
  }

  function ensureStreakHistory() {
    if (!data.meta.streakHistory) {
      data.meta.streakHistory = { fitness: [], english: [], learning: [], spiritual: [] };
    }
  }

  function getCloudVersion() { return cloudUpdatedAt; }
  function getCloudError() { return cloudError; }

  // ========== 数据迁移 ==========

  function hasLegacyData() {
    return !!localStorage.getItem('chayil_ceo_data_v4') ||
           !!localStorage.getItem('chayil_ceo_data_v3');
  }

  function getLegacyData() {
    // 优先 v4，其次 v3
    const v4 = localStorage.getItem('chayil_ceo_data_v4');
    if (v4) {
      try { return JSON.parse(v4); } catch (e) {}
    }
    const v3 = localStorage.getItem('chayil_ceo_data_v3');
    if (v3) {
      try { return JSON.parse(v3); } catch (e) {}
    }
    return null;
  }

  return {
    load, get, update, save,
    addItem, removeItem, updateItem, addItemToList,
    uid, todayStr, yesterdayStr,
    calcStreak, ensureStreakHistory,
    recordLogin, getLoginDays, getLoginStreak, getYesterdaySnapshot,
    pushNow, pullFromCloud,
    getCloudVersion, getCloudError,
    seed, KEY,
    hasLegacyData, getLegacyData,
    deepMerge, mergeArrayById,
    deduplicateAll,
  };
})();
