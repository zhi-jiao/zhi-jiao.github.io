(function () {
  function escapeHtml(s) {
    return s.replace(/[&<>"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  }

  async function fetchStatus(host, port) {
    const url = `https://api.mcsrvstat.us/2/${host}:${port}`;
    const res = await fetch(url, { cache: 'no-store' });
    return await res.json();
  }

  function render(container, data) {
    const online = data && data.online === true;
    const version = (Array.isArray(data?.version) ? data.version[0] : data?.version) || '-';
    const motd = typeof data?.motd?.clean === 'string'
      ? data.motd.clean
      : Array.isArray(data?.motd?.clean)
      ? data.motd.clean.join(' ')
      : '';
    const onlinePlayers = data?.players?.online ?? 0;
    const maxPlayers = data?.players?.max ?? '-';
    const list = Array.isArray(data?.players?.list) ? data.players.list : [];
    const uuids = data?.players?.uuid || {};

    // 新增：服务器名称和是否显示 IP
    const serverName = container.dataset.name || 'Minecraft 服务器';
    const showIp = container.dataset.showIp !== 'false'; // 默认 true，设置为 false 则不显示

    container.innerHTML = `
      <div style="border:1px solid #e2e8f0;border-radius:12px;padding:12px">
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:center;">
          <div>
            <div style="color:#6b7280;font-size:12px">服务器</div>
            <div style="font-family:ui-monospace,Consolas,monospace">
              ${escapeHtml(serverName)}${showIp ? ` (${escapeHtml(container.dataset.host)}:${escapeHtml(container.dataset.port)})` : ''}
            </div>
          </div>
          <div>
            <div style="color:#6b7280;font-size:12px">版本</div>
            <div style="font-family:ui-monospace,Consolas,monospace">${escapeHtml(String(version))}</div>
          </div>
          <div>
            <div style="color:#6b7280;font-size:12px">玩家</div>
            <div style="font-family:ui-monospace,Consolas,monospace">${online ? `${onlinePlayers}/${maxPlayers}` : '离线'}</div>
          </div>
          <span style="padding:4px 8px;border-radius:999px;font-size:12px;border:1px solid ${online?'#16a34a':'#ef4444'};color:${online?'#16a34a':'#ef4444'}">${online?'在线':'离线'}</span>
        </div>
        ${motd ? `<div style="margin-top:8px;color:#6b7280">${escapeHtml(motd)}</div>` : ''}
        <div style="margin-top:12px;color:#6b7280;font-size:12px">在线玩家</div>
        <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:10px" data-list></div>
        <div style="margin-top:8px;color:#94a3b8;font-size:12px">上次更新：<span data-ts></span></div>
      </div>
    `;

    const listEl = container.querySelector('[data-list]');
    const tsEl = container.querySelector('[data-ts]');
    tsEl.textContent = new Date().toLocaleString();
    listEl.innerHTML = '';

    if (!online || list.length === 0) {
      const empty = document.createElement('div');
      empty.style.color = '#9ca3af';
      empty.textContent = online ? '当前暂无玩家在线' : '服务器离线或不可达';
      listEl.appendChild(empty);
      return;
    }

    for (const name of list) {
      const uuid = uuids[name] || '';
      const wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;align-items:center;gap:8px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:10px;padding:6px 8px;';
      const img = document.createElement('img');
      img.width = 24; img.height = 24; img.style.borderRadius = '4px'; img.style.imageRendering = 'pixelated';
      img.alt = name;
      img.src = uuid
        ? `https://crafatar.com/avatars/${uuid}?size=48&overlay`
        : `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(name)}`;
      const label = document.createElement('span');
      label.textContent = name;
      wrap.appendChild(img);
      wrap.appendChild(label);
      listEl.appendChild(wrap);
    }

    const missingCount = Math.max(0, (onlinePlayers || 0) - list.length);
    if (missingCount > 0) {
      for (let i = 0; i < missingCount; i++) {
        const wrap = document.createElement('div');
        wrap.style.cssText = 'display:flex;align-items:center;gap:8px;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:10px;padding:6px 8px;opacity:.85';
        const img = document.createElement('img');
        img.width = 24; img.height = 24; img.style.borderRadius = '4px'; img.style.imageRendering = 'pixelated';
        img.alt = '匿名玩家';
        img.src = 'https://api.dicebear.com/7.x/pixel-art/svg?seed=anonymous';
        const label = document.createElement('span');
        label.textContent = '匿名玩家';
        wrap.appendChild(img);
        wrap.appendChild(label);
        listEl.appendChild(wrap);
      }
      const hint = document.createElement('div');
      hint.style.cssText = 'width:100%';
      hint.innerHTML = '<span style="color:#9ca3af;font-size:12px">部分玩家未公开，或服务器未开启 Query。</span>';
      listEl.appendChild(hint);
    }
  }

  async function initOne(container) {
    const host = container.dataset.host;
    const port = container.dataset.port || '25565';
    if (!host) { container.textContent = '缺少 data-host'; return; }
    container.textContent = '加载中...';
    try { render(container, await fetchStatus(host, port)); }
    catch { container.textContent = '加载失败'; }
  }

  function initAll() { document.querySelectorAll('[data-mc-status]').forEach(initOne); }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAll); else initAll();

  setInterval(() => { document.querySelectorAll('[data-mc-status]').forEach(initOne); }, 10000);
})();
