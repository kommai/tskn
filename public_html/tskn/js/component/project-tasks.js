import { Task } from '../model/task.js';
import { secondsToValueUnit } from '../util/time.js';
import { TaskEditDialog } from './project-task-edit-dialog.js';
import { TaskDeleteDialog } from './project-task-delete-dialog.js';
import { TaskController } from '../controller/task.js';
import { TaskHelper } from '../helper/task.js';
import { ErrorHandler } from './error-handler.js';
import { CommonBehavior } from './common-behavior.js';

/** @type {HTMLElement} */
const rootElement = document.querySelector('.project > .tasks');
/** @type {HTMLElement} */
const taskTemplateElement = rootElement.querySelector('.task.template');
/** @type {HTMLElement} */
const taskAdderElement = rootElement.querySelector('.task.adder');
/** @type {Map} */
const taskElementMap = new Map();
/** @type {Map} */
const elementTaskMap = new Map();

const show = () => {
    CommonBehavior.show(rootElement);
    resizeTaskElements();
};

const hide = () => {
    CommonBehavior.hide(rootElement);
};

/**
 * @param {HTMLElement} taskElement
 * @returns {boolean}
 */
function isTaskElement(taskElement) {
    return taskElement instanceof HTMLElement && taskElement.matches('.task');
}

function createNewTaskElement(task = null) {
    const newTaskElement = taskTemplateElement.cloneNode(true);
    if (task === null) {
        return newTaskElement;
    }
    if (!(task instanceof Task)) {
        throw new TypeError('Invalid task');
    }
    assignTaskToTaskElement(task, newTaskElement);
    return newTaskElement;
}

function appendTaskElement(taskElement) {
    if (!isTaskElement(taskElement)) {
        throw new TypeError('Invalid task element');
    }
    rootElement.insertBefore(taskElement, taskAdderElement);
    taskElement.classList.remove('template');
}

function deleteTaskElement(taskElement) {
    if (!isTaskElement(taskElement)) {
        throw new TypeError('Invalid task element');
    }
    taskElement.remove();
}

function assignTaskToTaskElement(task, taskElement) {
    if (!(task instanceof Task)) {
        throw new TypeError('Invalid task');
    }
    if (!isTaskElement(taskElement)) {
        throw new TypeError('Invalid task element');
    }
    const taskTitleElement = taskElement.querySelector('.title');
    const taskChartBarElement = taskElement.querySelector('.chart > .bar');
    const taskTimeValueElement = taskElement.querySelector('.time > .value');
    const taskTimeUnitElement = taskElement.querySelector('.time > .unit');

    taskTitleElement.textContent = task.title;

    taskChartBarElement.style.backgroundColor = task.color;
    taskChartBarElement.style.width = '0%';

    const [taskTimeValue, taskTimeUnit] = secondsToValueUnit(task.time, 1);
    if (taskTimeValue % 1 === 0) {
        taskTimeValueElement.textContent = taskTimeValue.toString();
    } else {
        const [l, r] = taskTimeValue.toString().split('.');
        taskTimeValueElement.innerHTML = `${l}<small>.${r}</small>`;
    }
    taskTimeUnitElement.textContent = taskTimeUnit;
}

function mapTaskAndTaskElement(task, taskElement) {
    if (!(task instanceof Task)) {
        throw new TypeError('Invalid task');
    }
    if (!isTaskElement(taskElement)) {
        throw new TypeError('Invalid task element');
    }
    taskElementMap.set(task, taskElement);
    elementTaskMap.set(taskElement, task);
    //console.log('mapped:', taskElementMap, elementTaskMap);
}

function unmapTaskAndTaskElement(task, taskElement) {
    if (!(task instanceof Task)) {
        throw new TypeError('Invalid task');
    }
    if (!isTaskElement(taskElement)) {
        throw new TypeError('Invalid task element');
    }
    taskElementMap.delete(task);
    elementTaskMap.delete(taskElement);
    //console.log('unmapped:', taskElementMap, elementTaskMap);
}

function getTaskForTaskElement(taskElement) {
    if (!isTaskElement(taskElement)) {
        throw new TypeError('Invalid task element');
    }
    return elementTaskMap.get(taskElement);
}

function getTaskElementForTask(task) {
    if (!(task instanceof Task)) {
        throw new TypeError('Invalid task');
    }
    return taskElementMap.get(task);
}

function addTask(task) {
    try {
        if (!(task instanceof Task)) {
            throw new TypeError('Invalid task');
        }
        const newTaskElement = createNewTaskElement(task);
        appendTaskElement(newTaskElement);
        mapTaskAndTaskElement(task, newTaskElement);
        rootElement.dispatchEvent(createUpdateEvent());
    } catch (error) {
        ErrorHandler(error);
    }
}

function replaceTask(targetTask, newTask) {
    try {
        if (!(targetTask instanceof Task) || !(newTask instanceof Task)) {
            throw new TypeError('Invalid task');
        }
        const targetTaskElement = getTaskElementForTask(targetTask);
        if (!isTaskElement(targetTaskElement)) {
            throw new ReferenceError('No task element to be replaced');
        }
        //throw new Error('test');
        unmapTaskAndTaskElement(targetTask, targetTaskElement);
        mapTaskAndTaskElement(newTask, targetTaskElement);
        assignTaskToTaskElement(newTask, targetTaskElement);
        rootElement.dispatchEvent(createUpdateEvent());
    } catch (error) {
        ErrorHandler.handle(error);
    }
}

