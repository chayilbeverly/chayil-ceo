/* ============================================
   Chayil CEO OS — Data Store v3.2
   基于 localStorage 的数据持久化层 + GitHub 云端实时同步
   新增：_updated 时间戳、saveLocalOnly、mergeRemote
   ============================================ */

const Store = (function () {
  const KEY = 'chayil_ceo_data_v3';

  function todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function uid() {
    return 'id_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
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

  function loadLocal() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        data = JSON.parse(raw);
      } else {
        data = seed();
        saveLocalOnly();
      }
    } catch (e) {
      data = seed();
    }
    return data;
  }

  /**
   * 仅保存到 localStorage，不触发云端推送
   * 用于从云端拉取数据后的本地落盘
   */
  function saveLocalOnly() {
    data._syncVersion = Math.max(data._syncVersion || 0, Date.now());
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function saveLocal() {
    saveLocalOnly();
  }

  // === 云端同步 ===

  async function load() {
    loadLocal();

    // 尝试从云端拉取
    if (typeof Sync !== 'undefined' && Sync.hasToken()) {
      try {
        const result = await Sync.pullRaw();
        if (result && result.data) {
          const localVer = data._syncVersion || 0;
          const remoteVer = result.data._syncVersion || 0;
          if (remoteVer > localVer) {
            // 云端更新，深度合并
            data = Sync.deepMerge(data, result.data);
            saveLocalOnly();
            console.log('📥 已从云端同步数据 (v' + remoteVer + ' > v' + localVer + ')');
          } else if (localVer > remoteVer) {
            // 本地更新，推送上去（合并后推送）
            Sync.debouncePush(data);
            console.log('📤 云端数据较旧，推送本地版本');
          }
        } else if (result === null && data._syncVersion) {
          // 云端没有数据，推送本地
          Sync.debouncePush(data);
        }
      } catch (e) {
        console.warn('云端同步跳过:', e.message);
      }
    }

    // 加载后自动检测并修复乱码
    if (typeof Sync !== 'undefined' && Sync.isGarbled) {
      const garbled = Sync.scanGarbled(data);
      if (garbled > 0) {
        console.warn('⚠ 本地数据检测到 ' + garbled + ' 处乱码，自动修复...');
        const repaired = Sync.repairGarbledData(data);
        console.log('✅ 本地已修复 ' + repaired + ' 处乱码');
        saveLocalOnly();
      }
    }

    return data;
  }

  /**
   * 保存：写入 localStorage + 防抖推送到云端
   * 推送时会先拉取远程数据做深度合并，避免覆盖冲突
   */
  function save() {
    saveLocalOnly();
    if (typeof Sync !== 'undefined' && Sync.hasToken()) {
      Sync.debouncePush(data);
    }
  }

  /**
   * 从远程合并数据到本地（由轮询触发）
   * 只写本地，不触发推送
   */
  function mergeRemote(remoteData) {
    if (!remoteData) return false;
    const localVer = data._syncVersion || 0;
    const remoteVer = remoteData._syncVersion || 0;
    if (remoteVer <= localVer) return false;

    // 修复远程数据中的乱码
    if (typeof Sync !== 'undefined' && Sync.repairGarbledData) {
      Sync.repairGarbledData(remoteData);
    }

    data = Sync.deepMerge(data, remoteData);
    saveLocalOnly();
    console.log('🔄 云端数据已合并到本地 (v' + remoteVer + ')');
    return true;
  }

  // 手动触发立即同步（先拉取合并再推送）
  async function syncNow() {
    if (typeof Sync === 'undefined' || !Sync.hasToken()) return;
    try {
      const merged = await Sync.pullAndMerge(data);
      if (merged) {
        data = merged;
        saveLocalOnly();
      }
      await Sync.pushNow(data);
      console.log('✅ 手动同步完成');
      return true;
    } catch (e) {
      console.warn('手动同步失败:', e.message);
      return false;
    }
  }

  function get() {
    if (!data) loadLocal();
    return data;
  }

  function update(fn) {
    if (!data) loadLocal();
    fn(data);
    save();
  }

  // 计算连续打卡天数（从今天往前数，一旦断掉就停）
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
      } else if (d < expected) {
        break;
      }
    }
    return streak;
  }

  function ensureStreakHistory() {
    if (!data.meta.streakHistory) {
      data.meta.streakHistory = { fitness: [], english: [], learning: [], spiritual: [] };
    }
  }

  // 通用增删改（均带 _updated 时间戳）
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

  return {
    load, get, update, save, saveLocalOnly, mergeRemote, syncNow,
    uid, todayStr, addItem, removeItem, updateItem,
    calcStreak, ensureStreakHistory,
    seed, KEY
  };
})();
