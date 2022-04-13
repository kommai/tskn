import { Abstract } from './abstract.js';

export class Task extends Abstract {
    /** @type {?number} */
    id = null;
    /** @type {?number} */
    projectId = null;
    /** @type {?number} */
    createdAt = null;
    /** @type {?number} */
    modifiedAt = null;
    /** @type {string} */
    title = '';
    /** @type {string} */
    color = '';
    /** @type {number} */
    time = 0;
    /** @type {number} */
    percentage = 0;

    /*
    static createFromResponseData(responseData) {
        const task = new this();
        task.id = parseInt(responseData.id);
        task.projectId = parseInt(responseData.projectId);
        task.color = responseData.color;
        task.title = responseData.title;
        task.time = parseInt(responseData.time);
        return task;
    }
    */
}
