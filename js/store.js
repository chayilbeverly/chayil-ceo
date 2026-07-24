/* ============================================
   Chayil CEO OS — Data Store v3.1
   基于 localStorage 的数据持久化层 + GitHub 云端同步
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

  // 默认种子数据
  function seed() {
    const today = todayStr();
    return {
      _syncVersion: Date.now(),
      meta: {
        created: today,
        streak: 0,
        personalStreaks: { fitness: 0, english: 0, learning: 0, spiritual: 0 },
        lastStreakDate: today,
      },
      tasks: {
        topThree: [],
        personalGrowth: [
          { id: uid(), text: '健身 2小时', done: false, time: '06:30', priority: 'high' },
          { id: uid(), text: '学习 1小时', done: false, time: '09:00', priority: 'high' },
          { id: uid(), text: '英语练习 30分钟', done: false, time: '10:00', priority: 'normal' },
          { id: uid(), text: '灵修 / 读经 30分钟', done: false, time: '07:00', priority: 'high' },
          { id: uid(), text: '阅读 30分钟', done: false, time: '21:00', priority: 'low' },
          { id: uid(), text: '今日感恩记录', done: false, time: '22:00', priority: 'low' },
        ],
        business: [
          { id: uid(), text: '回复客户咨询', done: false, time: '10:30', priority: 'high' },
          { id: uid(), text: '跟进 3 位老客户', done: false, time: '14:00', priority: 'high' },
          { id: uid(), text: '更新商品库存', done: false, time: '16:00', priority: 'normal' },
          { id: uid(), text: '发布朋友圈', done: false, time: '12:00', priority: 'normal' },
        ],
        contentGrowth: [
          { id: uid(), text: '寻找今日爆款', done: false, time: '11:00', priority: 'normal' },
          { id: uid(), text: '分析一个优秀视频', done: false, time: '11:30', priority: 'normal' },
          { id: uid(), text: '发布一条内容', done: false, time: '17:00', priority: 'high' },
          { id: uid(), text: '复盘昨天内容', done: false, time: '18:00', priority: 'normal' },
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
          { id: uid(), name: '张女士', contact: '微信 zhang****', brand: 'Louis Vuitton', time: today, amount: 8800, preference: '实用大包', budget: '8000-15000', frequency: '每月1-2次', note: '偏好中古款，复购意愿强', followUpTime: today },
          { id: uid(), name: '林小姐', contact: '微信 lin****', brand: 'Chanel', time: today, amount: 52000, preference: '经典款', budget: '30000-60000', frequency: '每季度', note: '注重成色与配件齐全', followUpTime: '' },
          { id: uid(), name: '王太太', contact: '电话 138****', brand: 'Hermes', time: '2026-07-20', amount: 98000, preference: '限量款', budget: '80000-200000', frequency: '不定期', note: '高净值客户，推荐稀缺款', followUpTime: '' },
        ],
        products: [
          { id: uid(), brand: 'Louis Vuitton', model: 'Neverfull MM', color: '经典老花', price: 8800, cost: 6500, stock: 3, demand: '高', profit: 2300 },
          { id: uid(), brand: 'Chanel', model: 'Classic Flap 中号', color: '黑金', price: 52000, cost: 38000, stock: 1, demand: '极高', profit: 14000 },
          { id: uid(), brand: 'Hermes', model: 'Birkin 25', color: '金棕', price: 98000, cost: 75000, stock: 1, demand: '极高', profit: 23000 },
          { id: uid(), brand: 'Dior', model: 'Lady Dior 中号', color: '黑色', price: 38000, cost: 28000, stock: 2, demand: '中', profit: 10000 },
        ],
        deals: [
          { id: uid(), need: '通勤大容量包，预算1万内', process: '推荐 LV Neverfull，强调耐用与保值', price: 8800, reason: '客户看重实用+品牌认知，Neverfull 完美匹配' },
          { id: uid(), need: '正式场合经典款，预算5万', process: '对比 Chanel CF 与 CF 中号，黑金配色', price: 52000, reason: '经典款认知度最高，客户一眼心动' },
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
        saveLocal();
      }
    } catch (e) {
      data = seed();
    }
    return data;
  }

  function saveLocal() {
    data._syncVersion = Date.now();
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  // === 云端同步 ===

  async function load() {
    loadLocal();

    // 尝试从云端拉取
    if (typeof Sync !== 'undefined' && Sync.hasToken()) {
      try {
        const remote = await Sync.pull();
        if (remote && remote._syncVersion) {
          // 比较版本：云端更新就用云端的
          const localVer = data._syncVersion || 0;
          const remoteVer = remote._syncVersion || 0;
          if (remoteVer > localVer) {
            data = remote;
            saveLocal();
            console.log('📥 已从云端同步数据 (v' + remoteVer + ' > v' + localVer + ')');
          } else if (localVer > remoteVer) {
            // 本地更新，推送上去
            Sync.debouncePush(data);
            console.log('📤 云端数据较旧，推送本地版本');
          }
        } else if (remote === null && data._syncVersion) {
          // 云端没有数据，推送本地
          Sync.debouncePush(data);
        }
      } catch (e) {
        console.warn('云端同步跳过:', e.message);
      }
    }

    return data;
  }

  function save() {
    saveLocal();
    // 防抖推送到云端
    if (typeof Sync !== 'undefined' && Sync.hasToken()) {
      Sync.debouncePush(data);
    }
  }

  // 手动触发立即同步
  async function syncNow() {
    if (typeof Sync === 'undefined' || !Sync.hasToken()) return;
    // 先拉再推
    try {
      const remote = await Sync.pull();
      if (remote && remote._syncVersion) {
        const localVer = data._syncVersion || 0;
        const remoteVer = remote._syncVersion || 0;
        if (remoteVer > localVer) {
          data = remote;
          saveLocal();
        }
      }
      await Sync.pushNow(data);
      console.log('✅ 手动同步完成');
    } catch (e) {
      console.warn('手动同步失败:', e.message);
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

  // 通用增删改
  function addItem(collection, item, parent) {
    update(d => {
      const arr = parent ? d[parent][collection] : d[collection];
      arr.unshift({ id: uid(), ...item });
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
      if (idx > -1) Object.assign(arr[idx], patch);
    });
  }

  return {
    load, get, update, save, saveLocal, syncNow,
    uid, todayStr, addItem, removeItem, updateItem,
    seed, KEY
  };
})();
