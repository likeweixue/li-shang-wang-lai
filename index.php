<?php
require_once __DIR__ . '/includes/bootstrap.php';

if (!is_installed()) { header('Location: install.php'); exit; }

require_once __DIR__ . '/includes/auth.php';
require_auth();

// 注入初始设置到前端
$s = get_settings();
$init = [
    'site_name'        => $s['site_name'] ?? '礼尚往来',
    'lang'             => $s['lang'] ?? 'zh',
    'default_currency' => $s['default_currency'] ?? 'CNY',
    'inflation_rate'   => (float)($s['inflation_rate'] ?? 3.0),
    'exchange_rates'   => $s['exchange_rates'] ?? ['CNY'=>1],
];
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title><?= e($init['site_name']) ?></title>
<link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
<div class="app">
  <!-- 侧边栏 -->
  <aside class="sidebar">
    <div class="sidebar-brand">
      <div class="brand-logo">礼</div>
      <div class="sidebar-title"><?= e($init['site_name']) ?></div>
    </div>
    <nav class="sidebar-nav">
      <a href="#" class="nav-item active" data-route="dashboard"><span class="nav-ico">◎</span><span data-i18n="nav_dashboard">仪表盘</span></a>
      <a href="#" class="nav-item" data-route="events"><span class="nav-ico">▦</span><span data-i18n="nav_events">办酒记录</span></a>
      <a href="#" class="nav-item" data-route="settings"><span class="nav-ico">⚙</span><span data-i18n="nav_settings">设置</span></a>
    </nav>
    <div class="sidebar-foot">
      <a href="logout.php" class="nav-item"><span class="nav-ico">⏻</span><span data-i18n="nav_logout">退出登录</span></a>
    </div>
  </aside>

  <!-- 主区 -->
  <div class="main">
    <header class="topbar">
      <div class="topbar-left">
        <button class="icon-btn menu-toggle" id="menuToggle">☰</button>
        <h2 id="pageTitle" data-i18n="nav_dashboard">仪表盘</h2>
      </div>
      <div class="topbar-right">
        <div class="seg" id="langSeg">
          <button data-lang="zh" class="active">简体</button>
          <button data-lang="tw">繁體</button>
          <button data-lang="en">EN</button>
        </div>
      </div>
    </header>
    <main class="content" id="app"></main>
  </div>
</div>

<!-- 通用模态框容器 -->
<div class="modal-mask" id="modalMask" hidden>
  <div class="modal" id="modalBox"></div>
</div>
<!-- Toast -->
<div class="toast-wrap" id="toastWrap"></div>

<script>window.__APP__ = <?= json_encode($init, JSON_UNESCAPED_UNICODE) ?>;</script>
<script src="assets/js/opencc.js"></script>
<script src="assets/js/i18n.js"></script>
<script src="assets/js/app.js"></script>
</body>
</html>
