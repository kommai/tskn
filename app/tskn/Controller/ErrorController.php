<?php
declare(strict_types=1);

namespace Tskn\Controller;

use Pherret\Config;
use Tskn\View\JsonView;

// who's using this?
class ErrorController extends \Pherret\Controller {
    public function abort(\Exception $e) {
        http_response_code($e->getCode() ?? 500);

        // TODO: better error response
        if ($e->getCode() === 404) {
            echo '404 Not Found';
        } else {
            $view = new JsonView();
            $view->data['error']['code'] = $e->getCode();
            $view->data['error']['message'] = $e->getMessage();

            if (Config::get('debug')) {
                $view->data['error']['file'] = $e->getFile();
                $view->data['error']['line'] = $e->getLine();
                $view->data['error']['exception'] = get_class($e);
                $view->data['error']['trace'] = $e->getTraceAsString();
            }

            $view->setHeader('Cache-Control', 'no-store');
            $view->render();
        }
    }
}
