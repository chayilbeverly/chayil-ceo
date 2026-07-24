/* ============================================
   Chayil CEO OS — Cloud Sync v2
   真正的双端实时同步：push前先pull合并、深度合并、
   轮询间隔12s、页面聚焦时立即拉取
   ============================================ */

const Sync = (function () {
  const REPO = 'chayilbeverly/chayil-ceo';
  const DATA_PATH = 'data/chayil-data.json';
  const TOKEN_KEY = 'chayil_gh_token';
  const BRANCH = 'main';
  const POLL_INTERVAL = 12000; // 12 秒轮询

  let status = 'idle'; // idle | pulling | pushing | error | ok
  let lastSyncTime = null;
  let pushDebounceTimer = null;
  let pollTimer = null;
  let onStatusChange = null;
  let onRemoteUpdate = null; // 回调：云端有新数据时通知 App 刷新

  // ========== Token 管理 ==========

  function getToken() {
    return localStorage.getItem(TOKEN_KEY);
  }

  function setToken(t) {
    localStorage.setItem(TOKEN_KEY, t);
  }

  function hasToken() {
    return !!getToken();
  }

  function getStatus() { return status; }
  function getLastSync() { return lastSyncTime; }

  function setStatus(s) {
    status = s;
    if (onStatusChange) onStatusChange(s, lastSyncTime);
  }

  // ========== API 封装 ==========

  async function api(path, method, body) {
    const token = getToken();
    if (!token) throw new Error('NO_TOKEN');
    const opts = {
      method,
      headers: {
        'Authorization': 'token ' + token,
        'Accept': 'application/vnd.github+json',
      },
    };
    if (body) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    const res = await fetch('https://api.github.com' + path, opts);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'HTTP ' + res.status);
    }
    return res.json();
  }

  // ========== 深度合并 ==========

  /**
   * 智能合并两份数据：
   * - 对带 id 的数组：以 id 为键合并，_updated 时间戳大的赢
   * - 对日期字符串数组（streakHistory）：去重合并
   * - 对 topThree：取较新的
   * - 其他字段：取 _syncVersion 高的
   */
  function deepMerge(local, remote) {
    if (!remote) return local;
    if (!local) return remote;

    const result = { ...local };

    // 以版本号高的为基础
    const base = (remote._syncVersion || 0) >= (local._syncVersion || 0) ? remote : local;
    const other = base === remote ? local : remote;

    // --- 合并 id 数组 ---
    const idArrays = [
      'inspirations', 'radar', 'reviews',
    ];

    for (const key of idArrays) {
      result[key] = mergeArrayById(local[key] || [], remote[key] || []);
    }

    // --- tasks ---
    if (local.tasks || remote.tasks) {
      result.tasks = { ...(base.tasks || {}) };
      for (const sub of ['personalGrowth', 'business', 'contentGrowth']) {
        result.tasks[sub] = mergeArrayById(
          (local.tasks && local.tasks[sub]) || [],
          (remote.tasks && remote.tasks[sub]) || []
        );
      }
      // topThree：取较新的
      result.tasks.topThree = base.tasks.topThree || other.tasks.topThree || [];
    }

    // --- finance ---
    if (local.finance || remote.finance) {
      result.finance = { ...(base.finance || {}) };
      result.finance.income = mergeArrayById(
        (local.finance && local.finance.income) || [],
        (remote.finance && remote.finance.income) || []
      );
      result.finance.expense = mergeArrayById(
        (local.finance && local.finance.expense) || [],
        (remote.finance && remote.finance.expense) || []
      );
      result.finance.dailyTarget = base.finance ? base.finance.dailyTarget : (other.finance ? other.finance.dailyTarget : 4000);
    }

    // --- assets ---
    if (local.assets || remote.assets) {
      result.assets = { ...(base.assets || {}) };
      for (const sub of ['customers', 'products', 'deals', 'contentAssets']) {
        result.assets[sub] = mergeArrayById(
          (local.assets && local.assets[sub]) || [],
          (remote.assets && remote.assets[sub]) || []
        );
      }
    }

    // --- meta ---
    if (local.meta || remote.meta) {
      result.meta = { ...(base.meta || {}) };
      result.meta.created = base.meta.created || other.meta.created || '';
      result.meta.streak = Math.max(base.meta.streak || 0, other.meta.streak || 0);
      result.meta.lastStreakDate = base.meta.lastStreakDate || other.meta.lastStreakDate || '';

      // streakHistory：日期数组去重合并
      if (local.meta && local.meta.streakHistory || remote.meta && remote.meta.streakHistory) {
        result.meta.streakHistory = {};
        const keys = ['fitness', 'english', 'learning', 'spiritual'];
        for (const k of keys) {
          const lArr = (local.meta && local.meta.streakHistory && local.meta.streakHistory[k]) || [];
          const rArr = (remote.meta && remote.meta.streakHistory && remote.meta.streakHistory[k]) || [];
          result.meta.streakHistory[k] = [...new Set([...lArr, ...rArr])].sort();
        }
      }

      // personalStreaks：取较大值
      if (local.meta && local.meta.personalStreaks || remote.meta && remote.meta.personalStreaks) {
        result.meta.personalStreaks = {};
        const keys = ['fitness', 'english', 'learning', 'spiritual'];
        for (const k of keys) {
          const lv = (local.meta && local.meta.personalStreaks && local.meta.personalStreaks[k]) || 0;
          const rv = (remote.meta && remote.meta.personalStreaks && remote.meta.personalStreaks[k]) || 0;
          result.meta.personalStreaks[k] = Math.max(lv, rv);
        }
      }
    }

    result._syncVersion = Math.max(local._syncVersion || 0, remote._syncVersion || 0) + 1;
    return result;
  }

  /**
   * 按 id 合并两个数组
   * - 同 id 的两条记录：_updated 时间戳大的赢
   * - 仅一方有的记录：保留
   */
  function mergeArrayById(arrA, arrB) {
    const map = new Map();
    for (const item of arrA) {
      if (item && item.id) map.set(item.id, item);
    }
    for (const item of arrB) {
      if (!item || !item.id) continue;
      const existing = map.get(item.id);
      if (!existing) {
        map.set(item.id, item);
      } else {
        // 两边都有：_updated 时间戳大的赢
        const tsA = existing._updated || 0;
        const tsB = item._updated || 0;
        if (tsB > tsA) map.set(item.id, item);
      }
    }
    return [...map.values()];
  }

  // ========== 拉取 & 推送 ==========

  /** 从 GitHub 拉取最新数据（不解码，返回原始 JSON 对象） */
  async function pullRaw() {
    try {
      const file = await api('/repos/' + REPO + '/contents/' + DATA_PATH + '?ref=' + BRANCH + '&t=' + Date.now(), 'GET');
      const content = atob(file.content);
      const data = JSON.parse(content);
      return { data, sha: file.sha };
    } catch (e) {
      if (e.message === 'NO_TOKEN') throw e;
      if (e.message && e.message.includes('Not Found')) return null; // 文件还不存在
      console.warn('Sync pull failed:', e.message);
      return null;
    }
  }

  /** 拉取并深度合并到本地数据，返回合并后的新数据 */
  function pullAndMerge(localData) {
    return pullRaw().then(result => {
      if (!result) return localData;
      setStatus('pulling');
      lastSyncTime = new Date().toISOString();
      const merged = deepMerge(localData, result.data);
      merged._remoteSHA = result.sha;
      setStatus('ok');
      return merged;
    }).catch(e => {
      if (e.message !== 'NO_TOKEN') setStatus('error');
      return localData;
    });
  }

  /** 推送到 GitHub（先拉取合并，再推送） */
  async function push(data) {
    if (!hasToken()) return false;
    setStatus('pushing');
    try {
      // 1. 先拉取远程最新版本
      let sha = null;
      try {
        const raw = await pullRaw();
        if (raw && raw.data) {
          // 远程有数据，深度合并
          data = deepMerge(data, raw.data);
          sha = raw.sha;
        }
      } catch (e) {
        // 远程文件不存在，sha 保持 null（会创建新文件）
      }

      // 2. 推送合并后的数据
      const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
      const body = {
        message: 'chore: sync app data [' + new Date().toLocaleString('zh-CN') + ']',
        content,
        branch: BRANCH,
      };
      if (sha) body.sha = sha;

      await api('/repos/' + REPO + '/contents/' + DATA_PATH, 'PUT', body);
      lastSyncTime = new Date().toISOString();
      setStatus('ok');
      return true;
    } catch (e) {
      if (e.message !== 'NO_TOKEN') setStatus('error');
      console.warn('Sync push failed:', e.message);
      return false;
    }
  }

  // ========== 防抖推送 & 轮询 ==========

  /** 防抖推送：等 3 秒无新操作后，先拉取合并再推送 */
  function debouncePush(data) {
    clearTimeout(pushDebounceTimer);
    pushDebounceTimer = setTimeout(() => push(data), 3000);
  }

  function pushNow(data) {
    clearTimeout(pushDebounceTimer);
    return push(data);
  }

  /** 启动定时轮询（检查远程是否有新数据） */
  function startPolling(getLocalDataFn) {
    stopPolling();
    pollTimer = setInterval(async () => {
      if (!hasToken()) return;
      try {
        const result = await pullRaw();
        if (result && result.data) {
          const localData = getLocalDataFn();
          const localVer = localData._syncVersion || 0;
          const remoteVer = result.data._syncVersion || 0;
          if (remoteVer > localVer) {
            // 远程有新数据，通知 App 合并
            if (onRemoteUpdate) {
              onRemoteUpdate(result.data);
            }
          }
        }
      } catch (e) { /* 静默 */ }
    }, POLL_INTERVAL);
    console.log('🔄 云端轮询已启动（每 ' + (POLL_INTERVAL / 1000) + ' 秒）');
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  // ========== 初始化 & 事件 ==========

  async function init(getLocalDataFn) {
    if (!hasToken()) return null;
    startPolling(getLocalDataFn);
    return pullRaw();
  }

  function onChange(cb) {
    onStatusChange = cb;
  }

  /** 注册远程更新回调：当轮询发现远程版本更新时触发 */
  function onRemoteUpdateCallback(cb) {
    onRemoteUpdate = cb;
  }

  return {
    init, pullRaw, pullAndMerge, push, pushNow, debouncePush,
    startPolling, stopPolling,
    getToken, setToken, hasToken,
    getStatus, getLastSync, onChange,
    onRemoteUpdateCallback,
    deepMerge, // 暴露给外部使用
  };
})();
