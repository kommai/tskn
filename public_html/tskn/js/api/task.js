import { Ajax } from '../util/ajax.js';
import { Task } from '../model/task.js';
import { Project } from '../model/project.js';
import { NetworkError } from '../error/network.js';
import { UnexpectedResponseError } from '../error/unexpected-response.js';

function createTaskFromResponseData(responseData) {
    const newTask = new Task();
    newTask.id = parseInt(responseData.id);
    newTask.projectId = parseInt(responseData.projectId);
    newTask.createdAt = parseInt(responseData.createdAt);
    newTask.modifiedAt = responseData.modifiedAt ? parseInt(responseData.modifiedAt) : null;
    newTask.color = responseData.color;
    newTask.title = responseData.title;
    newTask.time = parseInt(responseData.time);
    return newTask;
}

async function getTasksForProject(project) {
    if (!(project instanceof Project)) {
        throw new TypeError('Invalid project');
    }
    const response = await Ajax.get(`api/task/belongs-to/${project.id}`).catch(() => {
        throw new NetworkError(`Failed to get tasks for project #${project.id}`);
    });
    if (!response.ok) {
        throw new UnexpectedResponseError(response);
    }
    const responseData = await response.json();
    //console.log('raw response data:', responseData);
    const tasks = [];
    responseData.forEach((item) => {
        tasks.push(createTaskFromResponseData(item));
    });
    //console.log('tasks fetched:', tasks);
    return tasks;
}

async function addTaskToProject(task, project) {
    if (!(task instanceof Task)) {
        throw new TypeError('Invalid task');
    }
    if (!(project instanceof Project)) {
        throw new TypeError('Invalid project');
    }
    const formData = new FormData();
    formData.append('projectId', project.id);
    formData.append('title', task.title);
    formData.append('time', task.time);
    formData.append('color', task.color);


    const response = await Ajax.post('api/task/create', formData).catch(() => {
        throw new NetworkError(`Failed to add a task to project #${project.id}`);
    });
    if (!response.ok) {
        throw new UnexpectedResponseError(response);
    }
    const responseData = await response.json();
    return createTaskFromResponseData(responseData);

    /*
    try {
        const responseData = await Ajax.post('api/task/create', formData);
        return createTaskFromResponseData(responseData);
    } catch (error) {
        console.error(`Failed to add a task to a project #${project.id}`);
        throw error;
    }
    */
}

async function updateTask(task) {
    if (!(task instanceof Task)) {
        throw new TypeError('Invalid task');
    }
    if (!task.id) {
        throw new TypeError('Task is missing its ID');
    }
    const formData = new FormData();
    formData.append('projectId', task.projectId);
    formData.append('title', task.title);
    formData.append('time', task.time);
    //formData.append('color', task.color); // color is unchangeable



    const response = await Ajax.post(`api/task/update/${task.id}`, formData).catch(() => {
        throw new NetworkError(`Failed to update task #${task.id}`);
    });
    if (!response.ok) {
        throw new UnexpectedResponseError(response);
    }
    const responseData = await response.json();
    return createTaskFromResponseData(responseData);

    /*
    try {
        const responseData = await Ajax.post(`api/task/update/${task.id}`, formData);
        return createTaskFromResponseData(responseData);
    } catch (error) {
        console.error(`Failed to update task #${task.id}`);
        throw error;
    }
    */
}

async function deleteTask(task) {
    if (!(task instanceof Task)) {
        throw new TypeError('Invalid task');
    }
    if (!task.id) {
        throw new TypeError('Task is missing its ID');
    }
    console.log('deleting task:', task);
    const formData = new FormData();
    formData.append('projectId', task.projectId);
    const response = await Ajax.post(`api/task/destroy/${task.id}`, formData).catch((error) => {
        console.error(error);
        throw new NetworkError(`Failed to delete task #${task.id}`);
    });
    if (!response.ok) {
        throw new UnexpectedResponseError(response);
    }
    const responseData = await response.json();
    return createTaskFromResponseData(responseData);




    /*
    try {
        const responseData = await Ajax.post(`api/task/destroy/${task.id}`);
        return createTaskFromResponseData(responseData);
    } catch (error) {
        console.error(`Failed to delete task #${task.id}`);
        throw error;
    }
    */
}

export const TaskApi = {
    getTasksForProject,
    addTaskToProject,
    updateTask,
    deleteTask,
};