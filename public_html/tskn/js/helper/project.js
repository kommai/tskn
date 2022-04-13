import { Project } from '../model/project.js';
import { ProjectApi } from '../api/project.js';
import { sha256 } from '../util/hash.js';

/**
 * @param {(Location|URL)} url
 * @returns {Promise<Project>}
 */
const getProjectFromUrl = async (url) => {
    const slug = url.pathname.replace(/\/|\/+$/g, '');
    return await ProjectApi.getProjectBySlug(slug);
}

/**
 * @param {string} key
 * @returns {string}
 */
const hashProjectKey = async (key) => {
    const TIMES = 1000;
    let hash = key;
    for (let i = 0; i < TIMES; i++) {
        hash = await sha256(hash);
    }
    return hash;
};

export const ProjectHelper = {
    getProjectFromUrl,
    hashProjectKey,
};