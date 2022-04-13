import { Modal, StagingButton, Blocker } from '../../vendor/kommai/dist/kommai.js';
import { Config } from '../config.js';
import { Project } from '../model/project.js';
import { Task } from '../model/task.js';
import { ProjectController } from '../controller/project.js';
import { TaskController } from '../controller/task.js';
import { TaskApi } from '../api/task.js';
import { Tasks } from './project-tasks.js';
import { Chart } from './project-chart.js';
import { wait } from '../util/wait.js';
import { hoursToSeconds, minutesToSeconds } from '../util/time.js';
import { Validator } from '../util/validator.js';
import { ValidatableForm } from './validatable-form.js';
import { ErrorHandler } from './error-handler.js';
import { mojiToNumber } from '../util/nihongo.js';

/** @type {HTMLElement} */
const rootElement = document.getElementById('modal-edit');
/** @type {HTMLFormElement} */
const formElement = rootElement.querySelector('form');
/** @type {HTMLInputElement} */
const titleInputElement = rootElement.querySelector('.field.title input');
/** @type {HTMLInputElement} */
const hoursInputElement = rootElement.querySelector('.field.hour input');
/** @type {HTMLInputElement} */
const minutesInputElement = rootElement.querySelector('.field.min input');
/** @type {NodeList} */
const actionButtonElements = rootElement.querySelectorAll('.actions > .button');
/** @type {HTMLButtonElement} */
const cancelButtonElement = actionButtonElements.item(0);
/** @type {HTMLButtonElement} */
const okButtonElement = actionButtonElements.item(1);
/** @type {?Project} */
let targetProject = null;
/** @type {?Task} */
let targetTask = null;
/** @type {Object} */
const validatableForm = ValidatableForm.create(formElement);

const initValidation = () => {
    const titleValidator = Validator.create(
        (element) => {
            if (!element.value) {
                return '入力してください';
            }
            return true;
        },
    );
    const hoursAndMinutesValidator = Validator.create(
        (element) => {
            if (Number.isNaN(mojiToNumber(element.value || 0))) {
                return '数字を入力してください';
            }
            return true;
        },
    );
    validatableForm
        .setValidatorToElement(titleValidator, titleInputElement)
        .setValidatorToElement(hoursAndMinutesValidator, hoursInputElement)
        .setValidatorToElement(hoursAndMinutesValidator, minutesInputElement);
};

const initEventListeners = () => {
    formElement.addEventListener('submit', submit);
    cancelButtonElement.addEventListener('click', close);
};

const clearInputs = () => {
    titleInputElement.value = '';
    hoursInputElement.value = '';
    minutesInputElement.value = '';
};

const open = (task) => {
    try {
        if (!(task instanceof Task)) {
            throw new TypeError('Invalid task');
        }
        targetTask = task;
        targetProject = ProjectController.getProject();
        clearInputs();
        if (targetTask.hasId()) {
            titleInputElement.value = targetTask.title;
            hoursInputElement.focus();
        } else {
            titleInputElement.focus();
        }
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

        if (!(targetTask instanceof Task)) {
            throw new ReferenceError('No target task');
        }
        if (!(targetProject instanceof Project)) {
            throw new ReferenceError('No target project');
        }
        //console.log('saving:', targetTask, 'to project:', targetProject);

        const title = titleInputElement.value;
        const hours = mojiToNumber(hoursInputElement.value || 0);
        const minutes = mojiToNumber(minutesInputElement.value || 0);
        const seconds = hoursToSeconds(hours) + minutesToSeconds(minutes);

        const taskToSend = Object.assign(TaskController.createNewTask(), targetTask);
        taskToSend.title = title;
        taskToSend.time += seconds;
        console.log('task to send:', taskToSend);

        let api, callback;
        if (targetTask.hasId()) {
            api = TaskApi.updateTask;
            callback = (taskUpdated) => {
                TaskController.replaceTask(targetTask, taskUpdated);
                Tasks.replaceTask(targetTask, taskUpdated);
                targetTask = taskUpdated; // bad implementation!
            };
        } else {
            api = TaskApi.addTaskToProject;
            callback = (newTask) => {
                TaskController.addTask(newTask);
                Tasks.addTask(newTask);
            };
        }
        const [task] = await Promise.all([api(taskToSend, targetProject), wait(Config.MIN_RESPONSE_WAIT)]);
        callback(task);
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

initValidation();
initEventListeners();

export const TaskEditDialog = {
    open,
    close,
};