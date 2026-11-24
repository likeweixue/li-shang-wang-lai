<?php
define('API_REQUEST', true);
require_once __DIR__ . '/../includes/auth.php';
require_auth();

$method = $_SERVER['REQUEST_METHOD'];
$action = input('action', '');

$SAFE_KEYS = ['site_name','lang','default_currency','inflation_rate','exchange_rates'];

/* ---------- GET 设置 ---------- */
if ($method === 'GET') {
    $s = get_settings();
    $out = [];
    foreach ($SAFE_KEYS as $k) $out[$k] = $s[$k] ?? null;
    $out['inflation_rate'] = (float)($out['inflation_rate'] ?? 3.0);
    $out['exchange_rates'] = is_array($out['exchange_rates']) ? $out['exchange_rates'] : ['CNY' => 1];
    json_response(['settings' => $out]);
}

/* ---------- POST 刷新汇率（联网） ---------- */
if ($method === 'POST' && $action === 'refresh_rates') {
    $base = get_setting('default_currency', 'CNY');
    $url = 'https://open.er-api.com/v6/latest/' . rawurlencode($base);
    $ctx = stream_context_create(['http' => ['timeout' => 8, 'ignore_errors' => true]]);
    $raw = @file_get_contents($url, false, $ctx);
    if (!$raw) json_response(['ok' => false, 'message' => '无法连接汇率服务，请检查服务器网络或稍后重试。'], 502);
    $data = json_decode($raw, true);
    if (empty($data['rates']) || !is_array($data['rates'])) {
        json_response(['ok' => false, 'message' => '汇率服务返回数据异常。'], 502);
    }
    // 只保留常用币种
    $keep = ['CNY','USD','HKD','TWD','EUR','JPY','GBP','KRW','SGD','AUD'];
    $rates = [];
    foreach ($keep as $c) {
        if (isset($data['rates'][$c])) $rates[$c] = round((float)$data['rates'][$c], 6);
    }
    $rates[$base] = 1;
    set_setting('exchange_rates', $rates);
    $GLOBALS['__settings_cache'] = null;
    json_response(['ok' => true, 'rates' => $rates, 'updated_at' => date('Y-m-d H:i:s')]);
}

/* ---------- PUT 更新设置 ---------- */
if ($method === 'PUT') {
    if (input('site_name') !== null) {
        $v = trim((string)input('site_name'));
        if ($v !== '') set_setting('site_name', $v);
    }
    if (input('lang') !== null) {
        $lang = (string)input('lang');
        if (in_array($lang, ['zh','tw','en'], true)) set_setting('lang', $lang);
    }
    if (input('default_currency') !== null) {
        $cur = (string)input('default_currency');
        if (preg_match('/^[A-Z]{3}$/', $cur)) set_setting('default_currency', $cur);
    }
    if (input('inflation_rate') !== null) {
        $rate = (float)input('inflation_rate');
        if ($rate >= 0 && $rate <= 100) set_setting('inflation_rate', (string)$rate);
    }
    if (input('exchange_rates') !== null) {
        $r = input('exchange_rates');
        if (is_array($r)) set_setting('exchange_rates', $r);
    }
    $newpw = input('admin_password', null);
    if ($newpw !== null && $newpw !== '') {
        if (strlen((string)$newpw) < 6) json_response(['error' => '密码至少 6 位'], 400);
        change_password((string)$newpw);
    }
    $GLOBALS['__settings_cache'] = null;
    json_response(['ok' => true]);
}

json_response(['error' => 'method_not_allowed'], 405);
