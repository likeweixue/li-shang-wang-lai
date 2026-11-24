<?php
define('API_REQUEST', true);
require_once __DIR__ . '/../includes/auth.php';

$action = input('action', '');

if ($action === 'login') {
    $pw = (string)input('password', '');
    if ($pw !== '' && do_login($pw)) {
        json_response(['ok' => true]);
    }
    json_response(['ok' => false, 'message' => '密码错误'], 401);
}

require_auth();

if ($action === 'logout') {
    do_logout();
    json_response(['ok' => true]);
}
if ($action === 'check') {
    json_response(['ok' => true, 'uid' => current_user()]);
}
json_response(['error' => 'unknown_action'], 400);
