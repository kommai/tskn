import { Blocker } from '../vendor/kommai/dist/kommai.js';
//import { ProjectApi } from './api/project.js';
import { ErrorHandler } from './component/error-handler.js';
import { Auth as AuthComponent } from './component/project-auth.js';
import { ProjectController } from './controller/project.js';
import { ProjectHelper } from './helper/project.js';

(async () => {
    try {
        Blocker.open();

        const project = await ProjectHelper.getProjectFromUrl(location);
        console.log('project to auth:', project);

        ProjectController.setProject(project);



    } catch (error) {
        ErrorHandler.handle(error);
    } finally {
        Blocker.close();
    }
})();