/* ============================================================
   礼尚往来 · 多语言 (简体 / 繁体 / English)
   繁体由简体通过 OpenCC 即时转换生成，无需单独维护词库。
   ============================================================ */
(function () {
  const DICT = {
    zh: {
      nav_dashboard: '仪表盘',
      nav_events: '办酒记录',
      nav_settings: '设置',
      nav_logout: '退出登录',

      dash_title: '仪表盘',
      dash_welcome: '欢迎使用礼尚往来',
      dash_welcome_sub: '记录每一份人情往来，让还礼心中有数。',
      dash_total_events: '办酒场次',
      dash_total_records: '礼金记录',
      dash_total_amount: '累计入账',
      dash_recent: '最近活动',
      dash_view_all: '查看全部',
      dash_empty: '还没有任何记录，先创建一场办酒吧。',

      events_title: '办酒记录',
      events_sub: '每一场酒对应一本礼金簿',
      events_new: '新建活动',
      event_name: '活动名称',
      event_date: '办酒日期',
      event_remark: '备注',
      event_records: '条记录',
      event_amount: '入账',
      event_edit: '编辑',
      event_delete: '删除',
      event_delete_confirm: '确定删除这场活动？其下所有礼金记录也会一并删除，且不可恢复。',
      event_open: '进入',

      rec_title: '礼金簿',
      rec_back: '返回活动列表',
      rec_add: '添加记录',
      rec_search: '搜索姓名 / 备注 / 礼品…',
      rec_edit: '编辑',
      rec_delete: '删除',
      rec_delete_confirm: '确定删除这条记录？',
      rec_empty: '暂无记录，点击右上角“添加记录”开始记账。',
      rec_count: '共 {n} 条',
      rec_fields: '字段设置',
      rec_export: '导出表格',
      rec_reciprocity: '还礼建议',

      fld_title: '自定义字段',
      fld_sub: '拖拽调整列顺序，增删字段，控制是否显示 / 必填。表格会按此顺序展示与导出。',
      fld_add: '新增字段',
      fld_label: '字段名称',
      fld_type: '类型',
      fld_required: '必填',
      fld_visible: '显示',
      fld_delete: '删除',
      fld_drag: '拖拽排序',
      fld_system: '系统',
      fld_type_text: '单行文本',
      fld_type_number: '数字',
      fld_type_date: '日期',
      fld_type_textarea: '多行文本',
      fld_type_select: '下拉选择',
      fld_options: '选项（每行一个）',
      fld_options_hint: '仅“下拉选择”类型需要填写',
      fld_delete_confirm: '确定删除该字段？已有数据中的该列内容会一并清除。',
      fld_system_tip: '系统字段不可删除，可隐藏。',

      set_title: '设置',
      set_general: '基础设置',
      set_site_name: '站点名称',
      set_lang: '界面语言',
      set_default_currency: '默认币种',
      set_inflation: '年均通胀率 (%)',
      set_inflation_hint: '用于“还礼建议”：当年金额按此复利折算到今天。',
      set_currency: '币种与汇率',
      set_rates: '汇率表',
      set_rates_hint: '数值含义：1 默认币 = X 该币种。可手动修改，也可一键联网更新。',
      set_refresh_rates: '联网更新汇率',
      set_rates_updated: '汇率已更新',
      set_security: '安全',
      set_password: '修改管理员密码',
      set_password_new: '新密码（留空则不修改）',
      set_password_hint: '至少 6 位',
      set_save: '保存设置',
      set_saved: '设置已保存',
      set_export: '数据导出 / 备份',
      set_export_all: '导出全部记录为 CSV',
      set_export_backup: '下载完整数据备份 (JSON)',
      set_export_hint: 'CSV 可用 Excel / WPS / 谷歌表格直接打开；JSON 备份可用于迁移恢复。',

      reci_title: '还礼建议',
      reci_original: '当年收礼',
      reci_date: '收礼日期',
      reci_years: '距今',
      reci_years_unit: '年',
      reci_rate: '通胀率',
      reci_recommend: '建议还礼',
      reci_now_equiv: '约合今日',
      reci_formula: '计算公式',
      reci_note: '仅供参考，可根据亲疏远近与当下行情适当增减。',
      reci_no_amount: '该记录没有金额，无法计算还礼建议。',
      reci_edit_rate: '可在“设置”中调整通胀率与汇率。',
      reci_per_year: '/ 年',

      common_save: '保存',
      common_cancel: '取消',
      common_create: '创建',
      common_update: '更新',
      common_delete: '删除',
      common_close: '关闭',
      common_confirm: '确定',
      common_loading: '加载中…',
      common_required: '必填项',
      common_search: '搜索',
      common_all: '全部',
      common_actions: '操作',
      common_total: '合计',
      common_yuan: '元',
    },

    en: {
      nav_dashboard: 'Dashboard',
      nav_events: 'Events',
      nav_settings: 'Settings',
      nav_logout: 'Log out',

      dash_title: 'Dashboard',
      dash_welcome: 'Welcome to LiShangWangLai',
      dash_welcome_sub: 'Track every gift exchange so reciprocation is always on point.',
      dash_total_events: 'Events',
      dash_total_records: 'Gift Records',
      dash_total_amount: 'Total Received',
      dash_recent: 'Recent Events',
      dash_view_all: 'View all',
      dash_empty: 'No records yet. Create your first event to get started.',

      events_title: 'Events',
      events_sub: 'Each banquet has its own gift ledger',
      events_new: 'New Event',
      event_name: 'Event Name',
      event_date: 'Event Date',
      event_remark: 'Remark',
      event_records: 'records',
      event_amount: 'Received',
      event_edit: 'Edit',
      event_delete: 'Delete',
      event_delete_confirm: 'Delete this event? All gift records under it will be removed permanently.',
      event_open: 'Open',

      rec_title: 'Gift Ledger',
      rec_back: 'Back to events',
      rec_add: 'Add Record',
      rec_search: 'Search name / remark / gift…',
      rec_edit: 'Edit',
      rec_delete: 'Delete',
      rec_delete_confirm: 'Delete this record?',
      rec_empty: 'No records yet. Click "Add Record" to start.',
      rec_count: '{n} records',
      rec_fields: 'Fields',
      rec_export: 'Export',
      rec_reciprocity: 'Reciprocity',

      fld_title: 'Custom Fields',
      fld_sub: 'Drag to reorder columns, add/remove fields, toggle visibility / required. The table and export follow this order.',
      fld_add: 'Add Field',
      fld_label: 'Field Name',
      fld_type: 'Type',
      fld_required: 'Required',
      fld_visible: 'Visible',
      fld_delete: 'Delete',
      fld_drag: 'Drag to reorder',
      fld_system: 'System',
      fld_type_text: 'Text',
      fld_type_number: 'Number',
      fld_type_date: 'Date',
      fld_type_textarea: 'Textarea',
      fld_type_select: 'Dropdown',
      fld_options: 'Options (one per line)',
      fld_options_hint: 'Only needed for Dropdown type',
      fld_delete_confirm: 'Delete this field? Existing data in this column will also be cleared.',
      fld_system_tip: 'System fields cannot be deleted, but can be hidden.',

      set_title: 'Settings',
      set_general: 'General',
      set_site_name: 'Site Name',
      set_lang: 'Language',
      set_default_currency: 'Default Currency',
      set_inflation: 'Annual Inflation (%)',
      set_inflation_hint: 'Used for reciprocity advice: compounds the original amount to today.',
      set_currency: 'Currency & Exchange Rates',
      set_rates: 'Rate Table',
      set_rates_hint: 'Meaning: 1 default currency = X of this currency. Edit manually or fetch online.',
      set_refresh_rates: 'Fetch rates online',
      set_rates_updated: 'Rates updated',
      set_security: 'Security',
      set_password: 'Change admin password',
      set_password_new: 'New password (leave blank to keep)',
      set_password_hint: 'At least 6 characters',
      set_save: 'Save Settings',
      set_saved: 'Settings saved',
      set_export: 'Export / Backup',
      set_export_all: 'Export all records as CSV',
      set_export_backup: 'Download full backup (JSON)',
      set_export_hint: 'CSV opens directly in Excel / WPS / Google Sheets; JSON backup is for migration & restore.',

      reci_title: 'Reciprocity Advice',
      reci_original: 'Original gift',
      reci_date: 'Date received',
      reci_years: 'Years elapsed',
      reci_years_unit: 'yrs',
      reci_rate: 'Inflation rate',
      reci_recommend: 'Suggested return',
      reci_now_equiv: "Today's equivalent",
      reci_formula: 'Formula',
      reci_note: 'For reference only — adjust based on relationship and current customs.',
      reci_no_amount: 'This record has no amount; cannot compute advice.',
      reci_edit_rate: 'Adjust inflation & rates in Settings.',
      reci_per_year: '/ yr',

      common_save: 'Save',
      common_cancel: 'Cancel',
      common_create: 'Create',
      common_update: 'Update',
      common_delete: 'Delete',
      common_close: 'Close',
      common_confirm: 'Confirm',
      common_loading: 'Loading…',
      common_required: 'Required',
      common_search: 'Search',
      common_all: 'All',
      common_actions: 'Actions',
      common_total: 'Total',
      common_yuan: '',
    },
  };

  // ---- OpenCC 转换器（繁体 <-> 简体） ----
  let cn2tw = null, tw2cn = null;
  try {
    if (window.OpenCC && typeof window.OpenCC.Converter === 'function') {
      cn2tw = window.OpenCC.Converter({ from: 'cn', to: 'tw' });
      tw2cn = window.OpenCC.Converter({ from: 'tw', to: 'cn' });
    }
  } catch (e) { /* 转换不可用时回退为原文 */ }

  // 由简体生成繁体词典
  const DICT_TW = {};
  if (cn2tw) {
    for (const k in DICT.zh) {
      try { DICT_TW[k] = cn2tw(DICT.zh[k]); } catch (e) { DICT_TW[k] = DICT.zh[k]; }
    }
  } else {
    Object.assign(DICT_TW, DICT.zh);
  }

  const STORE_KEY = 'lishang_lang';
  let current = localStorage.getItem(STORE_KEY) || (window.__APP__ && window.__APP__.lang) || 'zh';

  function dict() {
    if (current === 'tw') return DICT_TW;
    if (current === 'en') return DICT.en;
    return DICT.zh;
  }

  function t(key, vars) {
    const d = dict();
    let s = d[key] != null ? d[key] : (DICT.zh[key] != null ? DICT.zh[key] : key);
    if (vars) {
      for (const k in vars) s = s.replace('{' + k + '}', vars[k]);
    }
    return s;
  }

  /** 把一段中文文本转成当前语言对应的字形（用于记录数据内容） */
  function convertText(s) {
    if (s == null) return s;
    s = String(s);
    if (current === 'tw' && cn2tw) { try { return cn2tw(s); } catch (e) { return s; } }
    if (current === 'zh' && tw2cn) { try { return tw2cn(s); } catch (e) { return s; } }
    return s; // English 模式不改动原始内容
  }

  function apply(root) {
    const scope = root || document;
    scope.querySelectorAll('[data-i18n]').forEach(function (el) {
      const key = el.getAttribute('data-i18n');
      el.textContent = t(key);
    });
    scope.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
    });
  }

  function setLang(lang, cb) {
    if (!['zh', 'tw', 'en'].includes(lang)) lang = 'zh';
    current = lang;
    localStorage.setItem(STORE_KEY, lang);
    // 同步到服务器
    fetch('api/settings.php', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lang: lang }),
    }).catch(function () {});
    apply(document);
    if (typeof cb === 'function') cb();
    // 通知应用重新渲染当前页（数据内容字形需要刷新）
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: lang } }));
  }

  window.I18N = {
    get lang() { return current; },
    t: t,
    apply: apply,
    setLang: setLang,
    convertText: convertText,
    dict: dict,
  };
})();
