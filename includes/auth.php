<?php
/**
 * 鉴权：登录 / 登出 / 登录校验
 */

require_once __DIR__ . '/bootstrap.php';
require_once __DIR__ . '/db.php';

function current_user() {
    return empty($_SESSION['uid']) ? null : $_SESSION['uid'];
}

function require_auth() {
    if (!current_user()) {
        if (is_ajax()) {
            json_response(['error' => 'unauthorized', 'message' => '请先登录'], 401);
        }
        header('Location: login.php');
        exit;
    }
}

function do_login($password) {
    $hash = get_setting('admin_password_hash', '');
    if (!$hash) {
        return false;
    }
    if (password_verify((string)$password, $hash)) {
        session_regenerate_id(true);
        $_SESSION['uid'] = 1;
        $_SESSION['login_at'] = time();
        return true;
    }
    return false;
}

function do_logout() {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }
    session_destroy();
}

function change_password($newPassword) {
    set_setting('admin_password_hash', password_hash($newPassword, PASSWORD_DEFAULT));
}
