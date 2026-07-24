/* ============================================
   Chayil CEO OS — Data Store
   基于 localStorage 的数据持久化层
   ============================================ */

const Store = (function () {
  const KEY = 'chayil_ceo_data_v2';

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
      meta: { created: today, streak: 3 },
      tasks: {
        personalGrowth: [
          { id: uid(), text: '健身 2小时', done: true, time: '06:30' },
          { id: uid(), text: '学习 1小时', done: true, time: '09:00' },
          { id: uid(), text: '英语练习 30分钟', done: false, time: '10:00' },
          { id: uid(), text: '灵修 / 读经 30分钟', done: false, time: '07:00' },
          { id: uid(), text: '阅读 30分钟', done: false, time: '21:00' },
          { id: uid(), text: '今日感恩记录', done: false, time: '22:00' },
        ],
        business: [
          { id: uid(), text: '回复客户咨询', done: true, time: '10:30' },
          { id: uid(), text: '跟进 3 位老客户', done: true, time: '14:00' },
          { id: uid(), text: '更新商品库存', done: false, time: '16:00' },
          { id: uid(), text: '上传新品资料', done: false, time: '16:30' },
          { id: uid(), text: '发布朋友圈', done: false, time: '12:00' },
        ],
        contentGrowth: [
          { id: uid(), text: '寻找今日爆款', done: true, time: '11:00' },
          { id: uid(), text: '分析一个优秀视频', done: false, time: '11:30' },
          { id: uid(), text: '发布一条内容', done: false, time: '17:00' },
          { id: uid(), text: '复盘昨天内容', done: false, time: '18:00' },
        ],
      },
      inspirations: [],
      radar: [],
      reviews: [],
      finance: {
        income: [],
        expense: [],
      },
      assets: {
        customers: [
          { id: uid(), name: '张女士', contact: '微信 zhang****', brand: 'Louis Vuitton', time: '2026-07-24', amount: 8800, preference: '实用大包', budget: '8000-15000', frequency: '每月1-2次', note: '偏好中古款，复购意愿强' },
          { id: uid(), name: '林小姐', contact: '微信 lin****', brand: 'Chanel', time: '2026-07-24', amount: 52000, preference: '经典款', budget: '30000-60000', frequency: '每季度', note: '注重成色与配件齐全' },
          { id: uid(), name: '王太太', contact: '电话 138****', brand: 'Hermes', time: '2026-07-20', amount: 98000, preference: '限量款', budget: '80000-200000', frequency: '不定期', note: '高净值客户，推荐稀缺款' },
        ],
        products: [
          { id: uid(), brand: 'Louis Vuitton', model: 'Neverfull MM', color: '经典老花', price: 8800, stock: 3, demand: '高' },
          { id: uid(), brand: 'Chanel', model: 'Classic Flap 中号', color: '黑金', price: 52000, stock: 1, demand: '极高' },
          { id: uid(), brand: 'Hermes', model: 'Birkin 25', color: '金棕', price: 98000, stock: 1, demand: '极高' },
          { id: uid(), brand: 'Dior', model: 'Lady Dior 中号', color: '黑色', price: 38000, stock: 2, demand: '中' },
        ],
        deals: [
          { id: uid(), need: '通勤大容量包，预算1万内', process: '推荐 LV Neverfull，强调耐用与保值', price: 8800, reason: '客户看重实用+品牌认知，Neverfull 完美匹配' },
          { id: uid(), need: '正式场合经典款，预算5万', process: '对比 Chanel CF 与 CF 中号，黑金配色', price: 52000, reason: '经典款认知度最高，客户一眼心动' },
        ],
      },
    };
  }

  let data = null;

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        data = JSON.parse(raw);
      } else {
        data = seed();
        save();
      }
    } catch (e) {
      data = seed();
    }
    return data;
  }

  function save() {
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function get() {
    if (!data) load();
    return data;
  }

  function update(fn) {
    if (!data) load();
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
    load, get, update, save, uid, todayStr,
    addItem, removeItem, updateItem,
    seed, KEY
  };
})();
