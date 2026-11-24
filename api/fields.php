<?php
define('API_REQUEST', true);
require_once __DIR__ . '/../includes/auth.php';
require_auth();

$method = $_SERVER['REQUEST_METHOD'];

function decode_options($row) {
    if (!empty($row['options'])) {
        $d = json_decode($row['options'], true);
        $row['options'] = is_array($d) ? $d : [];
    } else {
        $row['options'] = [];
    }
    $row['visible'] = (int)$row['visible'];
    $row['required'] = (int)$row['required'];
    $row['is_system'] = (int)$row['is_system'];
    $row['sort_order'] = (int)$row['sort_order'];
    return $row;
}

/* ---------- GET 字段列表 ---------- */
if ($method === 'GET') {
    $event_id = (int)input('event_id');
    if ($event_id <= 0) json_response(['error' => 'event_id_required'], 400);
    $rows = db()->prepare("SELECT * FROM fields WHERE event_id=? ORDER BY sort_order ASC, id ASC");
    $rows->execute([$event_id]);
    $list = array_map('decode_options', $rows->fetchAll());
    json_response(['fields' => $list]);
}

/* ---------- POST 新增字段 ---------- */
if ($method === 'POST') {
    $event_id = (int)input('event_id');
    $label = trim((string)input('label', ''));
    $type = (string)input('type', 'text');
    if ($event_id <= 0 || $label === '') json_response(['error' => 'invalid'], 400);
    $allowed = ['text','number','date','textarea','select'];
    if (!in_array($type, $allowed, true)) $type = 'text';
    $visible = input('visible') === null ? 1 : (int)input('visible');
    $required = (int)input('required', 0);
    $options = input('options', []);
    $opts = is_array($options) ? json_encode($options, JSON_UNESCAPED_UNICODE) : null;

    $max = db()->prepare("SELECT COALESCE(MAX(sort_order), -1) AS m FROM fields WHERE event_id=?");
    $max->execute([$event_id]);
    $sort = ((int)$max->fetch()['m']) + 1;

    $key = 'fld_' . substr(bin2hex(random_bytes(4)), 0, 8);
    db()->prepare("INSERT INTO fields (event_id, field_key, label, type, options, sort_order, visible, required, is_system)
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)")
        ->execute([$event_id, $key, $label, $type, $opts, $sort, $visible, $required]);
    json_response(['ok' => true, 'id' => (int)db()->lastInsertId(), 'field_key' => $key]);
}

/* ---------- PUT 更新 / 排序 ---------- */
if ($method === 'PUT') {
    // 批量排序：ids=[...]
    $ids = input('ids', null);
    if (is_array($ids) && !empty($ids)) {
        $stmt = db()->prepare("UPDATE fields SET sort_order=? WHERE id=?");
        $i = 0;
        foreach ($ids as $fid) {
            $stmt->execute([$i++, (int)$fid]);
        }
        json_response(['ok' => true]);
    }
    // 单个更新（局部更新：仅修改传入的字段，便于开关显示/必填）
    $id = (int)input('id');
    if ($id <= 0) json_response(['error' => 'id_required'], 400);

    $sets = [];
    $vals = [];

    $label = input('label', null);
    if ($label !== null) {
        $label = trim((string)$label);
        if ($label === '') json_response(['error' => 'label_required'], 400);
        $sets[] = 'label=?'; $vals[] = $label;
    }
    $type = input('type', null);
    if ($type !== null) {
        $allowed = ['text','number','date','textarea','select'];
        $sets[] = 'type=?'; $vals[] = in_array($type, $allowed, true) ? $type : 'text';
    }
    if (input('visible') !== null)  { $sets[] = 'visible=?';  $vals[] = (int)input('visible'); }
    if (input('required') !== null) { $sets[] = 'required=?'; $vals[] = (int)input('required'); }
    $options = input('options', null);
    if (is_array($options)) { $sets[] = 'options=?'; $vals[] = json_encode($options, JSON_UNESCAPED_UNICODE); }

    if (empty($sets)) json_response(['error' => 'nothing_to_update'], 400);
    $vals[] = $id;
    db()->prepare("UPDATE fields SET " . implode(',', $sets) . " WHERE id=?")->execute($vals);
    json_response(['ok' => true]);
}

/* ---------- DELETE 删除字段 ---------- */
if ($method === 'DELETE') {
    $id = (int)input('id');
    if ($id <= 0) json_response(['error' => 'id_required'], 400);
    // 系统字段禁止删除（但可隐藏）
    $row = db()->prepare("SELECT is_system FROM fields WHERE id=?");
    $row->execute([$id]);
    $r = $row->fetch();
    if (!$r) json_response(['error' => 'not_found'], 404);
    if ((int)$r['is_system'] === 1) json_response(['error' => 'system_field_cannot_delete'], 400);
    db()->prepare("DELETE FROM fields WHERE id=?")->execute([$id]);
    json_response(['ok' => true]);
}

json_response(['error' => 'method_not_allowed'], 405);
