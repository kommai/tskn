<?php
declare(strict_types=1);

namespace Tskn\Controller;

use RuntimeException;
use Tskn\Model\Project;
use Tskn\Service\ProjectAuthorizer;

trait ApiTrait {
    public static function requireProjectAuthorized(int $projectId) {
        ProjectAuthorizer::init();

        $project = Project::getById($projectId);
        if (!($project instanceof Project)) {
            throw new RuntimeException("Project #{$projectId} does not exist", 410);
        }
        if (!ProjectAuthorizer::hasAuthorized($project)) {
            throw new RuntimeException('You have no access to this operation', 403);
        }
    }
}