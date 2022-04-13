import { StagingButton, Blocker } from '../../vendor/kommai/dist/kommai.js';
import { Project } from '../model/project.js';
import { Config } from '../config.js';
import { ErrorHandler } from './error-handler.js';
import { Validator } from '../util/validator.js';
import { ValidatableForm } from './validatable-form.js';
import { ProjectController } from '../controller/project.js';
import { ProjectApi } from '../api/project.js';
import { wait } from '../util/wait.js';
import { Tooltip } from './tooltip.js';
import { ProjectHelper } from '../helper/project.js';

/** @type {HTMLElement} */
const rootElement = document.querySelector('.project > .create');
/** @type {HTMLFormElement} */
const formElement = rootElement.querySelector('form');
/** @type {HTMLInputElement} */
const titleInputElement = formElement.querySelector('input[name="title"]');
/** @type {HTMLInputElement} */
const keyInputElement = formElement.querySelector('input[name="key"]');
/** @type {HTMLButtonElement} */
const okButtonElement = rootElement.querySelector('button');
/** @type {Object} */
const validatableForm = ValidatableForm.create(formElement);

const initValidation = () => {
    const titleAndKeyValidator = Validator.create(
        (element) => {
            if (!element.value) {
                return '入力してください';
            }
            return true;
        },
    );
    validatableForm
        .setValidatorToElement(titleAndKeyValidator, titleInputElement)
        .setValidatorToElement(titleAndKeyValidator, keyInputElement);
};

const initEventListeners = () => {
    formElement.addEventListener('submit', submit);
};

const submit = async (event) => {
    try {
        event.preventDefault();
        Blocker.open();
        StagingButton.stage(okButtonElement, 'idle', 'busy');

        const title = titleInputElement.value;
        //const key = keyInputElement.value;
        const key = await ProjectHelper.hashProjectKey(keyInputElement.value);
        const projectToSend = ProjectController.createNewProject();
        projectToSend.title = title;
        console.log('project to send:', projectToSend);
        console.log('key to protect:', key);
        //return;

        const [projectAdded] = await Promise.all([ProjectApi.addProject(projectToSend, key), wait(Config.MIN_RESPONSE_WAIT)]);
        //alert('success!');
        console.log('project added:', projectAdded);
        //location.href = projectAdded.slug;

        const projectAuthorized = await ProjectApi.authProjectByKey(projectAdded, key);
        location.href = projectAuthorized.slug;
    } catch (error) {
        ErrorHandler.handle(error);
    } finally {
        Blocker.close();
        //StagingButton.reset(okButtonElement);
    }
};

initValidation();
initEventListeners();

export const Create = {
};