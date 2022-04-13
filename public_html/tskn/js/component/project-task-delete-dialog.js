import { Modal, StagingButton, Blocker } from '../../vendor/kommai/dist/kommai.js';
import { Config } from '../config.js';
import { Task } from '../model/task.js';
import { TaskController } from '../controller/task.js';
import { TaskApi } from '../api/task.js';
import { Tasks } from './project-tasks.js';
import { Chart } from './project-chart.js';
import { wait } from '../util/wait.js';
import { ErrorHandler } from './error-handler.js';

/** @type {HTMLElement} */
const rootElement = document.getElementById('modal-delete-task');
/** @type {HTMLFormElement} */
const formElement = rootElement.querySelector('form');
/** @type {HTMLElement} */
const contentElement = rootElement.querySelector('.content > p');
/** @type {NodeList} */
const actionButtonElements = rootElement.querySelectorAll('.actions > .button');
/** @type {HTMLButtonElement} */
const cancelButtonElement = actionButtonElements.item(0);
/** @type {HTMLButtonElement} */
const okButtonElement = actionButtonElements.item(1);
/** @type {?Task} */
let targetTask = null;

const initEventListeners = () => {
    formElement.addEventListener('submit', submit);
    cancelButtonElement.addEventListener('click', close);
};

const open = (task) => {
    try {
        if (!(task instanceof Task)) {
            throw new TypeError('Invalid task');
        }
        targetTask = task;
        contentElement.textContent = `「${targetTask.title}」を削除しますか？`;
        StagingButton.reset(okButtonElement);
        Modal.open(rootElement);
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

        if (!(targetTask instanceof Task)) {
            throw new ReferenceError('No target task');
        }
        //console.log('deleting:', targetTask);

        await Promise.all([TaskApi.deleteTask(targetTask), wait(Config.MIN_RESPONSE_WAIT)]);
        TaskController.deleteTask(targetTask);
        Tasks.deleteTask(targetTask);
        Chart.update();
        close();
        /*
        StagingButton.stage(okButtonElement, 'busy', 'done');
        setTimeout(() => {
            StagingButton.stage(okButtonElement, 'done', 'idle');
        }, Config.NOTIFICATION_WAIT);
        */
    } catch (error) {
        StagingButton.stage(okButtonElement, 'busy', 'idle');
        ErrorHandler.handle(error);
    } finally {
        Blocker.close();
        //StagingButton.reset(okButtonElement);
    }
};

initEventListeners();

export const TaskDeleteDialog = {
    open,
    close,
};