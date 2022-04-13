<?php
declare(strict_types=1);

namespace Tskn\Service;

use ChromePhpWrapper as Console;
use Tskn\Model\Project;

class ProjectAuthorizer {
    const SESSION_KEY = 'authorizedProjectIds';

    public static function init() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        Console::log('authorized projects:', $_SESSION[self::SESSION_KEY]);
    }

    private static function check() {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            throw new \RuntimeException('Service has not been properly initiated');
        }
    }

    private static function add(Project $project) {
        self::check();
        $_SESSION[self::SESSION_KEY][] = $project->id;
    }

    private static function has(Project $project) {
        self::check();
        if (empty($_SESSION[self::SESSION_KEY])) {
            return false;
        }
        return in_array($project->id, $_SESSION[self::SESSION_KEY], true);
    }

    private static function delete(Project $project) {
        self::check();
        if (self::has($project)) {
            $index = array_search($project->id, $_SESSION[self::SESSION_KEY], true);
            unset($_SESSION[self::SESSION_KEY][$index]);
        }
    }

    public static function authorize(Project $project) {
        if (self::has($project)) {
            return;
        }
        self::add($project);
    }

    public static function unauthorize(Project $project) {
        self::delete($project);
    }

    public static function hasAuthorized(Project $project) {
        return self::has($project);
    }

    public static function getAuthorizedIds() {
        return $_SESSION[self::SESSION_KEY];
    }
}