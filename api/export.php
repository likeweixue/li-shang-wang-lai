<?php
define('API_REQUEST', true);
require_once __DIR__ . '/../includes/auth.php';
require_auth();

/** 取某事件可见字段（按排序） */
function get_visible_fields($event_id) {
    $st = db()->prepare("SELECT field_key, label, type FROM fields WHERE event_id=? AND visible=1 ORDER BY sort_order ASC, id ASC");
    $st->execute([$event_id]);
    return $st->fetchAll();
}

function csv_out($filename, $rows) {
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    $out = fopen('php://output', 'w');
    // UTF-8 BOM，保证 Excel 正确识别中文
    fwrite($out, "\xEF\xBB\xBF");
    foreach ($rows as $r) {
        $line = [];
        foreach ($r as $c) {
            $line[] = is_array($c) ? implode(';', $c) : (string)$c;
        }
        fputcsv($out, $line);
    }
    fclose($out);
    exit;
}

$all = input('all');
$backup = input('backup');
$event_id = (int)input('event_id', 0);

/* ---------- 全量 JSON 备份 ---------- */
if ($backup) {
    $events = db()->query("SELECT * FROM events ORDER BY id")->fetchAll();
    $fields = db()->query("SELECT * FROM fields ORDER BY event_id, sort_order")->fetchAll();
    $records = db()->query("SELECT * FROM records ORDER BY id")->fetchAll();
    $dump = [
        'app' => '礼尚往来',
        'exported_at' => date('Y-m-d H:i:s'),
        'events' => $events,
        'fields' => $fields,
        'records' => $records,
    ];
    header('Content-Type: application/json; charset=utf-8');
    header('Content-Disposition: attachment; filename="lishang_backup_' . date('Ymd') . '.json"');
    echo json_encode($dump, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

/* ---------- 全部事件合并导出 ---------- */
if ($all) {
    $events = db()->query("SELECT id, name, event_date FROM events ORDER BY id")->fetchAll();
    if (!$events) {
        csv_out('lishang_all.csv', [['提示'], ['暂无数据']]);
    }
    // 取所有事件的可见字段并集
    $headers = ['所属活动'];
    $keyOrder = [];
    foreach ($events as $ev) {
        $fs = get_visible_fields((int)$ev['id']);
        foreach ($fs as $f) {
            if (!isset($keyOrder[$f['field_key']])) {
                $keyOrder[$f['field_key']] = $f['label'];
                $headers[] = $f['label'];
            }
        }
    }
    $rows = [$headers];
    foreach ($events as $ev) {
        $st = db()->prepare("SELECT `values` FROM records WHERE event_id=? ORDER BY id DESC");
        $st->execute([(int)$ev['id']]);
        foreach ($st->fetchAll() as $r) {
            $v = json_decode($r['values'], true);
            if (!is_array($v)) $v = [];
            $line = [$ev['name']];
            foreach ($keyOrder as $k => $lbl) {
                $line[] = $v[$k] ?? '';
            }
            $rows[] = $line;
        }
    }
    csv_out('lishang_all_' . date('Ymd') . '.csv', $rows);
}

/* ---------- 单事件导出 ---------- */
if ($event_id > 0) {
    $ev = db()->prepare("SELECT name, event_date FROM events WHERE id=?");
    $ev->execute([$event_id]);
    $event = $ev->fetch();
    if (!$event) {
        header('Location: index.php'); exit;
    }
    $fields = get_visible_fields($event_id);
    $headers = [];
    foreach ($fields as $f) $headers[] = $f['label'];
    $rows = [$headers ?: ['提示']];

    $st = db()->prepare("SELECT `values` FROM records WHERE event_id=? ORDER BY id DESC");
    $st->execute([$event_id]);
    foreach ($st->fetchAll() as $r) {
        $v = json_decode($r['values'], true);
        if (!is_array($v)) $v = [];
        $line = [];
        foreach ($fields as $f) {
            $line[] = $v[$f['field_key']] ?? '';
        }
        $rows[] = $line;
    }
    $safe = preg_replace('/[^\w\x{4e00}-\x{9fa5}]+/u', '_', $event['name']);
    csv_out($safe . '_' . date('Ymd') . '.csv', $rows);
}

header('Location: index.php');
