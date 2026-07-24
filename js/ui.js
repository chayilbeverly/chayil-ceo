/* ============================================
   Chayil CEO OS — UI Helpers
   ============================================ */

const UI = {
  toast(msg) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => {
      el.style.transition = 'opacity 0.3s, transform 0.3s';
      el.style.opacity = '0';
      el.style.transform = 'translate(-50%, 10px)';
      setTimeout(() => el.remove(), 300);
    }, 1800);
  },

  fmt(n) {
    if (n == null || n === '') return '0';
    return Number(n).toLocaleString('zh-CN');
  },

  money(n) {
    return '¥' + UI.fmt(n);
  },

  fmtNum(n) {
    if (n >= 10000) return (n / 10000).toFixed(1) + '万';
    return UI.fmt(n);
  },

  empty(text, ico = '◇') {
    return `<div class="empty-state"><div class="empty-ico">${ico}</div><div class="empty-text">${text}</div></div>`;
  },

  // 转义HTML
  esc(s) {
    if (s == null) return '';
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
};
