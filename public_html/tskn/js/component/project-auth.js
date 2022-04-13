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
const rootElement = document.querySelector('.project > .auth');
/** @type {HTMLFormElement} */
const formElement = rootElement.querySelector('form');
/** @type {HTMLInputElement} */
const keyInputElement = formElement.querySelector('input[name="key"]');
/** @type {HTMLButtonElement} */
const openButtonElement = rootElement.querySelector('button');
/** @type {Object} */
const validatableForm = ValidatableForm.create(formElement);

StagingButton.reset(openButtonElement);

const initValidation = () => {
    const keyValidator = Validator.create(
        (element) => {
            if (!element.value) {
                return '入力してください';
            }
            return true;
        },
    );
    validatableForm.setValidatorToElement(keyValidator, keyInputElement);
};

const initEventListeners = () => {
    formElement.addEventListener('submit', submit);
};

const submit = async (event) => {
    try {
        event.preventDefault();
        Blocker.open();
        StagingButton.stage(openButtonElement, 'idle', 'busy');

        const project = ProjectController.getProject();

        //const key = keyInputElement.value;
        const key = await ProjectHelper.hashProjectKey(keyInputElement.value);

        const [response] = await Promise.all([ProjectApi.authProjectByKey(project, key), wait(Config.MIN_RESPONSE_WAIT)]);
        console.log('response:', response);
        if (response instanceof Project) {
            Tooltip.destroy(keyInputElement);
            //alert('Authorized!');
            location.reload();
        } else {
            Tooltip.show(keyInputElement, '合言葉が違います');
            StagingButton.stage(openButtonElement, 'busy', 'idle');
        }
    } catch (error) {
        ErrorHandler.handle(error);
    } finally {
        Blocker.close();
        //StagingButton.reset(openButtonElement);
    }
};

initValidation();
initEventListeners();

export const Auth = {
};