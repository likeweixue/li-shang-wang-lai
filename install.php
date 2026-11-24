<?php
/**
 * 安装向导：环境检测 → 数据库配置 → 自动建表 → 写 config.php → 设置管理员密码
 * 上传后首次访问自动进入本页，安装完成后不可重复进入。
 */
require_once __DIR__ . '/includes/bootstrap.php';
require_once __DIR__ . '/includes/schema.php';

if (is_installed()) {
    header('Location: index.php');
    exit;
}

$errors = [];
$ok = false;
$defaults = [
    'db_host' => '127.0.0.1',
    'db_name' => 'lishang',
    'db_user' => 'root',
    'db_pass' => '',
    'site_name' => '礼尚往来',
    'default_currency' => 'CNY',
];

/* ---------- 环境检测 ---------- */
$env = [
    'php_version'   => PHP_VERSION_ID >= 70400,
    'pdo_mysql'     => extension_loaded('pdo_mysql'),
    'mbstring'      => extension_loaded('mbstring'),
    'writable_root' => is_writable(root_path()),
];
$env_ready = !in_array(false, $env, true);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    foreach (['db_host','db_name','db_user','db_pass','admin_password'] as $k) {
        $$k = trim((string)input($k, ''));
    }
    $site_name = trim((string)input('site_name', '礼尚往来'));
    $default_currency = trim((string)input('default_currency', 'CNY'));

    if (!$env_ready) $errors[] = '环境检测未通过，请先满足下方要求。';
    if ($db_host === '' || $db_name === '' || $db_user === '') $errors[] = '请填写完整的数据库信息。';
    if (strlen($admin_password) < 6) $errors[] = '管理员密码至少 6 位。';

    if (!$errors) {
        try {
            // 1) 先连服务器（不指定库），尝试建库
            $pdo = new PDO("mysql:host={$db_host};charset=utf8mb4", $db_user, $db_pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            ]);
            $pdo->exec("CREATE DATABASE IF NOT EXISTS `{$db_name}` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

            // 2) 连指定库，建表
            $pdo = new PDO("mysql:host={$db_host};dbname={$db_name};charset=utf8mb4", $db_user, $db_pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);
            foreach ($SCHEMA_SQL as $sql) {
                $pdo->exec($sql);
            }

            // 3) 写配置文件
            $site_key = random_key(32);
            $config_php = "<?php\nreturn [\n"
                . "  'installed' => true,\n"
                . "  'db_host' => " . var_export($db_host, true) . ",\n"
                . "  'db_name' => " . var_export($db_name, true) . ",\n"
                . "  'db_user' => " . var_export($db_user, true) . ",\n"
                . "  'db_pass' => " . var_export($db_pass, true) . ",\n"
                . "  'site_key' => " . var_export($site_key, true) . ",\n"
                . "];\n";
            $written = @file_put_contents(config_path(), $config_php);
            if ($written === false) {
                throw new RuntimeException('写入 config.php 失败，请检查目录写权限。');
            }

            // 4) 写入默认设置
            $ins = $pdo->prepare("INSERT INTO settings (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)");
            $ins->execute(['site_name', $site_name]);
            $ins->execute(['default_currency', $default_currency]);
            $ins->execute(['admin_password_hash', password_hash($admin_password, PASSWORD_DEFAULT)]);
            $ins->execute(['lang', 'zh']);
            $ins->execute(['inflation_rate', '3.0']);
            $rates = ['CNY'=>1,'USD'=>0.14,'HKD'=>1.09,'TWD'=>4.35,'EUR'=>0.13,'JPY'=>20.5];
            $ins->execute(['exchange_rates', json_encode($rates, JSON_UNESCAPED_UNICODE)]);

            $ok = true;
        } catch (Throwable $ex) {
            $errors[] = '安装失败：' . $ex->getMessage();
        }
    }
}
?>
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>安装 · 礼尚往来</title>
<link rel="stylesheet" href="assets/css/style.css">
</head>
<body class="install-body">
<div class="install-wrap">
  <div class="install-card">
    <div class="brand">
      <div class="brand-logo">礼</div>
      <div>
        <h1>礼尚往来</h1>
        <p class="brand-sub">礼品礼金记账 · 安装向导</p>
      </div>
    </div>

    <?php if ($ok): ?>
      <div class="alert success">安装成功！正在跳转登录…</div>
      <script>setTimeout(function(){ location.href='login.php'; }, 1200);</script>
    <?php else: ?>
      <?php if ($errors): ?>
        <div class="alert error"><?= e(implode('<br>', $errors)) ?></div>
      <?php endif; ?>

      <h2 class="step-title">1. 环境检测</h2>
      <ul class="env-list">
        <li class="<?= $env['php_version']?'ok':'bad' ?>">PHP ≥ 7.4（当前 <?= PHP_VERSION ?>）</li>
        <li class="<?= $env['pdo_mysql']?'ok':'bad' ?>">PDO MySQL 扩展</li>
        <li class="<?= $env['mbstring']?'ok':'bad' ?>">mbstring 扩展</li>
        <li class="<?= $env['writable_root']?'ok':'bad' ?>">根目录可写（用于生成 config.php）</li>
      </ul>

      <form method="post" class="install-form" <?= $env_ready?'':'disabled' ?>>
        <h2 class="step-title">2. 数据库配置</h2>
        <div class="grid-2">
          <label>数据库主机<input name="db_host" value="<?= e($defaults['db_host']) ?>" required></label>
          <label>数据库名<input name="db_name" value="<?= e($defaults['db_name']) ?>" required></label>
          <label>数据库用户名<input name="db_user" value="<?= e($defaults['db_user']) ?>" required></label>
          <label>数据库密码<input type="password" name="db_pass" value="<?= e($defaults['db_pass']) ?>" placeholder="无则留空"></label>
        </div>

        <h2 class="step-title">3. 站点与管理员</h2>
        <div class="grid-2">
          <label>站点名称<input name="site_name" value="<?= e($defaults['site_name']) ?>" required></label>
          <label>默认币种
            <select name="default_currency">
              <?php foreach (['CNY'=>'人民币 CNY','USD'=>'美元 USD','HKD'=>'港币 HKD','TWD'=>'新台币 TWD','EUR'=>'欧元 EUR','JPY'=>'日元 JPY'] as $c=>$n): ?>
                <option value="<?= $c ?>" <?= $c===$defaults['default_currency']?'selected':'' ?>><?= $n ?></option>
              <?php endforeach; ?>
            </select>
          </label>
          <label class="span-2">管理员密码（至少 6 位）<input type="password" name="admin_password" required minlength="6"></label>
        </div>

        <button type="submit" class="btn primary btn-block" <?= $env_ready?'':'disabled' ?>>开始安装</button>
        <p class="hint">安装程序会自动创建数据库与数据表，并在根目录生成 <code>config.php</code>。安装完成后建议删除或重命名本文件。</p>
      </form>
    <?php endif; ?>
  </div>
</div>
</body>
</html>
