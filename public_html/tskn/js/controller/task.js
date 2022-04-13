import { Task } from '../model/task.js';
import { getRandomColor, getNextColorOf } from '../util/color.js';
import { Tasks as TasksComponent } from '../component/project-tasks.js';

/** @type {Task[]} */
let myTasks = [];
/** @type {number} */
let timeInTotal = 0;

function findIndexOfTask(task) {
    if (!(task instanceof Task)) {
        throw new TypeError('Invalid task');
    }
    return myTasks.findIndex((myTask) => {
        return task === myTask;
    });
};

function createNewTask() {
    //return new Task();
    const newTask = new Task();
    newTask.color = (myTasks.length === 0) ? getRandomColor() : getNextColorOf(getNewestTask().color);
    return newTask;
}

function addTask(task) {
    if (!(task instanceof Task)) {
        throw new TypeError('Invalid task');
    }
    myTasks.push(task);
    timeInTotal += task.time;
}

/**
 * @param {Task[]} tasks
 */
function setTasks(tasks) {
    myTasks = [];
    tasks.forEach((task) => {
        addTask(task);
    });
}

function replaceTask(targetTask, newTask) {
    if (!(targetTask instanceof Task) || !(newTask instanceof Task)) {
        throw new TypeError('Invalid task');
    }
    const targetIndex = findIndexOfTask(targetTask);
    if (targetIndex === -1) {
        throw new ReferenceError('No task to be replaced');
    }
    myTasks[targetIndex] = newTask;
    timeInTotal += (newTask.time - targetTask.time);
}

function deleteTask(task) {
    if (!(task instanceof Task)) {
        throw new TypeError('Invalid task');
    }
    const targetIndex = findIndexOfTask(task);
    if (targetIndex === -1) {
        throw new Error('No task to be removed');
    }
    timeInTotal -= task.time;
    myTasks.splice(targetIndex, 1);
}

function getTasks() {
    return myTasks;
}

function getTaskById(id) {
    return myTasks.find((myTask) => {
        return myTask.id === id;
    });
}

function getNewestTask() {
    myTasks.sort((taskA, taskB) => {
        return taskB.id - taskA.id;
    });
    return myTasks[0];
}


function getTaskTimeInTotal() {
    return timeInTotal;
}

export const TaskController = {
    createNewTask,
    addTask,
    setTasks,
    replaceTask,
    deleteTask,
    getTasks,
    getTaskById,
    getNewestTask,
    getTaskTimeInTotal,
};
