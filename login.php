<?php
require_once __DIR__ . '/includes/bootstrap.php';
require_once __DIR__ . '/includes/auth.php';

if (!is_installed()) { header('Location: install.php'); exit; }
if (current_user()) { header('Location: index.php'); exit; }

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $pw = (string)input('password', '');
    if (do_login($pw)) {
        header('Location: index.php');
        exit;
    }
    $error = '密码错误，请重试。';
}
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>登录 · 礼尚往来</title>
<link rel="stylesheet" href="assets/css/style.css">
</head>
<body class="install-body">
<div class="install-wrap">
  <div class="install-card narrow">
    <div class="brand center">
      <div class="brand-logo big">礼</div>
      <h1>礼尚往来</h1>
      <p class="brand-sub">礼品礼金记账 · 登录</p>
    </div>
    <?php if ($error): ?><div class="alert error"><?= e($error) ?></div><?php endif; ?>
    <form method="post" class="install-form">
      <label>管理员密码
        <input type="password" name="password" autofocus required>
      </label>
      <button type="submit" class="btn primary btn-block">登 录</button>
    </form>
  </div>
</div>
</body>
</html>
