import { Abstract } from './abstract.js';

export class Project extends Abstract {
    /** @type {?number} */
    id = null;
    /** @type {?number} */
    createdAt = null;
    /** @type {?number} */
    modifiedAt = null;
    /** @type {string} */
    slug = '';
    /** @type {string} */
    title = '';
    /** @type {number} */
    //timeInTotal = 0;

    /*
    static createFromResponseData(responseData) {
        const project = new this();
        project.id = parseInt(responseData.id);
        project.slug = responseData.slug;
        project.title = responseData.title;
        return project;
    }
    */
}
