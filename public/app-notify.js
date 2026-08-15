(() => {
  const STYLE_ID = 'ak-app-notify-style';
  const ROOT_ID = 'ak-app-notify-root';
  const queue = [];
  let active = false;

  const classify = (message, requested = '') => {
    if (requested) return requested;
    const text = String(message || '');
    if (/成功|完成|已儲存|已收藏|已贈送|登入成功|已送出|已更新|已複製|已建立|已報名|已傳送/.test(text)) return 'success';
    if (/失敗|錯誤|無法|不能|不可|逾時|不存在|未完成|不足|拒絕|異常/.test(text)) return 'error';
    if (/請|注意|提醒|確認|尚未|需要|建議/.test(text)) return 'warning';
    return 'info';
  };

  const titleFor = (type, title = '') => title || ({
    success: '操作完成',
    error: '操作未完成',
    warning: '請注意',
    info: '系統通知',
  }[type] || '系統通知');

  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .ak-notify-layer{position:fixed;inset:0;z-index:2147483000;display:grid;place-items:center;padding:24px;background:rgba(0,0,0,.38);backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px);animation:akNotifyFade .16s ease-out}
      .ak-notify-card{width:min(328px,calc(100vw - 48px));overflow:hidden;border-radius:20px;background:#fff;box-shadow:0 18px 55px rgba(0,0,0,.22);font-family:system-ui,-apple-system,"Noto Sans TC","PingFang TC",sans-serif;text-align:center;animation:akNotifyPop .2s cubic-bezier(.22,.9,.3,1.08)}
      .ak-notify-body{padding:28px 24px 22px}
      .ak-notify-icon{display:grid;place-items:center;width:54px;height:54px;margin:0 auto 16px;border-radius:50%;font-size:30px;font-weight:800;line-height:1}
      .ak-notify-success .ak-notify-icon{background:#07c160;color:#fff}.ak-notify-error .ak-notify-icon{background:#fa5151;color:#fff}.ak-notify-warning .ak-notify-icon{background:#ffc300;color:#fff}.ak-notify-info .ak-notify-icon{background:#f2f2f2;color:#576b95}
      .ak-notify-title{margin:0;color:#111;font-size:20px;font-weight:700;line-height:1.35;letter-spacing:.01em}
      .ak-notify-message{margin:10px 0 0;color:#888;font-size:15px;line-height:1.65;white-space:pre-line;overflow-wrap:anywhere}
      .ak-notify-actions{display:flex;border-top:1px solid #ededed}
      .ak-notify-button{flex:1;min-height:54px;border:0;background:#fff;font-size:17px;font-weight:600;color:#07c160;-webkit-tap-highlight-color:transparent}
      .ak-notify-button:active{background:#f7f7f7}.ak-notify-button+.ak-notify-button{border-left:1px solid #ededed}.ak-notify-button.secondary{color:#576b95}.ak-notify-button.danger{color:#fa5151}
      @keyframes akNotifyFade{from{opacity:0}to{opacity:1}}@keyframes akNotifyPop{from{opacity:0;transform:scale(.94) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
      @media (prefers-reduced-motion:reduce){.ak-notify-layer,.ak-notify-card{animation:none}}
    `;
    document.head.append(style);
  }

  function iconFor(type) {
    if (type === 'success') return '✓';
    if (type === 'error') return '!';
    if (type === 'warning') return '!';
    return 'i';
  }

  function mountRoot() {
    let root = document.getElementById(ROOT_ID);
    if (!root) {
      root = document.createElement('div');
      root.id = ROOT_ID;
      document.body.append(root);
    }
    return root;
  }

  function renderNext() {
    if (active || !queue.length || !document.body) return;
    active = true;
    ensureStyle();
    const item = queue.shift();
    const type = classify(item.message, item.type);
    const root = mountRoot();
    const layer = document.createElement('div');
    layer.className = `ak-notify-layer ak-notify-${type}`;
    layer.setAttribute('role', 'dialog');
    layer.setAttribute('aria-modal', 'true');
    layer.setAttribute('aria-label', titleFor(type, item.title));

    const card = document.createElement('section');
    card.className = 'ak-notify-card';
    const body = document.createElement('div');
    body.className = 'ak-notify-body';
    const icon = document.createElement('div');
    icon.className = 'ak-notify-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = iconFor(type);
    const title = document.createElement('h2');
    title.className = 'ak-notify-title';
    title.textContent = titleFor(type, item.title);
    const message = document.createElement('p');
    message.className = 'ak-notify-message';
    message.textContent = String(item.message ?? '');
    const actions = document.createElement('div');
    actions.className = 'ak-notify-actions';

    const finish = (value) => {
      document.removeEventListener('keydown', onKey);
      layer.remove();
      active = false;
      item.resolve(value);
      queueMicrotask(renderNext);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') finish(item.kind === 'confirm' ? false : true);
      if (event.key === 'Enter' && item.kind !== 'confirm') finish(true);
    };
    document.addEventListener('keydown', onKey);

    if (item.kind === 'confirm') {
      const cancel = document.createElement('button');
      cancel.className = 'ak-notify-button secondary';
      cancel.type = 'button';
      cancel.textContent = item.cancelText || '取消';
      cancel.onclick = () => finish(false);
      actions.append(cancel);
    }

    const ok = document.createElement('button');
    ok.className = `ak-notify-button${item.danger ? ' danger' : ''}`;
    ok.type = 'button';
    ok.textContent = item.okText || '確定';
    ok.onclick = () => finish(true);
    actions.append(ok);

    body.append(icon, title, message);
    card.append(body, actions);
    layer.append(card);
    root.append(layer);
    requestAnimationFrame(() => ok.focus({ preventScroll:true }));
  }

  function enqueue(item) {
    return new Promise((resolve) => {
      queue.push({ ...item, resolve });
      if (document.body) renderNext();
      else window.addEventListener('DOMContentLoaded', renderNext, { once:true });
    });
  }

  window.appNotice = (message, options = {}) => enqueue({ kind:'alert', message, ...options });
  window.appConfirm = (message, options = {}) => enqueue({ kind:'confirm', message, ...options });

  // 將既有數十個 alert() 全域換成 App 內通知，不需逐一修改業務流程。
  window.alert = (message) => { void window.appNotice(message); };
})();
