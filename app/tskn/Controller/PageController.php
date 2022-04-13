<?php
declare(strict_types=1);

namespace Tskn\Controller;

use RuntimeException;
use ChromePhpWrapper as Console;
use Tskn\Model\Project;
use Tskn\View\HtmlView;
use Tskn\Service\ProjectAuthorizer;

class PageController extends \Pherret\Controller {

    public function index() {
        $view = new HtmlView('index.html');
        $view->render();
    }

    public function create() {
        $view = new HtmlView('project-create.html');
        $view->render();
    }

    public function project(string $slug) {
        ProjectAuthorizer::init();

        $project = Project::getBySlug($slug);
        if (!($project instanceof Project)) {
            throw new RuntimeException('Project not found', 404);
        }

        if (ProjectAuthorizer::hasAuthorized($project)) {
            $view = new HtmlView('project.html');
        } else {
            $view = new HtmlView('project-auth.html');
        }
        $view->data['project'] = $project->getValues();
        $view->render();
    }
}