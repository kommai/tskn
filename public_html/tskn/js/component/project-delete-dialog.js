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

/** @type {HTMLElement} */
const rootElement = document.getElementById('modal-delete');
/** @type {HTMLFormElement} */
const formElement = rootElement.querySelector('form');
/** @type {HTMLElement} */
const contentElement = rootElement.querySelector('.content > p');
/** @type {HTMLInputElement} */
const keyInputElement = rootElement.querySelector('input[name="key"]');
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
    const keyValidator = Validator.create((element) => {
        if (!element.value) {
            return '入力してください';
        }
        return true;
    });
    validatableForm.setValidatorToElement(keyValidator, keyInputElement);
};

const initEventListeners = () => {
    formElement.addEventListener('submit', submit);
    cancelButtonElement.addEventListener('click', close);
};

const open = () => {
    try {
        targetProject = ProjectController.getProject();
        contentElement.textContent = `プロジェクト「${targetProject.title}」を削除するには合言葉を入力してください。`;
        keyInputElement.value = '';
        keyInputElement.focus();
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
        console.log('deleting project:', targetProject);

        const key = await ProjectHelper.hashProjectKey(keyInputElement.value);
        const [response] = await Promise.all([ProjectApi.deleteProject(targetProject, key), wait(Config.MIN_RESPONSE_WAIT)]);
        console.log('response:', response);
        if (response instanceof Project) {
            const projectDeleted = response;
            ProjectController.deleteProject(projectDeleted);
            Tooltip.destroy(keyInputElement);
            //alert('Success!');
            history.replaceState(null, '', './');
            location.reload();
        } else {
            Tooltip.show(keyInputElement, '合言葉が違います');
            StagingButton.stage(okButtonElement, 'busy', 'idle');
        }
    } catch (error) {
        ErrorHandler.handle(error);
    } finally {
        Blocker.close();
    }
};

initValidation();
initEventListeners();

export const ProjectDeleteDialog = {
    open,
    close,
};