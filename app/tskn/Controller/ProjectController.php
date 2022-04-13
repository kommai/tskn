<?php
declare(strict_types=1);

namespace Tskn\Controller;

use ChromePhpWrapper as Console;
use Pherret\Config;
use RuntimeException;
use Tskn\Model\Project;
use Tskn\Model\Task;
use Tskn\View\HtmlView;
use Tskn\View\JsonView;
use Tskn\Service\ProjectAuthorizer;
use Tskn\Controller\ApiTrait;

class ProjectController extends \Pherret\Controller {

    use ApiTrait;

    public function authorize(int $id) {

        //session_start();
        ProjectAuthorizer::init();

        $project = Project::getById($id);
        if (!($project instanceof Project)) {
            throw new \RuntimeException("Project #{$id} does not exist", 410);
        }

        $key = $_POST['key'];
        Console::group('verifying');
        Console::log('project:', $project);
        Console::log('key:', $key);
        Console::groupEnd();
        if (password_verify($key, $project->lock)) {
            ProjectAuthorizer::authorize($project);
            $data = $project->getValues();
        } else {
            $data = false;
        }

        //Console::log('$_SESSION:', $_SESSION);

        $view = new JsonView();
        $view->setHeader('Cache-Control', 'no-store');
        $view->data = $data;
        unset($view->data['lock']);
        $view->render();
    }

    public function unauthorize(int $id) {
        ProjectAuthorizer::init();

        $project = Project::getById($id);
        if (!($project instanceof Project)) {
            throw new \RuntimeException("Project #{$id} does not exist", 410);
        }

        ProjectAuthorizer::unauthorize($project);

        $view = new JsonView();
        $view->setHeader('Cache-Control', 'no-store');
        $view->data = $project->getValues();
        unset($view->data['lock']);
        $view->render();
    }

    /*
    public function all() {
        $projects = Project::getAll();
        Console::log($projects);

        $view = new JsonView();
        $view->setHeader('Cache-Control', 'no-store');
        $view->data = $projects;
        $view->render();
    }
    */

    public function one(int $id) {
        $project = Project::getById($id);
        if (!($project instanceof Project)) {
            throw new \RuntimeException('Project not found', 404);
        }
        $tasks = Task::getByProjectId($id);
        $timeInTotal = 0;
        foreach ($tasks as $task) {
            $timeInTotal += $task->time;
        }

        $view = new JsonView();
        $view->setHeader('Cache-Control', 'no-store');
        $view->data = array_merge($project->getValues(), ['timeInTotal' => $timeInTotal]);
        unset($view->data['lock']);
        $view->render();
    }

    public function slug(string $slug) {
        $project = Project::getBySlug($slug);
        if (!($project instanceof Project)) {
            throw new \RuntimeException('Project not found', 404);
        }
        $tasks = Task::getByProjectId($project->id);
        $timeInTotal = 0;
        foreach ($tasks as $task) {
            $timeInTotal += $task->time;
        }

        //throw new RuntimeException('Teapot', 418);
        //throw new RuntimeException('Test');
        //sleep(2);

        $view = new JsonView();
        $view->setHeader('Cache-Control', 'no-store');
        $view->data = array_merge($project->getValues(), ['timeInTotal' => $timeInTotal]);
        $view->render();
    }

    public function create() {
        Console::log('posted data:', $_POST);
        $project = new Project();
        $project->slug = Project::generateSlug();
        $project->title = $_POST['title'] ?? Project::DEFAULT_TITLE;
        $project->lock = password_hash($_POST['key'], PASSWORD_DEFAULT);
        $projectAdded = Project::add($project);

        $view = new JsonView();
        $view->setHeader('Cache-Control', 'no-store');
        $view->data = $projectAdded->getValues();
        $view->render();
    }

    public function update(int $id) {
        self::requireProjectAuthorized($id);

        $project = Project::getById($id);
        if (!($project instanceof Project)) {
            throw new \RuntimeException("Project #{$id} does not exist", 410);
        }

        // TODO: validation!
        $project->title = $_POST['title'] ?? '';
        if (isset($_POST['key'])) {
            $project->lock = password_hash($_POST['key'], PASSWORD_DEFAULT);
        }
        $projectUpdated = Project::update($project);

        $view = new JsonView();
        $view->setHeader('Cache-Control', 'no-store');
        $view->data = $projectUpdated->getValues();
        unset($view->data['lock']);
        //sleep(1);
        $view->render();
    }

    public function destroy(int $id) {
        Console::group(__METHOD__);
        Console::log('project id:'. $id);
        self::requireProjectAuthorized($id);

        ProjectAuthorizer::init();

        $project = Project::getById($id);
        Console::log('project', $project);
        if (!($project instanceof Project)) {
            throw new \RuntimeException("Project #{$id} does not exist", 410);
        }

        $key = $_POST['key'];
        Console::group('verifying');
        Console::log('project:', $project);
        Console::log('key:', $key);
        Console::groupEnd();
        if (password_verify($key, $project->lock)) {
            Console::log('key verified!');
            ProjectAuthorizer::unauthorize($project);
            Console::log('project unauthorized. left:', ProjectAuthorizer::getAuthorizedIds());
            try {
                $projectDeleted = Project::delete($project);
            } catch (\Exception $e) {
                Console::error($e);
            }
            Console::log('project deleted:', $projectDeleted);
            $data = $projectDeleted->getValues();
            unset($data['lock']);
        } else {
            Console::log('key denied');
            $data = false;
        }

        $view = new JsonView();
        $view->setHeader('Cache-Control', 'no-store');
        $view->data = $data;
        $view->render();
        Console::groupEnd();
    }
}