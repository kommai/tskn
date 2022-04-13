import { Task } from '../model/task.js';

/**
 * @param {Task} taskA
 * @param {Task} taskB
 */
const sorter = (taskA, taskB) => {
    if (taskA.time === taskB.time) {
        return taskA.id - taskB.id;
    }
    return taskB.time - taskA.time;
};

export const TaskHelper = {
    sorter,
};