<?php
declare(strict_types=1);

namespace Tskn\Controller;

use RuntimeException;
use ChromePhpWrapper as Console;
use Tskn\Model\Project;
use Tskn\Model\Task;
use Tskn\View\JsonView;
use Tskn\Controller\ApiTrait;

class TaskController extends \Pherret\Controller {

    use ApiTrait;

    public function belongsTo(int $projectId) {
        $tasks = Task::getByProjectId($projectId);
        $view = new JsonView();
        foreach ($tasks as $task) {
            $view->data[] = $task->getValues();
        }
        $view->setHeader('Cache-Control', 'no-store');
        //sleep(1);
        $view->render();
    }

    public function update(int $id) {

        self::requireProjectAuthorized(intval($_POST['projectId']));

        $task = Task::getById($id);
        if (!($task instanceof Task)) {
            throw new \RuntimeException("Task #{$id} does not exist", 410);
        }
        //Console::log('task to update:', $task);
        //Console::log('post data:', $_POST);

        // TODO: validation!
        //$task->color = $_POST['color'] ?? ''; // no, color is unchangeable
        $task->title = $_POST['title'] ?? '';
        $task->time = intval($_POST['time']);
        $taskUpdated = Task::update($task);

        $view = new JsonView();
        $view->setHeader('Cache-Control', 'no-store');
        $view->data = $taskUpdated->getValues();
        //sleep(1);
        $view->render();
    }

    public function create() {

        self::requireProjectAuthorized(intval($_POST['projectId']));

        Console::log('post data:', $_POST);
        $task = new Task();
        // TODO: validation!
        $task->projectId = intval($_POST['projectId']);
        //$task->projectId = $projectId;
        $task->color = $_POST['color'] ?? 'black';
        $task->title = $_POST['title'] ?? '';
        $task->time = intval($_POST['time']);
        $taskAdded = Task::add($task);

        $view = new JsonView();
        $view->setHeader('Cache-Control', 'no-store');
        $view->data = $taskAdded->getValues();
        $view->render();
    }

    public function destroy(int $id) {

        Console::log('deleting task #', $id, $_POST);
        self::requireProjectAuthorized(intval($_POST['projectId']));

        $task = Task::getById($id);
        if (!($task instanceof Task)) {
            throw new \RuntimeException("Task #{$id} does not exist", 410);
        }
        Task::delete($task);

        $view = new JsonView();
        $view->setHeader('Cache-Control', 'no-store');
        $view->data = $task->getValues();
        $view->render();

        // returns even if the target doesn't exist
        /*
        $taskDeleted = ($task instanceof Task) ? Task::delete($task) : null;

        $view = new JsonView();
        $view->setHeader('Cache-Control', 'no-store');
        $view->data = ($taskDeleted instanceof Task) ? $taskDeleted->getValues() : null;
        $view->render();
        */
    }
}