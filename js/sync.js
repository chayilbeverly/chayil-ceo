/* ============================================
   Chayil CEO OS — Cloud Sync v1
   通过 GitHub API 将数据同步到仓库，实现多设备共享
   ============================================ */

const Sync = (function () {
  const REPO = 'chayilbeverly/chayil-ceo';
  const DATA_PATH = 'data/chayil-data.json';
  const TOKEN_KEY = 'chayil_gh_token';
  const BRANCH = 'main';

  let status = 'idle'; // idle | pulling | pushing | error | ok
  let lastSyncTime = null;
  let debounceTimer = null;
  let onStatusChange = null;

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

  async function pull() {
    if (!hasToken()) return null;
    setStatus('pulling');
    try {
      const file = await api('/repos/' + REPO + '/contents/' + DATA_PATH + '?ref=' + BRANCH, 'GET');
      const content = atob(file.content);
      const data = JSON.parse(content);
      lastSyncTime = new Date().toISOString();
      setStatus('ok');
      return data;
    } catch (e) {
      if (e.message === 'NO_TOKEN') { setStatus('idle'); return null; }
      if (e.message && e.message.includes('Not Found')) {
        // 文件还不存在，创建初始版本
        setStatus('ok');
        return null;
      }
      setStatus('error');
      console.warn('Sync pull failed:', e.message);
      return null;
    }
  }

  async function push(data) {
    if (!hasToken()) return;
    setStatus('pushing');
    try {
      // 获取当前文件 SHA（如果存在）
      let sha = null;
      try {
        const existing = await api('/repos/' + REPO + '/contents/' + DATA_PATH + '?ref=' + BRANCH, 'GET');
        sha = existing.sha;
      } catch (e) { /* 文件不存在，正常 */ }

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
    } catch (e) {
      if (e.message !== 'NO_TOKEN') setStatus('error');
      console.warn('Sync push failed:', e.message);
    }
  }

  // 防抖推送：等 3 秒无新操作后再推
  function debouncePush(data) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => push(data), 3000);
  }

  function pushNow(data) {
    clearTimeout(debounceTimer);
    return push(data);
  }

  async function init() {
    const remote = await pull();
    return remote;
  }

  function onChange(cb) {
    onStatusChange = cb;
  }

  return {
    init, pull, push, pushNow, debouncePush,
    getToken, setToken, hasToken,
    getStatus, getLastSync, onChange,
  };
})();
