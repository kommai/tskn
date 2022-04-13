import { Ajax } from '../util/ajax.js';
import { Project } from '../model/project.js';
import { NetworkError } from '../error/network.js';
import { UnexpectedResponseError } from '../error/unexpected-response.js';

function createProjectFromResponseData(responseData) {
    const newProject = new Project();
    newProject.id = parseInt(responseData.id);
    newProject.createdAt = parseInt(responseData.createdAt);
    newProject.modifiedAt = responseData.modifiedAt ? parseInt(responseData.modifiedAt) : null;
    newProject.slug = responseData.slug;
    newProject.title = responseData.title;
    return newProject;
}

/**
 * @param {Project} project
 * @param {string} key
 * @returns {Promise<Project>}
 */
async function addProject(project, key) {
    if (!(project instanceof Project)) {
        throw new TypeError('Invalid project');
    }

    const formData = new FormData();
    formData.append('title', project.title);
    formData.append('key', key);

    const response = await Ajax.post('api/project/create', formData).catch(() => {
        throw new NetworkError('Failed to add a project');
    });
    if (!response.ok) {
        throw new UnexpectedResponseError(response);
    }
    const responseData = await response.json();
    return createProjectFromResponseData(responseData);
}

/**
 * @param {Project} project
 * @param {string} key
 * @returns {Promise<Project>}
 */
async function updateProject(project, key = null) {
    if (!(project instanceof Project)) {
        throw new TypeError('Invalid project');
    }
    const formData = new FormData();
    formData.append('title', project.title);
    if (key !== null) {
        formData.append('key', key.toString());
    }
    const response = await Ajax.post(`api/project/update/${project.id}`, formData).catch(() => {
        throw new NetworkError(`Failed to update project #${project.id}`);
    });
    if (!response.ok) {
        throw new UnexpectedResponseError(response);
    }
    const responseData = await response.json();
    return createProjectFromResponseData(responseData);
}

/**
 * @param {Project} project
 * @param {string} key
 * @returns {Promise<Project>}
 */
async function deleteProject(project, key) {
    if (!(project instanceof Project)) {
        throw new TypeError('Invalid project');
    }

    const formData = new FormData();
    formData.append('key', key.toString());

    const response = await Ajax.post(`api/project/destroy/${project.id}`, formData).catch(() => {
        throw new NetworkError(`Failed to delete project #${project.id}`);
    });
    if (!response.ok) {
        throw new UnexpectedResponseError(response);
    }
    const responseData = await response.json();
    //return createProjectFromResponseData(responseData);
    return responseData ? createProjectFromResponseData(responseData) : 'Authorization failed';
}

/**
 * @param {string} slug
 * @returns {Promise<Project>}
 */
async function getProjectBySlug(slug) {
    const response = await Ajax.get(`api/project/slug/${slug}`).catch(() => {
        throw new NetworkError(`Failed to get a project slugged "${slug}"`);
    });
    if (!response.ok) {
        throw new UnexpectedResponseError(response);
    }
    const responseData = await response.json();
    return createProjectFromResponseData(responseData);
}

/**
 * @param {Project} project
 * @param {string} key
 * @returns {Promise<(Project|string)>}
 */
async function authProjectByKey(project, key) {
    if (!(project instanceof Project)) {
        throw new TypeError('Invalid project');
    }

    const formData = new FormData();
    formData.append('key', key.toString());

    const response = await Ajax.post(`api/project/auth/${project.id}`, formData).catch(() => {
        throw new NetworkError(`Failed to auth project #${project.id}`);
    });
    if (!response.ok) {
        throw new UnexpectedResponseError(response);
    }
    const responseData = await response.json();
    return responseData ? createProjectFromResponseData(responseData) : 'Authorization failed';
    //return createProjectFromResponseData(await response.json());
}

async function unauthProject(project) {
    if (!(project instanceof Project)) {
        throw new TypeError('Invalid project');
    }
    const response = await Ajax.post(`api/project/unauth/${project.id}`).catch(() => {
        throw new NetworkError(`Failed to unauth project #${project.id}`);
    });
    if (!response.ok) {
        throw new UnexpectedResponseError(response);
    }
    const responseData = await response.json();
    return createProjectFromResponseData(responseData);
}

export const ProjectApi = {
    addProject,
    updateProject,
    deleteProject,
    getProjectBySlug,
    authProjectByKey,
    unauthProject,
};