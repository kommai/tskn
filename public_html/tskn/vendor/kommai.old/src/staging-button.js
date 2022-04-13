import { Button } from './button.js';

const verifyElement = (element) => {
    if (
        !(element instanceof HTMLButtonElement) ||
        !element.matches('.kc.staging.button')
    ) throw new Error('Invalid element');
};

const stage = (element, from, to) => {
    verifyElement(element);
    //console.log('Staging:', element, `from "${from}" to "${to}"...`);
    return new Promise((resolve) => {
        const stages = element.querySelectorAll('.stage');
        stages.forEach((stage) => stage.style.visibility = 'hidden');

        const ghosts = element.querySelectorAll('.ghost');
        ghosts.forEach((ghost) => ghost.remove());

        const fromStage = element.querySelector(`.stage[data-stage-name="${from}"]`);
        if (!fromStage) throw new Error(`Stage named "${from}" does not exist`);
        const fromStageGhost = fromStage.cloneNode(true);
        fromStageGhost.classList.add('ghost');
        element.appendChild(fromStageGhost);
        fromStageGhost.style.visibility = 'visible';
        fromStageGhost.style.top = '0';
        fromStageGhost.style.transform = `translateY(${Math.ceil(element.offsetHeight) * -1}px)`;

        const toStage = element.querySelector(`.stage[data-stage-name="${to}"]`);
        if (!toStage) throw new Error(`Stage named "${to}" does not exist`);
        const toStageGhost = toStage.cloneNode(true);
        toStageGhost.classList.add('ghost');
        element.appendChild(toStageGhost);
        toStageGhost.style.visibility = 'visible';
        toStageGhost.style.top = `${element.offsetHeight}px`;
        toStageGhost.style.transform = `translateY(${Math.ceil(element.offsetHeight) * -1}px)`;

        toStageGhost.addEventListener('transitionend', () => resolve(), { once: true });
    });
};

const reset = (element) => {
    verifyElement(element);
    const stages = element.querySelectorAll('.stage');
    stages.forEach((stage) => stage.style.removeProperty('visibility'));

    const ghosts = element.querySelectorAll('.ghost');
    ghosts.forEach((ghost) => ghost.remove());
};

export const StagingButton = {
    enable: Button.enable,
    disable: Button.disable,
    stage,
    reset,
};