import { Project } from '../model/project.js';

/** @type {?Project} */
let myProject = null;

const createNewProject = () => {
    const newProject = new Project();
    return newProject;
};

const setProject = (project) => {
    if (!(project instanceof Project)) {
        throw new TypeError('Invalid project');
    }
    myProject = project;
}

const getProject = () => {
    return myProject;
};

const deleteProject = (project) => {
    if (!(project instanceof Project)) {
        throw new TypeError('Invalid project');
    }
    myProject = null;
};

const updateProject = setProject;

export const ProjectController = {
    createNewProject,
    setProject,
    getProject,
    deleteProject,
    updateProject,
};