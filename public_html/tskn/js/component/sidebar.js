import { ProjectController } from '../controller/project.js';
import { ProjectApi } from '../api/project.js';
import { ProjectDeleteDialog } from './project-delete-dialog.js';
import { ProjectRenameDialog } from './project-rename-dialog.js';
import { ProjectKeyDialog } from './project-key-dialog.js';
import { ProjectShareDialog } from './project-share-dialog.js';

/** @type {HTMLElement} */
const rootElement = document.querySelector('.sidebar');
/** @type {HTMLAnchorElement[]} */
const anchorElements = rootElement.querySelectorAll('a');

//console.log('sidebar anchors:', anchorElements);

const initEventListeners = () => {
    anchorElements[1].addEventListener('click', (event) => {
        event.preventDefault();
        ProjectShareDialog.open();
    });
    anchorElements[2].addEventListener('click', (event) => {
        event.preventDefault();
        ProjectRenameDialog.open();
    });
    anchorElements[3].addEventListener('click', (event) => {
        event.preventDefault();
        ProjectKeyDialog.open();
    });
    anchorElements[4].addEventListener('click', async (event) => {
        event.preventDefault();
        const project = ProjectController.getProject();
        console.log('logging out:', project);
        const projectUnauthorized = await ProjectApi.unauthProject(project);
        console.log('logged out:', projectUnauthorized);
        location.href = './';
    });
    anchorElements[5].addEventListener('click', (event) => {
        event.preventDefault();
        ProjectDeleteDialog.open();
    });
};

initEventListeners();
