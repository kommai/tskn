<?php
declare(strict_types=1);

namespace Tskn\Service;

use Tskn\Model\Log;

class Logger {
    /**
     * @param string $level
     * @param string $message
     * @param string|null $file
     * @param int|null $line
     * @param int|null $code
     * @return Log
     */
    public static function log($level, $message, $file = null, $line = null, $code = null)
    {
        $backtrace = debug_backtrace();
        $log = new Log;
        $log->ip = $_SERVER['REMOTE_ADDR'];
        $log->client = $_SERVER['HTTP_USER_AGENT'];
        $log->file = isset($file) ? $file : $backtrace[0]['file'];
        $log->line = isset($line) ? $line : $backtrace[0]['line'];
        $log->level = strtoupper($level);
        $log->code = $code ?: null;
        $log->message = $message;
        return Log::add($log);
    }
}