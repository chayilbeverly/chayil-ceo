/* ============================================
   Chayil CEO OS — Data Store v4
   Supabase 云端存储 + localStorage 离线缓存
   支持：多设备实时同步 / 用户隔离 / 离线回退
   ============================================ */

const Store = (function () {
  const KEY = 'chayil_ceo_data_v4';

  function todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function uid() {
    return Supa.uid();
  }

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
          { id: uid(), brand: 'Louis Vuitton', model: 'Neverfull MM', color: '经典老花', price: 8800, cost: 6500, stock: 3, demand: '高', profit: 2300, _updated: ts },
          { id: uid(), brand: 'Chanel', model: 'Classic Flap 中号', color: '黑金', price: 52000, cost: 38000, stock: 1, demand: '极高', profit: 14000, _updated: ts },
          { id: uid(), brand: 'Hermes', model: 'Birkin 25', color: '金棕', price: 98000, cost: 75000, stock: 1, demand: '极高', profit: 23000, _updated: ts },
          { id: uid(), brand: 'Dior', model: 'Lady Dior 中号', color: '黑色', price: 38000, cost: 28000, stock: 2, demand: '中', profit: 10000, _updated: ts },
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
  let cloudVersion = null;    // 云端 updated_at
  let saveDebounceTimer = null;
  let isSaving = false;

  // ========== 本地存储（离线缓存 + 快速启动） ==========

  function loadLocal() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        data = JSON.parse(raw);
        return true;
      }
    } catch (e) { /* fall through */ }
    return false;
  }

  function saveLocal() {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('localStorage 写入失败:', e.message);
    }
  }

  // ========== 云端存储 ==========

  /**
   * 推送数据到 Supabase（防抖 2 秒）
   */
  function scheduleCloudSave() {
    clearTimeout(saveDebounceTimer);
    saveDebounceTimer = setTimeout(async () => {
      if (isSaving) return;
      isSaving = true;
      try {
        data._syncVersion = Date.now();
        const ok = await Supa.saveAppData(data);
        if (ok) {
          cloudVersion = new Date().toISOString();
          saveLocal(); // 同时保存本地
        }
      } catch (e) {
        console.warn('云端保存失败:', e.message);
      } finally {
        isSaving = false;
      }
    }, 2000);
  }

  /**
   * 立即推送到云端
   */
  async function pushNow() {
    clearTimeout(saveDebounceTimer);
    isSaving = true;
    try {
      data._syncVersion = Date.now();
      const ok = await Supa.saveAppData(data);
      if (ok) {
        cloudVersion = new Date().toISOString();
        saveLocal();
      }
      return ok;
    } catch (e) {
      console.warn('云端推送失败:', e.message);
      return false;
    } finally {
      isSaving = false;
    }
  }

  /**
   * 从云端拉取并合并数据
   * 返回 true 表示有新数据合并
   */
  async function pullFromCloud() {
    if (!Supa.getUserId()) return false;

    try {
      const result = await Supa.loadAppData();
      if (!result || !result.data) return false;

      const remoteData = result.data;
      const remoteVer = result.updatedAt;

      // 比较时间戳
      if (cloudVersion && remoteVer <= cloudVersion) return false;

      // 合并：云端数据优先（取 _updated 时间戳大的）
      data = deepMerge(data, remoteData);
      cloudVersion = remoteVer;
      saveLocal();
      return true;
    } catch (e) {
      console.warn('云端拉取失败:', e.message);
      return false;
    }
  }

  /**
   * 深度合并：按 id 合并数组，同 id 取 _updated 大的
   */
  function deepMerge(local, remote) {
    if (!remote) return local;
    if (!local) return remote;

    const result = JSON.parse(JSON.stringify(local));

    // 合并 ID 数组
    const idArrays = ['inspirations', 'radar', 'reviews'];
    idArrays.forEach(key => {
      result[key] = mergeArrayById(local[key] || [], remote[key] || []);
    });

    // 合并 tasks
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

    // 合并 finance
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

    // 合并 assets
    if (remote.assets) {
      result.assets = result.assets || {};
      ['customers', 'products', 'deals', 'contentAssets'].forEach(sub => {
        result.assets[sub] = mergeArrayById(
          (local.assets && local.assets[sub]) || [],
          (remote.assets && remote.assets[sub]) || []
        );
      });
    }

    // 合并 meta
    if (remote.meta) {
      result.meta = result.meta || {};
      result.meta.created = remote.meta.created || (local.meta && local.meta.created) || '';
      result.meta.streak = Math.max((local.meta && local.meta.streak) || 0, remote.meta.streak || 0);
      result.meta.lastStreakDate = remote.meta.lastStreakDate || (local.meta && local.meta.lastStreakDate) || '';

      // streakHistory 取并集
      if (remote.meta.streakHistory) {
        result.meta.streakHistory = result.meta.streakHistory || {};
        ['fitness', 'english', 'learning', 'spiritual'].forEach(hk => {
          const lArr = (local.meta && local.meta.streakHistory && local.meta.streakHistory[hk]) || [];
          const rArr = (remote.meta.streakHistory && remote.meta.streakHistory[hk]) || [];
          result.meta.streakHistory[hk] = Array.from(new Set(lArr.concat(rArr))).sort();
        });
      }

      if (remote.meta.personalStreaks) {
        result.meta.personalStreaks = result.meta.personalStreaks || {};
        ['fitness', 'english', 'learning', 'spiritual'].forEach(pk => {
          result.meta.personalStreaks[pk] = Math.max(
            (local.meta && local.meta.personalStreaks && local.meta.personalStreaks[pk]) || 0,
            remote.meta.personalStreaks[pk] || 0
          );
        });
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
      if (!existing) {
        map.set(item.id, item);
      } else {
        const tsA = existing._updated || 0;
        const tsB = item._updated || 0;
        if (tsB > tsA) map.set(item.id, item);
      }
    });
    return Array.from(map.values());
  }

  // ========== 公开 API（保持与旧版兼容） ==========

  /**
   * 异步加载：本地 → 云端合并
   * 返回 data
   */
  async function load() {
    // 1. 先加载本地缓存（快速渲染）
    const hasLocal = loadLocal();

    if (!hasLocal) {
      // 无本地缓存，尝试从云端加载
      try {
        const result = await Supa.loadAppData();
        if (result && result.data) {
          data = result.data;
          cloudVersion = result.updatedAt;
          saveLocal();
        } else {
          data = seed();
        }
      } catch (e) {
        data = seed();
      }
    } else {
      // 有本地缓存，异步拉取云端合并
      try {
        const result = await Supa.loadAppData();
        if (result && result.data && result.updatedAt) {
          if (!cloudVersion || result.updatedAt > cloudVersion) {
            data = deepMerge(data, result.data);
            cloudVersion = result.updatedAt;
            saveLocal();
          }
        }
      } catch (e) {
        // 离线模式，使用本地数据
        console.log('离线模式，使用本地缓存');
      }
    }

    // 确保 streakHistory
    if (!data.meta) data.meta = {};
    if (!data.meta.streakHistory) {
      data.meta.streakHistory = { fitness: [], english: [], learning: [], spiritual: [] };
    }

    return data;
  }

  /**
   * 同步获取当前数据（所有模块都用这个）
   */
  function get() {
    if (!data) {
      loadLocal();
      if (!data) data = seed();
    }
    return data;
  }

  /**
   * 修改数据 + 自动保存
   */
  function update(fn) {
    if (!data) get();
    fn(data);
    data._syncVersion = Date.now();
    saveLocal();
    scheduleCloudSave();
  }

  /**
   * 保存（本地 + 云端）
   */
  function save() {
    saveLocal();
    scheduleCloudSave();
  }

  /**
   * 通用增删改（均带 _updated 时间戳）
   */
  function addItem(collection, item, parent) {
    update(d => {
      const arr = parent ? d[parent][collection] : d[collection];
      arr.unshift({ id: uid(), _updated: now(), ...item });
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
      if (idx > -1) {
        Object.assign(arr[idx], patch);
        arr[idx]._updated = now();
      }
    });
  }

  // 计算连续打卡天数
  function calcStreak(dates) {
    if (!dates || !dates.length) return 0;
    const sorted = [...new Set(dates)].sort().reverse();
    const today = todayStr();
    let expected = today;
    let streak = 0;
    for (const d of sorted) {
      if (d === expected) {
        streak++;
        const dt = new Date(d);
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

  /**
   * 获取云端版本时间戳（用于同步状态显示）
   */
  function getCloudVersion() {
    return cloudVersion;
  }

  // ========== 数据迁移 ==========

  /**
   * 检测是否有旧版 localStorage 数据（v3 格式）
   */
  function hasLegacyData() {
    return !!localStorage.getItem('chayil_ceo_data_v3');
  }

  /**
   * 获取旧数据
   */
  function getLegacyData() {
    try {
      const raw = localStorage.getItem('chayil_ceo_data_v3');
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  /**
   * 迁移旧数据到当前 Store
   */
  function migrateLegacy(legacyData) {
    if (!legacyData) return;
    data = deepMerge(data, legacyData);
    saveLocal();
    scheduleCloudSave();
  }

  return {
    load,
    get,
    update,
    save,
    addItem,
    removeItem,
    updateItem,
    uid,
    todayStr,
    calcStreak,
    ensureStreakHistory,
    pushNow,
    pullFromCloud,
    getCloudVersion,
    seed,
    KEY,
    hasLegacyData,
    getLegacyData,
    migrateLegacy,
  };
})();
