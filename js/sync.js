/* ============================================
   Chayil CEO OS — Cloud Sync v3
   UTF-8 安全编码 + 乱码数据自动修复 + 实时同步
   ============================================ */

const Sync = (function () {
  const REPO = 'chayilbeverly/chayil-ceo';
  const DATA_PATH = 'data/chayil-data.json';
  const TOKEN_KEY = 'chayil_gh_token';
  const BRANCH = 'main';
  const POLL_INTERVAL = 12000;

  let status = 'idle';
  let lastSyncTime = null;
  let pushDebounceTimer = null;
  let pollTimer = null;
  let onStatusChange = null;
  let onRemoteUpdate = null;

  // ========== UTF-8 安全的 Base64 编码 ==========

  /** 字符串 → UTF-8 字节 → Base64（安全处理中文/emoji/特殊字符） */
  function strToBase64(str) {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    const binStr = Array.from(bytes, function (b) { return String.fromCharCode(b); }).join('');
    return btoa(binStr);
  }

  /** Base64 → UTF-8 字节 → 字符串（安全还原中文/emoji/特殊字符） */
  function base64ToStr(b64) {
    const binStr = atob(b64);
    const len = binStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binStr.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  }

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
      opts.headers['Content-Type'] = 'application/json; charset=utf-8';
      opts.body = JSON.stringify(body);
    }
    const res = await fetch('https://api.github.com' + path, opts);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'HTTP ' + res.status);
    }
    return res.json();
  }

  // ========== 乱码检测 ==========

  /**
   * 检测字符串是否为 UTF-8 双重/多重编码乱码
   * 乱码特征：包含大量 Latin-1 高位字节（0x80-0xFF）但不成有效中文
   * 或者出现 Â/Ã 等典型的错编码前缀字符
   */
  function isGarbled(str) {
    if (!str || typeof str !== 'string') return false;
    // 纯 ASCII 不是乱码
    if (/^[\x00-\x7F\s]*$/.test(str)) return false;
    // 包含正常中文字符（CJK统一表意文字）→ 不是乱码
    if (/[\u4E00-\u9FFF\u3400-\u4DBF]/.test(str)) return false;
    // 检查是否为典型的 UTF-8 错编码特征：
    // Â (U+00C2) 或 Ã (U+00C3) 常出现在双重编码的 UTF-8 中
    if (/[\u00C0-\u00FF]{3,}/.test(str)) return true;
    // 连续出现 è/é/ê/ë (U+00E8-U+00EB) 等字符
    if (/[\u00C0-\u00FF][\u00C0-\u00FF]/.test(str)) return true;
    return false;
  }

  /**
   * 递归扫描对象中的所有字符串字段，检测并标记乱码
   */
  function scanGarbled(obj) {
    let count = 0;
    function scan(o) {
      if (!o || typeof o !== 'object') return;
      if (Array.isArray(o)) {
        o.forEach(function (item) { scan(item); });
        return;
      }
      for (var key in o) {
        if (!o.hasOwnProperty(key)) continue;
        var val = o[key];
        if (typeof val === 'string' && isGarbled(val)) {
          count++;
          o._hasGarbled = true;
        } else if (typeof val === 'object') {
          scan(val);
        }
      }
    }
    scan(obj);
    return count;
  }

  /**
   * 递归修复对象中的乱码字段
   * 尝试将 Latin-1 错编码的 UTF-8 字节还原为正确的 UTF-8 字符串
   */
  function repairGarbledData(obj) {
    var repaired = 0;

    function repair(o) {
      if (!o || typeof o !== 'object') return;
      if (Array.isArray(o)) {
        o.forEach(function (item) { repair(item); });
        return;
      }
      for (var key in o) {
        if (!o.hasOwnProperty(key)) continue;
        var val = o[key];
        if (typeof val === 'string' && isGarbled(val)) {
          try {
            // 尝试修复：将每个字符的 charCode 当作 UTF-8 字节重新解码
            var bytes = new Uint8Array(val.length);
            for (var i = 0; i < val.length; i++) {
              bytes[i] = val.charCodeAt(i) & 0xFF;
            }
            var fixed = new TextDecoder('utf-8').decode(bytes);
            // 验证修复结果：应包含正常中文
            if (/[\u4E00-\u9FFF]/.test(fixed)) {
              o[key] = fixed;
              repaired++;
            }
          } catch (e) { /* 无法修复则保留原值 */ }
        } else if (typeof val === 'object') {
          repair(val);
        }
      }
      // 清除标记
      delete o._hasGarbled;
    }

    repair(obj);
    return repaired;
  }

  // ========== 深度合并 ==========

  function deepMerge(local, remote) {
    if (!remote) return local;
    if (!local) return remote;

    var result = JSON.parse(JSON.stringify(local));
    var base = (remote._syncVersion || 0) >= (local._syncVersion || 0) ? remote : local;
    var other = base === remote ? local : remote;

    var idArrays = ['inspirations', 'radar', 'reviews'];

    for (var i = 0; i < idArrays.length; i++) {
      var key = idArrays[i];
      result[key] = mergeArrayById(local[key] || [], remote[key] || []);
    }

    if (local.tasks || remote.tasks) {
      result.tasks = JSON.parse(JSON.stringify(base.tasks || {}));
      var taskSubs = ['personalGrowth', 'business', 'contentGrowth'];
      for (var ti = 0; ti < taskSubs.length; ti++) {
        var sub = taskSubs[ti];
        result.tasks[sub] = mergeArrayById(
          (local.tasks && local.tasks[sub]) || [],
          (remote.tasks && remote.tasks[sub]) || []
        );
      }
      result.tasks.topThree = base.tasks.topThree || other.tasks.topThree || [];
    }

    if (local.finance || remote.finance) {
      result.finance = JSON.parse(JSON.stringify(base.finance || {}));
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

    if (local.assets || remote.assets) {
      result.assets = JSON.parse(JSON.stringify(base.assets || {}));
      var assetSubs = ['customers', 'products', 'deals', 'contentAssets'];
      for (var ai = 0; ai < assetSubs.length; ai++) {
        var asub = assetSubs[ai];
        result.assets[asub] = mergeArrayById(
          (local.assets && local.assets[asub]) || [],
          (remote.assets && remote.assets[asub]) || []
        );
      }
    }

    if (local.meta || remote.meta) {
      result.meta = JSON.parse(JSON.stringify(base.meta || {}));
      result.meta.created = base.meta.created || other.meta.created || '';
      result.meta.streak = Math.max(base.meta.streak || 0, other.meta.streak || 0);
      result.meta.lastStreakDate = base.meta.lastStreakDate || other.meta.lastStreakDate || '';

      if ((local.meta && local.meta.streakHistory) || (remote.meta && remote.meta.streakHistory)) {
        result.meta.streakHistory = {};
        var histKeys = ['fitness', 'english', 'learning', 'spiritual'];
        for (var hi = 0; hi < histKeys.length; hi++) {
          var hk = histKeys[hi];
          var lArr = (local.meta && local.meta.streakHistory && local.meta.streakHistory[hk]) || [];
          var rArr = (remote.meta && remote.meta.streakHistory && remote.meta.streakHistory[hk]) || [];
          result.meta.streakHistory[hk] = Array.from(new Set(lArr.concat(rArr))).sort();
        }
      }

      if ((local.meta && local.meta.personalStreaks) || (remote.meta && remote.meta.personalStreaks)) {
        result.meta.personalStreaks = {};
        var psKeys = ['fitness', 'english', 'learning', 'spiritual'];
        for (var pi = 0; pi < psKeys.length; pi++) {
          var pk = psKeys[pi];
          var lv = (local.meta && local.meta.personalStreaks && local.meta.personalStreaks[pk]) || 0;
          var rv = (remote.meta && remote.meta.personalStreaks && remote.meta.personalStreaks[pk]) || 0;
          result.meta.personalStreaks[pk] = Math.max(lv, rv);
        }
      }
    }

    result._syncVersion = Math.max(local._syncVersion || 0, remote._syncVersion || 0) + 1;
    return result;
  }

  function mergeArrayById(arrA, arrB) {
    var map = new Map();
    for (var i = 0; i < arrA.length; i++) {
      var item = arrA[i];
      if (item && item.id) {
        // 跳过乱码条目（让干净版本优先）
        var hasGarbled = false;
        for (var k in item) {
          if (typeof item[k] === 'string' && isGarbled(item[k])) {
            hasGarbled = true;
            break;
          }
        }
        if (!hasGarbled) map.set(item.id, item);
      }
    }
    for (var j = 0; j < arrB.length; j++) {
      var itemB = arrB[j];
      if (!itemB || !itemB.id) continue;
      // 检查当前条目是否乱码
      var bGarbled = false;
      for (var bk in itemB) {
        if (typeof itemB[bk] === 'string' && isGarbled(itemB[bk])) {
          bGarbled = true;
          break;
        }
      }
      if (bGarbled) continue; // 跳过乱码条目

      var existing = map.get(itemB.id);
      if (!existing) {
        map.set(itemB.id, itemB);
      } else {
        var tsA = existing._updated || 0;
        var tsB = itemB._updated || 0;
        if (tsB > tsA) map.set(itemB.id, itemB);
      }
    }
    return Array.from(map.values());
  }

  // ========== 拉取 & 推送 ==========

  async function pullRaw() {
    try {
      var file = await api('/repos/' + REPO + '/contents/' + DATA_PATH + '?ref=' + BRANCH + '&t=' + Date.now(), 'GET');
      // 使用 UTF-8 安全的 base64 解码
      var content = base64ToStr(file.content);
      var data = JSON.parse(content);

      // 检测并修复乱码
      var garbledCount = scanGarbled(data);
      if (garbledCount > 0) {
        console.warn('⚠ 检测到 ' + garbledCount + ' 处乱码，尝试自动修复...');
        var repaired = repairGarbledData(data);
        console.log('✅ 已修复 ' + repaired + ' 处乱码');
      }

      return { data: data, sha: file.sha };
    } catch (e) {
      if (e.message === 'NO_TOKEN') throw e;
      if (e.message && e.message.indexOf('Not Found') > -1) return null;
      console.warn('Sync pull failed:', e.message);
      return null;
    }
  }

  function pullAndMerge(localData) {
    return pullRaw().then(function (result) {
      if (!result) return localData;
      setStatus('pulling');
      lastSyncTime = new Date().toISOString();
      var merged = deepMerge(localData, result.data);
      merged._remoteSHA = result.sha;
      setStatus('ok');
      return merged;
    }).catch(function (e) {
      if (e.message !== 'NO_TOKEN') setStatus('error');
      return localData;
    });
  }

  async function push(data) {
    if (!hasToken()) return false;
    setStatus('pushing');
    try {
      var sha = null;
      try {
        var raw = await pullRaw();
        if (raw && raw.data) {
          data = deepMerge(data, raw.data);
          sha = raw.sha;
        }
      } catch (e) { /* 远程文件不存在 */ }

      // 推送前本地再修复一次乱码
      repairGarbledData(data);

      // 使用 UTF-8 安全的 base64 编码
      var content = strToBase64(JSON.stringify(data, null, 2));
      var body = {
        message: 'chore: sync app data [' + new Date().toLocaleString('zh-CN') + ']',
        content: content,
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

  function debouncePush(data) {
    clearTimeout(pushDebounceTimer);
    pushDebounceTimer = setTimeout(function () { push(data); }, 3000);
  }

  function pushNow(data) {
    clearTimeout(pushDebounceTimer);
    return push(data);
  }

  function startPolling(getLocalDataFn) {
    stopPolling();
    pollTimer = setInterval(async function () {
      if (!hasToken()) return;
      try {
        var result = await pullRaw();
        if (result && result.data) {
          var localData = getLocalDataFn();
          var localVer = localData._syncVersion || 0;
          var remoteVer = result.data._syncVersion || 0;
          if (remoteVer > localVer) {
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

  function onRemoteUpdateCallback(cb) {
    onRemoteUpdate = cb;
  }

  return {
    init: init,
    pullRaw: pullRaw,
    pullAndMerge: pullAndMerge,
    push: push,
    pushNow: pushNow,
    debouncePush: debouncePush,
    startPolling: startPolling,
    stopPolling: stopPolling,
    getToken: getToken,
    setToken: setToken,
    hasToken: hasToken,
    getStatus: getStatus,
    getLastSync: getLastSync,
    onChange: onChange,
    onRemoteUpdateCallback: onRemoteUpdateCallback,
    deepMerge: deepMerge,
    isGarbled: isGarbled,
    scanGarbled: scanGarbled,
    repairGarbledData: repairGarbledData,
    strToBase64: strToBase64,
    base64ToStr: base64ToStr
  };
})();
