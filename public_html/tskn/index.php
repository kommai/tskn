<?php
declare(strict_types=1);

use ChromePhpWrapper as Console;
use Pherret\App;
use Pherret\Config;
use Pherret\Database;
use Tskn\View\HtmlView;
use Tskn\Service\Logger;

require_once __DIR__ . '/../../vendor/autoload.php';

ob_start();

$start = microtime(true);

$config = [
    'production' => __DIR__ . '/../../config/tskn/production.json',
    'dev' => __DIR__ . '/../../config/tskn/dev.json'
];
Config::load($config['production']);
if (file_exists($config['dev'])) {
    Config::load($config['dev']);
}
HtmlView::setDirectory(Config::get('path') . '/app/tskn/Html');
HtmlView::setForceReparse(Config::get('debug'));
Database::setConnection(new PDO(Config::get('dsn')));
Console::setEnabled(Config::get('debug'));



// error handler
App::setErrorHandler(function (Exception $e) {
    $error = [
        'file' => $e->getFile(),
        'line' => $e->getLine(),
        'code' => $e->getCode(),
        'message' => $e->getMessage(),
        'exception' => get_class($e),
        'trace' => $e->getTraceAsString(),
        'level' => (empty($e->getCode()) || $e->getCode() === 500) ? 'ERROR' : 'WARNING'
    ];
    if ($error['code'] !== 404) {
        Logger::log($error['level'], $error['message'], $error['file'], $error['line'], $error['code']);
    }
    $debug = Config::get('debug');
    $ajax = isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest';
    $code = $error['code'];
    switch ($code) {
        case 400:
            $excuse = '不正なリクエストです。';
            break;
        case 401:
        case 403:
            $excuse = $ajax ? 'アクセス権限がありません。' : 'このページを表示する権限がありません。';
            break;
        case 404:
            $excuse = $ajax ? '存在しないAPIです。' : 'ページが見つかりません。';
            break;
        default:
            $code = 500;
            $excuse = '現在システムに障害が発生しております。';
    }
    http_response_code($code);
    if ($ajax) {
        $response = ['error' => $excuse];
        if ($debug) $response['debug'] = $error;
        header('Content-Type: application/json');
        echo json_encode($response);
    } else {
        header('Content-Type: text/html');
        echo "{$code} {$excuse}";
    }
    exit;
});



// routing

App::route('GET', '/^$/', function () {
    (new \Tskn\Controller\PageController())->index();
});
App::route('GET', '/^(\w+)$/', function ($slug) {
    //(new \Tskn\Controller\ProjectController())->index($slug);
    (new \Tskn\Controller\PageController())->project($slug);
});
App::route('GET', '/^new$/', function () {
    (new \Tskn\Controller\PageController())->create();
});




App::route('POST', '/^api\/project\/create$/', function () {
    (new \Tskn\Controller\ProjectController())->create();
});
App::route('POST', '/^api\/project\/update\/(\d+)$/', function ($id) {
    (new \Tskn\Controller\ProjectController())->update(intval($id));
});
App::route('POST', '/^api\/project\/destroy\/(\d+)$/', function ($id) {
    (new \Tskn\Controller\ProjectController())->destroy(intval($id));
});
App::route('POST', '/^api\/project\/auth\/(\d+)$/', function ($id) {
    (new \Tskn\Controller\ProjectController())->authorize(intval($id));
});
App::route('POST', '/^api\/project\/unauth\/(\d+)$/', function ($id) {
    (new \Tskn\Controller\ProjectController())->unauthorize(intval($id));
});
App::route('GET', '/^api\/project\/one\/(\d+)$/', function ($id) {
    (new \Tskn\Controller\ProjectController())->one(intval($id));
});
App::route('GET', '/^api\/project\/slug\/(\w+)$/', function ($slug) {
    (new \Tskn\Controller\ProjectController())->slug($slug);
});





App::route('GET', '/^api\/task\/belongs-to\/(\d+)$/', function ($projectId) {
    //sleep(1);
    (new \Tskn\Controller\TaskController())->belongsTo(intval($projectId));
});
App::route('POST', '/^api\/task\/create$/', function () {
    (new \Tskn\Controller\TaskController())->create();
});
App::route('POST', '/^api\/task\/update\/(\d+)$/', function ($taskId) {
    (new \Tskn\Controller\TaskController())->update(intval($taskId));
});
App::route('POST', '/^api\/task\/destroy\/(\d+)$/', function ($taskId) {
    (new \Tskn\Controller\TaskController())->destroy(intval($taskId));
});






if (Config::get('debug')) {
    App::route('GET', '/^test$/', function () {
        sleep(1);
        (new \Tskn\Controller\TestController())->index();
    });
}

App::run();



$end = microtime(true);
$mem = memory_get_peak_usage();
Console::log(sprintf("\n%.2f msec / %.2f kb / %d file(s)\n", ($end - $start) * 1000, $mem / 1000, count(get_included_files())));

ob_end_flush();
