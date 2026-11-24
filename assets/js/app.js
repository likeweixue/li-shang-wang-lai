/* ============================================================
   礼尚往来 · 前端应用 (Vanilla JS SPA)
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 基础工具 ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.prototype.slice.call(r.querySelectorAll(s));
  const esc = (s) => {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  };
  const tx = (s) => esc(window.I18N.convertText(s)); // 转字形 + 转义

  const state = {
    events: [],
    settings: Object.assign({
      site_name: '礼尚往来', lang: 'zh', default_currency: 'CNY',
      inflation_rate: 3.0, exchange_rates: { CNY: 1 },
    }, window.__APP__ || {}),
  };

  /* ---------- API ---------- */
  async function api(path, opts = {}) {
    const options = Object.assign({ credentials: 'same-origin' }, opts);
    if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
      options.headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
      options.body = JSON.stringify(options.body);
    }
    let res, data;
    try {
      res = await fetch(path, options);
      const text = await res.text();
      data = text ? JSON.parse(text) : null;
    } catch (e) {
      toast('网络错误，请检查连接', 'error');
      throw e;
    }
    if (!res.ok) {
      toast((data && (data.message || data.error)) || '请求失败', 'error');
      throw new Error((data && data.error) || 'http ' + res.status);
    }
    return data;
  }

  /* ---------- Toast ---------- */
  function toast(msg, type) {
    const wrap = $('#toastWrap');
    const el = document.createElement('div');
    el.className = 'toast ' + (type || '');
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 300); }, 2400);
  }

  /* ---------- Modal ---------- */
  function openModal(html) {
    const mask = $('#modalMask');
    $('#modalBox').innerHTML = html;
    mask.hidden = false;
  }
  function closeModal() { $('#modalMask').hidden = true; $('#modalBox').innerHTML = ''; }
  $('#modalMask').addEventListener('click', (e) => { if (e.target.id === 'modalMask') closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  function confirmDlg(title, msg, onOk) {
    openModal(`
      <div class="modal-head"><h3>${esc(title)}</h3><button class="icon-btn" onclick="closeModal()">✕</button></div>
      <div class="modal-body"><p style="margin:0;color:var(--text-muted)">${esc(msg)}</p></div>
      <div class="modal-foot">
        <button class="btn" onclick="closeModal()">${tx(window.I18N.t('common_cancel'))}</button>
        <button class="btn primary" id="confirmOk">${tx(window.I18N.t('common_confirm'))}</button>
      </div>`);
    $('#confirmOk').onclick = () => { closeModal(); onOk(); };
  }
  window.closeModal = closeModal;

  /* ---------- 金额格式化 ---------- */
  function fmtMoney(n, currency) {
    const num = parseFloat(n);
    if (isNaN(num)) return '-';
    const cur = currency || state.settings.default_currency || 'CNY';
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + cur;
  }
  // 外币 → 默认币 (rates 存的是 1 默认币 = X 外币)
  function toDefault(amount, currency) {
    const rates = state.settings.exchange_rates || {};
    const cur = currency || state.settings.default_currency;
    const r = parseFloat(rates[cur]);
    if (!r || r <= 0) return null;
    return parseFloat(amount) / r;
  }

  /* ---------- 路由 (hash) ---------- */
  function parseHash() {
    const h = (location.hash || '').replace(/^#\/?/, '');
    const parts = h.split('/').filter(Boolean);
    return { route: parts[0] || 'dashboard', id: parts[1] ? parseInt(parts[1], 10) : null };
  }
  function navigate(route, id) {
    location.hash = '#/' + route + (id ? '/' + id : '');
  }
  window.navigate = navigate;
  function setActiveNav(route) {
    $$('.nav-item[data-route]').forEach((n) => {
      const r = n.dataset.route;
      const active = r === route || (route === 'records' && r === 'events') || (route === 'fields' && r === 'events');
      n.classList.toggle('active', active);
    });
  }
  function setTitle(key) { $('#pageTitle').textContent = window.I18N.t(key); }
  window.addEventListener('hashchange', router);
  document.addEventListener('langchange', () => { window.I18N.apply(document); router(); });

  async function loadEvents() {
    const data = await api('api/events.php');
    state.events = data.events || [];
    return state.events;
  }
  function findEvent(id) { return state.events.find((e) => e.id === id); }

  /* ---------- 渲染：仪表盘 ---------- */
  async function renderDashboard() {
    setActiveNav('dashboard'); setTitle('nav_dashboard');
    $('#app').innerHTML = `<div class="empty"><div class="big">◎</div>${tx(window.I18N.t('common_loading'))}</div>`;
    let events;
    try { events = await loadEvents(); } catch (e) { return; }

    const totalRecords = events.reduce((s, e) => s + (e.record_count || 0), 0);
    const totalAmount = events.reduce((s, e) => s + (parseFloat(e.total_amount) || 0), 0);

    let recent = events.slice(0, 5).map((e) => `
      <div class="event-card" onclick="navigate('records',${e.id})">
        <h4 class="ec-name">${tx(e.name)}</h4>
        <div class="ec-date dim">${esc(e.event_date || '-')}</div>
        <div class="ec-meta">
          <span class="muted">${esc(e.record_count || 0)} ${tx(window.I18N.t('event_records'))}</span>
          <b>${fmtMoney(e.total_amount, state.settings.default_currency)}</b>
        </div>
      </div>`).join('');

    $('#app').innerHTML = `
      <div class="card" style="margin-bottom:20px;background:linear-gradient(135deg,rgba(246,130,31,.1),rgba(59,130,246,.05))">
        <h3 style="margin:0 0 4px">${tx(window.I18N.t('dash_welcome'))}</h3>
        <p class="muted" style="margin:0">${tx(window.I18N.t('dash_welcome_sub'))}</p>
      </div>
      <div class="stats">
        <div class="stat"><div class="stat-label">${tx(window.I18N.t('dash_total_events'))}</div><div class="stat-value">${events.length}</div></div>
        <div class="stat"><div class="stat-label">${tx(window.I18N.t('dash_total_records'))}</div><div class="stat-value">${totalRecords}</div></div>
        <div class="stat"><div class="stat-label">${tx(window.I18N.t('dash_total_amount'))}</div><div class="stat-value accent">${fmtMoney(totalAmount, state.settings.default_currency)}</div></div>
      </div>
      <div class="card">
        <div class="card-head">
          <h3 class="card-title">${tx(window.I18N.t('dash_recent'))}</h3>
          <button class="btn sm" onclick="navigate('events')">${tx(window.I18N.t('dash_view_all'))} →</button>
        </div>
        ${recent ? `<div class="events-grid">${recent}</div>` : `<div class="empty"><div class="big">🎉</div>${tx(window.I18N.t('dash_empty'))}</div>`}
      </div>`;
  }
  window.navigate = navigate;

  /* ---------- 渲染：活动列表 ---------- */
  async function renderEvents() {
    setActiveNav('events'); setTitle('nav_events');
    $('#app').innerHTML = `<div class="empty">${tx(window.I18N.t('common_loading'))}</div>`;
    let events;
    try { events = await loadEvents(); } catch (e) { return; }

    const cards = events.map((e) => `
      <div class="event-card">
        <div class="ec-actions">
          <button class="icon-btn" title="${tx(window.I18N.t('event_edit'))}" onclick="event.stopPropagation();editEvent(${e.id})">✎</button>
          <button class="icon-btn" title="${tx(window.I18N.t('event_delete'))}" onclick="event.stopPropagation();deleteEvent(${e.id})">🗑</button>
        </div>
        <div onclick="navigate('records',${e.id})">
          <h4 class="ec-name">${tx(e.name)}</h4>
          <div class="ec-date dim">${esc(e.event_date || '-')} · ${esc(e.remark ? e.remark.slice(0, 30) : '')}</div>
          <div class="ec-meta">
            <span class="muted">${esc(e.record_count || 0)} ${tx(window.I18N.t('event_records'))}</span>
            <b class="accent-text">${fmtMoney(e.total_amount, state.settings.default_currency)}</b>
          </div>
        </div>
      </div>`).join('');

    $('#app').innerHTML = `
      <div class="toolbar">
        <div>
          <h2 style="margin:0">${tx(window.I18N.t('events_title'))}</h2>
          <div class="dim" style="font-size:12px;margin-top:2px">${tx(window.I18N.t('events_sub'))}</div>
        </div>
        <div class="spacer"></div>
        <button class="btn primary" onclick="editEvent()">+ ${tx(window.I18N.t('events_new'))}</button>
      </div>
      ${cards ? `<div class="events-grid">${cards}</div>` : `<div class="card"><div class="empty"><div class="big">📒</div>${tx(window.I18N.t('dash_empty'))}</div></div>`}`;
  }

  window.editEvent = function (id) {
    const e = id ? findEvent(id) : { name: '', event_date: '', remark: '' };
    openModal(`
      <div class="modal-head"><h3>${tx(window.I18N.t(id ? 'event_edit' : 'events_new'))}</h3><button class="icon-btn" onclick="closeModal()">✕</button></div>
      <div class="modal-body">
        <label>${tx(window.I18N.t('event_name'))}<input id="evName" value="${esc(e.name || '')}" autofocus></label>
        <label>${tx(window.I18N.t('event_date'))}<input type="date" id="evDate" value="${esc(e.event_date || '')}"></label>
        <label>${tx(window.I18N.t('event_remark'))}<textarea id="evRemark">${esc(e.remark || '')}</textarea></label>
      </div>
      <div class="modal-foot">
        <button class="btn" onclick="closeModal()">${tx(window.I18N.t('common_cancel'))}</button>
        <button class="btn primary" id="evSave">${tx(window.I18N.t('common_save'))}</button>
      </div>`);
    $('#evSave').onclick = async () => {
      const name = $('#evName').value.trim();
      if (!name) { toast(window.I18N.t('common_required'), 'error'); return; }
      const body = { name, event_date: $('#evDate').value || null, remark: $('#evRemark').value };
      try {
        if (id) {
          await api('api/events.php', { method: 'PUT', body: Object.assign({ id }, body) });
        } else {
          const r = await api('api/events.php', { method: 'POST', body });
          id = r.id;
        }
        toast('OK', 'success'); closeModal(); router();
      } catch (e) { }
    };
  };

  window.deleteEvent = function (id) {
    const e = findEvent(id);
    confirmDlg(window.I18N.t('event_delete'), window.I18N.t('event_delete_confirm'), async () => {
      try { await api('api/events.php?id=' + id, { method: 'DELETE' }); toast('OK', 'success'); router(); } catch (e) { }
    });
  };

  /* ---------- 渲染：记录表格 ---------- */
  async function renderRecords(eventId) {
    setActiveNav('records'); setTitle('nav_events');
    if (!eventId) { navigate('events'); return; }
    $('#app').innerHTML = `<div class="empty">${tx(window.I18N.t('common_loading'))}</div>`;

    let data, event;
    try {
      await loadEvents();
      event = findEvent(eventId);
      data = await api('api/records.php?event_id=' + eventId);
    } catch (e) { return; }
    if (!event) { navigate('events'); return; }

    const fields = data.fields || [];
    let records = data.records || [];
    const visibleFields = fields.filter((f) => f.visible);

    // 缓存当前过滤关键字
    let keyword = '';
    const draw = () => {
      const kw = keyword.trim().toLowerCase();
      const list = kw ? records.filter((r) => JSON.stringify(r.values).toLowerCase().includes(kw)) : records;
      const total = list.reduce((s, r) => s + (toDefault(r.amount, r.currency) || 0), 0);

      const header = visibleFields.map((f) => `<th>${tx(f.label)}</th>`).join('') + `<th style="text-align:right">${tx(window.I18N.t('common_actions'))}</th>`;
      const rows = list.map((r) => {
        const cells = visibleFields.map((f) => {
          let v = r.values[f.field_key];
          if (v === null || v === undefined || v === '') v = '';
          const cls = (f.type === 'number') ? 'num' : '';
          const accent = (f.field_key === 'amount') ? ' accent-text' : '';
          return `<td class="${cls}${accent}">${tx(v)}</td>`;
        }).join('');
        return `<tr>${cells}<td><div class="row-actions">
          <button class="btn sm" onclick="showReciprocity(${r.id})" title="${tx(window.I18N.t('rec_reciprocity'))}">↺</button>
          <button class="btn sm" onclick="editRecord(${eventId},${r.id})">${tx(window.I18N.t('rec_edit'))}</button>
          <button class="btn sm danger" onclick="deleteRecord(${eventId},${r.id})">${tx(window.I18N.t('rec_delete'))}</button>
        </div></td></tr>`;
      }).join('');

      $('#recTableArea').innerHTML = list.length
        ? `<div class="table-wrap"><table class="data"><thead><tr>${header}</tr></thead><tbody>${rows}</tbody></table></div>
           <div style="margin-top:12px;display:flex;justify-content:space-between;color:var(--text-muted);font-size:12px">
             <span>${tx(window.I18N.t('rec_count', { n: list.length }))}</span>
             <span>${tx(window.I18N.t('common_total'))}：<b class="accent-text">${fmtMoney(total, state.settings.default_currency)}</b></span>
           </div>`
        : `<div class="card"><div class="empty"><div class="big">📝</div>${tx(window.I18N.t('rec_empty'))}</div></div>`;
    };

    $('#app').innerHTML = `
      <div class="toolbar">
        <button class="btn ghost" onclick="navigate('events')">← ${tx(window.I18N.t('rec_back'))}</button>
        <div>
          <h2 style="margin:0">${tx(event.name)}</h2>
          <div class="dim" style="font-size:12px;margin-top:2px">${esc(event.event_date || '')} ${event.remark ? '· ' + esc(event.remark) : ''}</div>
        </div>
        <div class="spacer"></div>
        <div class="search-box"><input id="recSearch" placeholder="${tx(window.I18N.t('rec_search'))}"></div>
        <a class="btn" href="api/export.php?event_id=${eventId}" target="_blank">⬇ ${tx(window.I18N.t('rec_export'))}</a>
        <button class="btn" onclick="navigate('fields',${eventId})">⚙ ${tx(window.I18N.t('rec_fields'))}</button>
        <button class="btn primary" onclick="editRecord(${eventId})">+ ${tx(window.I18N.t('rec_add'))}</button>
      </div>
      <div id="recTableArea"></div>`;

    $('#recSearch').addEventListener('input', (e) => { keyword = e.target.value; draw(); });
    draw();
  }

  window.editRecord = function (eventId, id) {
    // 取字段定义（重新拉一次保证最新）
    api('api/records.php?event_id=' + eventId).then((data) => {
      const fields = data.fields || [];
      const record = id ? (data.records || []).find((r) => r.id === id) : null;
      const values = record ? record.values : {};

      const formHtml = fields.map((f) => {
        const v = values[f.field_key] != null ? values[f.field_key] : (f.field_key === 'currency' ? (state.settings.default_currency || 'CNY') : '');
        let input = '';
        if (f.type === 'textarea') {
          input = `<textarea data-key="${f.field_key}">${esc(v)}</textarea>`;
        } else if (f.type === 'select') {
          const opts = (f.options || []).map((o) => `<option value="${esc(o)}" ${String(o) === String(v) ? 'selected' : ''}>${tx(o)}</option>`).join('');
          input = `<select data-key="${f.field_key}"><option value="">-</option>${opts}</select>`;
        } else if (f.type === 'date') {
          input = `<input type="date" data-key="${f.field_key}" value="${esc(v)}">`;
        } else if (f.type === 'number') {
          input = `<input type="number" step="0.01" data-key="${f.field_key}" value="${esc(v)}">`;
        } else {
          input = `<input data-key="${f.field_key}" value="${esc(v)}">`;
        }
        return `<label>${tx(f.label)} ${f.required ? '<span style="color:var(--danger)">*</span>' : ''}${input}</label>`;
      }).join('');

      openModal(`
        <div class="modal-head"><h3>${tx(window.I18N.t(id ? 'rec_edit' : 'rec_add'))}</h3><button class="icon-btn" onclick="closeModal()">✕</button></div>
        <div class="modal-body">${formHtml}</div>
        <div class="modal-foot">
          <button class="btn" onclick="closeModal()">${tx(window.I18N.t('common_cancel'))}</button>
          <button class="btn primary" id="recSave">${tx(window.I18N.t('common_save'))}</button>
        </div>`);

      $('#recSave').onclick = async () => {
        const values = {};
        let ok = true;
        $$('#modalBox [data-key]').forEach((inp) => {
          const key = inp.dataset.key;
          let val = inp.value;
          const fdef = fields.find((x) => x.field_key === key);
          if (fdef && fdef.required && (val === '' || val === null)) ok = false;
          values[key] = val;
        });
        if (!ok) { toast(window.I18N.t('common_required'), 'error'); return; }
        try {
          if (id) await api('api/records.php', { method: 'PUT', body: { id, values } });
          else await api('api/records.php', { method: 'POST', body: { event_id: eventId, values } });
          toast('OK', 'success'); closeModal(); router();
        } catch (e) { }
      };
    });
  };

  window.deleteRecord = function (eventId, id) {
    confirmDlg(window.I18N.t('rec_delete'), window.I18N.t('rec_delete_confirm'), async () => {
      try { await api('api/records.php?id=' + id, { method: 'DELETE' }); toast('OK', 'success'); router(); } catch (e) { }
    });
  };

  /* ---------- 还礼建议 ---------- */
  window.showReciprocity = function (recordId) {
    const { route, id } = parseHash();
    if (route !== 'records' || !id) return;
    api('api/records.php?event_id=' + id).then((data) => {
      const r = (data.records || []).find((x) => x.id === recordId);
      if (!r) return;
      const amount = parseFloat(r.values.amount);
      const currency = r.values.currency || state.settings.default_currency || 'CNY';
      const dateStr = r.values.record_date || r.record_date || findEvent(id)?.event_date;
      const rate = parseFloat(state.settings.inflation_rate) || 0;

      if (isNaN(amount) || amount <= 0 || !dateStr) {
        openModal(`<div class="modal-head"><h3>${tx(window.I18N.t('reci_title'))}</h3><button class="icon-btn" onclick="closeModal()">✕</button></div>
          <div class="modal-body"><p class="muted">${tx(window.I18N.t('reci_no_amount'))}</p></div>
          <div class="modal-foot"><button class="btn" onclick="closeModal()">${tx(window.I18N.t('common_close'))}</button></div>`);
        return;
      }

      const then = new Date(dateStr);
      const now = new Date();
      const years = Math.max(0, (now - then) / (1000 * 60 * 60 * 24 * 365.25));
      const factor = Math.pow(1 + rate / 100, years);
      const recommended = amount * factor;
      const equivDefault = toDefault(recommended, currency);

      openModal(`
        <div class="modal-head"><h3>${tx(window.I18N.t('reci_title'))}</h3><button class="icon-btn" onclick="closeModal()">✕</button></div>
        <div class="modal-body">
          <div class="reci-box">
            <div class="reci-row"><span>${tx(window.I18N.t('reci_original'))}</span><b>${fmtMoney(amount, currency)}</b></div>
            <div class="reci-row"><span>${tx(window.I18N.t('reci_date'))}</span><span>${esc(dateStr)}</span></div>
            <div class="reci-row"><span>${tx(window.I18N.t('reci_years'))}</span><span>${years.toFixed(1)} ${tx(window.I18N.t('reci_years_unit'))}</span></div>
            <div class="reci-row"><span>${tx(window.I18N.t('reci_rate'))}</span><span>${rate}% ${tx(window.I18N.t('reci_per_year'))}</span></div>
            <div style="margin-top:14px;text-align:center">
              <div class="dim" style="font-size:12px">${tx(window.I18N.t('reci_recommend'))}</div>
              <div class="reci-big">≈ ${fmtMoney(recommended, currency)}</div>
              ${equivDefault != null && currency !== state.settings.default_currency ? `<div class="muted" style="font-size:13px">${tx(window.I18N.t('reci_now_equiv'))}：${fmtMoney(equivDefault, state.settings.default_currency)}</div>` : ''}
            </div>
            <div class="reci-formula">${esc(window.I18N.t('reci_formula'))}：${amount} × (1 + ${rate}%)^${years.toFixed(2)} = ${recommended.toFixed(2)}</div>
          </div>
          <p class="dim" style="font-size:12px;margin-top:12px">${tx(window.I18N.t('reci_note'))} ${tx(window.I18N.t('reci_edit_rate'))}</p>
        </div>
        <div class="modal-foot"><button class="btn primary" onclick="closeModal()">${tx(window.I18N.t('common_close'))}</button></div>`);
    });
  };

  /* ---------- 渲染：字段配置（拖拽排序） ---------- */
  async function renderFields(eventId) {
    setActiveNav('fields'); setTitle('nav_events');
    if (!eventId) { navigate('events'); return; }
    await loadEvents();
    const event = findEvent(eventId);
    if (!event) { navigate('events'); return; }

    $('#app').innerHTML = `<div class="empty">${tx(window.I18N.t('common_loading'))}</div>`;
    let data;
    try { data = await api('api/fields.php?event_id=' + eventId); } catch (e) { return; }
    let fields = data.fields || [];

    const typeLabel = (t) => window.I18N.t('fld_type_' + t) || t;

    const draw = () => {
      const rows = fields.map((f) => `
        <div class="field-row" draggable="true" data-id="${f.id}">
          <span class="drag-handle" title="${tx(window.I18N.t('fld_drag'))}">⠿</span>
          <span class="fl-label">${tx(f.label)} ${f.is_system ? `<span class="fl-type">${tx(window.I18N.t('fld_system'))}</span>` : ''}</span>
          <span class="fl-type">${tx(typeLabel(f.type))}</span>
          <label class="switch" title="${tx(window.I18N.t('fld_required'))}"><input type="checkbox" data-act="required" data-id="${f.id}" ${f.required ? 'checked' : ''}><span class="slider"></span></label>
          <label class="switch" title="${tx(window.I18N.t('fld_visible'))}"><input type="checkbox" data-act="visible" data-id="${f.id}" ${f.visible ? 'checked' : ''}><span class="slider"></span></label>
          <button class="btn sm" onclick="editField(${eventId},${f.id})">✎</button>
          <button class="btn sm danger" ${f.is_system ? 'disabled title="' + tx(window.I18N.t('fld_system_tip')) + '"' : ''} onclick="deleteField(${eventId},${f.id})">🗑</button>
        </div>`).join('');

      $('#app').innerHTML = `
        <div class="toolbar">
          <button class="btn ghost" onclick="navigate('records',${eventId})">← ${tx(window.I18N.t('rec_back'))}</button>
          <div><h2 style="margin:0">${tx(event.name)} · ${tx(window.I18N.t('fld_title'))}</h2>
            <div class="dim" style="font-size:12px;margin-top:2px">${tx(window.I18N.t('fld_sub'))}</div></div>
          <div class="spacer"></div>
          <button class="btn primary" onclick="editField(${eventId})">+ ${tx(window.I18N.t('fld_add'))}</button>
        </div>
        <div class="card"><div class="field-list" id="fieldList">${rows}</div></div>`;
      bindDnD();
      bindFieldToggles();
    };

    function bindFieldToggles() {
      $$('#fieldList input[type=checkbox]').forEach((cb) => {
        cb.addEventListener('change', async () => {
          const id = parseInt(cb.dataset.id, 10);
          const f = fields.find((x) => x.id === id);
          const patch = { id };
          patch[cb.dataset.act] = cb.checked ? 1 : 0;
          try {
            await api('api/fields.php', { method: 'PUT', body: patch });
            if (f) f[cb.dataset.act] = cb.checked ? 1 : 0;
            toast('OK', 'success');
          } catch (e) { cb.checked = !cb.checked; }
        });
      });
    }

    let dragId = null;
    function bindDnD() {
      const list = $('#fieldList');
      list.querySelectorAll('.field-row').forEach((row) => {
        row.addEventListener('dragstart', (e) => { dragId = parseInt(row.dataset.id, 10); row.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; });
        row.addEventListener('dragend', () => { row.classList.remove('dragging'); list.querySelectorAll('.drag-over').forEach((x) => x.classList.remove('drag-over')); });
        row.addEventListener('dragover', (e) => { e.preventDefault(); row.classList.add('drag-over'); });
        row.addEventListener('dragleave', () => row.classList.remove('drag-over'));
        row.addEventListener('drop', (e) => {
          e.preventDefault(); row.classList.remove('drag-over');
          const targetId = parseInt(row.dataset.id, 10);
          if (!dragId || dragId === targetId) return;
          const from = fields.findIndex((x) => x.id === dragId);
          const to = fields.findIndex((x) => x.id === targetId);
          if (from < 0 || to < 0) return;
          const [moved] = fields.splice(from, 1);
          fields.splice(to, 0, moved);
          const ids = fields.map((x) => x.id);
          api('api/fields.php', { method: 'PUT', body: { ids } }).then(() => { toast('OK', 'success'); draw(); }).catch(() => draw());
        });
      });
    }

    window.editField = function (eid, fid) {
      const f = fid ? fields.find((x) => x.id === fid) : { label: '', type: 'text', options: [], required: 0, visible: 1 };
      const typeOpts = ['text', 'number', 'date', 'textarea', 'select'].map((t) => `<option value="${t}" ${f.type === t ? 'selected' : ''}>${tx(typeLabel(t))}</option>`).join('');
      const isSelect = f.type === 'select';
      openModal(`
        <div class="modal-head"><h3>${tx(window.I18N.t(fid ? 'fld_label' : 'fld_add'))}</h3><button class="icon-btn" onclick="closeModal()">✕</button></div>
        <div class="modal-body">
          <label>${tx(window.I18N.t('fld_label'))}<input id="fLabel" value="${esc(f.label || '')}" autofocus></label>
          <label>${tx(window.I18N.t('fld_type'))}
            <select id="fType">${typeOpts}</select>
          </label>
          <div id="fOptionsWrap" style="${isSelect ? '' : 'display:none'}">
            <label>${tx(window.I18N.t('fld_options'))}<textarea id="fOptions">${esc((f.options || []).join('\n'))}</textarea>
            <span class="dim" style="font-size:11px">${tx(window.I18N.t('fld_options_hint'))}</span></label>
          </div>
          <div style="display:flex;gap:18px;margin-top:6px">
            <label style="display:flex;align-items:center;gap:8px;margin:0"><input type="checkbox" id="fRequired" ${f.required ? 'checked' : ''} style="width:auto"> ${tx(window.I18N.t('fld_required'))}</label>
            <label style="display:flex;align-items:center;gap:8px;margin:0"><input type="checkbox" id="fVisible" ${f.visible ? 'checked' : ''} style="width:auto"> ${tx(window.I18N.t('fld_visible'))}</label>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn" onclick="closeModal()">${tx(window.I18N.t('common_cancel'))}</button>
          <button class="btn primary" id="fSave">${tx(window.I18N.t('common_save'))}</button>
        </div>`);
      $('#fType').onchange = () => { $('#fOptionsWrap').style.display = $('#fType').value === 'select' ? '' : 'none'; };
      $('#fSave').onclick = async () => {
        const label = $('#fLabel').value.trim();
        if (!label) { toast(window.I18N.t('common_required'), 'error'); return; }
        const type = $('#fType').value;
        const options = type === 'select' ? $('#fOptions').value.split('\n').map((s) => s.trim()).filter(Boolean) : [];
        const body = { label, type, options, required: $('#fRequired').checked ? 1 : 0, visible: $('#fVisible').checked ? 1 : 0 };
        try {
          if (fid) await api('api/fields.php', { method: 'PUT', body: Object.assign({ id: fid }, body) });
          else await api('api/fields.php', { method: 'POST', body: Object.assign({ event_id: eid }, body) });
          toast('OK', 'success'); closeModal(); draw();
        } catch (e) { }
      };
    };

    window.deleteField = function (eid, fid) {
      const f = fields.find((x) => x.id === fid);
      if (f && f.is_system) { toast(window.I18N.t('fld_system_tip'), 'error'); return; }
      confirmDlg(window.I18N.t('fld_delete'), window.I18N.t('fld_delete_confirm'), async () => {
        try { await api('api/fields.php?id=' + fid, { method: 'DELETE' }); toast('OK', 'success'); draw(); } catch (e) { }
      });
    };

    draw();
  }

  /* ---------- 渲染：设置 ---------- */
  async function renderSettings() {
    setActiveNav('settings'); setTitle('nav_settings');
    $('#app').innerHTML = `<div class="empty">${tx(window.I18N.t('common_loading'))}</div>`;
    let data;
    try { data = await api('api/settings.php'); state.settings = Object.assign(state.settings, data.settings); } catch (e) { return; }
    const s = state.settings;
    const currencies = ['CNY', 'USD', 'HKD', 'TWD', 'EUR', 'JPY', 'GBP', 'KRW', 'SGD', 'AUD'];

    const rateRows = currencies.map((c) => {
      const val = s.exchange_rates && s.exchange_rates[c] != null ? s.exchange_rates[c] : '';
      return `<div class="rate-row"><code>1 ${s.default_currency} =</code><input type="number" step="0.0001" data-rate="${c}" value="${esc(val)}" placeholder="${c}"></div>`;
    }).join('');

    $('#app').innerHTML = `
      <div class="toolbar"><h2 style="margin:0">${tx(window.I18N.t('set_title'))}</h2></div>
      <div class="settings-grid">
        <div class="card">
          <h3 class="card-title">${tx(window.I18N.t('set_general'))}</h3>
          <label>${tx(window.I18N.t('set_site_name'))}<input id="sSiteName" value="${esc(s.site_name)}"></label>
          <label>${tx(window.I18N.t('set_default_currency'))}
            <select id="sDefaultCur">${currencies.map((c) => `<option value="${c}" ${c === s.default_currency ? 'selected' : ''}>${c}</option>`).join('')}</select>
          </label>
          <label>${tx(window.I18N.t('set_inflation'))}<input type="number" step="0.1" id="sInflation" value="${esc(s.inflation_rate)}">
            <span class="dim" style="font-size:11px">${tx(window.I18N.t('set_inflation_hint'))}</span></label>
        </div>
        <div class="card">
          <div class="card-head"><h3 class="card-title">${tx(window.I18N.t('set_rates'))}</h3>
            <button class="btn sm" id="refreshRates">↻ ${tx(window.I18N.t('set_refresh_rates'))}</button></div>
          <p class="dim" style="font-size:11px;margin-top:0">${tx(window.I18N.t('set_rates_hint'))}</p>
          <div id="rateArea">${rateRows}</div>
          <div id="rateUpdated" class="dim" style="font-size:11px;margin-top:6px"></div>
        </div>
        <div class="card">
          <h3 class="card-title">${tx(window.I18N.t('set_security'))}</h3>
          <label>${tx(window.I18N.t('set_password'))} — ${tx(window.I18N.t('set_password_new'))}<input type="password" id="sPassword" placeholder="${tx(window.I18N.t('set_password_hint'))}"></label>
        </div>
        <div class="card">
          <h3 class="card-title">${tx(window.I18N.t('set_export'))}</h3>
          <p class="dim" style="font-size:11px">${tx(window.I18N.t('set_export_hint'))}</p>
          <a class="btn" href="api/export.php?all=1" target="_blank" style="margin-bottom:8px">⬇ ${tx(window.I18N.t('set_export_all'))}</a><br>
          <a class="btn" href="api/export.php?backup=1" target="_blank">⬇ ${tx(window.I18N.t('set_export_backup'))}</a>
        </div>
      </div>
      <div style="margin-top:18px;text-align:right">
        <button class="btn primary" id="saveSettings">${tx(window.I18N.t('set_save'))}</button>
      </div>`;

    $('#refreshRates').onclick = async () => {
      const btn = $('#refreshRates'); btn.disabled = true;
      try {
        const r = await api('api/settings.php?action=refresh_rates', { method: 'POST' });
        state.settings.exchange_rates = r.rates;
        toast(window.I18N.t('set_rates_updated'), 'success');
        $('#rateUpdated').textContent = (window.I18N.t('set_rates_updated') + ' · ' + (r.updated_at || ''));
        renderSettings();
      } catch (e) { } finally { btn.disabled = false; }
    };

    $('#saveSettings').onclick = async () => {
      const rates = {};
      $$('#rateArea [data-rate]').forEach((inp) => { const v = parseFloat(inp.value); if (!isNaN(v)) rates[inp.dataset.rate] = v; });
      const body = {
        site_name: $('#sSiteName').value.trim(),
        default_currency: $('#sDefaultCur').value,
        inflation_rate: parseFloat($('#sInflation').value) || 0,
        exchange_rates: rates,
      };
      const pw = $('#sPassword').value;
      if (pw) body.admin_password = pw;
      try {
        await api('api/settings.php', { method: 'PUT', body });
        state.settings = Object.assign(state.settings, body);
        toast(window.I18N.t('set_saved'), 'success');
        // 站点名变化时刷新侧栏
        $('.sidebar-title').textContent = state.settings.site_name;
        document.title = state.settings.site_name;
      } catch (e) { }
    };
  }

  /* ---------- 路由分发 ---------- */
  function router() {
    const { route, id } = parseHash();
    if (route === 'dashboard') renderDashboard();
    else if (route === 'events') renderEvents();
    else if (route === 'records') renderRecords(id);
    else if (route === 'fields') renderFields(id);
    else if (route === 'settings') renderSettings();
    else renderDashboard();
  }

  /* ---------- 初始化 ---------- */
  function init() {
    // 侧栏导航
    $$('.nav-item[data-route]').forEach((n) => {
      n.addEventListener('click', (e) => { e.preventDefault(); navigate(n.dataset.route); $('.sidebar').classList.remove('open'); });
    });
    // 移动端菜单
    const menu = $('#menuToggle');
    if (menu) menu.addEventListener('click', () => $('.sidebar').classList.toggle('open'));
    // 语言切换
    const cur = window.I18N.lang;
    $$('#langSeg button').forEach((b) => b.classList.toggle('active', b.dataset.lang === cur));
    $$('#langSeg button').forEach((b) => b.addEventListener('click', () => {
      $$('#langSeg button').forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
      window.I18N.setLang(b.dataset.lang);
    }));
    window.I18N.apply(document);
    if (!location.hash) location.hash = '#/dashboard';
    else router();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
