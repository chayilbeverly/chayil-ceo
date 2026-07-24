/* ============================================
   Chayil CEO OS — Supabase 数据层 v1
   替代 localStorage + GitHub Sync
   提供：认证 / 数据CRUD / 实时轮询
   ============================================ */

const Supa = (function () {
  // ========== 配置（部署前替换为你的 Supabase 项目凭据） ==========
  const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
  const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';

  let client = null;
  let currentUser = null;
  let session = null;

  // ========== 初始化 ==========

  function initClient() {
    if (client) return client;
    if (typeof supabase === 'undefined') {
      console.error('❌ Supabase SDK 未加载');
      return null;
    }
    if (SUPABASE_URL.includes('YOUR_PROJECT_ID')) {
      console.warn('⚠ Supabase 凭据未配置，请在 js/supabase.js 中填入你的项目 URL 和 anon key');
      return null;
    }
    client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
    return client;
  }

  function getClient() {
    return initClient();
  }

  function isConfigured() {
    return !SUPABASE_URL.includes('YOUR_PROJECT_ID');
  }

  // ========== 认证 ==========

  async function signUp(email, password) {
    const sb = getClient();
    if (!sb) throw new Error('Supabase 未配置');
    const { data, error } = await sb.auth.signUp({ email, password });
    if (error) throw error;
    if (data.user) {
      currentUser = data.user;
      session = data.session;
    }
    return data;
  }

  async function signIn(email, password) {
    const sb = getClient();
    if (!sb) throw new Error('Supabase 未配置');
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    currentUser = data.user;
    session = data.session;
    return data;
  }

  async function signOut() {
    const sb = getClient();
    if (!sb) return;
    await sb.auth.signOut();
    currentUser = null;
    session = null;
  }

  async function getSession() {
    const sb = getClient();
    if (!sb) return null;
    const { data } = await sb.auth.getSession();
    if (data.session) {
      currentUser = data.session.user;
      session = data.session;
      return data.session;
    }
    return null;
  }

  function getUser() {
    return currentUser;
  }

  function getUserId() {
    return currentUser ? currentUser.id : null;
  }

  // ========== 应用数据 CRUD（JSONB 存储整个数据对象） ==========

  /**
   * 从 Supabase 加载用户数据
   * 返回 { data, version } 或 null
   */
  async function loadAppData() {
    const sb = getClient();
    const uid = getUserId();
    if (!sb || !uid) return null;

    const { data, error } = await sb
      .from('app_data')
      .select('data, updated_at')
      .eq('user_id', uid)
      .maybeSingle();

    if (error) {
      console.warn('加载云端数据失败:', error.message);
      return null;
    }
    if (!data) return null; // 新用户，无数据

    return {
      data: data.data,
      updatedAt: data.updated_at,
    };
  }

  /**
   * 保存用户数据到 Supabase（UPSERT）
   */
  async function saveAppData(appData) {
    const sb = getClient();
    const uid = getUserId();
    if (!sb || !uid) return false;

    const { error } = await sb
      .from('app_data')
      .upsert({
        user_id: uid,
        data: appData,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    if (error) {
      console.warn('保存云端数据失败:', error.message);
      return false;
    }
    return true;
  }

  /**
   * 检查云端是否有更新的数据（用于轮询）
   * 返回 { data, updatedAt } 如果云端更新，否则 null
   */
  async function checkForUpdates(localVersion) {
    const sb = getClient();
    const uid = getUserId();
    if (!sb || !uid) return null;

    const { data, error } = await sb
      .from('app_data')
      .select('data, updated_at')
      .eq('user_id', uid)
      .maybeSingle();

    if (error || !data) return null;

    // 用 updated_at 比较（ISO 字符串可以直接比较）
    if (!localVersion || data.updated_at > localVersion) {
      return { data: data.data, updatedAt: data.updated_at };
    }
    return null;
  }

  // ========== 轮询管理 ==========

  let pollTimer = null;
  let pollInterval = 5000; // 5 秒
  let onRemoteUpdate = null;

  function startPolling(callback) {
    stopPolling();
    onRemoteUpdate = callback;
    pollTimer = setInterval(async () => {
      if (!getUserId()) return;
      try {
        if (onRemoteUpdate) await onRemoteUpdate();
      } catch (e) { /* 静默 */ }
    }, pollInterval);
    console.log('🔄 Supabase 轮询已启动（每 ' + (pollInterval / 1000) + ' 秒）');
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    onRemoteUpdate = null;
  }

  // ========== 工具 ==========

  function uid() {
    return 'id_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
  }

  function todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  return {
    initClient,
    getClient,
    isConfigured,
    signUp,
    signIn,
    signOut,
    getSession,
    getUser,
    getUserId,
    loadAppData,
    saveAppData,
    checkForUpdates,
    startPolling,
    stopPolling,
    uid,
    todayStr,
  };
})();
