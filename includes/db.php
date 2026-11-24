<?php
/**
 * PDO 数据库单例 + 设置读写
 */
require_once __DIR__ . '/schema.php';

function db() {
    static $pdo = null;
    if ($pdo === null) {
        $cfg = load_config();
        if (empty($cfg['installed'])) {
            json_response(['error' => 'not_installed'], 500);
        }
        $dsn = 'mysql:host=' . $cfg['db_host'] . ';dbname=' . $cfg['db_name'] . ';charset=utf8mb4';
        try {
            $pdo = new PDO($dsn, $cfg['db_user'], $cfg['db_pass'], [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        } catch (PDOException $e) {
            json_response(['error' => 'db_connect_failed', 'message' => $e->getMessage()], 500);
        }
    }
    return $pdo;
}

/* ---------- 设置（key-value，支持 JSON） ---------- */
$GLOBALS['__settings_cache'] = null;

function get_settings() {
    if ($GLOBALS['__settings_cache'] === null) {
        $cache = [];
        try {
            $rows = db()->query("SELECT k, v FROM settings")->fetchAll();
            foreach ($rows as $r) {
                $v = $r['v'];
                if ($v !== null && $v !== '' && ($v[0] === '{' || $v[0] === '[')) {
                    $decoded = json_decode($v, true);
                    $cache[$r['k']] = ($decoded === null) ? $v : $decoded;
                } else {
                    $cache[$r['k']] = $v;
                }
            }
        } catch (Throwable $e) {
            $cache = [];
        }
        $GLOBALS['__settings_cache'] = $cache;
    }
    return $GLOBALS['__settings_cache'];
}

function get_setting($k, $default = null) {
    $s = get_settings();
    return array_key_exists($k, $s) ? $s[$k] : $default;
}

function set_setting($k, $v) {
    $val = is_array($v) ? json_encode($v, JSON_UNESCAPED_UNICODE) : (string)$v;
    db()->prepare("INSERT INTO settings (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)")
        ->execute([$k, $val]);
    $GLOBALS['__settings_cache'] = null;
}

/** 执行全部建表语句 */
function run_schema() {
    global $SCHEMA_SQL;
    require_once __DIR__ . '/schema.php';
    foreach ($SCHEMA_SQL as $sql) {
        db()->exec($sql);
    }
}
