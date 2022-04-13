import {
    Chart as ChartJs,
    ArcElement,
    DoughnutController,
} from '../../vendor/chartjs/dist/chart.esm.js';
import { Config } from '../config.js';
import { ProjectController } from '../controller/project.js';
import { TaskController } from '../controller/task.js';
import { TaskHelper } from '../helper/task.js';
import { Task } from '../model/task.js';
import { roundFloat } from '../util/math.js';
import { secondsToHours, secondsToDays, daysToSeconds } from '../util/time.js';
import { animateCounter } from '../util/counter.js';
import { ErrorHandler } from './error-handler.js';
import { CommonBehavior } from './common-behavior.js';

/** @type {HTMLElement} */
const rootElement = document.querySelector('.project > .chart');
/** @type {HTMLCanvasElement} */
const canvasElement = rootElement.querySelector('canvas');
/** @type {HTMLElement} */
const summaryElement = rootElement.querySelector('.summary');
/** @type {HTMLElement} */
const summaryTitleElement = summaryElement.querySelector('.title');
/** @type {HTMLElement} */
const summaryValueElement = summaryElement.querySelector('.value');
/** @type {HTMLElement} */
const summaryUnitElement = summaryElement.querySelector('.unit');
/** @type {ChartJs} */
let chart;

let summaryType = null;

const chartData = {
    labels: [],
    datasets: [{
        data: [],
        backgroundColor: []
    }]
};

const show = () => {
    CommonBehavior.show(rootElement);
    resize();
};

const hide = () => {
    CommonBehavior.hide(rootElement);
};

const initEventListeners = () => {
    document.addEventListener('DOMContentLoaded', resize);
    window.addEventListener('resize', resize);

    //rootElement.addEventListener('touchstart', switchSummaryToPassed);
    //rootElement.addEventListener('mousedown', switchSummaryToPassed);
    //rootElement.addEventListener('mouseup', switchSummaryToTotal);
    rootElement.addEventListener('click', toggleSummary);
};

const resize = () => {
    rootElement.style.height = `${Math.ceil(rootElement.offsetWidth)}px`;
    fitSummary();
};

const update = () => {
    try {
        summaryType = 'TOTAL';
        updateSummary('合計', '時間', secondsToHours(TaskController.getTaskTimeInTotal()));
        updateChart();
    } catch (error) {
        ErrorHandler.handle(error);
    }
};

const fitSummary = () => {
    const parentElement = summaryElement;
    const childElement = summaryValueElement;
    const parentElementRect = parentElement.getBoundingClientRect();
    const childElementRect = childElement.getBoundingClientRect();
    const availableWidth = parentElementRect.width;
    const availableHeight = parentElementRect.height - summaryTitleElement.offsetHeight - summaryUnitElement.offsetHeight;
    const scale = Math.min(availableWidth, availableHeight) / Math.max(childElementRect.width, childElementRect.height);
    const scaleComputed = parseFloat(getComputedStyle(childElement).transform.split(', ')[3]);
    childElement.style.transformOrigin = 'center';
    childElement.style.transform = `scale(${scale * (scaleComputed || 1)})`;
    //childElement.style.transform = `scale(${scale * (scaleComputed || 1)}) translate3d(0)`; // translate3d is to fix blurry text but seems to be ignored... why??
    //childElement.style.transform += ` translate3d(0)`; // this actually be ignored

    const childElementRectResized = childElement.getBoundingClientRect();
    summaryTitleElement.style.transform = `translateY(${Math.ceil(childElementRectResized.height / 2) * -1}px)`;
    summaryUnitElement.style.transform = `translateY(${Math.ceil(childElementRectResized.height / 2)}px)`;
};

const updateSummary = (title, unit, value) => {
    //console.group('updating summary...');
    //console.log({ title, unit, value });
    summaryTitleElement.textContent = title;
    summaryUnitElement.textContent = unit;
    const fromValue = Number.parseFloat(summaryValueElement.textContent);
    const toValue = roundFloat(value, 1);
    //console.log('counting from:', fromValue, 'to:', toValue);
    animateCounter(toValue * 10, fromValue * 10, 250, (count) => {
        const countRounded = count / 10;
        //console.log(countRounded);
        if (Number.isInteger(countRounded)) {
            summaryValueElement.innerHTML = `${countRounded.toString()}<small>.0</small>`;
        } else {
            const [l, r] = countRounded.toString().split('.');
            summaryValueElement.innerHTML = `${l}<small>.${r}</small>`;
        }
        fitSummary();
    });
    //console.groupEnd();
};

const switchSummaryToTotal = () => {
    if (summaryType === 'TOTAL') {
        return;
    }
    console.log('switching summary to total...');
    summaryType = 'TOTAL';
    updateSummary('合計', '時間', secondsToHours(TaskController.getTaskTimeInTotal()));
};

const switchSummaryToPassed = () => {
    if (summaryType === 'PASSED') {
        return;
    }
    //console.log('switching summary to passed...');
    summaryType = 'PASSED';
    const start = ProjectController.getProject().createdAt;
    const now = Math.floor(Date.now() / 1000);
    const passed = Math.max(now - start, 0);
    if (passed >= daysToSeconds(1)) {
        updateSummary('経過', '日', secondsToDays(passed));
        return;
    }
    updateSummary('経過', '時間', secondsToHours(passed));
};

const toggleSummary = () => {
    switch (summaryType) {
        case 'TOTAL':
            switchSummaryToPassed();
            break;
        case 'PASSED':
            switchSummaryToTotal();
            break;
        default:
            switchSummaryToTotal();
    }
};

const initChart = () => {
    ChartJs.register(ArcElement, DoughnutController);
    chart = new ChartJs(canvasElement.getContext('2d'), {
        data: chartData,
        type: 'doughnut',
        options: {
            aspectRatio: 1,
            cutoutPercentage: 50,
            legend: {
                display: false,
            },
            events: [],
            animation: {
                duration: 250,
                easing: 'easeOutCubic',
            }
        }
    });
};

const updateChart = () => {
    console.group('updating chart');
    const tasks = TaskController.getTasks();
    console.log('tasks:', tasks);
    console.log('time in total:', TaskController.getTaskTimeInTotal());
    if (tasks.length >= 1 && TaskController.getTaskTimeInTotal() >= 1) {
        const tasksToRender = [...tasks];
        tasksToRender.sort(TaskHelper.sorter);
        //console.log('tasks to RENDER:', tasksToRender);
        //console.log('make sure original is not affected:', tasks);
        chartData.datasets[0].data = [];
        chartData.datasets[0].backgroundColor = [];
        for (const task of tasksToRender) {
            chartData.datasets[0].data.push(task.time);
            chartData.datasets[0].backgroundColor.push(task.color);
        }
    } else {
        chartData.datasets[0].data = [1];
        chartData.datasets[0].backgroundColor = ['rgba(0, 0, 0, .1)']; // TODO: use CSS custom property or config!
    }
    chart.update();
    console.groupEnd();
};

initChart();
initEventListeners();

export const Chart = {
    show,
    hide,
    update,
};