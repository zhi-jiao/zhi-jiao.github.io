// /source/js/creeper.js
(function () {
  // --- 自动推断 CSS 路径（基于当前 script 的 src） ---
  function getThisScript() {
    // document.currentScript 在大多数浏览器可用，作为后备遍历 script 标签
    if (document.currentScript) return document.currentScript;
    const scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  }

  const thisScript = getThisScript();
  let cssHref = '/css/creeper.css'; // 默认回退路径

  if (thisScript && thisScript.src) {
    try {
      const url = new URL(thisScript.src, location.href);
      // 在同目录寻找 creeper.css
      url.pathname = url.pathname.replace(/\/[^/]*$/, '/creeper.css');
      cssHref = url.pathname + (url.search || '') + (url.hash || '');
    } catch (e) {
      // ignore
    }
  }

  // 插入 css
  const cssLink = document.createElement('link');
  cssLink.rel = 'stylesheet';
  cssLink.href = cssHref;
  document.head.appendChild(cssLink);

  // 创建元素
  const creeper = document.createElement('div');
  creeper.className = 'creeper';
  creeper.tabIndex = -1;
  // 设置默认位置（使用 top 而不是 bottom，避免后续拖动时冲突）
  const startLeft = 20;
  const startTop = 80;
  creeper.style.left = startLeft + 'px';
  creeper.style.top = startTop + 'px';

  document.body.appendChild(creeper);

  // 拖动（pointer）
  let dragging = false;
  let sx = 0, sy = 0, sLeft = 0, sTop = 0;

  creeper.addEventListener('pointerdown', (ev) => {
    if (ev.button && ev.button !== 0) return;
    dragging = true;
    creeper.setPointerCapture && creeper.setPointerCapture(ev.pointerId);
    sx = ev.clientX; sy = ev.clientY;
    const rect = creeper.getBoundingClientRect();
    sLeft = rect.left; sTop = rect.top;
    creeper.style.transition = 'none';
    creeper.style.cursor = 'grabbing';
    ev.preventDefault();
  });

  window.addEventListener('pointermove', (ev) => {
    if (!dragging) return;
    const dx = ev.clientX - sx;
    const dy = ev.clientY - sy;
    let nx = Math.round(sLeft + dx);
    let ny = Math.round(sTop + dy);

    const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    const rect = creeper.getBoundingClientRect();

    const margin = 8;
    nx = Math.min(Math.max(nx, margin - rect.width / 2), vw - rect.width - margin);
    ny = Math.min(Math.max(ny, margin), vh - rect.height - margin);

    creeper.style.left = nx + 'px';
    creeper.style.top = ny + 'px';
  });

  window.addEventListener('pointerup', (ev) => {
    if (!dragging) return;
    dragging = false;
    try { creeper.releasePointerCapture && creeper.releasePointerCapture(ev.pointerId); } catch {}
    creeper.style.transition = '';
    creeper.style.cursor = 'grab';
    // 保持位置（可选 localStorage）
    try {
      const left = parseFloat(getComputedStyle(creeper).left) || 0;
      const top = parseFloat(getComputedStyle(creeper).top) || 0;
      localStorage.setItem('creeper_pos', JSON.stringify({ left, top }));
    } catch (e) {}
  });

  // 恢复位置（如果之前保存过）
  try {
    const raw = localStorage.getItem('creeper_pos');
    if (raw) {
      const p = JSON.parse(raw);
      if (typeof p.left === 'number') creeper.style.left = p.left + 'px';
      if (typeof p.top === 'number') creeper.style.top = p.top + 'px';
    }
  } catch (e) {}

  // 防止选中文本
  creeper.addEventListener('mousedown', (e) => e.preventDefault());

  // 入口动画
  creeper.style.transform = 'translateY(-8px) scale(.98)';
  requestAnimationFrame(() => (creeper.style.transform = ''));

  // 暴露以便调试
  window.__creeper = { el: creeper };
})();
