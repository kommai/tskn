import { Modal, StagingButton, Blocker } from '../../vendor/kommai/dist/kommai.js';
import { Project } from '../model/project.js';
import { ErrorHandler } from './error-handler.js';

/** @type {HTMLElement} */
const rootElement = document.getElementById('modal-welcome');
/** @type {HTMLFormElement} */
const formElement = rootElement.querySelector('form');
/** @type {HTMLElement} */
const contentElement = rootElement.querySelector('.content > p');
/** @type {HTMLInputElement} */
const urlInputElement = rootElement.querySelector('input[name="url"]');
/** @type {NodeList} */
const actionButtonElements = rootElement.querySelectorAll('.actions > .button');
/** @type {HTMLButtonElement} */
const cancelButtonElement = actionButtonElements.item(0);
/** @type {HTMLButtonElement} */
const copyButtonElement = actionButtonElements.item(1);
/** @type {?Project} */
//let targetProject = null;

const initEventListeners = () => {
    cancelButtonElement.addEventListener('click', close);
    copyButtonElement.addEventListener('click', copyUrl);
};

const copyUrl = () => {
    urlInputElement.select();
    document.execCommand('copy');
    StagingButton.stage(copyButtonElement, 'idle', 'done');
    setTimeout(() => {
        StagingButton.stage(copyButtonElement, 'done', 'idle');
    }, 1000);
};

const open = () => {
    try {
        urlInputElement.value = location.href;
        //urlInputElement.select();
        StagingButton.reset(copyButtonElement);
        Modal.open(rootElement, {
            beforeClose: () => {
                document.activeElement.blur();
            },
        });
    } catch (error) {
        ErrorHandler.handle(error);
    }
};

const close = () => {
    Modal.close(rootElement);
};

initEventListeners();

export const ProjectWelcomeDialog = {
    open,
    close,
};