/* ============================================
   Chayil CEO OS — Supabase 数据层 v2
   分离表架构：tasks / customers / finance / contents + app_meta
   认证 / CRUD / 轮询 / 数据迁移
   ============================================ */

const Supa = (function () {
  // ========== 配置 ==========
  const SUPABASE_URL = 'https://sbujvbzqrnqfrtfeggk.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNidWp2amJ6cXJucWZydGZlZ2drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ4NzMzOTcsImV4cCI6MjEwMDQ0OTM5N30.Ut5We6VJ-MnNA1iH-w5bW7hhkj5TfuO6J2ThrK41hk0';

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
    if (SUPABASE_ANON_KEY === 'YOUR_PUBLISHABLE_KEY') {
      console.warn('⚠ Supabase anon key 未配置，请在 js/supabase.js 中填入');
      return null;
    }
    client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
    console.log('✅ Supabase 已连接:', SUPABASE_URL);
    return client;
  }

  function getClient() { return initClient(); }
  function isConfigured() { return SUPABASE_ANON_KEY !== 'YOUR_PUBLISHABLE_KEY'; }
  function _getUrl() { return SUPABASE_URL; }
  function _getKey() { return SUPABASE_ANON_KEY; }

  // ========== 认证 ==========

  async function signUp(email, password) {
    const sb = getClient();
    if (!sb) throw new Error('Supabase 未配置');

    try {
      const { data, error } = await sb.auth.signUp({ email, password });
      if (error) {
        // Supabase 业务错误（如邮箱已注册、注册关闭等）
        console.error('[signUp] Supabase 拒绝:', error);
        throw new Error(error.message || error.status || '注册请求被拒绝');
      }
      if (data.user) { currentUser = data.user; session = data.session; }
      return data;
    } catch (e) {
      // 区分网络错误 vs 业务错误
      console.error('[signUp] 完整异常:', e);
      if (e.message && e.message.indexOf('Failed to fetch') === -1) {
        // 已有具体消息，直接抛出
        throw e;
      }
      // 网络异常：尝试诊断
      var detail = '网络请求失败（' + SUPABASE_URL + '/auth/v1/signup）';
      if (e.name) detail += ' | name=' + e.name;
      if (e.cause) detail += ' | cause=' + JSON.stringify(e.cause);
      throw new Error(detail);
    }
  }

  async function signIn(email, password) {
    const sb = getClient();
    if (!sb) throw new Error('Supabase 未配置');
    try {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('[signIn] Supabase 拒绝:', error);
        throw new Error(error.message || '登录失败');
      }
      currentUser = data.user;
      session = data.session;
      return data;
    } catch (e) {
      console.error('[signIn] 完整异常:', e);
      throw e;
    }
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

  function getUser() { return currentUser; }
  function getUserId() { return currentUser ? currentUser.id : null; }

  // ========== 工具 ==========

  function uid() { return 'id_' + Date.now() + '_' + Math.floor(Math.random() * 10000); }
  function todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  // ============================================
  //  分离表 CRUD（tasks / customers / finance / contents）
  // ============================================

  // --- tasks ---

  async function loadTasks() {
    const sb = getClient();
    const uid = getUserId();
    if (!sb || !uid) return [];
    const { data, error } = await sb.from('tasks').select('*').eq('user_id', uid).order('created_at', { ascending: true });
    if (error) { console.warn('加载 tasks 失败:', error.message); return []; }
    return (data || []).map(rowToTask);
  }

  async function saveTasks(tasks) {
    const sb = getClient();
    const uid = getUserId();
    if (!sb || !uid || !tasks) return false;
    const rows = tasks.map(taskToRow);
    // 分批 UPSERT（每批最多 50 条）
    for (let i = 0; i < rows.length; i += 50) {
      const batch = rows.slice(i, i + 50);
      const { error } = await sb.from('tasks').upsert(batch, { onConflict: 'local_id' });
      if (error) { console.warn('保存 tasks 失败:', error.message); return false; }
    }
    return true;
  }

  async function deleteTask(localId) {
    const sb = getClient();
    const uid = getUserId();
    if (!sb || !uid) return false;
    const { error } = await sb.from('tasks').delete().eq('user_id', uid).eq('local_id', localId);
    if (error) { console.warn('删除 task 失败:', error.message); return false; }
    return true;
  }

  async function deleteTasksNotIn(localIds) {
    const sb = getClient();
    const uid = getUserId();
    if (!sb || !uid || !localIds.length) return false;
    // 先获取云端所有 task
    const { data } = await sb.from('tasks').select('local_id').eq('user_id', uid);
    const cloudIds = (data || []).map(r => r.local_id);
    const toDelete = cloudIds.filter(id => !localIds.includes(id));
    if (!toDelete.length) return true;
    for (let i = 0; i < toDelete.length; i += 50) {
      const batch = toDelete.slice(i, i + 50);
      await sb.from('tasks').delete().eq('user_id', uid).in('local_id', batch);
    }
    return true;
  }

  function taskToRow(t) {
    return {
      user_id: getUserId(),
      local_id: t.id,
      title: t.text || t.title || '',
      category: t._cat || 'personalGrowth',
      priority: t.priority || 'normal',
      completed: t.done || false,
      scheduled_time: t.time || '',
      updated_at: new Date(t._updated || Date.now()).toISOString(),
    };
  }

  function rowToTask(r) {
    return {
      id: r.local_id,
      text: r.title,
      done: r.completed,
      time: r.scheduled_time || '',
      priority: r.priority || 'normal',
      _cat: r.category || 'personalGrowth',
      _updated: new Date(r.updated_at).getTime(),
    };
  }

  // --- customers ---

  async function loadCustomers() {
    const sb = getClient();
    const uid = getUserId();
    if (!sb || !uid) return [];
    const { data, error } = await sb.from('customers').select('*').eq('user_id', uid).order('created_at', { ascending: true });
    if (error) { console.warn('加载 customers 失败:', error.message); return []; }
    return (data || []).map(rowToCustomer);
  }

  async function saveCustomers(customers) {
    const sb = getClient();
    const uid = getUserId();
    if (!sb || !uid || !customers) return false;
    const rows = customers.map(customerToRow);
    for (let i = 0; i < rows.length; i += 50) {
      const batch = rows.slice(i, i + 50);
      const { error } = await sb.from('customers').upsert(batch, { onConflict: 'local_id' });
      if (error) { console.warn('保存 customers 失败:', error.message); return false; }
    }
    // 清理已删除的
    const localIds = customers.map(c => c.id);
    await deleteFromTable('customers', localIds);
    return true;
  }

  function customerToRow(c) {
    return {
      user_id: getUserId(),
      local_id: c.id,
      name: c.name || '',
      contact: c.contact || '',
      brand: c.brand || '',
      amount: c.amount || 0,
      preference: c.preference || '',
      budget: c.budget || '',
      frequency: c.frequency || '',
      note: c.note || '',
      follow_up_time: c.followUpTime || '',
      updated_at: new Date(c._updated || Date.now()).toISOString(),
    };
  }

  function rowToCustomer(r) {
    return {
      id: r.local_id,
      name: r.name,
      contact: r.contact,
      brand: r.brand,
      amount: r.amount,
      preference: r.preference,
      budget: r.budget,
      frequency: r.frequency,
      note: r.note,
      followUpTime: r.follow_up_time,
      _updated: new Date(r.updated_at).getTime(),
    };
  }

  // --- finance ---

  async function loadFinance() {
    const sb = getClient();
    const uid = getUserId();
    if (!sb || !uid) return { income: [], expense: [] };
    const { data, error } = await sb.from('finance').select('*').eq('user_id', uid).order('date', { ascending: false });
    if (error) { console.warn('加载 finance 失败:', error.message); return { income: [], expense: [] }; }
    const income = [];
    const expense = [];
    (data || []).forEach(r => {
      const item = rowToFinance(r);
      if (r.type === 'income') income.push(item);
      else expense.push(item);
    });
    return { income, expense };
  }

  async function saveFinance(financeData) {
    const sb = getClient();
    const uid = getUserId();
    if (!sb || !uid) return false;
    const rows = [];
    (financeData.income || []).forEach(f => rows.push(financeToRow(f, 'income')));
    (financeData.expense || []).forEach(f => rows.push(financeToRow(f, 'expense')));
    for (let i = 0; i < rows.length; i += 50) {
      const batch = rows.slice(i, i + 50);
      const { error } = await sb.from('finance').upsert(batch, { onConflict: 'local_id' });
      if (error) { console.warn('保存 finance 失败:', error.message); return false; }
    }
    const allIds = rows.map(r => r.local_id);
    await deleteFromTable('finance', allIds);
    return true;
  }

  function financeToRow(f, type) {
    return {
      user_id: getUserId(),
      local_id: f.id,
      type: type,
      date: f.date || todayStr(),
      amount: f.amount || 0,
      category: f.category || '',
      remark: f.remark || f.note || f.desc || '',
      updated_at: new Date(f._updated || Date.now()).toISOString(),
    };
  }

  function rowToFinance(r) {
    return {
      id: r.local_id,
      date: r.date,
      amount: r.amount,
      category: r.category || '',
      remark: r.remark || '',
      _updated: new Date(r.updated_at).getTime(),
    };
  }

  // --- contents (内容复盘) ---

  async function loadContents() {
    const sb = getClient();
    const uid = getUserId();
    if (!sb || !uid) return [];
    const { data, error } = await sb.from('contents').select('*').eq('user_id', uid).order('publish_time', { ascending: false });
    if (error) { console.warn('加载 contents 失败:', error.message); return []; }
    return (data || []).map(rowToContent);
  }

  async function saveContents(contents) {
    const sb = getClient();
    const uid = getUserId();
    if (!sb || !uid || !contents) return false;
    const rows = contents.map(contentToRow);
    for (let i = 0; i < rows.length; i += 50) {
      const batch = rows.slice(i, i + 50);
      const { error } = await sb.from('contents').upsert(batch, { onConflict: 'local_id' });
      if (error) { console.warn('保存 contents 失败:', error.message); return false; }
    }
    const localIds = contents.map(c => c.id);
    await deleteFromTable('contents', localIds);
    return true;
  }

  function contentToRow(c) {
    return {
      user_id: getUserId(),
      local_id: c.id,
      title: c.title || '',
      platform: c.platform || '',
      publish_time: c.publishTime || c.publish_time || '',
      views: c.views || 0,
      likes: c.likes || 0,
      saves: c.saves || 0,
      comments: c.comments || 0,
      followers: c.followers || 0,
      revenue: c.revenue || 0,
      review: c.review || '',
      updated_at: new Date(c._updated || Date.now()).toISOString(),
    };
  }

  function rowToContent(r) {
    return {
      id: r.local_id,
      title: r.title,
      platform: r.platform,
      publishTime: r.publish_time,
      views: r.views,
      likes: r.likes,
      saves: r.saves,
      comments: r.comments,
      followers: r.followers,
      revenue: r.revenue,
      review: r.review,
      _updated: new Date(r.updated_at).getTime(),
    };
  }

  // --- app_meta（灵感中心 / 爆款雷达 / 产品 / 交易 / 打卡 / 设置） ---

  async function loadMeta() {
    const sb = getClient();
    const uid = getUserId();
    if (!sb || !uid) return null;
    const { data, error } = await sb.from('app_meta').select('data').eq('user_id', uid).maybeSingle();
    if (error || !data) return null;
    return data.data;
  }

  async function saveMeta(metaData) {
    const sb = getClient();
    const uid = getUserId();
    if (!sb || !uid) return false;
    const { error } = await sb.from('app_meta').upsert({
      user_id: uid,
      data: metaData,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    if (error) { console.warn('保存 meta 失败:', error.message); return false; }
    return true;
  }

  // --- 通用删除辅助 ---

  async function deleteFromTable(table, localIds) {
    const sb = getClient();
    const uid = getUserId();
    if (!sb || !uid || !localIds.length) return;
    const { data } = await sb.from(table).select('local_id').eq('user_id', uid);
    const cloudIds = (data || []).map(r => r.local_id);
    const toDelete = cloudIds.filter(id => !localIds.includes(id));
    if (!toDelete.length) return;
    for (let i = 0; i < toDelete.length; i += 50) {
      await sb.from(table).delete().eq('user_id', uid).in('local_id', toDelete.slice(i, i + 50));
    }
  }

  // ========== 批量推送（App 层统一调用） ==========

  /**
   * 将内存中的完整数据推送到 Supabase 所有表
   */
  async function pushAllData(appData) {
    const uid = getUserId();
    if (!uid) return false;

    try {
      // 1. 任务
      const allTasks = [];
      if (appData.tasks) {
        ['personalGrowth', 'business', 'contentGrowth'].forEach(cat => {
          (appData.tasks[cat] || []).forEach(t => {
            allTasks.push({ ...t, _cat: cat });
          });
        });
      }
      await saveTasks(allTasks);

      // 2. 客户
      const customers = (appData.assets && appData.assets.customers) || [];
      await saveCustomers(customers);

      // 3. 财务
      const finance = appData.finance || { income: [], expense: [] };
      await saveFinance(finance);

      // 4. 内容复盘
      const contents = appData.reviews || [];
      await saveContents(contents);

      // 5. 元数据（灵感、雷达、产品、交易、打卡等）
      const meta = {
        meta: appData.meta || {},
        inspirations: appData.inspirations || [],
        radar: appData.radar || [],
        products: (appData.assets && appData.assets.products) || [],
        deals: (appData.assets && appData.assets.deals) || [],
        contentAssets: (appData.assets && appData.assets.contentAssets) || [],
        dailyTarget: (appData.finance && appData.finance.dailyTarget) || 4000,
        tasksTopThree: (appData.tasks && appData.tasks.topThree) || [],
      };
      await saveMeta(meta);

      return true;
    } catch (e) {
      console.warn('批量推送失败:', e.message);
      return false;
    }
  }

  /**
   * 从 Supabase 所有表拉取数据并组装成完整内存结构
   */
  async function pullAllData(baseData) {
    const uid = getUserId();
    if (!uid) return null;

    try {
      // 并行拉取所有表
      const [tasks, customers, finance, contents, meta] = await Promise.all([
        loadTasks(),
        loadCustomers(),
        loadFinance(),
        loadContents(),
        loadMeta(),
      ]);

      // 组装任务
      const tasksGrouped = { topThree: [], personalGrowth: [], business: [], contentGrowth: [] };
      tasks.forEach(t => {
        const cat = t._cat || 'personalGrowth';
        if (tasksGrouped[cat]) tasksGrouped[cat].push(t);
        else tasksGrouped.personalGrowth.push(t);
      });
      if (meta && meta.tasksTopThree) tasksGrouped.topThree = meta.tasksTopThree;

      // 组装资产
      const assets = {
        customers: customers,
        products: (meta && meta.products) || [],
        deals: (meta && meta.deals) || [],
        contentAssets: (meta && meta.contentAssets) || [],
      };

      // 组装完整数据
      const result = {
        _syncVersion: Date.now(),
        meta: (meta && meta.meta) || baseData.meta || { streakHistory: { fitness: [], english: [], learning: [], spiritual: [] } },
        tasks: tasksGrouped,
        inspirations: (meta && meta.inspirations) || baseData.inspirations || [],
        radar: (meta && meta.radar) || baseData.radar || [],
        reviews: contents,
        finance: {
          dailyTarget: (meta && meta.dailyTarget) || 4000,
          income: finance.income || [],
          expense: finance.expense || [],
        },
        assets: assets,
      };

      return result;
    } catch (e) {
      console.warn('批量拉取失败:', e.message);
      return null;
    }
  }

  // ========== 数据迁移 ==========

  /**
   * 将旧版 JSON blob 数据导入新的分离表
   */
  async function migrateFromBlob(oldData) {
    if (!oldData) return { success: false, message: '无数据' };
    if (!getUserId()) return { success: false, message: '未登录' };

    try {
      // 提取并保存 tasks
      const allTasks = [];
      if (oldData.tasks) {
        ['personalGrowth', 'business', 'contentGrowth'].forEach(cat => {
          (oldData.tasks[cat] || []).forEach(t => {
            allTasks.push({ ...t, _cat: cat });
          });
        });
      }
      if (allTasks.length) await saveTasks(allTasks);

      // 提取并保存 customers
      const customers = (oldData.assets && oldData.assets.customers) || [];
      if (customers.length) await saveCustomers(customers);

      // 提取并保存 finance
      const finance = oldData.finance || { income: [], expense: [] };
      if ((finance.income || []).length || (finance.expense || []).length) await saveFinance(finance);

      // 提取并保存 contents
      const contents = oldData.reviews || [];
      if (contents.length) await saveContents(contents);

      // 保存 meta
      const meta = {
        meta: oldData.meta || {},
        inspirations: oldData.inspirations || [],
        radar: oldData.radar || [],
        products: (oldData.assets && oldData.assets.products) || [],
        deals: (oldData.assets && oldData.assets.deals) || [],
        contentAssets: (oldData.assets && oldData.assets.contentAssets) || [],
        dailyTarget: (oldData.finance && oldData.finance.dailyTarget) || 4000,
        tasksTopThree: (oldData.tasks && oldData.tasks.topThree) || [],
      };
      await saveMeta(meta);

      return { success: true, message: `已迁移 ${allTasks.length} 任务, ${customers.length} 客户, ${(finance.income||[]).length + (finance.expense||[]).length} 财务记录, ${contents.length} 内容` };
    } catch (e) {
      return { success: false, message: '迁移失败: ' + e.message };
    }
  }

  // ========== 轮询管理 ==========

  let pollTimer = null;
  let pollInterval = 5000;
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
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    onRemoteUpdate = null;
  }

  return {
    initClient, getClient, isConfigured, _getUrl, _getKey,
    signUp, signIn, signOut, getSession, getUser, getUserId,
    // 分离表 CRUD
    loadTasks, saveTasks, deleteTask,
    loadCustomers, saveCustomers,
    loadFinance, saveFinance,
    loadContents, saveContents,
    loadMeta, saveMeta,
    // 批量操作
    pushAllData, pullAllData,
    // 迁移
    migrateFromBlob,
    // 轮询
    startPolling, stopPolling,
    // 工具
    uid, todayStr,
  };
})();
