import { Modal, StagingButton, Blocker } from '../../vendor/kommai/dist/kommai.js';
import { Config } from '../config.js';
import { Project } from '../model/project.js';
import { ProjectController } from '../controller/project.js';
import { ProjectApi } from '../api/project.js';
import { wait } from '../util/wait.js';
import { ErrorHandler } from './error-handler.js';
import { Validator } from '../util/validator.js';
import { ValidatableForm } from './validatable-form.js';
import { ProjectHelper } from '../helper/project.js';
import { Tooltip } from './tooltip.js';
import { ProjectTitle } from './project-title.js';

/** @type {HTMLElement} */
const rootElement = document.getElementById('modal-rename');
/** @type {HTMLFormElement} */
const formElement = rootElement.querySelector('form');
/** @type {HTMLElement} */
const contentElement = rootElement.querySelector('.content > p');
/** @type {HTMLInputElement} */
const titleInputElement = rootElement.querySelector('input[name="title"]');
/** @type {NodeList} */
const actionButtonElements = rootElement.querySelectorAll('.actions > .button');
/** @type {HTMLButtonElement} */
const cancelButtonElement = actionButtonElements.item(0);
/** @type {HTMLButtonElement} */
const okButtonElement = actionButtonElements.item(1);
/** @type {?Project} */
let targetProject = null;
/** @type {Object} */
const validatableForm = ValidatableForm.create(formElement);

const initValidation = () => {
    const titleValidator = Validator.create((element) => {
        if (!element.value) {
            return '入力してください';
        }
        return true;
    });
    validatableForm.setValidatorToElement(titleValidator, titleInputElement);
};

const initEventListeners = () => {
    formElement.addEventListener('submit', submit);
    cancelButtonElement.addEventListener('click', close);
};

const open = () => {
    try {
        targetProject = ProjectController.getProject();
        //titleInputElement.value = '';
        titleInputElement.value = targetProject.title;
        titleInputElement.focus();
        StagingButton.reset(okButtonElement);
        Modal.open(rootElement, {
            beforeClose: () => {
                document.activeElement.blur();
                validatableForm.clearValidations();
            },
        });
    } catch (error) {
        ErrorHandler.handle(error);
    }
};

const close = () => {
    Modal.close(rootElement);
};

const submit = async (event) => {
    try {
        event.preventDefault();
        Blocker.open();
        StagingButton.stage(okButtonElement, 'idle', 'busy');

        if (!(targetProject instanceof Project)) {
            throw new ReferenceError('No target project');
        }
        console.log('updating project:', targetProject);

        const projectToSend = Object.assign(ProjectController.createNewProject(), targetProject);
        projectToSend.title = titleInputElement.value;

        const [projectUpdated] = await Promise.all([ProjectApi.updateProject(projectToSend), wait(Config.MIN_RESPONSE_WAIT)]);
        console.log('project updated:', projectUpdated);
        //alert('project updated!');
        ProjectController.setProject(projectUpdated);
        ProjectTitle.updateProject(projectUpdated);

        //close();
        StagingButton.stage(okButtonElement, 'busy', 'done');
        setTimeout(() => {
            StagingButton.stage(okButtonElement, 'done', 'idle');
        }, Config.NOTIFICATION_WAIT);
    } catch (error) {
        StagingButton.stage(okButtonElement, 'busy', 'idle');
        ErrorHandler.handle(error);
    } finally {
        Blocker.close();
        //StagingButton.reset(okButtonElement);
    }
};

initValidation();
initEventListeners();

export const ProjectRenameDialog = {
    open,
    close,
};