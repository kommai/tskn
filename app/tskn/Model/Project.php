<?php
declare(strict_types=1);

namespace Tskn\Model;

use PDOException;
use ChromePhpWrapper as Console;
use Pherret\Database;

class Project extends \Pherret\Model {
    public const TABLE = 'project';
    private const SLUG_LENGTH = 8;
    public const DEFAULT_TITLE = '名称未設定プロジェクト';

    public int $createdAt;
    public ?int $modifiedAt = null;
    public string $slug;
    public string $title;
    public string $lock;

    protected static function inflate(&$instance, array $values) {
        parent::inflate($instance, $values);
        $instance->createdAt = intval($values['created_at']);
        $instance->modifiedAt = intval($values['modified_at']) ?: null;
        $instance->slug = $values['slug'];
        $instance->title = $values['title'];
        $instance->lock = $values['lock'];
    }

    protected static function deflate($instance, array &$values) {
        parent::deflate($instance, $values);
        $values['created_at'] = $instance->createdAt;
        $values['modified_at'] = $instance->modifiedAt;
        $values['slug'] = $instance->slug;
        $values['title'] = $instance->title;
        $values['lock'] = $instance->lock;
    }

    public static function generateSlug()
    {
        while (true) {
            $slug = '';
            $chars = '0123456789abcdefghijklmnopqrstuvwxyz';
            //$chars = '0123456789';
            $charLength = strlen($chars);
            for ($i = 0; $i < static::SLUG_LENGTH; $i++) {
                $slug .= $chars[random_int(0, $charLength - 1)];
            }
            if (!(static::getBySlug($slug) instanceof static)) {
                return $slug;
            }
        }
    }

    public static function add($instance) {
        $instance->createdAt = time();
        return parent::add($instance);
    }

    public static function update($instance) {
        $instance->modifiedAt = time();
        return parent::update($instance);
    }

    public static function delete($instance) {
        try {
            Database::beginTransaction();

            $projectDeleted = parent::delete($instance);

            $tasks = Task::getByProjectId($projectDeleted->id);
            foreach ($tasks as $task) {
                Task::delete($task);
            }

            Database::commit();
            return $projectDeleted;
        } catch (PDOException $e) {
            Database::rollback();
            throw $e;
        }
    }

    public static function getBySlug(string $slug)
    {
        $q = sprintf('SELECT * FROM "%s" WHERE "slug" = ?;', static::TABLE);
        return static::toInstance(Database::query($q, [$slug]));
    }
}