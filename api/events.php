<?php
define('API_REQUEST', true);
require_once __DIR__ . '/../includes/auth.php';
require_auth();

$method = $_SERVER['REQUEST_METHOD'];

/* ---------- 工具：把金额按汇率折算为默认币种（CNY 口径） ---------- */
function to_default_cny($amount, $currency) {
    if ($amount === null || $amount === '') return 0.0;
    $rates = get_setting('exchange_rates', ['CNY' => 1]);
    $cur = $currency ?: 'CNY';
    $rate = isset($rates[$cur]) ? (float)$rates[$cur] : 0;
    if ($rate <= 0) return 0.0;
    return (float)$amount / $rate; // rates 存的是 “1 CNY = X 外币”
}

/* ---------- GET 列表 ---------- */
if ($method === 'GET') {
    $events = db()->query("SELECT * FROM events ORDER BY COALESCE(event_date, created_at) DESC, id DESC")->fetchAll();
    $recs = db()->query("SELECT event_id, amount, currency FROM records")->fetchAll();

    $agg = [];
    foreach ($recs as $r) {
        $eid = (int)$r['event_id'];
        if (!isset($agg[$eid])) $agg[$eid] = ['count' => 0, 'total' => 0.0];
        $agg[$eid]['count']++;
        $agg[$eid]['total'] += to_default_cny($r['amount'], $r['currency']);
    }
    foreach ($events as &$e) {
        $eid = (int)$e['id'];
        $e['record_count'] = $agg[$eid]['count'] ?? 0;
        $e['total_amount'] = round($agg[$eid]['total'] ?? 0, 2);
    }
    unset($e);
    json_response(['events' => $events]);
}

/* ---------- POST 新建 ---------- */
if ($method === 'POST') {
    $name = trim((string)input('name', ''));
    if ($name === '') json_response(['error' => 'name_required'], 400);
    $event_date = input('event_date', null) ?: null;
    $remark = (string)input('remark', '');
    db()->prepare("INSERT INTO events (name, event_date, remark) VALUES (?, ?, ?)")
        ->execute([$name, $event_date, $remark]);
    $id = (int)db()->lastInsertId();

    // 复制默认字段
    $fields = default_fields();
    $sort = 0;
    $stmt = db()->prepare("INSERT INTO fields (event_id, field_key, label, type, options, sort_order, visible, required, is_system)
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    foreach ($fields as $f) {
        $opts = $f['options'] ? json_encode($f['options'], JSON_UNESCAPED_UNICODE) : null;
        $stmt->execute([$id, $f['field_key'], $f['label'], $f['type'], $opts, $sort++, $f['visible'], $f['required'], $f['is_system']]);
    }
    json_response(['ok' => true, 'id' => $id]);
}

/* ---------- PUT 更新 ---------- */
if ($method === 'PUT') {
    $id = (int)input('id');
    if ($id <= 0) json_response(['error' => 'id_required'], 400);
    $name = trim((string)input('name', ''));
    if ($name === '') json_response(['error' => 'name_required'], 400);
    $event_date = input('event_date', null) ?: null;
    $remark = (string)input('remark', '');
    db()->prepare("UPDATE events SET name=?, event_date=?, remark=? WHERE id=?")
        ->execute([$name, $event_date, $remark, $id]);
    json_response(['ok' => true]);
}

/* ---------- DELETE 删除 ---------- */
if ($method === 'DELETE') {
    $id = (int)input('id');
    if ($id <= 0) json_response(['error' => 'id_required'], 400);
    db()->prepare("DELETE FROM records WHERE event_id=?")->execute([$id]);
    db()->prepare("DELETE FROM fields WHERE event_id=?")->execute([$id]);
    db()->prepare("DELETE FROM events WHERE id=?")->execute([$id]);
    json_response(['ok' => true]);
}

json_response(['error' => 'method_not_allowed'], 405);
