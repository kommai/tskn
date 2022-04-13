<?php
declare(strict_types=1);

namespace Tskn\Controller;

use ChromePhpWrapper as Console;
//use Tskn\Model\TestModel;
//use Tskn\View\HtmlView;
use Tskn\Model\Project;
use Tskn\View\JsonView;

class TestController extends \Pherret\Controller
{
    public function index()
    {
        //echo __CLASS__ . ' works!';
        $projects = Project::getAll();
        $view = new JsonView();
        $view->data = $projects;
        $view->render();
    }
}
