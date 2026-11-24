<?php
/**
 * 公共引导：配置加载 / Session / JSON 入参兼容 / 响应助手 / 工具函数
 * 每个页面/接口先 require 本文件。
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
header('X-Content-Type-Options: nosniff');

/* ---------- 路径 ---------- */
function root_path() { return dirname(__DIR__); }
function config_path() { return root_path() . '/config.php'; }

/* ---------- 配置 ---------- */
function load_config() {
    static $cfg = null;
    if ($cfg === null) {
        $f = config_path();
        $cfg = is_file($f) ? (include $f) : [];
        if (!is_array($cfg)) $cfg = [];
    }
    return $cfg;
}

function is_installed() {
    $cfg = load_config();
    return !empty($cfg['installed']);
}

/* ---------- 兼容 application/json 请求体 → 并入 $_POST ---------- */
$__ct = $_SERVER['CONTENT_TYPE'] ?? ($_SERVER['HTTP_CONTENT_TYPE'] ?? '');
if (stripos($__ct, 'application/json') !== false) {
    $__raw = file_get_contents('php://input');
    if ($__raw) {
        $__data = json_decode($__raw, true);
        if (is_array($__data)) {
            $_POST    = array_merge($_POST, $__data);
            $_REQUEST = array_merge($_REQUEST, $__data);
        }
    }
}

/* ---------- 响应助手 ---------- */
function json_response($data, $code = 200) {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function input($key, $default = null) {
    return $_POST[$key] ?? $_GET[$key] ?? $default;
}

function is_ajax() {
    return (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest')
        || (defined('API_REQUEST') && API_REQUEST)
        || (stripos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== false);
}

/* ---------- 小工具 ---------- */
function e($s) { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }

function random_key($len = 32) {
    return bin2hex(random_bytes($len / 2));
}

/** 金额安全转换 */
function to_decimal($v) {
    if ($v === null || $v === '') return null;
    $v = preg_replace('/[^0-9.\-]/', '', (string)$v);
    if ($v === '' || $v === '-' || $v === '.') return null;
    return number_format((float)$v, 2, '.', '');
}
