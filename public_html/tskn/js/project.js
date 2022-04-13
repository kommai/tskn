import { Sidebar, Blocker } from '../vendor/kommai/dist/kommai.js';
import { ProjectTitle as TitleComponent } from './component/project-title.js';
import { Chart as ChartComponent } from './component/project-chart.js';
import { Tasks as TasksComponent } from './component/project-tasks.js';
import { ProjectWelcomeDialog } from './component/project-welcome-dialog.js';
import { TaskController } from './controller/task.js';
import { ProjectController } from './controller/project.js';
//import { ProjectApi } from './api/project.js';
import { TaskApi } from './api/task.js';
import { ErrorHandler } from './component/error-handler.js';
import { ProjectHelper } from './helper/project.js';
import './global.js';
import './component/sidebar.js';

(async () => {
    try {
        Blocker.open();

        const project = await ProjectHelper.getProjectFromUrl(location);
        //console.log('project fetched:', project);
        const tasks = await TaskApi.getTasksForProject(project);
        //console.log('tasks fetched:', tasks);

        ProjectController.setProject(project);
        TaskController.setTasks(tasks);

        TitleComponent.setProject(project).updateProject(project);
        ChartComponent.update();
        TasksComponent.setInitialTasks(tasks);

        if (!project.modifiedAt) {
            ProjectWelcomeDialog.open();
        }
    } catch (error) {
        ErrorHandler.handle(error);
    } finally {
        Blocker.close();
    }
})();
