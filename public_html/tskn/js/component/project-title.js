import { Project } from '../model/project.js';
import { ErrorHandler } from './error-handler.js';
import { CommonBehavior } from './common-behavior.js';

/** @type {HTMLElement} */
const rootElement = document.querySelector('.project > .title');
/** @type {HTMLElement} */
const projectTitleElement = rootElement.querySelector('h1');
/** @type {Project} */
let targetProject = new Project();

const show = () => {
    CommonBehavior.show(rootElement);
};

const hide = () => {
    CommonBehavior.hide(rootElement);
};

/**
 * @param {Project} project
 * @returns {TaskDeleteDialog}
 */
const setProject = (project) => {
    try {
        if (!(project instanceof Project)) {
            throw new TypeError('Invalid project');
        }
        targetProject = project;
        return ProjectTitle;
    } catch (error) {
        ErrorHandler.handle();
    }
};

/**
 * @param {Project} project
 */
const updateProject = (project) => {
    try {
        setProject(project);
        projectTitleElement.textContent = project.title;
        document.title = `たすくん - ${project.title}`;
    } catch (error) {
        ErrorHandler.handle();
    }
};

export const ProjectTitle = {
    show,
    hide,
    setProject,
    updateProject,
};