function deleteTask(task) {
    try {
        if (!(task instanceof Task)) {
            throw new TypeError('Invalid task');
        }
        const taskElement = getTaskElementForTask(task);
        if (!isTaskElement(taskElement)) {
            throw new ReferenceError('No task element to be deleted');
        }
        unmapTaskAndTaskElement(task, taskElement);
        deleteTaskElement(taskElement);
        rootElement.dispatchEvent(createUpdateEvent());
    } catch (error) {
        ErrorHandler.handle(error);
    }
}

function resizeTaskElements() {
    const taskTimeElements = rootElement.querySelectorAll('.task:not(.template) .time');
    if (taskTimeElements.length === 0) {
        return;
    }
    const taskTimeElementWidths = [];
    taskTimeElements.forEach((taskTimeElement) => {
        taskTimeElementWidths.push(Math.ceil(taskTimeElement.offsetWidth));
    });
    const taskTimeElementMaxWidth = Math.max(...taskTimeElementWidths);
    taskTimeElements.forEach((taskTimeElement) => {
        taskTimeElement.style.width = `${taskTimeElementMaxWidth}px`;
    });
}

function sortTaskElements() {
    const taskElements = rootElement.querySelectorAll('.task:not(.template):not(.adder)');
    if (taskElements.length === 0) {
        return;
    }
    const taskElementStartingPosition = rootElement.getBoundingClientRect().y + window.scrollY;
    const taskElementPositions = [taskElementStartingPosition];
    taskElements.forEach((taskElement, i) => {
        taskElementPositions.push(taskElementPositions[i] + taskElement.getBoundingClientRect().height);
    });
    taskElementPositions.pop();
    taskElementPositions.sort((positionA, positionB) => {
        return positionA - positionB;
    });
    const taskElementsSorted = Array.from(taskElements).sort((taskElementA, taskElementB) => {
        const taskA = getTaskForTaskElement(taskElementA);
        const taskB = getTaskForTaskElement(taskElementB);
        if (taskA.time === taskB.time) {
            return taskA.id - taskB.id;
        }
        return taskB.time - taskA.time;
    });
    taskElementsSorted.forEach((taskElement, i) => {
        const taskElementPosition = taskElement.getBoundingClientRect().y + window.scrollY;
        const taskElementMatrix = getComputedStyle(taskElement).transform;
        const taskElementTranslate = (taskElementMatrix === 'none') ? 0 : parseFloat(taskElementMatrix.split(', ')[5]);
        taskElement.style.transform = `translateY(${Math.floor(taskElementTranslate + taskElementPositions[i] - taskElementPosition)}px)`;
    });
}

function updateTaskPercentages() {
    const taskChartBarElements = rootElement.querySelectorAll('.task:not(.template) .bar');
    if (taskChartBarElements.length === 0) {
        return;
    }
    taskChartBarElements.forEach((taskChartBarElement) => {
        const taskElement = taskChartBarElement.parentElement.parentElement;
        const task = getTaskForTaskElement(taskElement);
        const percentage = (task.time >= 1) ? Math.round((task.time / TaskController.getTaskTimeInTotal()) * 100) : 0;
        taskChartBarElement.style.width = `${percentage}%`;
    });
}

/**
 * @param {Task[]} tasks
 */
function setInitialTasks(tasks) {
    try {
        //console.log('setting initial tasks:', tasks);
        tasks.sort(TaskHelper.sorter);
        tasks.forEach((task) => {
            if (!(task instanceof Task)) {
                throw new TypeError('Invalid task');
            }
            const newTaskElement = createNewTaskElement(task);
            appendTaskElement(newTaskElement);
            mapTaskAndTaskElement(task, newTaskElement);
        });
        rootElement.dispatchEvent(createUpdateEvent(true, false, true));
    } catch (error) {
        ErrorHandler.handle(error);
    }
}

function createUpdateEvent(resize = true, sort = true, percentage = true) {
    return new CustomEvent('my-update', {
        bubbles: false,
        detail: {
            'resize': resize,
            'sort': sort,
            'percentage': percentage,
        }
    });
}

rootElement.addEventListener('my-update', (event) => {
    console.warn('TasksComponent updated!');
    console.log('event detail:', event.detail);
    if (event.detail.resize) {
        resizeTaskElements();
    }
    if (event.detail.sort) {
        sortTaskElements();
    }
    if (event.detail.percentage) {
        updateTaskPercentages();
    }
});

rootElement.addEventListener('click', (event) => {
    event.stopPropagation();
    const taskElementClicked = event.target.closest('.task');
    if (event.target.closest('.task:not(.template):not(.adder) > .action')) {
        console.log('deleting:', taskElementClicked);
        TaskDeleteDialog.open(getTaskForTaskElement(taskElementClicked));
        return;
    }
    if (event.target.closest('.task.adder')) {
        console.log('adding a new task');
        TaskEditDialog.open(TaskController.createNewTask());
        return;
    }
    console.log('editing:', taskElementClicked);
    TaskEditDialog.open(getTaskForTaskElement(taskElementClicked));
});

export const Tasks = {
    show,
    hide,
    setInitialTasks,
    addTask,
    replaceTask,
    deleteTask,
};