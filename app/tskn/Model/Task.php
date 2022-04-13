<?php
declare(strict_types=1);

namespace Tskn\Model;

use PDOException;
use ChromePhpWrapper as Console;
use Pherret\Database;

class Task extends \Pherret\Model {
    public const TABLE = 'task';
    public const DEFAULT_TITLE = '名称未設定タスク';

    public int $projectId;
    public int $createdAt;
    public ?int $modifiedAt = null;
    public string $color;
    public string $title;
    public int $time;

    protected static function inflate(&$instance, array $values) {
        parent::inflate($instance, $values);
        $instance->projectId = intval($values['project_id']);
        $instance->createdAt = intval($values['created_at']);
        $instance->modifiedAt = intval($values['modified_at']) ?: null;
        $instance->color = $values['color'];
        $instance->title = $values['title'];
        $instance->time = intval($values['time']);
    }

    protected static function deflate($instance, array &$values) {
        parent::deflate($instance, $values);
        $values['project_id'] = $instance->projectId;
        $values['created_at'] = $instance->createdAt;
        $values['modified_at'] = $instance->modifiedAt;
        $values['color'] = $instance->color;
        $values['title'] = $instance->title;
        $values['time'] = $instance->time;
    }

    public static function add($instance) {
        try {
            Database::beginTransaction();

            $instance->createdAt = time();
            $instanceAdded = parent::add($instance);

            $project = Project::getById($instanceAdded->projectId);
            Project::update($project);

            Database::commit();

            return $instanceAdded;
        } catch (PDOException $e) {
            Database::rollback();
            throw $e;
        }
    }

    public static function update($instance) {
        try {
            Database::beginTransaction();

            $instance->modifiedAt = time();
            $instanceUpdated = parent::update($instance);

            $project = Project::getById($instanceUpdated->projectId);
            Project::update($project);

            Database::commit();

            return $instanceUpdated;
        } catch (PDOException $e) {
            Database::rollback();
            throw $e;
        }
    }

    public static function delete($instance) {
        try {
            // transaction supressed due to Pherrets' malfunction (which should be corrected!)
            //Database::beginTransaction();

            $instanceDeleted = parent::delete($instance);
            //Console::log('task deleted:', $instanceDeleted);

            $project = Project::getById($instanceDeleted->projectId);
            if ($project instanceof Project) {
                Project::update($project);
            }

            //Database::commit();

            return $instanceDeleted;
        } catch (PDOException $e) {
            //Database::rollback();
            throw $e;
        }
    }

    public static function getByProjectId(int $projectId) {
        $q = sprintf('SELECT * FROM "%s" WHERE "project_id" = ?;', static::TABLE);
        return static::toInstanceArray(Database::query($q, [$projectId]));
    }
}