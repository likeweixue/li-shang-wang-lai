<?php
define('API_REQUEST', true);
require_once __DIR__ . '/../includes/auth.php';
require_auth();

$method = $_SERVER['REQUEST_METHOD'];

function decode_records($rows) {
    foreach ($rows as &$r) {
        $v = json_decode($r['values'], true);
        $r['values'] = is_array($v) ? $v : [];
        $r['amount'] = $r['amount'] !== null ? (float)$r['amount'] : null;
    }
    return $rows;
}

function mirror_values($values) {
    if (!is_array($values)) $values = [];
    return [
        'amount'      => to_decimal($values['amount'] ?? null),
        'currency'    => (!empty($values['currency'])) ? (string)$values['currency'] : null,
        'record_date' => (!empty($values['record_date'])) ? (string)$values['record_date'] : null,
    ];
}

/* ---------- GET 列表（同时返回该事件字段） ---------- */
if ($method === 'GET') {
    $event_id = (int)input('event_id');
    if ($event_id <= 0) json_response(['error' => 'event_id_required'], 400);
    $q = trim((string)input('q', ''));

    // 字段
    $fst = db()->prepare("SELECT * FROM fields WHERE event_id=? ORDER BY sort_order ASC, id ASC");
    $fst->execute([$event_id]);
    $fields = array_map(function ($row) {
        $row['options'] = !empty($row['options']) ? (json_decode($row['options'], true) ?: []) : [];
        $row['visible'] = (int)$row['visible'];
        $row['required'] = (int)$row['required'];
        $row['is_system'] = (int)$row['is_system'];
        $row['sort_order'] = (int)$row['sort_order'];
        return $row;
    }, $fst->fetchAll());

    // 记录
    $sql = "SELECT * FROM records WHERE event_id=?";
    $args = [$event_id];
    if ($q !== '') {
        $sql .= " AND `values` LIKE ?";
        $args[] = '%' . $q . '%';
    }
    $sql .= " ORDER BY id DESC";
    $st = db()->prepare($sql);
    $st->execute($args);
    $records = decode_records($st->fetchAll());

    json_response(['fields' => $fields, 'records' => $records]);
}

/* ---------- POST 新增 ---------- */
if ($method === 'POST') {
    $event_id = (int)input('event_id');
    $values = input('values', []);
    if ($event_id <= 0) json_response(['error' => 'event_id_required'], 400);
    if (!is_array($values)) $values = [];
    $m = mirror_values($values);
    db()->prepare("INSERT INTO records (event_id, `values`, amount, currency, record_date) VALUES (?, ?, ?, ?, ?)")
        ->execute([$event_id, json_encode($values, JSON_UNESCAPED_UNICODE), $m['amount'], $m['currency'], $m['record_date']]);
    json_response(['ok' => true, 'id' => (int)db()->lastInsertId()]);
}

/* ---------- PUT 更新 ---------- */
if ($method === 'PUT') {
    $id = (int)input('id');
    if ($id <= 0) json_response(['error' => 'id_required'], 400);
    $values = input('values', []);
    if (!is_array($values)) $values = [];
    $m = mirror_values($values);
    db()->prepare("UPDATE records SET `values`=?, amount=?, currency=?, record_date=? WHERE id=?")
        ->execute([json_encode($values, JSON_UNESCAPED_UNICODE), $m['amount'], $m['currency'], $m['record_date'], $id]);
    json_response(['ok' => true]);
}

/* ---------- DELETE ---------- */
if ($method === 'DELETE') {
    $id = (int)input('id');
    if ($id <= 0) json_response(['error' => 'id_required'], 400);
    db()->prepare("DELETE FROM records WHERE id=?")->execute([$id]);
    json_response(['ok' => true]);
}

json_response(['error' => 'method_not_allowed'], 405);
